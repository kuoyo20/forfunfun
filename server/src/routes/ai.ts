import { Router } from 'express';
import { aiAction, aiActionStream } from '../services/aiService.js';

const router = Router();

const ACTIONS = ['summarize', 'rewrite', 'expand', 'adjust-tone', 'continue', 'title-suggest'];

router.post('/:action', async (req, res) => {
  const { action } = req.params;
  if (!ACTIONS.includes(action)) {
    return res.status(400).json({ error: `不支援的操作: ${action}` });
  }

  const { text, options } = req.body;
  if (!text) return res.status(400).json({ error: '請提供文字內容' });

  try {
    if (req.headers.accept === 'text/event-stream') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of aiActionStream(action, text, options)) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const result = await aiAction(action, text, options);
      res.json({ result });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI 服務錯誤';
    res.status(500).json({ error: message });
  }
});

export default router;
