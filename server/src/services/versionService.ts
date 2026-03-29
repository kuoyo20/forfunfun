import db from '../db/connection.js';

export interface Version {
  id: number;
  article_id: number;
  title: string;
  content_md: string;
  content_json: string;
  note: string | null;
  created_at: string;
}

export function listVersions(articleId: number) {
  return db.prepare(
    'SELECT id, article_id, title, note, created_at FROM versions WHERE article_id = ? ORDER BY created_at DESC'
  ).all(articleId);
}

export function getVersion(id: number): Version | undefined {
  return db.prepare('SELECT * FROM versions WHERE id = ?').get(id) as Version | undefined;
}

export function createVersion(articleId: number, note?: string): Version {
  const article = db.prepare('SELECT title, content_md, content_json FROM articles WHERE id = ?').get(articleId) as {
    title: string; content_md: string; content_json: string;
  } | undefined;

  if (!article) throw new Error('Article not found');

  const result = db.prepare(
    'INSERT INTO versions (article_id, title, content_md, content_json, note) VALUES (?, ?, ?, ?, ?)'
  ).run(articleId, article.title, article.content_md, article.content_json, note || null);

  return db.prepare('SELECT * FROM versions WHERE id = ?').get(result.lastInsertRowid) as Version;
}

export function restoreVersion(articleId: number, versionId: number) {
  const version = getVersion(versionId);
  if (!version || version.article_id !== articleId) throw new Error('Version not found');

  db.prepare(
    "UPDATE articles SET title = ?, content_md = ?, content_json = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(version.title, version.content_md, version.content_json, articleId);

  return db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
}
