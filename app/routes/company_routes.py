from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required
from app.database import get_db

router = APIRouter(prefix="/companies")
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash, **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("")
@login_required
async def list_companies(request: Request):
    db = get_db()
    companies = db.execute("""
        SELECT c.*, COUNT(DISTINCT r.person_id) as person_count
        FROM companies c
        LEFT JOIN roles r ON r.company_id = c.id
        GROUP BY c.id ORDER BY c.name
    """).fetchall()
    db.close()
    return _render(request, "companies/list.html", companies=companies)


@router.get("/new")
@login_required
async def new_company(request: Request):
    return _render(request, "companies/form.html", company=None)


@router.post("/new")
@login_required
async def create_company(
    request: Request,
    name: str = Form(...),
    domain: str = Form(""),
    industry: str = Form(""),
    website: str = Form(""),
    address: str = Form(""),
    notes: str = Form(""),
):
    db = get_db()
    db.execute(
        "INSERT INTO companies (name, domain, industry, website, address, notes, created_by) VALUES (?,?,?,?,?,?,?)",
        (name, domain, industry, website, address, notes, request.state.user["id"]),
    )
    db.commit()
    company_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.execute(
        "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
        (request.state.user["id"], "company", company_id, "create", f"建立公司: {name}"),
    )
    db.commit()
    db.close()
    return RedirectResponse(f"/companies/{company_id}", status_code=302)


@router.get("/{company_id}")
@login_required
async def view_company(request: Request, company_id: int):
    db = get_db()
    company = db.execute("SELECT * FROM companies WHERE id = ?", (company_id,)).fetchone()
    if not company:
        db.close()
        return RedirectResponse("/companies", status_code=302)
    people = db.execute("""
        SELECT p.*, r.title, r.is_current, r.work_email, r.work_phone
        FROM roles r JOIN persons p ON p.id = r.person_id
        WHERE r.company_id = ? ORDER BY r.is_current DESC, p.last_name
    """, (company_id,)).fetchall()
    db.close()
    return _render(request, "companies/detail.html", company=company, people=people)


@router.get("/{company_id}/edit")
@login_required
async def edit_company(request: Request, company_id: int):
    db = get_db()
    company = db.execute("SELECT * FROM companies WHERE id = ?", (company_id,)).fetchone()
    db.close()
    if not company:
        return RedirectResponse("/companies", status_code=302)
    return _render(request, "companies/form.html", company=company)


@router.post("/{company_id}/edit")
@login_required
async def update_company(
    request: Request, company_id: int,
    name: str = Form(...),
    domain: str = Form(""),
    industry: str = Form(""),
    website: str = Form(""),
    address: str = Form(""),
    notes: str = Form(""),
):
    db = get_db()
    db.execute(
        "UPDATE companies SET name=?, domain=?, industry=?, website=?, address=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (name, domain, industry, website, address, notes, company_id),
    )
    db.execute(
        "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
        (request.state.user["id"], "company", company_id, "update", f"更新公司: {name}"),
    )
    db.commit()
    db.close()
    return RedirectResponse(f"/companies/{company_id}", status_code=302)


@router.post("/{company_id}/delete")
@login_required
async def delete_company(request: Request, company_id: int):
    db = get_db()
    db.execute("DELETE FROM companies WHERE id = ?", (company_id,))
    db.execute(
        "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
        (request.state.user["id"], "company", company_id, "delete", "刪除公司"),
    )
    db.commit()
    db.close()
    return RedirectResponse("/companies", status_code=302)
