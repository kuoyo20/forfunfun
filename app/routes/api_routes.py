from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.database import get_db

router = APIRouter(prefix="/api")


@router.get("/tags/suggest")
async def suggest_tags(request: Request, q: str = ""):
    if len(q) < 1:
        return JSONResponse([])
    db = get_db()
    tags = db.execute(
        "SELECT name FROM tags WHERE name LIKE ? ORDER BY name LIMIT 10",
        (f"%{q}%",),
    ).fetchall()
    db.close()
    return JSONResponse([t["name"] for t in tags])


@router.get("/persons/suggest")
async def suggest_persons(request: Request, q: str = ""):
    if len(q) < 1:
        return JSONResponse([])
    db = get_db()
    like = f"%{q}%"
    persons = db.execute(
        "SELECT id, first_name, last_name FROM persons WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? LIMIT 10",
        (like, like, like),
    ).fetchall()
    db.close()
    return JSONResponse([{"id": p["id"], "name": f"{p['first_name']} {p['last_name']}"} for p in persons])
