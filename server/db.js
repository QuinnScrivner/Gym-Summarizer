import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
const db = new Database(path.join(process.cwd(), 'db.sqlite'));

const migDir = path.join(process.cwd(), 'migrations');
if (fs.existsSync(migDir)) {
  const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
  db.exec('PRAGMA foreign_keys = ON;');
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
    db.exec(sql);
  }
}
export default db;
