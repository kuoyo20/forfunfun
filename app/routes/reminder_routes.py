"""Follow-up reminders — track tasks related to contacts."""
from datetime import date
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required, can_edit
from app.database import get_db

router = APIRouter(prefix="/reminders")
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash,
           "notif_count": getattr(request.state, "notif_count", 0),
           "can_edit": can_edit(request.state.user), **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("")
@login_required
async def list_reminders(request: Request):
    db = get_db()
    filter_mode = request.query_params.get("filter", "pending")

    if filter_mode == "done":
        where = "r.is_done = 1"
    elif filter_mode == "all":
        where = "1=1"
    else:
        where = "r.is_done = 0"

    reminders = db.execute(f"""
        SELECT r.*, p.first_name, p.last_name
        FROM reminders r
        JOIN persons p ON p.id = r.person_id
        WHERE {where}
        ORDER BY r.is_done ASC, r.remind_date ASC
    """).fetchall()

    pending_count = db.execute("SELECT COUNT(*) FROM reminders WHERE is_done = 0").fetchone()[0]
    all_persons = db.execute("SELECT id, first_name, last_name FROM persons ORDER BY first_name").fetchall()
    db.close()

    today = date.today().isoformat()
    return _render(request, "reminders.html",
                   reminders=reminders, filter=filter_mode, pending_count=pending_count,
                   all_persons=all_persons, today=today)


@router.post("/new")
@login_required
async def create_reminder(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/reminders", status_code=302)
    form = await request.form()
    db = get_db()
    db.execute(
        "INSERT INTO reminders (person_id, user_id, remind_date, title, notes) VALUES (?,?,?,?,?)",
        (int(form.get("person_id")), request.state.user["id"],
         form.get("remind_date", ""), form.get("title", ""), form.get("notes", ""))
    )
    db.commit()
    db.close()
    return RedirectResponse("/reminders", status_code=302)


@router.post("/{reminder_id}/done")
@login_required
async def mark_done(request: Request, reminder_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse("/reminders", status_code=302)
    db = get_db()
    db.execute("UPDATE reminders SET is_done = 1 WHERE id = ?", (reminder_id,))
    db.commit()
    db.close()
    return RedirectResponse("/reminders", status_code=302)


@router.post("/{reminder_id}/delete")
@login_required
async def delete_reminder(request: Request, reminder_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse("/reminders", status_code=302)
    db = get_db()
    db.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
    db.commit()
    db.close()
    return RedirectResponse("/reminders", status_code=302)
