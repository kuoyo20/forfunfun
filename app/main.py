from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from app.database import init_db
from app.auth import get_user_from_request
from app.routes import auth_routes, company_routes, person_routes, search_routes, import_routes, api_routes

app = FastAPI(title="人脈管理系統")
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


@app.get("/")
async def index(request: Request):
    user = get_user_from_request(request)
    if not user:
        return RedirectResponse("/login", status_code=302)
    return RedirectResponse("/dashboard", status_code=302)
