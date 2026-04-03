from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required, can_edit
from app.database import get_db
from app.services.import_service import export_persons_csv

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash,
           "notif_count": getattr(request.state, "notif_count", 0),
           "can_edit": can_edit(request.state.user), **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("/search")
@login_required
async def search(request: Request):
    q = request.query_params.get("q", "").strip()
    tag = request.query_params.get("tag", "").strip()
    company = request.query_params.get("company", "").strip()
    results = {"persons": [], "companies": [], "tags": []}

    db = get_db()

    if q or tag or company:
        conditions = []
        params = []

        if q:
            like = f"%{q}%"
            conditions.append("""(p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ?
                OR p.phone LIKE ? OR r.title LIKE ? OR r.work_email LIKE ?
                OR c.name LIKE ? OR t.name LIKE ?)""")
            params.extend([like] * 8)

        if tag:
            conditions.append("t.name = ?")
            params.append(tag)

        if company:
            conditions.append("c.name = ?")
            params.append(company)

        where = " AND ".join(conditions) if conditions else "1=1"

        results["persons"] = db.execute(f"""
            SELECT DISTINCT p.* FROM persons p
            LEFT JOIN roles r ON r.person_id = p.id
            LEFT JOIN companies c ON c.id = r.company_id
            LEFT JOIN person_tags pt ON pt.person_id = p.id
            LEFT JOIN tags t ON t.id = pt.tag_id
            WHERE {where}
            ORDER BY p.first_name LIMIT 50
        """, params).fetchall()

        if q:
            results["companies"] = db.execute("""
                SELECT * FROM companies
                WHERE name LIKE ? OR domain LIKE ? OR industry LIKE ? OR notes LIKE ?
                ORDER BY name LIMIT 50
            """, (f"%{q}%",) * 4).fetchall()

            results["tags"] = db.execute("""
                SELECT DISTINCT t.name, COUNT(pt.person_id) as cnt
                FROM tags t JOIN person_tags pt ON pt.tag_id = t.id
                WHERE t.name LIKE ? GROUP BY t.id ORDER BY cnt DESC LIMIT 20
            """, (f"%{q}%",)).fetchall()

    # Get all tags and companies for advanced filter dropdowns
    all_tags = db.execute("SELECT DISTINCT t.name FROM tags t JOIN person_tags pt ON pt.tag_id = t.id ORDER BY t.name").fetchall()
    all_companies = db.execute("SELECT DISTINCT name FROM companies ORDER BY name").fetchall()
    db.close()

    return _render(request, "search.html", q=q, tag=tag, company=company,
        results=results, all_tags=[t["name"] for t in all_tags],
        all_companies=[c["name"] for c in all_companies])


@router.get("/dashboard")
@login_required
async def dashboard(request: Request):
    db = get_db()
    stats = {
        "persons": db.execute("SELECT COUNT(*) FROM persons").fetchone()[0],
        "companies": db.execute("SELECT COUNT(*) FROM companies").fetchone()[0],
        "tags": db.execute("SELECT COUNT(*) FROM tags").fetchone()[0],
        "users": db.execute("SELECT COUNT(*) FROM users").fetchone()[0],
        "interactions": db.execute("SELECT COUNT(*) FROM interactions").fetchone()[0],
    }
    recent_persons = db.execute("SELECT * FROM persons ORDER BY updated_at DESC LIMIT 10").fetchall()
    recent_logs = db.execute("""
        SELECT el.*, u.username FROM edit_log el
        LEFT JOIN users u ON u.id = el.user_id
        ORDER BY el.created_at DESC LIMIT 20
    """).fetchall()

    # Gift tier summary
    gift_tiers = db.execute("""
        SELECT gift_tier, COUNT(*) as cnt FROM persons
        WHERE gift_tier != '' GROUP BY gift_tier ORDER BY
        CASE gift_tier WHEN 'VIP' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 WHEN 'C' THEN 4 WHEN 'D' THEN 5 END
    """).fetchall()
    gift_total_spent = db.execute("SELECT COALESCE(SUM(amount), 0) FROM gift_records").fetchone()[0]

    # Upcoming birthdays (simple: get all with birthdays)
    upcoming_bdays = db.execute("""
        SELECT id, first_name, last_name, birthday, gift_tier FROM persons
        WHERE birthday != '' ORDER BY SUBSTR(birthday, -5) LIMIT 10
    """).fetchall()

    db.close()
    return _render(request, "dashboard.html",
        stats=stats, recent_persons=recent_persons, recent_logs=recent_logs,
        gift_tiers=gift_tiers, gift_total_spent=gift_total_spent,
        upcoming_bdays=upcoming_bdays)


@router.get("/export/csv")
@login_required
async def export_csv(request: Request):
    db = get_db()
    csv_content = export_persons_csv(db)
    db.close()

    def generate():
        # Add BOM for Excel compatibility
        yield b'\xef\xbb\xbf'
        yield csv_content.encode("utf-8")

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contacts_export.csv"},
    )


@router.get("/notifications")
@login_required
async def notifications(request: Request):
    db = get_db()
    notifs = db.execute("""
        SELECT * FROM notifications WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 50
    """, (request.state.user["id"],)).fetchall()
    # Mark all as read
    db.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
               (request.state.user["id"],))
    db.commit()
    db.close()
    return _render(request, "notifications.html", notifs=notifs)


@router.get("/graph")
@login_required
async def relationship_graph(request: Request):
    db = get_db()
    persons = db.execute("SELECT id, first_name, last_name FROM persons").fetchall()
    relationships = db.execute("""
        SELECT person_a_id, person_b_id, label FROM relationships
    """).fetchall()
    # Also include company relationships
    roles = db.execute("""
        SELECT r.person_id, c.name as company_name, c.id as company_id
        FROM roles r JOIN companies c ON c.id = r.company_id WHERE r.is_current = 1
    """).fetchall()
    db.close()

    nodes = []
    edges = []

    for p in persons:
        nodes.append({"id": f"p_{p['id']}", "label": f"{p['first_name']} {p['last_name']}", "type": "person"})

    company_ids_added = set()
    for r in roles:
        cid = f"c_{r['company_id']}"
        if cid not in company_ids_added:
            nodes.append({"id": cid, "label": r["company_name"], "type": "company"})
            company_ids_added.add(cid)
        edges.append({"from": f"p_{r['person_id']}", "to": cid, "label": ""})

    for rel in relationships:
        edges.append({"from": f"p_{rel['person_a_id']}", "to": f"p_{rel['person_b_id']}", "label": rel["label"]})

    return _render(request, "graph.html", nodes=nodes, edges=edges)


# --- Admin routes ---
@router.get("/admin/users")
@login_required
async def admin_users(request: Request):
    from app.auth import is_admin
    if not is_admin(request.state.user):
        return RedirectResponse("/dashboard", status_code=302)
    db = get_db()
    users = db.execute("SELECT * FROM users ORDER BY created_at").fetchall()
    db.close()
    return _render(request, "admin_users.html", users=users)


@router.post("/admin/users/{user_id}/role")
@login_required
async def update_user_role(request: Request, user_id: int):
    from app.auth import is_admin
    if not is_admin(request.state.user):
        return RedirectResponse("/dashboard", status_code=302)
    form = await request.form()
    new_role = form.get("role", "viewer")
    if new_role not in ("admin", "editor", "viewer"):
        return RedirectResponse("/admin/users", status_code=302)
    db = get_db()
    db.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
    db.commit()
    db.close()
    return RedirectResponse("/admin/users", status_code=302)
