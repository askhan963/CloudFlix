import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './mysql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGR_DIR = path.join(__dirname, '../../migrations');

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function appliedIds(): Promise<Set<string>> {
  const [rows] = await pool.query('SELECT id FROM _migrations ORDER BY applied_at');
  return new Set((rows as any[]).map(r => r.id));
}

async function applyOne(id: string, sql: string) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(sql);
    await conn.query('INSERT INTO _migrations (id) VALUES (?)', [id]);
    await conn.commit();
    console.log('Applied', id);
  } catch (e) {
    await conn.rollback();
    console.error('Failed migration', id, e);
    process.exit(1);
  } finally {
    conn.release();
  }
}

async function statusOnly() {
  const have = await appliedIds();
  const files = fs.readdirSync(MIGR_DIR).filter(f => f.endsWith('.sql')).sort();
  console.log('--- Migration status ---');
  for (const f of files) {
    console.log(have.has(f) ? `APPLIED  ${f}` : `PENDING  ${f}`);
  }
}

async function runAll() {
  await ensureTable();
  const have = await appliedIds();
  const files = fs.readdirSync(MIGR_DIR).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (have.has(f)) continue;
    const sql = fs.readFileSync(path.join(MIGR_DIR, f), 'utf8');
    await applyOne(f, sql);
  }
  console.log('All migrations applied ✅');
  process.exit(0);
}

const arg = process.argv[2];
if (arg === '--status') {
  statusOnly().then(() => process.exit(0));
} else {
  runAll();
}
