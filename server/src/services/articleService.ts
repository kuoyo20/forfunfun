import db from '../db/connection.js';

export interface Article {
  id: number;
  title: string;
  content_md: string;
  content_html: string;
  content_json: string;
  category: string;
  status: string;
  tags: string;
  publication: string | null;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export function listArticles(params: {
  category?: string;
  status?: string;
  publication?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.category) {
    conditions.push('category = ?');
    values.push(params.category);
  }
  if (params.status) {
    conditions.push('status = ?');
    values.push(params.status);
  } else {
    conditions.push("status != 'archived'");
  }
  if (params.publication) {
    conditions.push('publication = ?');
    values.push(params.publication);
  }
  if (params.search) {
    conditions.push('(title LIKE ? OR content_md LIKE ?)');
    values.push(`%${params.search}%`, `%${params.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = params.limit || 50;
  const offset = ((params.page || 1) - 1) * limit;

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM articles ${where}`).get(...values) as { total: number };
  const rows = db.prepare(
    `SELECT id, title, category, status, tags, publication, word_count, created_at, updated_at
     FROM articles ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
  ).all(...values, limit, offset);

  return { articles: rows, total: countRow.total, page: params.page || 1, limit };
}

export function getArticle(id: number): Article | undefined {
  return db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as Article | undefined;
}

export function createArticle(data: Partial<Article>): Article {
  const stmt = db.prepare(
    `INSERT INTO articles (title, content_md, content_html, content_json, category, status, tags, publication, word_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.title || '',
    data.content_md || '',
    data.content_html || '',
    data.content_json || '{}',
    data.category || 'blog',
    data.status || 'draft',
    data.tags || '[]',
    data.publication || null,
    data.word_count || 0
  );
  return getArticle(result.lastInsertRowid as number)!;
}

export function updateArticle(id: number, data: Partial<Article>): Article | undefined {
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowed = ['title', 'content_md', 'content_html', 'content_json', 'category', 'status', 'tags', 'publication', 'word_count'] as const;
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return getArticle(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE articles SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getArticle(id);
}

export function deleteArticle(id: number) {
  db.prepare("UPDATE articles SET status = 'archived', updated_at = datetime('now') WHERE id = ?").run(id);
}
