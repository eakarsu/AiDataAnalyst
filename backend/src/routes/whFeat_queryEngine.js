import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const TABLE = 'query_engine_entries';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const rlMap = new Map();
function aiRateLimit(req, res, next) {
  const key = `user:${req.user.id}`;
  const now = Date.now();
  const win = 3600000;
  const e = rlMap.get(key) || { count: 0, reset: now + win };
  if (now > e.reset) { e.count = 0; e.reset = now + win; }
  e.count++;
  rlMap.set(key, e);
  if (e.count > 20) return res.status(429).json({ error: 'Rate limit: 20 AI calls/hr' });
  next();
}

function parseAIJson(text) {
  if (!text) return { raw: '' };
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return { raw_response: text };
}

async function callAI(prompt) {
  const resp = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 1024 })
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── CRUD (18) ──────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND is_archived=false ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [req.user.id, limit, offset]);
    const { rows: cnt } = await pool.query(`SELECT COUNT(*) FROM ${TABLE} WHERE user_id=$1 AND is_archived=false`, [req.user.id]);
    res.json({ data: rows, pagination: { page, limit, total: parseInt(cnt[0].count), totalPages: Math.ceil(parseInt(cnt[0].count) / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/count', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM ${TABLE} WHERE user_id=$1 AND is_archived=false`, [req.user.id]);
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/search', async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const offset = ((parseInt(req.query.page) || 1) - 1) * limit;
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND is_archived=false AND (sql_text ILIKE $2 OR query_intent ILIKE $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`, [req.user.id, q, limit, offset]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-parent/:pattern', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND query_pattern=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.pattern]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-secondary/:status', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND status=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.status]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows: byGroup } = await pool.query(`SELECT status, COUNT(*) as count FROM query_engine_entries WHERE user_id=$1 GROUP BY status`, [req.user.id]);
    const { rows: totals } = await pool.query(`SELECT COUNT(*) as total FROM ${TABLE} WHERE user_id=$1 AND is_archived=false`, [req.user.id]);
    res.json({ byGroup, total: parseInt(totals[0].total) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/export/csv', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 ORDER BY created_at DESC`, [req.user.id]);
    if (!rows.length) return res.send('');
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${TABLE}.csv"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/batch', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'items array required' });
    const created = await Promise.all(items.map(async item => {
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, sql_text, query_intent) VALUES ($1,$2,$3) RETURNING *`, [req.user.id, item.sql_text||'SELECT 1', item.query_intent||null]);
      return rows[0];
    }));
    res.status(201).json({ data: created, count: created.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/batch', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'items array required' });
    const updated = await Promise.all(items.map(async ({ id, ...fields }) => {
      const sets = Object.keys(fields).map((k, i) => `${k}=${i + 3}`).join(', ');
      if (!sets) return { id, error: 'no fields' };
      const { rows } = await pool.query(`UPDATE ${TABLE} SET ${sets}, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [id, req.user.id, ...Object.values(fields)]);
      return rows[0] || { id, error: 'not found' };
    }));
    res.json({ data: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids array required' });
    await pool.query(`UPDATE ${TABLE} SET is_archived=true, updated_at=NOW() WHERE id=ANY($1) AND user_id=$2`, [ids, req.user.id]);
    res.json({ archived: ids.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/import/csv', async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ error: 'csv field required' });
    const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return res.status(400).json({ error: 'CSV needs header + rows' });
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const items = lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^,]+)/g) || [];
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ? vals[i].replace(/^"|"$/g, '') : null; });
      return obj;
    });
    const created = await Promise.all(items.map(async item => {
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, sql_text) VALUES ($1,$2) RETURNING *`, [req.user.id, item.sql_text||'SELECT 1']);
      return rows[0];
    }));
    res.status(201).json({ data: created, count: created.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, sql_text, query_intent, query_pattern, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [req.user.id, req.body.sql_text, req.body.query_intent||null, req.body.query_pattern||null, req.body.status||'pending']);
    res.status(201).json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ error: 'no fields' });
    const sets = keys.map((k, i) => `${k}=${i + 3}`).join(', ');
    const { rows } = await pool.query(`UPDATE ${TABLE} SET ${sets}, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [req.params.id, req.user.id, ...Object.values(fields)]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`UPDATE ${TABLE} SET is_archived=true, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/archive', async (req, res) => {
  try {
    const { rows } = await pool.query(`UPDATE ${TABLE} SET is_archived=true, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/restore', async (req, res) => {
  try {
    const { rows } = await pool.query(`UPDATE ${TABLE} SET is_archived=false, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/history', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM activity_log WHERE user_id=$1 AND entity_type=$2 AND entity_id=$3 ORDER BY created_at DESC LIMIT 100`, [req.user.id, TABLE, req.params.id]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── AI verbs (16) ─────────────────────────────────────────────────────────────

const aiVerbs = [
  { slug: 'explain-query-plan', prompt: (r) => `Explain the query execution plan for: ${r.sql_text?.slice(0,200)}. Respond JSON: { "plan_steps": [...], "bottlenecks": [...], "estimated_cost": "..." }` },
  { slug: 'suggest-rewrite', prompt: (r) => `Suggest a rewrite for this SQL: ${r.sql_text?.slice(0,300)}. Respond JSON: { "rewritten_sql": "...", "improvements": [...], "reason": "..." }` },
  { slug: 'detect-anti-pattern', prompt: (r) => `Detect SQL anti-patterns in: ${r.sql_text?.slice(0,300)}. Respond JSON: { "anti_patterns": [{ "pattern": "...", "severity": "low|medium|high", "fix": "..." }] }` },
  { slug: 'predict-query-cost', prompt: (r) => `Predict execution cost for SQL: ${r.sql_text?.slice(0,200)}. Respond JSON: { "cost_estimate": "...", "bytes_scanned": N, "optimization_tips": [...] }` },
  { slug: 'classify-query-intent', prompt: (r) => `Classify intent of query: ${r.sql_text?.slice(0,200)}. Respond JSON: { "intent": "reporting|etl|ad-hoc|monitoring|other", "confidence": "high|medium|low" }` },
  { slug: 'recommend-index-or-mv', prompt: (r) => `Recommend indexes or materialized views for: ${r.sql_text?.slice(0,200)}. Respond JSON: { "recommendations": [{ "type": "index|mv", "definition": "...", "rationale": "..." }] }` },
  { slug: 'generate-test-data', prompt: (r) => `Generate test data for query: ${r.sql_text?.slice(0,200)}. Respond JSON: { "test_rows": [...], "edge_cases": [...] }` },
  { slug: 'summarize-slow-queries', prompt: (r) => `Summarize slow query patterns for: ${r.sql_text?.slice(0,200)}, exec_time: ${r.execution_time_ms}ms. Respond JSON: { "summary": "...", "slowness_cause": "...", "fix": "..." }` },
  { slug: 'validate-sql-syntax', prompt: (r) => `Validate SQL syntax for: ${r.sql_text?.slice(0,300)}. Respond JSON: { "valid": true|false, "errors": [...], "warnings": [...] }` },
  { slug: 'suggest-optimization', prompt: (r) => `Suggest optimizations for SQL: ${r.sql_text?.slice(0,200)}. Respond JSON: { "optimizations": [{ "change": "...", "impact": "low|medium|high" }] }` },
  { slug: 'score-query-quality', prompt: (r) => `Score quality of SQL: ${r.sql_text?.slice(0,200)}. Respond JSON: { "quality_score": 0-100, "readability": N, "performance": N, "correctness": N }` },
  { slug: 'detect-cartesian-join', prompt: (r) => `Detect cartesian joins in SQL: ${r.sql_text?.slice(0,300)}. Respond JSON: { "cartesian_join_detected": true|false, "locations": [...], "fix": "..." }` },
  { slug: 'recommend-cte-extraction', prompt: (r) => `Recommend CTE extraction for SQL: ${r.sql_text?.slice(0,300)}. Respond JSON: { "ctes_recommended": [...], "refactored_sql_sketch": "..." }` },
  { slug: 'predict-resource-need', prompt: (r) => `Predict resource needs for query: ${r.sql_text?.slice(0,200)}. Respond JSON: { "cpu_estimate": "...", "memory_mb": N, "concurrency_risk": "low|medium|high" }` },
  { slug: 'classify-query-pattern', prompt: (r) => `Classify query pattern for: ${r.sql_text?.slice(0,200)}. Respond JSON: { "pattern": "star-schema|flat|recursive|pivoting|aggregation|other", "confidence": "..." }` },
  { slug: 'generate-query-from-nl', prompt: (r) => `Generate SQL from natural language: ${req.body.natural_language||r.query_intent||"no NL provided"}. Respond JSON: { "sql": "...", "explanation": "...", "assumptions": [...] }` },
];

for (const verb of aiVerbs) {
  router.post(`/ai/${verb.slug}`, aiRateLimit, async (req, res) => {
    try {
      const id = req.body.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE id=$1 AND user_id=$2`, [id, req.user.id]);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      const raw = await callAI(verb.prompt(rows[0]));
      const result = parseAIJson(raw);
      await pool.query(`UPDATE ${TABLE} SET ai_notes=$1, updated_at=NOW() WHERE id=$2`, [raw.slice(0, 2000), id]);
      res.json({ success: true, result, model: OPENROUTER_MODEL });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
}

export default router;
