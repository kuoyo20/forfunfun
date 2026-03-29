import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');
mkdirSync(dataDir, { recursive: true });

const db: DatabaseType = new Database(join(dataDir, 'writeflow.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
