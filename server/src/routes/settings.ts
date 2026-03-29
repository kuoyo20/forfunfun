import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    // Mask API key for security
    if (row.key === 'ai_api_key' && row.value) {
      settings[row.key] = row.value.slice(0, 8) + '...' + row.value.slice(-4);
    } else {
      settings[row.key] = row.value;
    }
  }
  res.json(settings);
});

router.put('/', (req, res) => {
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const txn = db.transaction(() => {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        update.run(key, value);
      }
    }
  });
  txn();

  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

export default router;
