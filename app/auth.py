import bcrypt
from itsdangerous import URLSafeSerializer
from starlette.requests import Request
from starlette.responses import RedirectResponse
from functools import wraps
from app.config import SECRET_KEY
from app.database import get_db

serializer = URLSafeSerializer(SECRET_KEY)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_session_token(user_id: int) -> str:
    return serializer.dumps({"user_id": user_id})


def get_user_from_request(request: Request) -> dict | None:
    token = request.cookies.get("session")
    if not token:
        return None
    try:
        data = serializer.loads(token)
    except Exception:
        return None
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (data["user_id"],)).fetchone()
    db.close()
    if user:
        u = dict(user)
        # Ensure role field exists for older DBs
        if "role" not in u:
            u["role"] = "editor"
        return u
    return None


def get_unread_notification_count(user_id: int) -> int:
    db = get_db()
    count = db.execute("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0", (user_id,)).fetchone()[0]
    db.close()
    return count


def login_required(func):
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        user = get_user_from_request(request)
        if not user:
            return RedirectResponse("/login", status_code=302)
        request.state.user = user
        request.state.notif_count = get_unread_notification_count(user["id"])
        return await func(request, *args, **kwargs)
    return wrapper


def require_role(*roles):
    """Decorator to require specific user roles (admin, editor, viewer)."""
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            user = getattr(request.state, "user", None)
            if not user or user.get("role", "viewer") not in roles:
                request.state.flash = [("error", "您沒有權限執行此操作")]
                return RedirectResponse("/dashboard", status_code=302)
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


def can_edit(user: dict) -> bool:
    return user.get("role", "viewer") in ("admin", "editor")


def is_admin(user: dict) -> bool:
    return user.get("role", "viewer") == "admin"


def create_notification(db, user_id: int, message: str, link: str = ""):
    db.execute(
        "INSERT INTO notifications (user_id, message, link) VALUES (?,?,?)",
        (user_id, message, link),
    )
    db.commit()


def notify_other_editors(db, current_user_id: int, message: str, link: str = ""):
    """Notify all editors/admins except the current user."""
    users = db.execute(
        "SELECT id FROM users WHERE id != ? AND role IN ('admin', 'editor')",
        (current_user_id,),
    ).fetchall()
    for u in users:
        create_notification(db, u["id"], message, link)
