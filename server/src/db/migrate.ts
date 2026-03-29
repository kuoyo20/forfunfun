import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

export function runMigrations() {
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    db.exec(sql);
    console.log(`Migration applied: ${file}`);
  }
}
