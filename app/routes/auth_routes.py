from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from app.auth import hash_password, verify_password, create_session_token, get_user_from_request
from app.database import get_db

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/login")
async def login_page(request: Request):
    user = get_user_from_request(request)
    if user:
        return RedirectResponse("/", status_code=302)
    return templates.TemplateResponse("login.html", {
        "request": request, "user": None, "get_flashed_messages": lambda: request.state.flash
    })


@router.post("/login")
async def login_submit(request: Request, username: str = Form(...), password: str = Form(...)):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    db.close()

    if not user or not verify_password(password, user["password_hash"]):
        request.state.flash = [("error", "帳號或密碼錯誤")]
        return templates.TemplateResponse("login.html", {
            "request": request, "user": None, "get_flashed_messages": lambda: request.state.flash
        })

    response = RedirectResponse("/", status_code=302)
    response.set_cookie("session", create_session_token(user["id"]), httponly=True, max_age=86400 * 30)
    return response


@router.get("/register")
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {
        "request": request, "user": None, "get_flashed_messages": lambda: request.state.flash
    })


@router.post("/register")
async def register_submit(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    password_confirm: str = Form(...),
    display_name: str = Form(""),
):
    if password != password_confirm:
        request.state.flash = [("error", "兩次密碼不一致")]
        return templates.TemplateResponse("register.html", {
            "request": request, "user": None, "get_flashed_messages": lambda: request.state.flash
        })

    db = get_db()
    existing = db.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?", (username, email)
    ).fetchone()

    if existing:
        db.close()
        request.state.flash = [("error", "帳號或 Email 已被使用")]
        return templates.TemplateResponse("register.html", {
            "request": request, "user": None, "get_flashed_messages": lambda: request.state.flash
        })

    db.execute(
        "INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)",
        (username, email, hash_password(password), display_name or username),
    )
    db.commit()

    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    db.close()

    response = RedirectResponse("/", status_code=302)
    response.set_cookie("session", create_session_token(user["id"]), httponly=True, max_age=86400 * 30)
    return response


@router.get("/logout")
async def logout(request: Request):
    response = RedirectResponse("/login", status_code=302)
    response.delete_cookie("session")
    return response
