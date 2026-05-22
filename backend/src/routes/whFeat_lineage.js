import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const TABLE = 'lineage_assets';
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
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND is_archived=false AND (asset_name ILIKE $2 OR asset_type ILIKE $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`, [req.user.id, q, limit, offset]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-parent/:assetType', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND asset_type=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.assetType]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-secondary/:depType', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND dependency_type=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.depType]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows: byGroup } = await pool.query(`SELECT asset_type, COUNT(*) as count FROM lineage_assets WHERE user_id=$1 GROUP BY asset_type`, [req.user.id]);
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, asset_name, asset_type) VALUES ($1,$2,$3) RETURNING *`, [req.user.id, item.asset_name||'asset', item.asset_type||'table']);
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, asset_name, asset_type) VALUES ($1,$2,$3) RETURNING *`, [req.user.id, item.asset_name||'imported', item.asset_type||'table']);
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
    const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, asset_name, asset_type, upstream_assets, downstream_assets, tags) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [req.user.id, req.body.asset_name, req.body.asset_type||'table', JSON.stringify(req.body.upstream_assets||[]), JSON.stringify(req.body.downstream_assets||[]), JSON.stringify(req.body.tags||[])]);
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
  { slug: 'trace-upstream', prompt: (r) => `Trace upstream lineage for asset: ${r.asset_name}. Upstream: ${JSON.stringify(r.upstream_assets)}. Respond JSON: { "upstream_chain": [...], "root_sources": [...], "depth": N }` },
  { slug: 'trace-downstream', prompt: (r) => `Trace downstream lineage for asset: ${r.asset_name}. Downstream: ${JSON.stringify(r.downstream_assets)}. Respond JSON: { "downstream_chain": [...], "leaf_consumers": [...], "depth": N }` },
  { slug: 'suggest-impact-radius', prompt: (r) => `Suggest impact radius for changes to asset: ${r.asset_name}. Respond JSON: { "impact_radius": "narrow|moderate|wide", "affected_assets": [...], "risk_score": 0-100 }` },
  { slug: 'predict-breaking-change', prompt: (r) => `Predict breaking change risk for asset: ${r.asset_name}, downstream: ${JSON.stringify(r.downstream_assets)}. Respond JSON: { "breaking_change_risk": "low|medium|high", "impacted": [...], "mitigation": "..." }` },
  { slug: 'classify-lineage-gap', prompt: (r) => `Classify lineage gaps for asset: ${r.asset_name}, completeness: ${r.completeness_score}. Respond JSON: { "gaps": [...], "gap_severity": "low|medium|high", "fill_strategy": "..." }` },
  { slug: 'recommend-lineage-test', prompt: (r) => `Recommend lineage tests for asset: ${r.asset_name}. Respond JSON: { "tests": [{ "test": "...", "assertion": "...", "priority": "high|medium|low" }] }` },
  { slug: 'summarize-data-flow', prompt: (r) => `Summarize data flow for asset: ${r.asset_name}. Respond JSON: { "flow_summary": "...", "transformation_steps": [...], "key_risks": [...] }` },
  { slug: 'score-lineage-completeness', prompt: (r) => `Score lineage completeness for asset: ${r.asset_name}, score: ${r.completeness_score}. Respond JSON: { "completeness_score": 0-100, "missing_links": [...], "actions": [...] }` },
  { slug: 'validate-column-level-lineage', prompt: (r) => `Validate column-level lineage for asset: ${r.asset_name}. Respond JSON: { "valid": true|false, "missing_column_lineage": [...], "recommendations": [...] }` },
  { slug: 'detect-orphan-asset', prompt: (r) => `Detect if asset is orphaned: ${r.asset_name}, is_orphan: ${r.is_orphan}, upstream: ${JSON.stringify(r.upstream_assets)}, downstream: ${JSON.stringify(r.downstream_assets)}. Respond JSON: { "orphaned": true|false, "action": "..." }` },
  { slug: 'suggest-tag-propagation', prompt: (r) => `Suggest tag propagation for asset: ${r.asset_name}, tags: ${JSON.stringify(r.tags)}. Respond JSON: { "propagate_to": [...], "new_tags": [...], "rationale": "..." }` },
  { slug: 'generate-lineage-doc', prompt: (r) => `Generate lineage documentation for asset: ${r.asset_name}. Respond JSON: { "title": "...", "lineage_description": "...", "upstream_summary": "...", "downstream_summary": "..." }` },
  { slug: 'classify-dependency-type', prompt: (r) => `Classify dependency type for asset: ${r.asset_name}, upstream: ${JSON.stringify(r.upstream_assets)}. Respond JSON: { "dependency_type": "hard|soft|derived|reference", "confidence": "..." }` },
  { slug: 'predict-cascade-failure', prompt: (r) => `Predict cascade failure risk if asset fails: ${r.asset_name}, downstream: ${JSON.stringify(r.downstream_assets)}. Respond JSON: { "cascade_risk": "low|medium|high", "cascade_chain": [...], "prevention": "..." }` },
  { slug: 'recommend-quarantine', prompt: (r) => `Recommend quarantine strategy for problematic asset: ${r.asset_name}. Respond JSON: { "quarantine_recommended": true|false, "strategy": "...", "impacted_assets": [...] }` },
  { slug: 'summarize-blast-radius', prompt: (r) => `Summarize blast radius if asset ${r.asset_name} is deleted. Respond JSON: { "blast_radius": "narrow|moderate|wide", "affected_count": N, "critical_assets": [...] }` },
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
