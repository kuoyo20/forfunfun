import { Router } from 'express';
import * as bookService from '../services/bookService.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(bookService.listBooks());
});

router.get('/:id', (req, res) => {
  const book = bookService.getBook(Number(req.params.id));
  if (!book) return res.status(404).json({ error: '書籍不存在' });
  res.json(book);
});

router.post('/', (req, res) => {
  const book = bookService.createBook(req.body);
  res.status(201).json(book);
});

router.put('/:id', (req, res) => {
  const book = bookService.updateBook(Number(req.params.id), req.body);
  if (!book) return res.status(404).json({ error: '書籍不存在' });
  res.json(book);
});

router.delete('/:id', (req, res) => {
  bookService.deleteBook(Number(req.params.id));
  res.json({ success: true });
});

router.post('/:id/chapters', (req, res) => {
  const book = bookService.addChapter(
    Number(req.params.id),
    req.body.article_id,
    req.body.chapter_title
  );
  res.json(book);
});

router.delete('/:id/chapters/:chapterId', (req, res) => {
  const book = bookService.removeChapter(Number(req.params.id), Number(req.params.chapterId));
  res.json(book);
});

router.put('/:id/chapters/reorder', (req, res) => {
  const book = bookService.reorderChapters(Number(req.params.id), req.body.ordered_ids);
  res.json(book);
});

export default router;
