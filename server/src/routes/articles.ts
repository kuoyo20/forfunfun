import { Router } from 'express';
import * as articleService from '../services/articleService.js';

const router = Router();

router.get('/', (req, res) => {
  const result = articleService.listArticles({
    category: req.query.category as string,
    status: req.query.status as string,
    publication: req.query.publication as string,
    search: req.query.search as string,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const article = articleService.getArticle(Number(req.params.id));
  if (!article) return res.status(404).json({ error: '文章不存在' });
  res.json(article);
});

router.post('/', (req, res) => {
  const article = articleService.createArticle(req.body);
  res.status(201).json(article);
});

router.put('/:id', (req, res) => {
  const article = articleService.updateArticle(Number(req.params.id), req.body);
  if (!article) return res.status(404).json({ error: '文章不存在' });
  res.json(article);
});

router.delete('/:id', (req, res) => {
  articleService.deleteArticle(Number(req.params.id));
  res.json({ success: true });
});

export default router;
