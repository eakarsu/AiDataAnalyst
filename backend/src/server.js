import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createPool } from './governance/db.js';
import { assertAuthConfiguration, authenticate } from './governance/auth.js';
import { createAuthRouter, provisionTestIdentity } from './governance/authRoutes.js';
import { createGovernanceRouter } from './governance/routes.js';
import { AnalystError } from './governance/domain.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

export function assertConfiguration(env = process.env) {
  assertAuthConfiguration(env);
  if (!env.CLIENT_URL) throw new Error('CLIENT_URL is required');
}

export function createApp({ pool, env = process.env }) {
  assertConfiguration(env);
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true, methods: ['GET', 'POST'] }));
  app.use(express.json({ limit: '2mb' }));
  app.use(rateLimit({ windowMs: 60000, limit: Number(env.RATE_LIMIT_PER_MINUTE || 120), standardHeaders: true }));
  const health = async (_req, res, next) => { try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); } catch (error) { next(error); } };
  app.get('/healthz', health);
  app.get('/api/health', health);
  app.use('/api/auth', createAuthRouter(pool, env));
  app.use('/api/governance', authenticate(pool, env), createGovernanceRouter(pool, env));
  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
  app.use((error, _req, res, _next) => {
    if (error instanceof AnalystError) {
      const status = error.code.endsWith('_not_found') ? 404 : error.code.includes('blocked') || error.code.includes('conflict') ? 409 : 422;
      return res.status(status).json({ error: error.code, message: error.message, details: error.details });
    }
    console.error({ name: error.name, message: error.message });
    return res.status(500).json({ error: 'internal_error' });
  });
  return app;
}

async function main() {
  assertConfiguration(process.env);
  const pool = createPool(process.env);
  await provisionTestIdentity(pool, process.env);
  const server = createApp({ pool, env: process.env }).listen(Number(process.env.BACKEND_PORT || 3001), process.env.BIND_HOST || '127.0.0.1');
  const shutdown = () => server.close(async () => { await pool.end(); process.exit(0); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

const invokedPath = process.argv[1] ? fs.realpathSync(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exit(1); });
