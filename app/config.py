import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = BASE_DIR / "uploads"
PHOTO_DIR = UPLOAD_DIR / "photos"
DB_PATH = DATA_DIR / "contacts.db"
SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production-please")

PER_PAGE = 20  # Pagination default

DATA_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)
PHOTO_DIR.mkdir(exist_ok=True)
