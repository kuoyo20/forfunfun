import express from 'express';
import cors from 'cors';
import { runMigrations } from './db/migrate.js';
import { errorHandler } from './middleware/errorHandler.js';
import articlesRouter from './routes/articles.js';
import versionsRouter from './routes/versions.js';
import booksRouter from './routes/books.js';
import aiRouter from './routes/ai.js';
import exportRouter from './routes/export.js';
import settingsRouter from './routes/settings.js';

runMigrations();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/articles', articlesRouter);
app.use('/api/articles', versionsRouter);
app.use('/api/books', booksRouter);
app.use('/api/ai', aiRouter);
app.use('/api/export', exportRouter);
app.use('/api/settings', settingsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`WriteFlow server running on http://localhost:${PORT}`);
});
