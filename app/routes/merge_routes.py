"""Contact merge — combine duplicate persons into one."""
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


def _merge_field(keep_val, merge_val):
    """Pick the non-empty value, preferring keep."""
    if keep_val and keep_val.strip():
        return keep_val
    return merge_val or ""


@router.get("/merge")
@login_required
async def merge_form(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/persons", status_code=302)
    db = get_db()
    persons = db.execute("SELECT id, first_name, last_name, email FROM persons ORDER BY first_name").fetchall()
    db.close()
    return _render(request, "merge.html", persons=persons, preview=None, merge_stats=None)


@router.post("/merge")
@login_required
async def merge_persons(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/persons", status_code=302)

    form = await request.form()
    keep_id = int(form.get("keep_id", 0))
    merge_id = int(form.get("merge_id", 0))
    confirm = form.get("confirm")

    if not keep_id or not merge_id or keep_id == merge_id:
        return RedirectResponse("/merge", status_code=302)

    db = get_db()
    keep = db.execute("SELECT * FROM persons WHERE id = ?", (keep_id,)).fetchone()
    merge = db.execute("SELECT * FROM persons WHERE id = ?", (merge_id,)).fetchone()

    if not keep or not merge:
        db.close()
        return RedirectResponse("/merge", status_code=302)

    fields = [
        ("名字", "first_name"), ("姓氏", "last_name"), ("Email", "email"),
        ("電話", "phone"), ("送禮層級", "gift_tier"), ("生日", "birthday"),
        ("喜好", "preferences"), ("送禮備註", "gift_notes"), ("備註", "notes"),
    ]

    # Count related records
    merge_stats = {
        "roles": db.execute("SELECT COUNT(*) FROM roles WHERE person_id = ?", (merge_id,)).fetchone()[0],
        "interactions": db.execute("SELECT COUNT(*) FROM interactions WHERE person_id = ?", (merge_id,)).fetchone()[0],
        "tags": db.execute("SELECT COUNT(*) FROM person_tags WHERE person_id = ?", (merge_id,)).fetchone()[0],
        "gifts": db.execute("SELECT COUNT(*) FROM gift_records WHERE person_id = ?", (merge_id,)).fetchone()[0],
    }

    if not confirm:
        # Show preview
        preview = []
        for label, col in fields:
            keep_val = keep[col] or ""
            merge_val = merge[col] or ""
            result_val = _merge_field(keep_val, merge_val)
            preview.append((label, keep_val, merge_val, result_val))

        persons = db.execute("SELECT id, first_name, last_name, email FROM persons ORDER BY first_name").fetchall()
        db.close()
        return _render(request, "merge.html", persons=persons, preview=preview,
                       merge_stats=merge_stats, keep_id=keep_id, merge_id=merge_id)

    # Execute merge
    # Update keep person with merged fields
    updates = {}
    for _, col in fields:
        updates[col] = _merge_field(keep[col] or "", merge[col] or "")

    set_clause = ", ".join(f"{col} = ?" for col in updates)
    db.execute(f"UPDATE persons SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
               (*updates.values(), keep_id))

    # Move related records
    db.execute("UPDATE roles SET person_id = ? WHERE person_id = ?", (keep_id, merge_id))
    db.execute("UPDATE interactions SET person_id = ? WHERE person_id = ?", (keep_id, merge_id))
    db.execute("UPDATE gift_records SET person_id = ? WHERE person_id = ?", (keep_id, merge_id))
    db.execute("UPDATE reminders SET person_id = ? WHERE person_id = ?", (keep_id, merge_id))

    # Move tags (ignore duplicates)
    db.execute("INSERT OR IGNORE INTO person_tags (person_id, tag_id) SELECT ?, tag_id FROM person_tags WHERE person_id = ?",
               (keep_id, merge_id))
    db.execute("DELETE FROM person_tags WHERE person_id = ?", (merge_id,))

    # Move custom field values (keep existing, add missing)
    db.execute("INSERT OR IGNORE INTO custom_field_values (person_id, field_id, value) SELECT ?, field_id, value FROM custom_field_values WHERE person_id = ?",
               (keep_id, merge_id))
    db.execute("DELETE FROM custom_field_values WHERE person_id = ?", (merge_id,))

    # Move relationships
    db.execute("UPDATE relationships SET person_a_id = ? WHERE person_a_id = ?", (keep_id, merge_id))
    db.execute("UPDATE relationships SET person_b_id = ? WHERE person_b_id = ?", (keep_id, merge_id))

    # Move gift list items
    db.execute("INSERT OR IGNORE INTO gift_list_items (list_id, person_id, planned_item, planned_amount, status, notes) SELECT list_id, ?, planned_item, planned_amount, status, notes FROM gift_list_items WHERE person_id = ?",
               (keep_id, merge_id))
    db.execute("DELETE FROM gift_list_items WHERE person_id = ?", (merge_id,))

    # Delete merged person
    db.execute("DELETE FROM persons WHERE id = ?", (merge_id,))

    # Log the merge
    db.execute("INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
               (request.state.user["id"], "person", keep_id, "合併",
                f"合併了 {merge['first_name']} {merge['last_name']} (ID:{merge_id})"))
    db.commit()
    db.close()

    return RedirectResponse(f"/persons/{keep_id}", status_code=302)
