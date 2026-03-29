import { Router } from 'express';
import * as versionService from '../services/versionService.js';

const router = Router();

router.get('/:articleId/versions', (req, res) => {
  const versions = versionService.listVersions(Number(req.params.articleId));
  res.json(versions);
});

router.post('/:articleId/versions', (req, res) => {
  const version = versionService.createVersion(Number(req.params.articleId), req.body.note);
  res.status(201).json(version);
});

router.get('/:articleId/versions/:versionId', (req, res) => {
  const version = versionService.getVersion(Number(req.params.versionId));
  if (!version) return res.status(404).json({ error: '版本不存在' });
  res.json(version);
});

router.post('/:articleId/versions/:versionId/restore', (req, res) => {
  const article = versionService.restoreVersion(
    Number(req.params.articleId),
    Number(req.params.versionId)
  );
  res.json(article);
});

export default router;
