import db from '../db/connection.js';

export interface Book {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function listBooks() {
  return db.prepare('SELECT * FROM books ORDER BY updated_at DESC').all();
}

export function getBook(id: number) {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
  if (!book) return undefined;

  const chapters = db.prepare(
    `SELECT bc.id, bc.chapter_num, bc.chapter_title, bc.article_id,
            a.title as article_title, a.word_count
     FROM book_chapters bc
     JOIN articles a ON a.id = bc.article_id
     WHERE bc.book_id = ?
     ORDER BY bc.chapter_num`
  ).all(id);

  return { ...book, chapters };
}

export function createBook(data: Partial<Book>): Book {
  const result = db.prepare(
    'INSERT INTO books (title, description, status) VALUES (?, ?, ?)'
  ).run(data.title || '', data.description || '', data.status || 'draft');
  return db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid) as Book;
}

export function updateBook(id: number, data: Partial<Book>) {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of ['title', 'description', 'status'] as const) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (fields.length === 0) return getBook(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getBook(id);
}

export function deleteBook(id: number) {
  db.prepare('DELETE FROM books WHERE id = ?').run(id);
}

export function addChapter(bookId: number, articleId: number, chapterTitle?: string) {
  const maxRow = db.prepare(
    'SELECT COALESCE(MAX(chapter_num), 0) as max_num FROM book_chapters WHERE book_id = ?'
  ).get(bookId) as { max_num: number };

  db.prepare(
    'INSERT INTO book_chapters (book_id, article_id, chapter_num, chapter_title) VALUES (?, ?, ?, ?)'
  ).run(bookId, articleId, maxRow.max_num + 1, chapterTitle || null);

  return getBook(bookId);
}

export function removeChapter(bookId: number, chapterId: number) {
  db.prepare('DELETE FROM book_chapters WHERE id = ? AND book_id = ?').run(chapterId, bookId);
  reorderChapters(bookId);
  return getBook(bookId);
}

export function reorderChapters(bookId: number, orderedIds?: number[]) {
  if (orderedIds) {
    const update = db.prepare('UPDATE book_chapters SET chapter_num = ? WHERE id = ? AND book_id = ?');
    const txn = db.transaction(() => {
      orderedIds.forEach((id, idx) => update.run(idx + 1, id, bookId));
    });
    txn();
  } else {
    const chapters = db.prepare(
      'SELECT id FROM book_chapters WHERE book_id = ? ORDER BY chapter_num'
    ).all(bookId) as { id: number }[];
    const update = db.prepare('UPDATE book_chapters SET chapter_num = ? WHERE id = ?');
    const txn = db.transaction(() => {
      chapters.forEach((ch, idx) => update.run(idx + 1, ch.id));
    });
    txn();
  }
  return getBook(bookId);
}
