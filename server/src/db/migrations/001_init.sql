CREATE TABLE IF NOT EXISTS articles (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL DEFAULT '',
    content_md    TEXT NOT NULL DEFAULT '',
    content_html  TEXT NOT NULL DEFAULT '',
    content_json  TEXT NOT NULL DEFAULT '{}',
    category      TEXT NOT NULL DEFAULT 'blog'
                  CHECK(category IN ('blog', 'social_media', 'column', 'book_chapter')),
    status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK(status IN ('draft', 'published', 'archived')),
    tags          TEXT NOT NULL DEFAULT '[]',
    publication   TEXT,
    word_count    INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS versions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id    INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    content_md    TEXT NOT NULL,
    content_json  TEXT NOT NULL DEFAULT '{}',
    note          TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_versions_article ON versions(article_id, created_at DESC);

CREATE TABLE IF NOT EXISTS books (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL DEFAULT '',
    description   TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK(status IN ('draft', 'in_progress', 'completed')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS book_chapters (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id       INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    article_id    INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    chapter_num   INTEGER NOT NULL,
    chapter_title TEXT,
    UNIQUE(book_id, article_id)
);
CREATE INDEX IF NOT EXISTS idx_book_chapters_book ON book_chapters(book_id, chapter_num);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_provider', 'openai');
INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_api_key', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_base_url', 'https://api.openai.com/v1');
INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_model', 'gpt-4o');
