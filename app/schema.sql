-- Users (app users who can collaboratively edit)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'editor',  -- admin, editor, viewer
    security_question TEXT DEFAULT '',
    security_answer_hash TEXT DEFAULT '',
    line_notify_token TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attachments for persons
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
);

-- Companies / Organizations
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    website TEXT,
    address TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Persons (real human beings)
CREATE TABLE IF NOT EXISTS persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT,
    phone TEXT,
    notes TEXT,
    photo_url TEXT,
    -- Gift & relationship management
    gift_tier TEXT DEFAULT '',           -- VIP, A, B, C, D or empty
    birthday TEXT DEFAULT '',            -- MM-DD or YYYY-MM-DD
    preferences TEXT DEFAULT '',         -- likes, hobbies, dietary
    gift_notes TEXT DEFAULT '',          -- gift taboos, special notes
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles / Identities (one person can have many roles at different companies)
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    title TEXT,
    work_email TEXT,
    work_phone TEXT,
    is_current BOOLEAN DEFAULT 1,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Person <-> Tag (many-to-many)
CREATE TABLE IF NOT EXISTS person_tags (
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (person_id, tag_id)
);

-- Relationships between persons
CREATE TABLE IF NOT EXISTS relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_a_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    person_b_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Edit log for audit trail (with JSON diff)
CREATE TABLE IF NOT EXISTS edit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    changes TEXT,
    diff_json TEXT,  -- JSON storing old/new values
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interaction / Activity records (CRM core)
CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    type TEXT NOT NULL DEFAULT 'note',  -- meeting, call, email, note, other
    title TEXT NOT NULL,
    content TEXT,
    interaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gift records (送禮紀錄)
CREATE TABLE IF NOT EXISTS gift_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    gift_date DATE NOT NULL,
    occasion TEXT DEFAULT '',            -- 生日, 過年, 中秋, 喬遷, 感謝, 其他
    item TEXT NOT NULL,                  -- what was given
    amount REAL DEFAULT 0,               -- cost/value
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follow-up reminders
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    remind_date DATE NOT NULL,
    title TEXT NOT NULL,
    notes TEXT DEFAULT '',
    is_done BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom fields definition
CREATE TABLE IF NOT EXISTS custom_field_defs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_name TEXT UNIQUE NOT NULL,     -- internal key
    field_label TEXT NOT NULL,           -- display label (e.g. "Line ID")
    field_type TEXT DEFAULT 'text',      -- text, number, date, url
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom field values per person
CREATE TABLE IF NOT EXISTS custom_field_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    field_id INTEGER NOT NULL REFERENCES custom_field_defs(id) ON DELETE CASCADE,
    value TEXT DEFAULT '',
    UNIQUE(person_id, field_id)
);

-- Gift lists (送禮清單 for holidays)
CREATE TABLE IF NOT EXISTS gift_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                  -- e.g. "2026 中秋送禮"
    occasion TEXT DEFAULT '',
    created_by INTEGER REFERENCES users(id),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gift list items
CREATE TABLE IF NOT EXISTS gift_list_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES gift_lists(id) ON DELETE CASCADE,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    planned_item TEXT DEFAULT '',
    planned_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',       -- pending, purchased, sent, done
    notes TEXT DEFAULT '',
    UNIQUE(list_id, person_id)
);
