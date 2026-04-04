"""Timeline view — unified chronological view of all events for a person."""
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required, can_edit
from app.database import get_db

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash,
           "notif_count": getattr(request.state, "notif_count", 0),
           "can_edit": can_edit(request.state.user), **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("/persons/{person_id}/timeline")
@login_required
async def person_timeline(request: Request, person_id: int):
    db = get_db()
    person = db.execute("SELECT * FROM persons WHERE id = ?", (person_id,)).fetchone()
    if not person:
        db.close()
        return RedirectResponse("/persons", status_code=302)

    events = []

    # Interactions
    for row in db.execute(
        "SELECT type, title, content, interaction_date FROM interactions WHERE person_id = ? ORDER BY interaction_date DESC",
        (person_id,)
    ).fetchall():
        events.append({
            "type": "interaction",
            "title": f"[{row['type']}] {row['title']}",
            "detail": row["content"] or "",
            "date": row["interaction_date"],
        })

    # Gift records
    for row in db.execute(
        "SELECT occasion, item, amount, gift_date, notes FROM gift_records WHERE person_id = ? ORDER BY gift_date DESC",
        (person_id,)
    ).fetchall():
        events.append({
            "type": "gift",
            "title": f"{row['item']} (${row['amount']:.0f})" if row["amount"] else row["item"],
            "detail": f"{row['occasion']} {row['notes'] or ''}".strip(),
            "date": row["gift_date"],
        })

    # Reminders
    for row in db.execute(
        "SELECT title, notes, remind_date, is_done FROM reminders WHERE person_id = ? ORDER BY remind_date DESC",
        (person_id,)
    ).fetchall():
        status = "已完成" if row["is_done"] else "待辦"
        events.append({
            "type": "reminder",
            "title": f"[{status}] {row['title']}",
            "detail": row["notes"] or "",
            "date": row["remind_date"],
        })

    # Edit log
    for row in db.execute(
        "SELECT action, changes, created_at FROM edit_log WHERE entity_type = 'person' AND entity_id = ? ORDER BY created_at DESC",
        (person_id,)
    ).fetchall():
        events.append({
            "type": "edit",
            "title": f"{row['action']}",
            "detail": row["changes"] or "",
            "date": row["created_at"][:10] if row["created_at"] else "",
        })

    # Sort all events by date descending
    events.sort(key=lambda e: e["date"] or "", reverse=True)

    db.close()
    return _render(request, "timeline.html", person=person, events=events)
