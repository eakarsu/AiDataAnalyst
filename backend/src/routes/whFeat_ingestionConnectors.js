import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const TABLE = 'ingestion_connectors';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Rate limiter: 20 AI calls/hr per user
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

// 1. list
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

// 2. count
router.get('/count', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM ${TABLE} WHERE user_id=$1 AND is_archived=false`, [req.user.id]);
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. search
router.get('/search', async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND is_archived=false AND (name ILIKE $2 OR source_type ILIKE $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`, [req.user.id, q, limit, offset]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. by-parent (by source_type)
router.get('/by-parent/:sourceType', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND source_type=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.sourceType]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. by-secondary (by status)
router.get('/by-secondary/:status', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND status=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.status]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. stats-summary
router.get('/stats/summary', async (req, res) => {
  try {
    const { rows: byStatus } = await pool.query(`SELECT status, COUNT(*) as count FROM ${TABLE} WHERE user_id=$1 GROUP BY status`, [req.user.id]);
    const { rows: byType } = await pool.query(`SELECT source_type, COUNT(*) as count FROM ${TABLE} WHERE user_id=$1 GROUP BY source_type`, [req.user.id]);
    res.json({ byStatus, byType });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. export-csv
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

// 8. batch-create
router.post('/batch', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'items array required' });
    const created = await Promise.all(items.map(async item => {
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, name, source_type, connection_config, schema_mapping, incremental_key, status, pii_fields, throttle_config) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [req.user.id, item.name, item.source_type || 'unknown', JSON.stringify(item.connection_config || {}), JSON.stringify(item.schema_mapping || {}), item.incremental_key || null, item.status || 'active', JSON.stringify(item.pii_fields || []), JSON.stringify(item.throttle_config || {})]);
      return rows[0];
    }));
    res.status(201).json({ data: created, count: created.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. batch-update
router.put('/batch', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'items array required' });
    const updated = await Promise.all(items.map(async ({ id, ...fields }) => {
      const sets = Object.keys(fields).map((k, i) => `${k}=$${i + 2}`).join(', ');
      const vals = Object.values(fields);
      if (!sets) return { id, error: 'no fields' };
      const { rows } = await pool.query(`UPDATE ${TABLE} SET ${sets}, updated_at=NOW() WHERE id=$1 AND user_id=${req.user.id} RETURNING *`, [id, ...vals]);
      return rows[0] || { id, error: 'not found' };
    }));
    res.json({ data: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 10. batch-delete
router.delete('/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids array required' });
    await pool.query(`UPDATE ${TABLE} SET is_archived=true, updated_at=NOW() WHERE id=ANY($1) AND user_id=$2`, [ids, req.user.id]);
    res.json({ archived: ids.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 11. import-csv
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, name, source_type) VALUES ($1,$2,$3) RETURNING *`, [req.user.id, item.name || 'imported', item.source_type || 'csv']);
      return rows[0];
    }));
    res.status(201).json({ data: created, count: created.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 12. get by id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 13. create
router.post('/', async (req, res) => {
  try {
    const { name, source_type, connection_config, schema_mapping, incremental_key, pii_fields, throttle_config } = req.body;
    const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, name, source_type, connection_config, schema_mapping, incremental_key, pii_fields, throttle_config) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, name, source_type || 'unknown', JSON.stringify(connection_config || {}), JSON.stringify(schema_mapping || {}), incremental_key || null, JSON.stringify(pii_fields || []), JSON.stringify(throttle_config || {})]);
    res.status(201).json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 14. update
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ error: 'no fields' });
    const sets = keys.map((k, i) => `${k}=$${i + 3}`).join(', ');
    const { rows } = await pool.query(`UPDATE ${TABLE} SET ${sets}, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [req.params.id, req.user.id, ...Object.values(fields)]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 15. soft-delete
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`UPDATE ${TABLE} SET is_archived=true, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 16. archive
router.post('/:id/archive', async (req, res) => {
  try {
    const { rows } = await pool.query(`UPDATE ${TABLE} SET is_archived=true, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 17. restore
router.post('/:id/restore', async (req, res) => {
  try {
    const { rows } = await pool.query(`UPDATE ${TABLE} SET is_archived=false, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 18. history
router.get('/:id/history', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM activity_log WHERE user_id=$1 AND entity_type=$2 AND entity_id=$3 ORDER BY created_at DESC LIMIT 100`, [req.user.id, TABLE, req.params.id]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── AI verbs (16) ─────────────────────────────────────────────────────────────

const aiVerbs = [
  { slug: 'classify-source-type', prompt: (r) => `Classify the data source type for this connector. Name: ${r.name}, Config: ${JSON.stringify(r.connection_config)}. Respond JSON: { "source_type": "...", "confidence": "high|medium|low", "rationale": "..." }` },
  { slug: 'suggest-schema-mapping', prompt: (r) => `Suggest schema mappings for this ingestion connector. Source: ${r.source_type}, Config: ${JSON.stringify(r.connection_config)}. Respond JSON: { "mappings": [{ "source_field": "...", "target_field": "...", "transform": "..." }] }` },
  { slug: 'detect-schema-drift', prompt: (r) => `Detect schema drift risks for connector: ${r.name}, source: ${r.source_type}. Respond JSON: { "drift_risk": "low|medium|high", "drifted_fields": [...], "recommendations": [...] }` },
  { slug: 'predict-ingestion-failure', prompt: (r) => `Predict ingestion failure likelihood for: ${r.name}, status: ${r.status}, runs: ${r.run_count}. Respond JSON: { "failure_probability": 0-100, "risk_factors": [...], "mitigations": [...] }` },
  { slug: 'recommend-retry-strategy', prompt: (r) => `Recommend retry strategy for connector: ${r.name}, source: ${r.source_type}. Respond JSON: { "strategy": "exponential|linear|immediate", "max_retries": N, "rationale": "..." }` },
  { slug: 'generate-connector-config', prompt: (r) => `Generate a production-ready connector config template for source type: ${r.source_type}. Respond JSON: { "config_template": {...}, "required_fields": [...], "notes": "..." }` },
  { slug: 'summarize-ingestion-run', prompt: (r) => `Summarize the last ingestion run for connector: ${r.name}, status: ${r.last_run_status}, runs: ${r.run_count}. Respond JSON: { "summary": "...", "key_metrics": {...}, "next_steps": [...] }` },
  { slug: 'score-data-freshness', prompt: (r) => `Score data freshness for connector: ${r.name}, last_run: ${r.last_run}. Respond JSON: { "freshness_score": 0-100, "staleness_hours": N, "recommendation": "..." }` },
  { slug: 'validate-source-credentials', prompt: (r) => `Validate source credential structure for connector: ${r.name}, type: ${r.source_type}. Respond JSON: { "valid": true|false, "issues": [...], "recommendations": [...] }` },
  { slug: 'suggest-incremental-key', prompt: (r) => `Suggest the best incremental key for connector: ${r.name}, source: ${r.source_type}. Respond JSON: { "suggested_key": "...", "rationale": "...", "alternatives": [...] }` },
  { slug: 'detect-duplicate-source', prompt: (r) => `Detect if this connector likely duplicates another source. Connector: ${r.name}, type: ${r.source_type}. Respond JSON: { "duplicate_risk": "low|medium|high", "likely_duplicates": [...], "action": "..." }` },
  { slug: 'classify-pii-fields', prompt: (r) => `Classify PII fields in schema mapping: ${JSON.stringify(r.schema_mapping)}. Respond JSON: { "pii_fields": [{ "field": "...", "pii_type": "name|email|ssn|phone|...", "risk": "low|medium|high" }] }` },
  { slug: 'generate-source-doc', prompt: (r) => `Generate documentation for data source connector: ${r.name}, type: ${r.source_type}. Respond JSON: { "title": "...", "description": "...", "fields_doc": [...], "usage_notes": "..." }` },
  { slug: 'predict-ingestion-cost', prompt: (r) => `Predict ingestion cost for connector: ${r.name}, source: ${r.source_type}, runs: ${r.run_count}. Respond JSON: { "estimated_cost_usd": N, "cost_drivers": [...], "optimization_tips": [...] }` },
  { slug: 'recommend-throttling', prompt: (r) => `Recommend throttling config for connector: ${r.name}, source: ${r.source_type}. Respond JSON: { "throttle_rps": N, "batch_size": N, "rationale": "..." }` },
  { slug: 'detect-source-decommission', prompt: (r) => `Detect if source ${r.name} (type: ${r.source_type}, last_run: ${r.last_run}) may be decommissioned. Respond JSON: { "decommission_risk": "low|medium|high", "signals": [...], "recommendation": "..." }` },
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
