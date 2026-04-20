"""File attachments for persons — upload, download, delete."""
import os
import uuid
from fastapi import APIRouter, Request, UploadFile, File, Form
from fastapi.responses import RedirectResponse, FileResponse
from app.auth import login_required, can_edit
from app.database import get_db
from app.config import ATTACHMENT_DIR

router = APIRouter()

MAX_SIZE = 10 * 1024 * 1024
ALLOWED_MIME_PREFIXES = (
    "image/", "application/pdf", "application/msword", "application/vnd.",
    "text/", "application/zip"
)


@router.post("/persons/{person_id}/attachment")
@login_required
async def upload_attachment(
    request: Request, person_id: int,
    file: UploadFile = File(...), description: str = Form(""),
):
    if not can_edit(request.state.user):
        return RedirectResponse(f"/persons/{person_id}", status_code=302)

    db = get_db()
    person = db.execute("SELECT id FROM persons WHERE id = ?", (person_id,)).fetchone()
    if not person:
        db.close()
        return RedirectResponse("/persons", status_code=302)

    content = await file.read()
    if len(content) > MAX_SIZE:
        db.close()
        request.state.flash = [("error", "檔案太大（上限 10MB）")]
        return RedirectResponse(f"/persons/{person_id}", status_code=302)

    mime = file.content_type or ""
    if mime and not any(mime.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        db.close()
        request.state.flash = [("error", "不支援的檔案類型")]
        return RedirectResponse(f"/persons/{person_id}", status_code=302)

    ext = os.path.splitext(file.filename)[1][:10]
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = ATTACHMENT_DIR / stored_name
    with open(dest, "wb") as f:
        f.write(content)

    db.execute("""
        INSERT INTO attachments (person_id, user_id, filename, original_name, mime_type, size_bytes, description)
        VALUES (?,?,?,?,?,?,?)
    """, (person_id, request.state.user["id"], stored_name, file.filename, mime, len(content), description))
    db.commit()
    db.close()
    return RedirectResponse(f"/persons/{person_id}", status_code=302)


@router.get("/attachment/{attachment_id}")
@login_required
async def download_attachment(request: Request, attachment_id: int):
    db = get_db()
    att = db.execute("SELECT * FROM attachments WHERE id = ?", (attachment_id,)).fetchone()
    db.close()
    if not att:
        return RedirectResponse("/persons", status_code=302)
    path = ATTACHMENT_DIR / att["filename"]
    if not path.exists():
        return RedirectResponse(f"/persons/{att['person_id']}", status_code=302)
    return FileResponse(path, filename=att["original_name"], media_type=att["mime_type"] or "application/octet-stream")


@router.post("/attachment/{attachment_id}/delete")
@login_required
async def delete_attachment(request: Request, attachment_id: int):
    if not can_edit(request.state.user):
        return RedirectResponse("/persons", status_code=302)
    db = get_db()
    att = db.execute("SELECT * FROM attachments WHERE id = ?", (attachment_id,)).fetchone()
    if att:
        path = ATTACHMENT_DIR / att["filename"]
        if path.exists():
            path.unlink()
        db.execute("DELETE FROM attachments WHERE id = ?", (attachment_id,))
        db.commit()
        pid = att["person_id"]
    else:
        pid = None
    db.close()
    return RedirectResponse(f"/persons/{pid}" if pid else "/persons", status_code=302)
