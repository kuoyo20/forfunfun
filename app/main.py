from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from app.database import init_db
from app.auth import get_user_from_request
from app.config import PHOTO_DIR
from app.routes import (auth_routes, company_routes, person_routes, search_routes,
                        import_routes, api_routes, gift_routes, reminder_routes,
                        merge_routes, custom_field_routes, timeline_routes, calendar_routes,
                        attachment_routes, settings_routes, backup_routes)

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


@app.get("/")
async def index(request: Request):
    user = get_user_from_request(request)
    if not user:
        return RedirectResponse("/login", status_code=302)
    return RedirectResponse("/dashboard", status_code=302)
