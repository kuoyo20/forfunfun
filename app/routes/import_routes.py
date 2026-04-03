import os
import json
from fastapi import APIRouter, Request, UploadFile, File, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required
from app.database import get_db
from app.config import UPLOAD_DIR
from app.services.import_service import parse_csv, parse_excel, map_and_import
from app.services.ocr_service import ocr_image, extract_card_info

router = APIRouter(prefix="/import")
templates = Jinja2Templates(directory="app/templates")


def _ctx(request, **kwargs):
    return {"request": request, "user": request.state.user,
            "get_flashed_messages": lambda: request.state.flash, **kwargs}


@router.get("")
@login_required
async def import_page(request: Request):
    return templates.TemplateResponse("import.html", _ctx(request))


@router.post("/file")
@login_required
async def upload_file(request: Request, file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "upload"

    if filename.endswith((".xlsx", ".xls")):
        headers, rows = parse_excel(content)
    elif filename.endswith(".csv"):
        headers, rows = parse_csv(content)
    else:
        request.state.flash = [("error", "不支援的檔案格式，請上傳 CSV 或 Excel 檔案")]
        return templates.TemplateResponse("import.html", _ctx(request))

    if not rows:
        request.state.flash = [("error", "檔案中沒有資料")]
        return templates.TemplateResponse("import.html", _ctx(request))

    # Store rows in a temp file for the mapping step
    import tempfile
    tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', dir=str(UPLOAD_DIR), delete=False)
    json.dump({"headers": headers, "rows": rows}, tmp)
    tmp.close()
    tmp_name = os.path.basename(tmp.name)

    preview = rows[:5]
    field_options = ["first_name", "last_name", "email", "phone", "company", "title", "tags", "notes"]

    return templates.TemplateResponse("import_mapping.html", _ctx(
        request, headers=headers, preview=preview, total=len(rows),
        tmp_file=tmp_name, field_options=field_options,
    ))


@router.post("/confirm")
@login_required
async def confirm_import(request: Request):
    form = await request.form()
    tmp_file = form.get("tmp_file", "")
    tmp_path = UPLOAD_DIR / tmp_file

    if not tmp_path.exists():
        request.state.flash = [("error", "暫存檔案已過期，請重新上傳")]
        return templates.TemplateResponse("import.html", _ctx(request))

    with open(tmp_path) as f:
        data = json.load(f)

    # Build mapping from form
    mapping = {}
    for key in ["first_name", "last_name", "email", "phone", "company", "title", "tags", "notes"]:
        col = form.get(f"map_{key}", "")
        if col:
            mapping[key] = col

    db = get_db()
    count = map_and_import(data["rows"], mapping, db, request.state.user["id"])
    db.close()

    # Clean up temp file
    os.unlink(tmp_path)

    request.state.flash = [("success", f"成功匯入 {count} 筆聯絡人！")]
    return templates.TemplateResponse("import.html", _ctx(request))


@router.post("/scan")
@login_required
async def scan_card(request: Request, file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "card.jpg"

    # Save to uploads
    save_path = UPLOAD_DIR / filename
    counter = 1
    while save_path.exists():
        name, ext = os.path.splitext(filename)
        save_path = UPLOAD_DIR / f"{name}_{counter}{ext}"
        counter += 1

    with open(save_path, "wb") as f:
        f.write(content)

    # OCR
    ocr_text = ocr_image(str(save_path))
    card_info = extract_card_info(ocr_text)

    db = get_db()
    companies = db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()
    db.close()

    return templates.TemplateResponse("import_scan_result.html", _ctx(
        request, ocr_text=ocr_text, card_info=card_info,
        companies=[dict(c) for c in companies],
    ))
