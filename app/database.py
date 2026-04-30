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

    _migrate(conn)
    _seed_users(conn)
    conn.close()


def _seed_users(conn):
    """Create default team accounts if no users exist yet."""
    existing = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if existing > 0:
        return

    import bcrypt
    def _hash(pw):
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

    default_pw = _hash("66446236")
    team = [
        ("kuoyo", "kuoyo@miraclex.com.tw", "老闆", "admin"),
        ("wendy", "wendy.tseng@miraclex.com.tw", "溫蒂（大特助）", "admin"),
        ("melody", "melody.cheng@bettermilk.com.tw", "小美（鮮乳坊特助）", "editor"),
        ("huda", "huda.huang@miraclex.com.tw", "Huda（專案型特助）", "editor"),
        ("anna", "anna.chen@miaolin.com.tw", "Anna（苗林行特助）", "editor"),
        ("lianlian", "booking@miraclex.com.tw", "連連（私人秘書）", "editor"),
    ]
    for username, email, display_name, role in team:
        conn.execute(
            "INSERT INTO users (username, password_hash, email, display_name, role) VALUES (?,?,?,?,?)",
            (username, default_pw, email, display_name, role),
        )
    conn.commit()


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

    # Gift tier and preferences columns on persons
    cursor = conn.execute("PRAGMA table_info(persons)")
    person_cols = [row[1] for row in cursor.fetchall()]
    for col, col_type in [("gift_tier", "TEXT DEFAULT ''"), ("birthday", "TEXT DEFAULT ''"),
                           ("preferences", "TEXT DEFAULT ''"), ("gift_notes", "TEXT DEFAULT ''")]:
        if col not in person_cols:
            conn.execute(f"ALTER TABLE persons ADD COLUMN {col} {col_type}")
    conn.commit()

    # Security question for password reset + LINE Notify token
    cursor = conn.execute("PRAGMA table_info(users)")
    user_cols = [row[1] for row in cursor.fetchall()]
    for col, col_type in [
        ("security_question", "TEXT DEFAULT ''"),
        ("security_answer_hash", "TEXT DEFAULT ''"),
        ("line_notify_token", "TEXT DEFAULT ''"),
    ]:
        if col not in user_cols:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
    conn.commit()

    # Attachments table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id),
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT DEFAULT '',
            size_bytes INTEGER DEFAULT 0,
            description TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
