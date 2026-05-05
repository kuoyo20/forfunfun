from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from app.database import init_db
from app.auth import get_user_from_request
from app.config import PHOTO_DIR
from app.routes import (auth_routes, company_routes, person_routes, search_routes,
                        import_routes, api_routes, gift_routes, reminder_routes,
                        merge_routes, custom_field_routes, timeline_routes, calendar_routes,
                        attachment_routes, settings_routes, backup_routes, scan_routes)

app = FastAPI(title="人脈管理系統")
app.mount("/static/photos", StaticFiles(directory=str(PHOTO_DIR)), name="photos")
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.on_event("startup")
def startup():
    init_db()


@app.middleware("http")
async def flash_middleware(request: Request, call_next):
    request.state.flash = []
    response = await call_next(request)
    return response


app.include_router(auth_routes.router)
app.include_router(company_routes.router)
app.include_router(person_routes.router)
app.include_router(search_routes.router)
app.include_router(import_routes.router)
app.include_router(api_routes.router)
app.include_router(gift_routes.router)
app.include_router(reminder_routes.router)
app.include_router(merge_routes.router)
app.include_router(custom_field_routes.router)
app.include_router(timeline_routes.router)
app.include_router(calendar_routes.router)
app.include_router(attachment_routes.router)
app.include_router(settings_routes.router)
app.include_router(backup_routes.router)
app.include_router(scan_routes.router)


# Register custom Jinja filters on all route template environments
from markupsafe import Markup, escape as _escape

def tbc_filter(value):
    if not value or str(value).strip().upper() == 'TBC':
        return Markup('<span class="tbc">(TBC)</span>')
    return _escape(value)

for _mod_name in ['auth_routes', 'company_routes', 'person_routes', 'search_routes',
                  'gift_routes', 'reminder_routes', 'merge_routes', 'custom_field_routes',
                  'timeline_routes', 'calendar_routes', 'attachment_routes', 'settings_routes',
                  'scan_routes', 'import_routes']:
    _mod = getattr(__import__(f'app.routes.{_mod_name}', fromlist=['templates']), 'templates', None)
    if _mod:
        _mod.env.filters['tbc'] = tbc_filter

import re as _re

def format_name(name):
    if not name or str(name).strip().upper() == 'TBC':
        return Markup('<span class="tbc">(TBC)</span>')
    name = str(name)
    has_chinese = bool(_re.search(r'[一-鿿]', name))
    english_matches = _re.findall(r"[A-Za-z][a-zA-Z\s\.\-']{1,}", name)
    has_english = english_matches and len(''.join(english_matches).replace(' ', '')) >= 2
    if not has_chinese or not has_english:
        return _escape(name)
    chinese_part = ''.join(_re.findall(r'[一-鿿·]+', name)).strip()
    if len(chinese_part) < 2:
        return _escape(name)
    english_part = ' '.join(m.strip() for m in english_matches).strip()
    return Markup(f'{_escape(chinese_part)}<span style="color:var(--text-muted);font-size:.82em">({_escape(english_part)})</span>')

for _mod_name in ['auth_routes', 'company_routes', 'person_routes', 'search_routes',
                  'gift_routes', 'reminder_routes', 'merge_routes', 'custom_field_routes',
                  'timeline_routes', 'calendar_routes', 'attachment_routes', 'settings_routes',
                  'scan_routes', 'import_routes']:
    _mod = getattr(__import__(f'app.routes.{_mod_name}', fromlist=['templates']), 'templates', None)
    if _mod:
        _mod.env.filters['format_name'] = format_name

TAG_PALETTES = [
    {'bg':'#DDEAF4','color':'#4A6A85'},
    {'bg':'#DFF0E6','color':'#3A6648'},
    {'bg':'#F4E8DD','color':'#7A4F35'},
    {'bg':'#EDE4F4','color':'#5A3D7A'},
    {'bg':'#F4EDED','color':'#7A3D3D'},
    {'bg':'#F0F4DD','color':'#4A5A28'},
    {'bg':'#DDF4F2','color':'#2A5F5D'},
]

def _tag_palette(tag):
    h = 0
    for ch in tag:
        h = (h * 31 + ord(ch)) & 0xffff
    return TAG_PALETTES[h % len(TAG_PALETTES)]

def render_tag_badges(tag_list_or_csv):
    if isinstance(tag_list_or_csv, str):
        tags = [t.strip() for t in tag_list_or_csv.split(',') if t.strip()]
    else:
        tags = [str(t).strip() for t in (tag_list_or_csv or []) if str(t).strip()]
    if not tags:
        return Markup('')
    html = ''.join(
        f'<span class="tag-badge" style="background:{_tag_palette(t)["bg"]};color:{_tag_palette(t)["color"]}">{_escape(t)}</span>'
        for t in tags
    )
    return Markup(f'<div class="tag-wrap">{html}</div>')

for _mod_name in ['auth_routes', 'company_routes', 'person_routes', 'search_routes',
                  'gift_routes', 'reminder_routes', 'merge_routes', 'custom_field_routes',
                  'timeline_routes', 'calendar_routes', 'attachment_routes', 'settings_routes',
                  'scan_routes', 'import_routes']:
    _mod = getattr(__import__(f'app.routes.{_mod_name}', fromlist=['templates']), 'templates', None)
    if _mod:
        _mod.env.filters['tag_badges'] = render_tag_badges


@app.get("/")
async def index(request: Request):
    user = get_user_from_request(request)
    if not user:
        return RedirectResponse("/login", status_code=302)
    return RedirectResponse("/dashboard", status_code=302)
