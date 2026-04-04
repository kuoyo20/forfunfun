"""Calendar export — ICS format for birthdays and reminders."""
from datetime import date, datetime
from fastapi import APIRouter, Request
from fastapi.responses import Response
from app.auth import login_required
from app.database import get_db

router = APIRouter()


def _ics_event(uid, summary, dt_str, description=""):
    """Generate a single VEVENT block."""
    # Parse date
    try:
        if len(dt_str) == 5:  # MM-DD format
            year = date.today().year
            dt = datetime.strptime(f"{year}-{dt_str}", "%Y-%m-%d")
        elif len(dt_str) == 10:  # YYYY-MM-DD
            dt = datetime.strptime(dt_str, "%Y-%m-%d")
        else:
            return ""
    except ValueError:
        return ""

    dtstart = dt.strftime("%Y%m%d")
    return (
        "BEGIN:VEVENT\r\n"
        f"UID:{uid}\r\n"
        f"DTSTART;VALUE=DATE:{dtstart}\r\n"
        f"SUMMARY:{summary}\r\n"
        f"DESCRIPTION:{description}\r\n"
        "END:VEVENT\r\n"
    )


@router.get("/export/calendar/birthdays")
@login_required
async def export_birthdays_ics(request: Request):
    db = get_db()
    persons = db.execute(
        "SELECT id, first_name, last_name, birthday, gift_tier FROM persons WHERE birthday != ''"
    ).fetchall()
    db.close()

    events = ""
    for p in persons:
        tier_info = f" [{p['gift_tier']}]" if p["gift_tier"] else ""
        events += _ics_event(
            uid=f"bday-{p['id']}@contacts",
            summary=f"{p['first_name']} {p['last_name']} 生日{tier_info}",
            dt_str=p["birthday"],
            description=f"聯絡人生日提醒"
        )

    cal = (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//ContactManager//Birthdays//ZH\r\n"
        "CALSCALE:GREGORIAN\r\n"
        f"{events}"
        "END:VCALENDAR\r\n"
    )

    return Response(
        content=cal,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=birthdays.ics"},
    )


@router.get("/export/calendar/reminders")
@login_required
async def export_reminders_ics(request: Request):
    db = get_db()
    reminders = db.execute("""
        SELECT r.id, r.title, r.remind_date, r.notes, p.first_name, p.last_name
        FROM reminders r
        JOIN persons p ON p.id = r.person_id
        WHERE r.is_done = 0
    """).fetchall()
    db.close()

    events = ""
    for r in reminders:
        events += _ics_event(
            uid=f"reminder-{r['id']}@contacts",
            summary=f"[提醒] {r['title']} — {r['first_name']} {r['last_name']}",
            dt_str=r["remind_date"],
            description=r["notes"] or ""
        )

    cal = (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//ContactManager//Reminders//ZH\r\n"
        "CALSCALE:GREGORIAN\r\n"
        f"{events}"
        "END:VCALENDAR\r\n"
    )

    return Response(
        content=cal,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=reminders.ics"},
    )
