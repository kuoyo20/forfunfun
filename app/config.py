import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR / "data"))
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", BASE_DIR / "uploads"))
PHOTO_DIR = UPLOAD_DIR / "photos"
ATTACHMENT_DIR = UPLOAD_DIR / "attachments"
DB_PATH = DATA_DIR / "contacts.db"
SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production-please")
DATABASE_URL = os.environ.get("DATABASE_URL", "")

PER_PAGE = 20

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PHOTO_DIR.mkdir(parents=True, exist_ok=True)
ATTACHMENT_DIR.mkdir(parents=True, exist_ok=True)
