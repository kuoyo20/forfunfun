from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.database import get_db

router = APIRouter(prefix="/api")

# Preset tag suggestions for common CRM categories
PRESET_TAGS = [
    # 關係類
    "大學同學", "高中同學", "研究所同學", "同事", "前同事", "家人", "親戚", "鄰居",
    # 商業類
    "合作夥伴", "客戶", "潛在客戶", "供應商", "投資人", "顧問", "業務往來",
    # 社交類
    "朋友", "好友", "社團", "教會", "社區", "志工",
    # 產業類
    "科技業", "金融業", "醫療業", "製造業", "法律", "會計", "設計", "行銷",
    # 層級類
    "決策者", "高階主管", "中階主管", "基層",
    # 特殊類
    "名片掃描", "展覽認識", "朋友介紹", "線上認識",
]


@router.get("/tags/suggest")
async def suggest_tags(request: Request, q: str = ""):
    if len(q) < 1:
        return JSONResponse([])
    db = get_db()
    # Combine DB tags with preset suggestions
    db_tags = db.execute(
        "SELECT name FROM tags WHERE name LIKE ? ORDER BY name LIMIT 10",
        (f"%{q}%",),
    ).fetchall()
    db.close()
    results = [t["name"] for t in db_tags]

    # Add matching presets that aren't already in results
    q_lower = q.lower()
    for preset in PRESET_TAGS:
        if q_lower in preset.lower() and preset not in results:
            results.append(preset)
        if len(results) >= 15:
            break

    return JSONResponse(results)


@router.get("/tags/presets")
async def get_preset_tags(request: Request):
    """Return all preset tag categories for the tag input UI."""
    return JSONResponse(PRESET_TAGS)


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


@router.get("/gift-summary")
async def gift_summary(request: Request):
    """Get gift tier summary stats."""
    db = get_db()
    tiers = db.execute("""
        SELECT gift_tier, COUNT(*) as cnt FROM persons
        WHERE gift_tier != '' GROUP BY gift_tier ORDER BY
        CASE gift_tier WHEN 'VIP' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 WHEN 'C' THEN 4 WHEN 'D' THEN 5 END
    """).fetchall()
    total_spent = db.execute("SELECT COALESCE(SUM(amount), 0) FROM gift_records").fetchone()[0]
    upcoming_birthdays = db.execute("""
        SELECT id, first_name, last_name, birthday, gift_tier FROM persons
        WHERE birthday != '' ORDER BY
        SUBSTR(birthday, -5)
        LIMIT 10
    """).fetchall()
    db.close()
    return JSONResponse({
        "tiers": [{"tier": t["gift_tier"], "count": t["cnt"]} for t in tiers],
        "total_spent": total_spent,
        "upcoming_birthdays": [
            {"id": p["id"], "name": f"{p['first_name']} {p['last_name']}",
             "birthday": p["birthday"], "tier": p["gift_tier"]}
            for p in upcoming_birthdays
        ],
    })
