import sqlite3
from pathlib import Path
from app.config import DB_PATH

SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    with open(SCHEMA_PATH) as f:
        conn.executescript(f.read())

    # Migrations for existing databases
    _migrate(conn)
    conn.close()


def _migrate(conn):
    """Apply migrations for columns/tables added after initial release."""
    cursor = conn.execute("PRAGMA table_info(users)")
    user_cols = [row[1] for row in cursor.fetchall()]

    if "role" not in user_cols:
        conn.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'editor'")
        # First user becomes admin
        first = conn.execute("SELECT id FROM users ORDER BY id LIMIT 1").fetchone()
        if first:
            conn.execute("UPDATE users SET role = 'admin' WHERE id = ?", (first[0],))
        conn.commit()

    cursor = conn.execute("PRAGMA table_info(edit_log)")
    log_cols = [row[1] for row in cursor.fetchall()]
    if "diff_json" not in log_cols:
        conn.execute("ALTER TABLE edit_log ADD COLUMN diff_json TEXT")
        conn.commit()
