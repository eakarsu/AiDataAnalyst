import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const TABLE = 'materialized_views';
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
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND is_archived=false AND (view_name ILIKE $2 OR mv_pattern ILIKE $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`, [req.user.id, q, limit, offset]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-parent/:pattern', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND mv_pattern=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.pattern]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-secondary/:strategy', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND refresh_strategy=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.strategy]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows: byGroup } = await pool.query(`SELECT refresh_strategy, COUNT(*) as count FROM materialized_views WHERE user_id=$1 GROUP BY refresh_strategy`, [req.user.id]);
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, view_name, sql_definition) VALUES ($1,$2,$3) RETURNING *`, [req.user.id, item.view_name||'mv', item.sql_definition||'SELECT 1']);
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, view_name) VALUES ($1,$2) RETURNING *`, [req.user.id, item.view_name||'imported']);
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
    const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, view_name, sql_definition, grain, refresh_strategy) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [req.user.id, req.body.view_name, req.body.sql_definition||'SELECT 1', req.body.grain||null, req.body.refresh_strategy||'full']);
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
  { slug: 'suggest-mv-candidate', prompt: (r) => `Suggest if this is a good MV candidate: ${r.view_name}, SQL: ${r.sql_definition?.slice(0,200)}. Respond JSON: { "mv_candidate": true|false, "rationale": "...", "expected_speedup": "..." }` },
  { slug: 'detect-stale-mv', prompt: (r) => `Detect staleness for MV: ${r.view_name}, last_refreshed: ${r.last_refreshed}, is_stale: ${r.is_stale}. Respond JSON: { "stale": true|false, "hours_stale": N, "action": "..." }` },
  { slug: 'predict-mv-refresh-cost', prompt: (r) => `Predict refresh cost for MV: ${r.view_name}, SQL: ${r.sql_definition?.slice(0,200)}. Respond JSON: { "refresh_cost_usd": N, "refresh_time_ms": N, "optimization_tips": [...] }` },
  { slug: 'recommend-mv-eviction', prompt: (r) => `Recommend eviction strategy for MV: ${r.view_name}, hits: ${r.hit_count}, roi: ${r.roi_score}. Respond JSON: { "evict": true|false, "reason": "...", "alternative": "..." }` },
  { slug: 'classify-mv-usage', prompt: (r) => `Classify usage pattern for MV: ${r.view_name}, hits: ${r.hit_count}. Respond JSON: { "usage_pattern": "high-traffic|low-traffic|burst|steady", "recommendation": "..." }` },
  { slug: 'generate-mv-ddl', prompt: (r) => `Generate CREATE MATERIALIZED VIEW DDL for: ${r.view_name}. SQL: ${r.sql_definition?.slice(0,200)}. Respond JSON: { "ddl": "...", "with_data": true|false, "indexes": [...] }` },
  { slug: 'summarize-mv-hits', prompt: (r) => `Summarize hit pattern for MV: ${r.view_name}, hits: ${r.hit_count}. Respond JSON: { "summary": "...", "hit_rate": "...", "value_assessment": "..." }` },
  { slug: 'score-mv-roi', prompt: (r) => `Score ROI for MV: ${r.view_name}, roi: ${r.roi_score}, hits: ${r.hit_count}, cost: ${r.refresh_cost_estimate}. Respond JSON: { "roi_score": 0-100, "breakeven_point": "...", "recommendation": "keep|evict|optimize" }` },
  { slug: 'validate-mv-grain', prompt: (r) => `Validate grain consistency for MV: ${r.view_name}, grain: ${r.grain}. Respond JSON: { "grain_valid": true|false, "issues": [...], "recommendation": "..." }` },
  { slug: 'suggest-incremental-refresh', prompt: (r) => `Suggest incremental refresh strategy for MV: ${r.view_name}. Respond JSON: { "incremental_feasible": true|false, "strategy": "...", "watermark_column": "..." }` },
  { slug: 'detect-mv-overlap', prompt: (r) => `Detect if MV ${r.view_name} overlaps with others. SQL: ${r.sql_definition?.slice(0,200)}. Respond JSON: { "overlap_risk": "low|medium|high", "overlapping_mvs": [...], "consolidation_suggestion": "..." }` },
  { slug: 'recommend-mv-consolidation', prompt: (r) => `Recommend MV consolidation opportunities for: ${r.view_name}. Respond JSON: { "consolidate_with": [...], "new_mv_sql": "...", "savings": "..." }` },
  { slug: 'classify-mv-pattern', prompt: (r) => `Classify MV pattern for: ${r.view_name}, SQL: ${r.sql_definition?.slice(0,200)}. Respond JSON: { "pattern": "rollup|pre-join|filter|hybrid", "confidence": "..." }` },
  { slug: 'predict-refresh-window', prompt: (r) => `Predict optimal refresh window for MV: ${r.view_name}, cron: ${r.refresh_window_cron}. Respond JSON: { "optimal_window": "...", "rationale": "...", "cron_expression": "..." }` },
  { slug: 'generate-mv-doc', prompt: (r) => `Generate documentation for MV: ${r.view_name}. Respond JSON: { "title": "...", "purpose": "...", "refresh_policy": "...", "usage_notes": "..." }` },
  { slug: 'suggest-precompute-strategy', prompt: (r) => `Suggest precompute strategy for MV: ${r.view_name}. Respond JSON: { "precompute_dims": [...], "aggregation_levels": [...], "expected_improvement": "..." }` },
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
