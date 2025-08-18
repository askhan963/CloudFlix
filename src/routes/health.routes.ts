import { Router } from 'express';
import { pingDB } from '../db/mysql.js';
import { pingBlob } from '../storage/blob.js';

const r = Router();
r.get('/', async (_req, res) => {
  const [dbOk, blobOk] = await Promise.all([
    pingDB().then(() => true).catch(() => false),
    pingBlob().then(() => true).catch(() => false)
  ]);
  res.json({
    ok: dbOk && blobOk,
    db: dbOk ? 'ok' : 'fail',
    blob: blobOk ? 'ok' : 'fail',
    version: 'v1'
  });
});
export default r;
