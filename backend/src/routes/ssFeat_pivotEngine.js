import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const TABLE = 'pivot_engine_configs';
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
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND is_archived=false AND (pivot_name ILIKE $2 OR use_case ILIKE $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`, [req.user.id, q, limit, offset]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-parent/:gridId', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND grid_id=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.gridId]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-secondary/:aggregationType', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND aggregation_type=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.aggregationType]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows: byGroup } = await pool.query(`SELECT aggregation_type, COUNT(*) as count FROM pivot_engine_configs WHERE user_id=$1 GROUP BY aggregation_type`, [req.user.id]);
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, grid_id, pivot_name) VALUES ($1,$2,$3) RETURNING *`, [req.user.id, item.grid_id||null, item.pivot_name||'Pivot']);
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, pivot_name) VALUES ($1,$2) RETURNING *`, [req.user.id, item.pivot_name||'imported']);
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
    const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, grid_id, pivot_name, row_keys, col_keys, value_fields, aggregation_type) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [req.user.id, req.body.grid_id||null, req.body.pivot_name||'Pivot', JSON.stringify(req.body.row_keys||[]), JSON.stringify(req.body.col_keys||[]), JSON.stringify(req.body.value_fields||[]), req.body.aggregation_type||'sum']);
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
  { slug: 'suggest-pivot-config', prompt: (r) => `Suggest pivot configuration for: ${r.pivot_name}. Respond JSON: { "row_keys": [...], "col_keys": [...], "value_fields": [...], "aggregation": "..." }` },
  { slug: 'detect-pivot-pattern', prompt: (r) => `Detect pivot usage pattern for: ${r.pivot_name}, use_case: ${r.use_case}. Respond JSON: { "pattern": "...", "suitability": "high|medium|low" }` },
  { slug: 'classify-grouping-key', prompt: (r) => `Classify grouping keys for pivot: ${r.pivot_name}, rows: ${JSON.stringify(r.row_keys)}. Respond JSON: { "key_types": [...], "recommended_order": [...] }` },
  { slug: 'recommend-aggregation', prompt: (r) => `Recommend aggregation for pivot: ${r.pivot_name}, current: ${r.aggregation_type}. Respond JSON: { "recommended_agg": "...", "rationale": "...", "alternatives": [...] }` },
  { slug: 'predict-pivot-perf', prompt: (r) => `Predict pivot performance for: ${r.pivot_name}, refresh_cost: ${r.refresh_cost_estimate}. Respond JSON: { "perf_estimate_ms": N, "bottlenecks": [...], "optimization": "..." }` },
  { slug: 'generate-pivot-summary', prompt: (r) => `Generate summary of pivot: ${r.pivot_name}. Respond JSON: { "summary": "...", "key_dimensions": [...], "insights": [...] }` },
  { slug: 'summarize-pivot-result', prompt: (r) => `Summarize pivot results for: ${r.pivot_name}, clarity: ${r.clarity_score}. Respond JSON: { "result_summary": "...", "top_values": [...], "trends": [...] }` },
  { slug: 'score-pivot-clarity', prompt: (r) => `Score clarity of pivot: ${r.pivot_name}, score: ${r.clarity_score}. Respond JSON: { "clarity_score": 0-100, "issues": [...], "improvements": [...] }` },
  { slug: 'validate-pivot-completeness', prompt: (r) => `Validate completeness of pivot: ${r.pivot_name}. Respond JSON: { "complete": true|false, "missing": [...], "recommendations": [...] }` },
  { slug: 'suggest-row-vs-column', prompt: (r) => `Suggest row vs column placement for pivot: ${r.pivot_name}. Respond JSON: { "rows": [...], "columns": [...], "rationale": "..." }` },
  { slug: 'detect-pivot-fanout', prompt: (r) => `Detect pivot fanout risk for: ${r.pivot_name}, col_keys: ${JSON.stringify(r.col_keys)}. Respond JSON: { "fanout_risk": "low|medium|high", "estimated_columns": N, "mitigation": "..." }` },
  { slug: 'recommend-pivot-simplification', prompt: (r) => `Recommend simplification for pivot: ${r.pivot_name}. Respond JSON: { "simplifications": [...], "removed_dimensions": [...], "clarity_gain": "..." }` },
  { slug: 'classify-pivot-use-case', prompt: (r) => `Classify use case for pivot: ${r.pivot_name}. Respond JSON: { "use_case": "reporting|exploration|monitoring|presentation", "confidence": "..." }` },
  { slug: 'predict-pivot-refresh-cost', prompt: (r) => `Predict pivot refresh cost for: ${r.pivot_name}. Respond JSON: { "refresh_cost_usd": N, "time_ms": N, "optimization_tips": [...] }` },
  { slug: 'generate-pivot-narrative', prompt: (r) => `Generate narrative for pivot: ${r.pivot_name}. Respond JSON: { "narrative": "...", "key_findings": [...], "action_items": [...] }` },
  { slug: 'suggest-drill-down', prompt: (r) => `Suggest drill-down paths for pivot: ${r.pivot_name}, rows: ${JSON.stringify(r.row_keys)}. Respond JSON: { "drill_paths": [...], "recommended_depth": N }` },
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
