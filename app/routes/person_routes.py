from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required
from app.database import get_db

router = APIRouter(prefix="/persons")
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash, **kwargs}
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


def _save_roles(db, person_id: int, form_data: dict):
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


@router.get("")
@login_required
async def list_persons(request: Request):
    tag_filter = request.query_params.get("tag", "")
    db = get_db()

    if tag_filter:
        persons = db.execute("""
            SELECT DISTINCT p.* FROM persons p
            JOIN person_tags pt ON pt.person_id = p.id
            JOIN tags t ON t.id = pt.tag_id
            WHERE t.name = ?
            ORDER BY p.last_name, p.first_name
        """, (tag_filter,)).fetchall()
    else:
        persons = db.execute("SELECT * FROM persons ORDER BY updated_at DESC").fetchall()

    person_list = []
    for p in persons:
        pid = p["id"]
        tags = db.execute("""
            SELECT t.name FROM tags t JOIN person_tags pt ON pt.tag_id = t.id WHERE pt.person_id = ?
        """, (pid,)).fetchall()
        roles = db.execute("""
            SELECT r.*, c.name as company_name FROM roles r
            LEFT JOIN companies c ON c.id = r.company_id WHERE r.person_id = ?
        """, (pid,)).fetchall()
        person_list.append({"person": dict(p), "tags": [t["name"] for t in tags], "roles": [dict(r) for r in roles]})

    all_tags = db.execute("SELECT DISTINCT t.name FROM tags t JOIN person_tags pt ON pt.tag_id = t.id ORDER BY t.name").fetchall()
    db.close()
    return _render(request, "persons/list.html",
        person_list=person_list, all_tags=[t["name"] for t in all_tags], current_tag=tag_filter)


@router.get("/new")
@login_required
async def new_person(request: Request):
    db = get_db()
    companies = db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()
    db.close()
    return _render(request, "persons/form.html",
        person=None, roles=[], tags=[], companies=[dict(c) for c in companies])


@router.post("/new")
@login_required
async def create_person(request: Request):
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

    db.execute(
        "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
        (request.state.user["id"], "person", person_id, "create",
         f"建立聯絡人: {form.get('first_name', '')} {form.get('last_name', '')}"),
    )
    db.commit()
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

    tags = db.execute("""
        SELECT t.name FROM tags t JOIN person_tags pt ON pt.tag_id = t.id WHERE pt.person_id = ?
    """, (person_id,)).fetchall()

    relationships = db.execute("""
        SELECT rel.*,
            pa.first_name || ' ' || pa.last_name as person_a_name, pa.id as person_a_id,
            pb.first_name || ' ' || pb.last_name as person_b_name, pb.id as person_b_id
        FROM relationships rel
        JOIN persons pa ON pa.id = rel.person_a_id
        JOIN persons pb ON pb.id = rel.person_b_id
        WHERE rel.person_a_id = ? OR rel.person_b_id = ?
    """, (person_id, person_id)).fetchall()

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
        relationships=relationships, logs=logs, all_persons=all_persons)


@router.get("/{person_id}/edit")
@login_required
async def edit_person(request: Request, person_id: int):
    db = get_db()
    person = db.execute("SELECT * FROM persons WHERE id = ?", (person_id,)).fetchone()
    if not person:
        db.close()
        return RedirectResponse("/persons", status_code=302)
    roles = db.execute("""
        SELECT r.*, c.name as company_name FROM roles r
        LEFT JOIN companies c ON c.id = r.company_id WHERE r.person_id = ?
    """, (person_id,)).fetchall()
    tags = db.execute("""
        SELECT t.name FROM tags t JOIN person_tags pt ON pt.tag_id = t.id WHERE pt.person_id = ?
    """, (person_id,)).fetchall()
    companies = db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()
    db.close()
    return _render(request, "persons/form.html",
        person=dict(person), roles=[dict(r) for r in roles],
        tags=[t["name"] for t in tags], companies=[dict(c) for c in companies])


@router.post("/{person_id}/edit")
@login_required
async def update_person(request: Request, person_id: int):
    form = await request.form()
    db = get_db()
    db.execute(
        "UPDATE persons SET first_name=?, last_name=?, email=?, phone=?, notes=?, updated_by=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (form.get("first_name", ""), form.get("last_name", ""), form.get("email", ""),
         form.get("phone", ""), form.get("notes", ""), request.state.user["id"], person_id),
    )
    db.commit()

    _save_tags(db, person_id, form.get("tags", ""))
    _save_roles(db, person_id, form)

    db.execute(
        "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
        (request.state.user["id"], "person", person_id, "update",
         f"更新聯絡人: {form.get('first_name', '')} {form.get('last_name', '')}"),
    )
    db.commit()
    db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)


@router.post("/{person_id}/delete")
@login_required
async def delete_person(request: Request, person_id: int):
    db = get_db()
    db.execute("DELETE FROM persons WHERE id = ?", (person_id,))
    db.execute(
        "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
        (request.state.user["id"], "person", person_id, "delete", "刪除聯絡人"),
    )
    db.commit()
    db.close()
    return RedirectResponse("/persons", status_code=302)


@router.post("/{person_id}/relationship")
@login_required
async def add_relationship(request: Request, person_id: int):
    form = await request.form()
    other_id = form.get("other_person_id")
    label = form.get("label", "")
    notes = form.get("rel_notes", "")

    if other_id and label:
        db = get_db()
        db.execute(
            "INSERT INTO relationships (person_a_id, person_b_id, label, notes) VALUES (?,?,?,?)",
            (person_id, int(other_id), label, notes),
        )
        db.commit()
        db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)


@router.post("/relationship/{rel_id}/delete")
@login_required
async def delete_relationship(request: Request, rel_id: int):
    form = await request.form()
    person_id = form.get("person_id", "")
    db = get_db()
    db.execute("DELETE FROM relationships WHERE id = ?", (rel_id,))
    db.commit()
    db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)
