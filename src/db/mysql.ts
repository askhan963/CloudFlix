import { env } from '../config/env.js';
import mysql from 'mysql2/promise';
import fs from 'fs';

const ssl = env.mysql.ssl
  ? (env.mysql.caPath && fs.existsSync(env.mysql.caPath))
      ? { minVersion: 'TLSv1.2' as const, rejectUnauthorized: true, ca: fs.readFileSync(env.mysql.caPath, 'utf8') }
      : { minVersion: 'TLSv1.2' as const, rejectUnauthorized: true }
  : undefined;

export const pool = mysql.createPool({
  host: env.mysql.host,
  port: env.mysql.port,
  user: env.mysql.user,
  password: "AwaisKhan#120", //env.mysql.pass,
  database: env.mysql.db,
  connectionLimit: 10,
  waitForConnections: true,
  ssl
});

// simple probe
export async function pingDB() {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return Array.isArray(rows);
}
