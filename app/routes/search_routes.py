from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from app.auth import login_required
from app.database import get_db

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash, **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("/search")
@login_required
async def search(request: Request):
    q = request.query_params.get("q", "").strip()
    results = {"persons": [], "companies": [], "tags": []}

    if q:
        db = get_db()
        like = f"%{q}%"

        results["persons"] = db.execute("""
            SELECT DISTINCT p.* FROM persons p
            LEFT JOIN roles r ON r.person_id = p.id
            LEFT JOIN companies c ON c.id = r.company_id
            LEFT JOIN person_tags pt ON pt.person_id = p.id
            LEFT JOIN tags t ON t.id = pt.tag_id
            WHERE p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ?
                OR p.phone LIKE ? OR r.title LIKE ? OR r.work_email LIKE ?
                OR c.name LIKE ? OR t.name LIKE ?
            ORDER BY p.first_name LIMIT 50
        """, (like, like, like, like, like, like, like, like)).fetchall()

        results["companies"] = db.execute("""
            SELECT * FROM companies
            WHERE name LIKE ? OR domain LIKE ? OR industry LIKE ? OR notes LIKE ?
            ORDER BY name LIMIT 50
        """, (like, like, like, like)).fetchall()

        results["tags"] = db.execute("""
            SELECT DISTINCT t.name, COUNT(pt.person_id) as cnt
            FROM tags t JOIN person_tags pt ON pt.tag_id = t.id
            WHERE t.name LIKE ? GROUP BY t.id ORDER BY cnt DESC LIMIT 20
        """, (like,)).fetchall()

        db.close()

    return _render(request, "search.html", q=q, results=results)


@router.get("/dashboard")
@login_required
async def dashboard(request: Request):
    db = get_db()
    stats = {
        "persons": db.execute("SELECT COUNT(*) FROM persons").fetchone()[0],
        "companies": db.execute("SELECT COUNT(*) FROM companies").fetchone()[0],
        "tags": db.execute("SELECT COUNT(*) FROM tags").fetchone()[0],
        "users": db.execute("SELECT COUNT(*) FROM users").fetchone()[0],
    }
    recent_persons = db.execute("""
        SELECT * FROM persons ORDER BY updated_at DESC LIMIT 10
    """).fetchall()
    recent_logs = db.execute("""
        SELECT el.*, u.username FROM edit_log el
        LEFT JOIN users u ON u.id = el.user_id
        ORDER BY el.created_at DESC LIMIT 20
    """).fetchall()
    db.close()
    return _render(request, "dashboard.html",
        stats=stats, recent_persons=recent_persons, recent_logs=recent_logs)
