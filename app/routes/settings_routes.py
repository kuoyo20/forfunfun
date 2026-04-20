"""User settings — profile, LINE Notify, password change."""
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import login_required, can_edit, hash_password, verify_password
from app.database import get_db
from app.services.line_service import send_line_notify

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": request.state.user,
           "get_flashed_messages": lambda: request.state.flash,
           "notif_count": getattr(request.state, "notif_count", 0),
           "can_edit": can_edit(request.state.user), **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("/settings")
@login_required
async def settings_page(request: Request):
    db = get_db()
    me = db.execute("SELECT * FROM users WHERE id = ?", (request.state.user["id"],)).fetchone()
    db.close()
    return _render(request, "settings.html", me=me)


@router.post("/settings/line-token")
@login_required
async def update_line_token(request: Request):
    form = await request.form()
    token = form.get("line_notify_token", "").strip()
    db = get_db()
    db.execute("UPDATE users SET line_notify_token = ? WHERE id = ?",
               (token, request.state.user["id"]))
    db.commit()
    db.close()
    request.state.flash = [("success", "LINE Notify Token 已更新")]
    return RedirectResponse("/settings", status_code=303)


@router.post("/settings/line-test")
@login_required
async def test_line_notify(request: Request):
    db = get_db()
    row = db.execute("SELECT line_notify_token FROM users WHERE id = ?",
                     (request.state.user["id"],)).fetchone()
    db.close()
    if not row or not row["line_notify_token"]:
        request.state.flash = [("error", "尚未設定 LINE Notify Token")]
    else:
        ok = send_line_notify(row["line_notify_token"], "\n人脈管理系統測試通知 ✓")
        request.state.flash = [("success" if ok else "error",
                               "測試通知已送出，請檢查 LINE" if ok else "發送失敗，請確認 Token 是否正確")]
    return RedirectResponse("/settings", status_code=303)


@router.post("/settings/password")
@login_required
async def change_password(request: Request):
    form = await request.form()
    current = form.get("current_password", "")
    new_password = form.get("new_password", "")
    confirm = form.get("new_password_confirm", "")

    db = get_db()
    me = db.execute("SELECT * FROM users WHERE id = ?", (request.state.user["id"],)).fetchone()

    if not verify_password(current, me["password_hash"]):
        db.close()
        request.state.flash = [("error", "目前密碼錯誤")]
        return RedirectResponse("/settings", status_code=303)

    if new_password != confirm or len(new_password) < 6:
        db.close()
        request.state.flash = [("error", "新密碼不一致或少於 6 字元")]
        return RedirectResponse("/settings", status_code=303)

    db.execute("UPDATE users SET password_hash = ? WHERE id = ?",
               (hash_password(new_password), me["id"]))
    db.commit()
    db.close()
    request.state.flash = [("success", "密碼已更新")]
    return RedirectResponse("/settings", status_code=303)


@router.post("/settings/security-question")
@login_required
async def update_security_question(request: Request):
    form = await request.form()
    question = form.get("security_question", "").strip()
    answer = form.get("security_answer", "").strip().lower()

    if not question or not answer:
        request.state.flash = [("error", "安全問題與答案都必須填寫")]
        return RedirectResponse("/settings", status_code=303)

    db = get_db()
    db.execute("UPDATE users SET security_question = ?, security_answer_hash = ? WHERE id = ?",
               (question, hash_password(answer), request.state.user["id"]))
    db.commit()
    db.close()
    request.state.flash = [("success", "安全問題已更新")]
    return RedirectResponse("/settings", status_code=303)
