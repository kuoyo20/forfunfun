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
        return dict(user)
    return None


def login_required(func):
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        user = get_user_from_request(request)
        if not user:
            return RedirectResponse("/login", status_code=302)
        request.state.user = user
        return await func(request, *args, **kwargs)
    return wrapper
