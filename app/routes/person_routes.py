import os
import json
from fastapi import APIRouter, Request, Form, UploadFile, File
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required, can_edit, notify_other_editors
from app.database import get_db
from app.config import PER_PAGE, PHOTO_DIR

router = APIRouter(prefix="/persons")
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash,
           "notif_count": getattr(request.state, "notif_count", 0),
           "can_edit": can_edit(request.state.user), **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


def _get_or_create_tag(db, name: str) -> int:
    name = name.strip().lower()
    row = db.execute("SELECT id FROM tags WHERE name = ?", (name,)).fetchone()
    if row:
        return row["id"]
    db.execute("INSERT INTO tags (name) VALUES (?)", (name,))
    db.commit()
    return db.execute("SELECT last_insert_rowid()").fetchone()[0]


def _save_tags(db, person_id: int, tags_str: str):
    db.execute("DELETE FROM person_tags WHERE person_id = ?", (person_id,))
    if tags_str:
        for tag_name in tags_str.split(","):
            tag_name = tag_name.strip()
            if tag_name:
                tag_id = _get_or_create_tag(db, tag_name)
                db.execute("INSERT OR IGNORE INTO person_tags (person_id, tag_id) VALUES (?, ?)",
                           (person_id, tag_id))
    db.commit()


def _save_roles(db, person_id: int, form_data):
    db.execute("DELETE FROM roles WHERE person_id = ?", (person_id,))

    titles = form_data.getlist("role_title[]")
    company_ids = form_data.getlist("role_company_id[]")
    work_emails = form_data.getlist("role_work_email[]")
    work_phones = form_data.getlist("role_work_phone[]")
    current_checks = form_data.getlist("role_is_current[]")

    for i in range(len(titles)):
        company_id = company_ids[i] if i < len(company_ids) and company_ids[i] else None
        title = titles[i] if i < len(titles) else ""
        work_email = work_emails[i] if i < len(work_emails) else ""
        work_phone = work_phones[i] if i < len(work_phones) else ""
        is_current = str(i) in current_checks or str(i + 1) in current_checks

        if title or company_id:
            db.execute(
                "INSERT INTO roles (person_id, company_id, title, work_email, work_phone, is_current) VALUES (?,?,?,?,?,?)",
                (person_id, company_id, title, work_email, work_phone, is_current),
            )
    db.commit()


def _get_person_snapshot(db, person_id: int) -> dict:
    """Get current person data for diff comparison."""
    p = db.execute("SELECT * FROM persons WHERE id = ?", (person_id,)).fetchone()
    if not p:
        return {}
    return {k: p[k] for k in p.keys()}


def _compute_diff(old: dict, new: dict) -> str:
    """Compute JSON diff between old and new values."""
    changes = {}
    for key in set(list(old.keys()) + list(new.keys())):
        old_val = old.get(key)
        new_val = new.get(key)
        if old_val != new_val and key not in ("updated_at", "updated_by"):
            changes[key] = {"old": old_val, "new": new_val}
    return json.dumps(changes, ensure_ascii=False) if changes else ""


@router.get("")
@login_required
async def list_persons(request: Request):
    tag_filter = request.query_params.get("tag", "")
    company_filter = request.query_params.get("company", "")
    page = int(request.query_params.get("page", 1))
    offset = (page - 1) * PER_PAGE
    db = get_db()

    conditions = []
    params = []

    if tag_filter:
        conditions.append("p.id IN (SELECT pt.person_id FROM person_tags pt JOIN tags t ON t.id = pt.tag_id WHERE t.name = ?)")
        params.append(tag_filter)

    if company_filter:
        conditions.append("p.id IN (SELECT r.person_id FROM roles r JOIN companies c ON c.id = r.company_id WHERE c.name = ?)")
        params.append(company_filter)

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    total = db.execute(f"SELECT COUNT(DISTINCT p.id) FROM persons p {where}", params).fetchone()[0]
    total_pages = max(1, (total + PER_PAGE - 1) // PER_PAGE)

    persons = db.execute(f"""
        SELECT DISTINCT p.* FROM persons p {where}
        ORDER BY p.updated_at DESC LIMIT ? OFFSET ?
    """, params + [PER_PAGE, offset]).fetchall()

    person_list = []
    for p in persons:
        pid = p["id"]
        tags = db.execute("SELECT t.name FROM tags t JOIN person_tags pt ON pt.tag_id = t.id WHERE pt.person_id = ?", (pid,)).fetchall()
        roles = db.execute("SELECT r.*, c.name as company_name FROM roles r LEFT JOIN companies c ON c.id = r.company_id WHERE r.person_id = ?", (pid,)).fetchall()
        person_list.append({"person": dict(p), "tags": [t["name"] for t in tags], "roles": [dict(r) for r in roles]})

    all_tags = db.execute("SELECT DISTINCT t.name FROM tags t JOIN person_tags pt ON pt.tag_id = t.id ORDER BY t.name").fetchall()
    all_companies = db.execute("SELECT DISTINCT c.name FROM companies c ORDER BY c.name").fetchall()
    db.close()
    return _render(request, "persons/list.html",
        person_list=person_list, all_tags=[t["name"] for t in all_tags],
        all_companies=[c["name"] for c in all_companies],
        current_tag=tag_filter, current_company=company_filter,
        page=page, total_pages=total_pages, total=total)


@router.get("/new")
@login_required
async def new_person(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/persons", status_code=302)
    db = get_db()
    companies = db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()
    db.close()
    return _render(request, "persons/form.html",
        person=None, roles=[], tags=[], companies=[dict(c) for c in companies])


@router.post("/new")
@login_required
async def create_person(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/persons", status_code=302)
    form = await request.form()
    db = get_db()
    db.execute(
        "INSERT INTO persons (first_name, last_name, email, phone, notes, created_by, updated_by) VALUES (?,?,?,?,?,?,?)",
        (form.get("first_name", ""), form.get("last_name", ""), form.get("email", ""),
         form.get("phone", ""), form.get("notes", ""),
         request.state.user["id"], request.state.user["id"]),
    )
    db.commit()
    person_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

    _save_tags(db, person_id, form.get("tags", ""))
    _save_roles(db, person_id, form)

    name = f"{form.get('first_name', '')} {form.get('last_name', '')}"
    db.execute(
        "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
        (request.state.user["id"], "person", person_id, "create", f"建立聯絡人: {name}"),
    )
    db.commit()
    notify_other_editors(db, request.state.user["id"],
        f"{request.state.user['username']} 新增了聯絡人「{name}」", f"/persons/{person_id}")
    db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)


@router.get("/{person_id}")
@login_required
async def view_person(request: Request, person_id: int):
    db = get_db()
    person = db.execute("SELECT * FROM persons WHERE id = ?", (person_id,)).fetchone()
    if not person:
        db.close()
        return RedirectResponse("/persons", status_code=302)

    roles = db.execute("""
        SELECT r.*, c.name as company_name FROM roles r
        LEFT JOIN companies c ON c.id = r.company_id WHERE r.person_id = ? ORDER BY r.is_current DESC
    """, (person_id,)).fetchall()

    tags = db.execute("SELECT t.name FROM tags t JOIN person_tags pt ON pt.tag_id = t.id WHERE pt.person_id = ?", (person_id,)).fetchall()

    relationships = db.execute("""
        SELECT rel.*,
            pa.first_name || ' ' || pa.last_name as person_a_name, pa.id as person_a_id,
            pb.first_name || ' ' || pb.last_name as person_b_name, pb.id as person_b_id
        FROM relationships rel
        JOIN persons pa ON pa.id = rel.person_a_id
        JOIN persons pb ON pb.id = rel.person_b_id
        WHERE rel.person_a_id = ? OR rel.person_b_id = ?
    """, (person_id, person_id)).fetchall()

    interactions = db.execute("""
        SELECT i.*, u.username FROM interactions i
        LEFT JOIN users u ON u.id = i.user_id
        WHERE i.person_id = ? ORDER BY i.interaction_date DESC, i.created_at DESC
    """, (person_id,)).fetchall()

    logs = db.execute("""
        SELECT el.*, u.username FROM edit_log el
        LEFT JOIN users u ON u.id = el.user_id
        WHERE el.entity_type = 'person' AND el.entity_id = ?
        ORDER BY el.created_at DESC LIMIT 10
    """, (person_id,)).fetchall()

    all_persons = db.execute("SELECT id, first_name, last_name FROM persons WHERE id != ? ORDER BY first_name", (person_id,)).fetchall()

    db.close()
    return _render(request, "persons/detail.html",
        person=person, roles=roles, tags=[t["name"] for t in tags],
        relationships=relationships, interactions=interactions,
        logs=logs, all_persons=all_persons)


@router.get("/{person_id}/edit")
@login_required
async def edit_person(request: Request, person_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse(f"/persons/{person_id}", status_code=302)
    db = get_db()
    person = db.execute("SELECT * FROM persons WHERE id = ?", (person_id,)).fetchone()
    if not person:
        db.close()
        return RedirectResponse("/persons", status_code=302)
    roles = db.execute("SELECT r.*, c.name as company_name FROM roles r LEFT JOIN companies c ON c.id = r.company_id WHERE r.person_id = ?", (person_id,)).fetchall()
    tags = db.execute("SELECT t.name FROM tags t JOIN person_tags pt ON pt.tag_id = t.id WHERE pt.person_id = ?", (person_id,)).fetchall()
    companies = db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()
    db.close()
    return _render(request, "persons/form.html",
        person=dict(person), roles=[dict(r) for r in roles],
        tags=[t["name"] for t in tags], companies=[dict(c) for c in companies])


@router.post("/{person_id}/edit")
@login_required
async def update_person(request: Request, person_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse(f"/persons/{person_id}", status_code=302)
    form = await request.form()
    db = get_db()

    old_data = _get_person_snapshot(db, person_id)

    db.execute(
        "UPDATE persons SET first_name=?, last_name=?, email=?, phone=?, notes=?, updated_by=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (form.get("first_name", ""), form.get("last_name", ""), form.get("email", ""),
         form.get("phone", ""), form.get("notes", ""), request.state.user["id"], person_id),
    )
    db.commit()

    new_data = _get_person_snapshot(db, person_id)
    diff = _compute_diff(old_data, new_data)

    _save_tags(db, person_id, form.get("tags", ""))
    _save_roles(db, person_id, form)

    name = f"{form.get('first_name', '')} {form.get('last_name', '')}"
    db.execute(
        "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes, diff_json) VALUES (?,?,?,?,?,?)",
        (request.state.user["id"], "person", person_id, "update", f"更新聯絡人: {name}", diff),
    )
    db.commit()
    notify_other_editors(db, request.state.user["id"],
        f"{request.state.user['username']} 更新了聯絡人「{name}」", f"/persons/{person_id}")
    db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)


@router.post("/{person_id}/delete")
@login_required
async def delete_person(request: Request, person_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse(f"/persons/{person_id}", status_code=302)
    db = get_db()
    person = db.execute("SELECT first_name, last_name FROM persons WHERE id = ?", (person_id,)).fetchone()
    name = f"{person['first_name']} {person['last_name']}" if person else ""
    db.execute("DELETE FROM persons WHERE id = ?", (person_id,))
    db.execute(
        "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
        (request.state.user["id"], "person", person_id, "delete", f"刪除聯絡人: {name}"),
    )
    db.commit()
    notify_other_editors(db, request.state.user["id"],
        f"{request.state.user['username']} 刪除了聯絡人「{name}」", "/persons")
    db.close()
    return RedirectResponse("/persons", status_code=302)


@router.post("/{person_id}/photo")
@login_required
async def upload_photo(request: Request, person_id: int, photo: UploadFile = File(...)):
    if not can_edit(request.state.user):
        return RedirectResponse(f"/persons/{person_id}", status_code=302)
    content = await photo.read()
    ext = os.path.splitext(photo.filename or "photo.jpg")[1] or ".jpg"
    filename = f"person_{person_id}{ext}"
    save_path = PHOTO_DIR / filename
    with open(save_path, "wb") as f:
        f.write(content)
    db = get_db()
    db.execute("UPDATE persons SET photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
               (f"/static/photos/{filename}", person_id))
    db.commit()
    db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)


@router.post("/{person_id}/relationship")
@login_required
async def add_relationship(request: Request, person_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse(f"/persons/{person_id}", status_code=302)
    form = await request.form()
    other_id = form.get("other_person_id")
    label = form.get("label", "")
    notes = form.get("rel_notes", "")

    if other_id and label:
        db = get_db()
        db.execute("INSERT INTO relationships (person_a_id, person_b_id, label, notes) VALUES (?,?,?,?)",
                   (person_id, int(other_id), label, notes))
        db.commit()
        db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)


@router.post("/relationship/{rel_id}/delete")
@login_required
async def delete_relationship(request: Request, rel_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse("/persons", status_code=302)
    form = await request.form()
    person_id = form.get("person_id", "")
    db = get_db()
    db.execute("DELETE FROM relationships WHERE id = ?", (rel_id,))
    db.commit()
    db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)


# --- Interaction routes ---
@router.post("/{person_id}/interaction")
@login_required
async def add_interaction(request: Request, person_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse(f"/persons/{person_id}", status_code=302)
    form = await request.form()
    db = get_db()
    db.execute(
        "INSERT INTO interactions (person_id, user_id, type, title, content, interaction_date) VALUES (?,?,?,?,?,?)",
        (person_id, request.state.user["id"], form.get("type", "note"),
         form.get("title", ""), form.get("content", ""), form.get("interaction_date", "")),
    )
    db.commit()
    db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)


@router.post("/interaction/{interaction_id}/delete")
@login_required
async def delete_interaction(request: Request, interaction_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse("/persons", status_code=302)
    form = await request.form()
    person_id = form.get("person_id", "")
    db = get_db()
    db.execute("DELETE FROM interactions WHERE id = ?", (interaction_id,))
    db.commit()
    db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)


# --- Batch operations ---
@router.post("/batch")
@login_required
async def batch_action(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/persons", status_code=302)
    form = await request.form()
    action = form.get("batch_action", "")
    person_ids = form.getlist("selected[]")

    if not person_ids:
        return RedirectResponse("/persons", status_code=302)

    db = get_db()

    if action == "delete":
        for pid in person_ids:
            db.execute("DELETE FROM persons WHERE id = ?", (int(pid),))
        db.commit()
        request.state.flash = [("success", f"已刪除 {len(person_ids)} 位聯絡人")]

    elif action == "add_tag":
        tag_name = form.get("batch_tag", "").strip()
        if tag_name:
            tag_id = _get_or_create_tag(db, tag_name)
            for pid in person_ids:
                db.execute("INSERT OR IGNORE INTO person_tags (person_id, tag_id) VALUES (?,?)", (int(pid), tag_id))
            db.commit()
            request.state.flash = [("success", f"已為 {len(person_ids)} 位聯絡人加上標籤「{tag_name}」")]

    elif action == "remove_tag":
        tag_name = form.get("batch_tag", "").strip().lower()
        if tag_name:
            tag = db.execute("SELECT id FROM tags WHERE name = ?", (tag_name,)).fetchone()
            if tag:
                for pid in person_ids:
                    db.execute("DELETE FROM person_tags WHERE person_id = ? AND tag_id = ?", (int(pid), tag["id"]))
                db.commit()
            request.state.flash = [("success", f"已為 {len(person_ids)} 位聯絡人移除標籤「{tag_name}」")]

    db.close()
    return RedirectResponse("/persons", status_code=302)
