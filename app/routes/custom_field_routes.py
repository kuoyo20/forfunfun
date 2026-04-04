"""Custom fields — admin-defined fields for persons."""
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required, can_edit, is_admin
from app.database import get_db

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash,
           "notif_count": getattr(request.state, "notif_count", 0),
           "can_edit": can_edit(request.state.user), **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("/admin/custom-fields")
@login_required
async def list_custom_fields(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/dashboard", status_code=302)
    db = get_db()
    fields = db.execute("SELECT * FROM custom_field_defs ORDER BY sort_order, id").fetchall()
    db.close()
    return _render(request, "custom_fields.html", fields=fields)


@router.post("/admin/custom-fields/new")
@login_required
async def create_custom_field(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/dashboard", status_code=302)
    form = await request.form()
    field_name = form.get("field_name", "").strip().lower().replace(" ", "_")
    field_label = form.get("field_label", "").strip()
    field_type = form.get("field_type", "text")

    if not field_name or not field_label:
        return RedirectResponse("/admin/custom-fields", status_code=302)

    db = get_db()
    max_order = db.execute("SELECT COALESCE(MAX(sort_order), 0) FROM custom_field_defs").fetchone()[0]
    db.execute(
        "INSERT OR IGNORE INTO custom_field_defs (field_name, field_label, field_type, sort_order) VALUES (?,?,?,?)",
        (field_name, field_label, field_type, max_order + 1)
    )
    db.commit()
    db.close()
    return RedirectResponse("/admin/custom-fields", status_code=302)


@router.post("/admin/custom-fields/{field_id}/delete")
@login_required
async def delete_custom_field(request: Request, field_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse("/dashboard", status_code=302)
    db = get_db()
    db.execute("DELETE FROM custom_field_defs WHERE id = ?", (field_id,))
    db.commit()
    db.close()
    return RedirectResponse("/admin/custom-fields", status_code=302)


def get_custom_fields_for_person(db, person_id: int) -> list:
    """Get all custom field defs with their values for a person."""
    return db.execute("""
        SELECT d.id, d.field_name, d.field_label, d.field_type,
               COALESCE(v.value, '') as value
        FROM custom_field_defs d
        LEFT JOIN custom_field_values v ON v.field_id = d.id AND v.person_id = ?
        ORDER BY d.sort_order, d.id
    """, (person_id,)).fetchall()


def save_custom_fields_for_person(db, person_id: int, form_data):
    """Save custom field values from form submission."""
    fields = db.execute("SELECT id, field_name FROM custom_field_defs ORDER BY id").fetchall()
    for f in fields:
        value = form_data.get(f"cf_{f['field_name']}", "").strip()
        db.execute("""
            INSERT INTO custom_field_values (person_id, field_id, value)
            VALUES (?, ?, ?)
            ON CONFLICT(person_id, field_id) DO UPDATE SET value = ?
        """, (person_id, f["id"], value, value))
    db.commit()
