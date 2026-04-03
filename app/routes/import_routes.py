import os
import json
from fastapi import APIRouter, Request, UploadFile, File, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required, can_edit
from app.database import get_db
from app.config import UPLOAD_DIR
from app.services.import_service import parse_csv, parse_excel, map_and_import, find_duplicates
from app.services.ocr_service import ocr_image, extract_card_info

router = APIRouter(prefix="/import")
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash,
           "notif_count": getattr(request.state, "notif_count", 0),
           "can_edit": can_edit(request.state.user), **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("")
@login_required
async def import_page(request: Request):
    return _render(request, "import.html")


@router.post("/file")
@login_required
async def upload_file(request: Request, file: UploadFile = File(...)):
    if not can_edit(request.state.user):
        return RedirectResponse("/import", status_code=302)
    content = await file.read()
    filename = file.filename or "upload"

    if filename.endswith((".xlsx", ".xls")):
        headers, rows = parse_excel(content)
    elif filename.endswith(".csv"):
        headers, rows = parse_csv(content)
    else:
        request.state.flash = [("error", "不支援的檔案格式，請上傳 CSV 或 Excel 檔案")]
        return _render(request, "import.html")

    if not rows:
        request.state.flash = [("error", "檔案中沒有資料")]
        return _render(request, "import.html")

    import tempfile
    tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', dir=str(UPLOAD_DIR), delete=False)
    json.dump({"headers": headers, "rows": rows}, tmp)
    tmp.close()
    tmp_name = os.path.basename(tmp.name)

    preview = rows[:5]
    field_options = ["first_name", "last_name", "email", "phone", "company", "title", "tags", "notes"]

    return _render(request, "import_mapping.html",
        headers=headers, preview=preview, total=len(rows),
        tmp_file=tmp_name, field_options=field_options)


@router.post("/check-duplicates")
@login_required
async def check_duplicates(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/import", status_code=302)
    form = await request.form()
    tmp_file = form.get("tmp_file", "")
    tmp_path = UPLOAD_DIR / tmp_file

    if not tmp_path.exists():
        request.state.flash = [("error", "暫存檔案已過期，請重新上傳")]
        return _render(request, "import.html")

    with open(tmp_path) as f:
        data = json.load(f)

    mapping = {}
    for key in ["first_name", "last_name", "email", "phone", "company", "title", "tags", "notes"]:
        col = form.get(f"map_{key}", "")
        if col:
            mapping[key] = col

    # Save mapping for confirm step
    mapping_json = json.dumps(mapping)

    db = get_db()
    dupes = find_duplicates(data["rows"], mapping, db)
    db.close()

    if dupes:
        return _render(request, "import_duplicates.html",
            dupes=dupes, total=len(data["rows"]),
            tmp_file=tmp_file, mapping_json=mapping_json)

    # No duplicates, proceed directly
    db = get_db()
    count, skipped = map_and_import(data["rows"], mapping, db, request.state.user["id"])
    db.close()
    os.unlink(tmp_path)
    request.state.flash = [("success", f"成功匯入 {count} 筆聯絡人！")]
    return _render(request, "import.html")


@router.post("/confirm")
@login_required
async def confirm_import(request: Request):
    if not can_edit(request.state.user):
        return RedirectResponse("/import", status_code=302)
    form = await request.form()
    tmp_file = form.get("tmp_file", "")
    tmp_path = UPLOAD_DIR / tmp_file

    if not tmp_path.exists():
        request.state.flash = [("error", "暫存檔案已過期，請重新上傳")]
        return _render(request, "import.html")

    with open(tmp_path) as f:
        data = json.load(f)

    mapping = json.loads(form.get("mapping_json", "{}"))

    # Collect indices to skip
    skip_indices = set()
    for key in form.keys():
        if key.startswith("skip_"):
            try:
                skip_indices.add(int(key.replace("skip_", "")))
            except ValueError:
                pass

    db = get_db()
    count, skipped = map_and_import(data["rows"], mapping, db, request.state.user["id"], skip_indices)
    db.close()
    os.unlink(tmp_path)

    msg = f"成功匯入 {count} 筆聯絡人"
    if skipped:
        msg += f"，跳過 {skipped} 筆重複"
    request.state.flash = [("success", msg + "！")]
    return _render(request, "import.html")


@router.post("/scan")
@login_required
async def scan_card(request: Request, file: UploadFile = File(...)):
    if not can_edit(request.state.user):
        return RedirectResponse("/import", status_code=302)
    content = await file.read()
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
    card_info = extract_card_info(ocr_text)

    db = get_db()
    companies = db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()
    db.close()

    return _render(request, "import_scan_result.html",
        ocr_text=ocr_text, card_info=card_info,
        companies=[dict(c) for c in companies])


@router.post("/text")
@login_required
async def import_text(request: Request):
    """Import from pasted text (alternative to OCR)."""
    if not can_edit(request.state.user):
        return RedirectResponse("/import", status_code=302)
    form = await request.form()
    text = form.get("card_text", "")
    card_info = extract_card_info(text)

    db = get_db()
    companies = db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()
    db.close()

    return _render(request, "import_scan_result.html",
        ocr_text=text, card_info=card_info,
        companies=[dict(c) for c in companies])
