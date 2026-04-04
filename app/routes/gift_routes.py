"""Gift list management — create holiday gift lists, auto-populate from tiers."""
from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required, can_edit
from app.database import get_db

router = APIRouter(prefix="/gifts")
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash,
           "notif_count": getattr(request.state, "notif_count", 0),
           "can_edit": can_edit(request.state.user), **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("")
@login_required
async def list_gift_lists(request: Request):
    db = get_db()
    lists = db.execute("""
        SELECT gl.*, u.username,
            COUNT(gli.id) as item_count,
            COALESCE(SUM(gli.planned_amount), 0) as total_amount,
            SUM(CASE WHEN gli.status = 'done' THEN 1 ELSE 0 END) as done_count
        FROM gift_lists gl
        LEFT JOIN users u ON u.id = gl.created_by
        LEFT JOIN gift_list_items gli ON gli.list_id = gl.id
        GROUP BY gl.id ORDER BY gl.created_at DESC
    """).fetchall()
    db.close()
    return _render(request, "gifts/list.html", lists=lists)


@router.get("/new")
@login_required
async def new_gift_list(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/gifts", status_code=302)
    return _render(request, "gifts/form.html", gift_list=None)


@router.post("/new")
@login_required
async def create_gift_list(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/gifts", status_code=302)
    form = await request.form()
    db = get_db()
    db.execute("INSERT INTO gift_lists (name, occasion, notes, created_by) VALUES (?,?,?,?)",
               (form.get("name", ""), form.get("occasion", ""),
                form.get("notes", ""), request.state.user["id"]))
    db.commit()
    list_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

    # Auto-populate from tier selection
    auto_tiers = form.getlist("auto_tiers[]")
    if auto_tiers:
        placeholders = ",".join(["?"] * len(auto_tiers))
        persons = db.execute(
            f"SELECT id FROM persons WHERE gift_tier IN ({placeholders})", auto_tiers
        ).fetchall()
        for p in persons:
            db.execute("INSERT OR IGNORE INTO gift_list_items (list_id, person_id) VALUES (?,?)",
                       (list_id, p["id"]))
        db.commit()

    db.close()
    return RedirectResponse(f"/gifts/{list_id}", status_code=302)


@router.get("/{list_id}")
@login_required
async def view_gift_list(request: Request, list_id: int):
    db = get_db()
    gift_list = db.execute("SELECT * FROM gift_lists WHERE id = ?", (list_id,)).fetchone()
    if not gift_list:
        db.close()
        return RedirectResponse("/gifts", status_code=302)

    items = db.execute("""
        SELECT gli.*, p.first_name, p.last_name, p.gift_tier, p.preferences, p.gift_notes
        FROM gift_list_items gli
        JOIN persons p ON p.id = gli.person_id
        WHERE gli.list_id = ?
        ORDER BY
            CASE p.gift_tier WHEN 'VIP' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 WHEN 'C' THEN 4 WHEN 'D' THEN 5 ELSE 6 END,
            p.first_name
    """, (list_id,)).fetchall()

    total_planned = sum(i["planned_amount"] or 0 for i in items)

    # Get persons not yet in this list for the add dropdown
    all_persons = db.execute("""
        SELECT id, first_name, last_name, gift_tier FROM persons
        WHERE id NOT IN (SELECT person_id FROM gift_list_items WHERE list_id = ?)
        ORDER BY first_name
    """, (list_id,)).fetchall()

    db.close()
    return _render(request, "gifts/detail.html",
        gift_list=gift_list, items=items, total_planned=total_planned, all_persons=all_persons)


@router.post("/{list_id}/add")
@login_required
async def add_to_list(request: Request, list_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse(f"/gifts/{list_id}", status_code=302)
    form = await request.form()
    person_id = form.get("person_id")
    if person_id:
        db = get_db()
        db.execute("INSERT OR IGNORE INTO gift_list_items (list_id, person_id, planned_item, planned_amount) VALUES (?,?,?,?)",
                   (list_id, int(person_id), form.get("planned_item", ""), float(form.get("planned_amount", 0) or 0)))
        db.commit()
        db.close()
    return RedirectResponse(f"/gifts/{list_id}", status_code=302)


@router.post("/{list_id}/item/{item_id}/update")
@login_required
async def update_item(request: Request, list_id: int, item_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse(f"/gifts/{list_id}", status_code=302)
    form = await request.form()
    db = get_db()
    db.execute("UPDATE gift_list_items SET planned_item=?, planned_amount=?, status=?, notes=? WHERE id=?",
               (form.get("planned_item", ""), float(form.get("planned_amount", 0) or 0),
                form.get("status", "pending"), form.get("notes", ""), item_id))
    db.commit()
    db.close()
    return RedirectResponse(f"/gifts/{list_id}", status_code=302)


@router.post("/{list_id}/item/{item_id}/delete")
@login_required
async def remove_from_list(request: Request, list_id: int, item_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse(f"/gifts/{list_id}", status_code=302)
    db = get_db()
    db.execute("DELETE FROM gift_list_items WHERE id = ?", (item_id,))
    db.commit()
    db.close()
    return RedirectResponse(f"/gifts/{list_id}", status_code=302)


@router.post("/{list_id}/delete")
@login_required
async def delete_gift_list(request: Request, list_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse("/gifts", status_code=302)
    db = get_db()
    db.execute("DELETE FROM gift_lists WHERE id = ?", (list_id,))
    db.commit()
    db.close()
    return RedirectResponse("/gifts", status_code=302)
