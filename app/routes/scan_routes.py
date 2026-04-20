"""One-click business card scanner — camera → OCR → auto-create contact."""
import os
from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required, can_edit, notify_other_editors
from app.database import get_db
from app.config import UPLOAD_DIR
from app.services.ocr_service import ocr_image, extract_card_info

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash,
           "notif_count": getattr(request.state, "notif_count", 0),
           "can_edit": can_edit(request.state.user), **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("/scan")
@login_required
async def scan_page(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/persons", status_code=302)
    return _render(request, "scan.html")


@router.post("/scan/auto")
@login_required
async def scan_auto_create(request: Request, file: UploadFile = File(...)):
    if not can_edit(request.state.user):
        return RedirectResponse("/persons", status_code=302)

    content = await file.read()
    if not content:
        request.state.flash = [("error", "未收到圖片，請重新拍攝")]
        return RedirectResponse("/scan", status_code=303)

    filename = file.filename or "card.jpg"
    save_path = UPLOAD_DIR / filename
    counter = 1
    while save_path.exists():
        name, ext = os.path.splitext(filename)
        save_path = UPLOAD_DIR / f"{name}_{counter}{ext}"
        counter += 1

    with open(save_path, "wb") as f:
        f.write(content)

    ocr_text = ocr_image(str(save_path))

    if ocr_text.startswith("[Error]"):
        request.state.flash = [("error", f"OCR 辨識失敗：{ocr_text}")]
        return RedirectResponse("/scan", status_code=303)

    card_info = extract_card_info(ocr_text)

    if not card_info.get("first_name") and not card_info.get("last_name"):
        request.state.flash = [("error", "無法從名片辨識出姓名，請手動建立或重新拍攝更清晰的照片")]
        return RedirectResponse("/scan", status_code=303)

    db = get_db()

    company_id = None
    company_name = card_info.get("company", "").strip()
    if company_name:
        existing = db.execute("SELECT id FROM companies WHERE name = ?", (company_name,)).fetchone()
        if existing:
            company_id = existing["id"]
        else:
            db.execute("INSERT INTO companies (name) VALUES (?)", (company_name,))
            db.commit()
            company_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

    first_name = card_info.get("first_name", "")
    last_name = card_info.get("last_name", "")
    email = card_info.get("email", "")
    phone = card_info.get("phone", "")
    title = card_info.get("title", "")
    notes_parts = ["名片掃描自動建立"]
    if card_info.get("address"):
        notes_parts.append(f"地址：{card_info['address']}")
    if card_info.get("website"):
        notes_parts.append(f"網站：{card_info['website']}")
    notes = "\n".join(notes_parts)

    db.execute(
        "INSERT INTO persons (first_name, last_name, email, phone, notes, created_by, updated_by) VALUES (?,?,?,?,?,?,?)",
        (first_name, last_name, email, phone, notes,
         request.state.user["id"], request.state.user["id"]),
    )
    db.commit()
    person_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

    tag_row = db.execute("SELECT id FROM tags WHERE name = ?", ("名片掃描",)).fetchone()
    if tag_row:
        tag_id = tag_row["id"]
    else:
        db.execute("INSERT INTO tags (name) VALUES (?)", ("名片掃描",))
        db.commit()
        tag_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.execute("INSERT OR IGNORE INTO person_tags (person_id, tag_id) VALUES (?,?)", (person_id, tag_id))

    if company_id and title:
        db.execute(
            "INSERT INTO roles (person_id, company_id, title, work_email, work_phone, is_current) VALUES (?,?,?,?,?,?)",
            (person_id, company_id, title, email, phone, True),
        )

    full_name = f"{first_name}{last_name}".strip() or "未知"
    db.execute(
        "INSERT INTO edit_log (user_id, entity_type, entity_id, action, changes) VALUES (?,?,?,?,?)",
        (request.state.user["id"], "person", person_id, "create",
         f"名片掃描自動建立聯絡人: {full_name}"),
    )
    db.commit()
    notify_other_editors(db, request.state.user["id"],
        f"{request.state.user['username']} 掃描名片新增了「{full_name}」", f"/persons/{person_id}")
    db.close()

    detail_parts = []
    if company_name:
        detail_parts.append(company_name)
    if title:
        detail_parts.append(title)
    if email:
        detail_parts.append(email)
    if phone:
        detail_parts.append(phone)
    detail_str = "、".join(detail_parts)

    request.state.flash = [("success",
        f"已從名片自動建立聯絡人「{full_name}」{('（' + detail_str + '）') if detail_str else ''}。請確認資料是否正確。")]
    return RedirectResponse(f"/persons/{person_id}", status_code=303)
