import { Router } from 'express';
import { PassThrough } from 'stream';
import { getArticle } from '../services/articleService.js';
import { getBook } from '../services/bookService.js';
import { generatePDF, generateBookPDF, generateDocx, generateBookDocx } from '../services/exportService.js';

const router = Router();

router.get('/article/:id/pdf', (req, res) => {
  const article = getArticle(Number(req.params.id));
  if (!article) return res.status(404).json({ error: '文章不存在' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(article.title || 'article')}.pdf"`);

  const stream = new PassThrough();
  stream.pipe(res);
  generatePDF(article, stream);
});

router.get('/article/:id/docx', async (req, res) => {
  const article = getArticle(Number(req.params.id));
  if (!article) return res.status(404).json({ error: '文章不存在' });

  const buffer = await generateDocx(article);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(article.title || 'article')}.docx"`);
  res.send(buffer);
});

router.get('/book/:id/pdf', (req, res) => {
  const book = getBook(Number(req.params.id));
  if (!book) return res.status(404).json({ error: '書籍不存在' });

  const chapters = (book.chapters as { chapter_title: string; article_id: number; article_title: string }[]).map(ch => ({
    chapter_title: ch.chapter_title || ch.article_title,
    article: getArticle(ch.article_id)!,
  }));

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(book.title || 'book')}.pdf"`);

  const stream = new PassThrough();
  stream.pipe(res);
  generateBookPDF(book.title, chapters, stream);
});

router.get('/book/:id/docx', async (req, res) => {
  const book = getBook(Number(req.params.id));
  if (!book) return res.status(404).json({ error: '書籍不存在' });

  const chapters = (book.chapters as { chapter_title: string; article_id: number; article_title: string }[]).map(ch => ({
    chapter_title: ch.chapter_title || ch.article_title,
    article: getArticle(ch.article_id)!,
  }));

  const buffer = await generateBookDocx(book.title, chapters);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(book.title || 'book')}.docx"`);
  res.send(buffer);
});

export default router;
