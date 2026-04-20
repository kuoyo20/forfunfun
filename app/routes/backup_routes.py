"""Backup and restore — download full SQLite DB and upload to restore."""
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import FileResponse, RedirectResponse
from app.auth import login_required, is_admin
from app.config import DB_PATH

router = APIRouter()


@router.get("/admin/backup")
@login_required
async def backup_download(request: Request):
    if not is_admin(request.state.user):
        return RedirectResponse("/dashboard", status_code=302)
    filename = f"contacts-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"
    return FileResponse(DB_PATH, filename=filename, media_type="application/octet-stream")


@router.post("/admin/restore")
@login_required
async def backup_restore(request: Request, file: UploadFile = File(...)):
    if not is_admin(request.state.user):
        return RedirectResponse("/dashboard", status_code=302)

    content = await file.read()
    if not content[:16].startswith(b"SQLite format 3"):
        request.state.flash = [("error", "檔案不是有效的 SQLite 資料庫")]
        return RedirectResponse("/admin/users", status_code=303)

    # Save current DB as safety backup
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = Path(str(DB_PATH) + f".before-restore-{ts}")
    if DB_PATH.exists():
        shutil.copy2(str(DB_PATH), str(backup_path))

    with open(DB_PATH, "wb") as f:
        f.write(content)

    request.state.flash = [("success",
        f"資料庫已還原。舊資料備份在 {backup_path.name}。請重新登入。")]
    response = RedirectResponse("/login", status_code=303)
    response.delete_cookie("session")
    return response
