from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import hash_password, verify_password, create_session_token, get_user_from_request
from app.database import get_db

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def _render(request, template, **kwargs):
    ctx = {"request": request, "user": kwargs.pop("user", None),
           "get_flashed_messages": lambda: request.state.flash,
           "notif_count": 0, "can_edit": False, **kwargs}
    return templates.TemplateResponse(request=request, name=template, context=ctx)


@router.get("/login")
async def login_page(request: Request):
    user = get_user_from_request(request)
    if user:
        return RedirectResponse("/", status_code=302)
    return _render(request, "login.html")


@router.post("/login")
async def login_submit(request: Request, username: str = Form(...), password: str = Form(...)):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    db.close()

    if not user or not verify_password(password, user["password_hash"]):
        request.state.flash = [("error", "帳號或密碼錯誤")]
        return _render(request, "login.html")

    response = RedirectResponse("/", status_code=302)
    response.set_cookie("session", create_session_token(user["id"]), httponly=True, max_age=86400 * 30)
    return response


@router.get("/register")
async def register_page(request: Request):
    return _render(request, "register.html")


@router.post("/register")
async def register_submit(
    request: Request, username: str = Form(...), email: str = Form(...),
    password: str = Form(...), password_confirm: str = Form(...),
    display_name: str = Form(""),
    security_question: str = Form(""), security_answer: str = Form(""),
):
    if password != password_confirm:
        request.state.flash = [("error", "兩次密碼不一致")]
        return _render(request, "register.html")

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username, email)).fetchone()

    if existing:
        db.close()
        request.state.flash = [("error", "帳號或 Email 已被使用")]
        return _render(request, "register.html")

    user_count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    role = "admin" if user_count == 0 else "editor"

    answer_hash = hash_password(security_answer.strip().lower()) if security_answer else ""

    db.execute(
        """INSERT INTO users (username, email, password_hash, display_name, role,
           security_question, security_answer_hash) VALUES (?,?,?,?,?,?,?)""",
        (username, email, hash_password(password), display_name or username, role,
         security_question, answer_hash),
    )
    db.commit()

    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    db.close()

    response = RedirectResponse("/", status_code=302)
    response.set_cookie("session", create_session_token(user["id"]), httponly=True, max_age=86400 * 30)
    return response


@router.get("/forgot-password")
async def forgot_password_page(request: Request):
    return _render(request, "forgot_password.html", step="lookup")


@router.post("/forgot-password")
async def forgot_password_submit(request: Request):
    form = await request.form()
    step = form.get("step", "lookup")
    username = form.get("username", "").strip()

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()

    if not user:
        db.close()
        request.state.flash = [("error", "找不到此帳號")]
        return _render(request, "forgot_password.html", step="lookup")

    if not user["security_question"] or not user["security_answer_hash"]:
        db.close()
        request.state.flash = [("error", "此帳號未設定安全問題，請聯絡管理員")]
        return _render(request, "forgot_password.html", step="lookup")

    if step == "lookup":
        db.close()
        return _render(request, "forgot_password.html", step="question",
                       username=username, security_question=user["security_question"])

    # step == 'question'
    answer = form.get("security_answer", "").strip().lower()
    new_password = form.get("new_password", "")
    new_password_confirm = form.get("new_password_confirm", "")

    if not verify_password(answer, user["security_answer_hash"]):
        db.close()
        request.state.flash = [("error", "安全問題答案錯誤")]
        return _render(request, "forgot_password.html", step="question",
                       username=username, security_question=user["security_question"])

    if new_password != new_password_confirm:
        db.close()
        request.state.flash = [("error", "兩次密碼不一致")]
        return _render(request, "forgot_password.html", step="question",
                       username=username, security_question=user["security_question"])

    if len(new_password) < 6:
        db.close()
        request.state.flash = [("error", "密碼至少需 6 個字元")]
        return _render(request, "forgot_password.html", step="question",
                       username=username, security_question=user["security_question"])

    db.execute("UPDATE users SET password_hash = ? WHERE id = ?",
               (hash_password(new_password), user["id"]))
    db.commit()
    db.close()

    request.state.flash = [("success", "密碼已重設，請用新密碼登入")]
    return _render(request, "login.html")


@router.get("/logout")
async def logout(request: Request):
    response = RedirectResponse("/login", status_code=302)
    response.delete_cookie("session")
    return response
