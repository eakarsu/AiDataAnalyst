import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const TABLE = 'parquet_iceberg_tables';
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
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND is_archived=false AND (table_name ILIKE $2 OR namespace ILIKE $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`, [req.user.id, q, limit, offset]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-parent/:connectorId', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND connector_id=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.connectorId]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-secondary/:namespace', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND namespace=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.namespace]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows: byFormat } = await pool.query(`SELECT format_version, COUNT(*) as count FROM ${TABLE} WHERE user_id=$1 GROUP BY format_version`, [req.user.id]);
    const { rows: totals } = await pool.query(`SELECT SUM(file_size_bytes) as total_bytes, SUM(record_count) as total_records, AVG(health_score) as avg_health FROM ${TABLE} WHERE user_id=$1 AND is_archived=false`, [req.user.id]);
    res.json({ byFormat, totals: totals[0] });
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, table_name, namespace, format_version) VALUES ($1,$2,$3,$4) RETURNING *`, [req.user.id, item.table_name, item.namespace || null, item.format_version || 2]);
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
      const sets = Object.keys(fields).map((k, i) => `${k}=$${i + 3}`).join(', ');
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, table_name, namespace) VALUES ($1,$2,$3) RETURNING *`, [req.user.id, item.table_name || 'imported', item.namespace || null]);
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
    const { table_name, namespace, connector_id, partition_spec, sort_order, storage_location, format_version, schema_json } = req.body;
    const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, table_name, namespace, connector_id, partition_spec, sort_order, storage_location, format_version, schema_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, table_name, namespace || null, connector_id || null, JSON.stringify(partition_spec || {}), JSON.stringify(sort_order || {}), storage_location || null, format_version || 2, JSON.stringify(schema_json || {})]);
    res.status(201).json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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
  { slug: 'suggest-partition-key', prompt: (r) => `Suggest the best partition key for Iceberg table: ${r.table_name}. Schema: ${JSON.stringify(r.schema_json)}. Respond JSON: { "partition_key": "...", "rationale": "...", "alternatives": [...] }` },
  { slug: 'optimize-file-size', prompt: (r) => `Recommend file size optimization for table: ${r.table_name}, current size bytes: ${r.file_size_bytes}. Respond JSON: { "recommended_file_size_mb": N, "current_assessment": "...", "action": "..." }` },
  { slug: 'detect-small-files', prompt: (r) => `Detect small file problem for Iceberg table: ${r.table_name}, file_size: ${r.file_size_bytes}, snapshot_count: ${r.snapshot_count}. Respond JSON: { "small_file_issue": true|false, "severity": "low|medium|high", "recommendation": "..." }` },
  { slug: 'recommend-compaction', prompt: (r) => `Recommend compaction strategy for table: ${r.table_name}, records: ${r.record_count}, snapshots: ${r.snapshot_count}. Respond JSON: { "compaction_needed": true|false, "strategy": "...", "schedule": "..." }` },
  { slug: 'predict-query-pruning', prompt: (r) => `Predict query pruning efficiency for table: ${r.table_name} with partition: ${JSON.stringify(r.partition_spec)}. Respond JSON: { "pruning_efficiency": "high|medium|low", "partition_quality": "...", "tips": [...] }` },
  { slug: 'classify-cold-data', prompt: (r) => `Classify cold data percentage for table: ${r.table_name}, last updated: ${r.updated_at}. Respond JSON: { "cold_data_pct": N, "classification": "hot|warm|cold", "archival_recommendation": "..." }` },
  { slug: 'summarize-table-stats', prompt: (r) => `Summarize stats for Iceberg table: ${r.table_name}. Records: ${r.record_count}, size: ${r.file_size_bytes} bytes, snapshots: ${r.snapshot_count}. Respond JSON: { "summary": "...", "health_indicators": {...}, "action_items": [...] }` },
  { slug: 'score-table-health', prompt: (r) => `Score health of Iceberg table: ${r.table_name}. Records: ${r.record_count}, size: ${r.file_size_bytes}, health_score: ${r.health_score}. Respond JSON: { "health_score": 0-100, "breakdown": {...}, "improvements": [...] }` },
  { slug: 'suggest-z-order', prompt: (r) => `Suggest Z-order clustering keys for table: ${r.table_name}, schema: ${JSON.stringify(r.schema_json)}. Respond JSON: { "z_order_keys": [...], "expected_improvement": "...", "rationale": "..." }` },
  { slug: 'validate-schema-evolution', prompt: (r) => `Validate schema evolution safety for table: ${r.table_name}, format: v${r.format_version}. Respond JSON: { "evolution_safe": true|false, "breaking_changes": [...], "recommendations": [...] }` },
  { slug: 'detect-snapshot-bloat', prompt: (r) => `Detect snapshot bloat for table: ${r.table_name}, snapshots: ${r.snapshot_count}. Respond JSON: { "bloat_detected": true|false, "severity": "low|medium|high", "recommended_retention": "..." }` },
  { slug: 'recommend-vacuum', prompt: (r) => `Recommend vacuum/expire snapshots for table: ${r.table_name}, snapshots: ${r.snapshot_count}. Respond JSON: { "vacuum_needed": true|false, "retention_days": N, "estimated_savings_bytes": N }` },
  { slug: 'generate-table-doc', prompt: (r) => `Generate documentation for Iceberg table: ${r.table_name}. Respond JSON: { "title": "...", "description": "...", "columns_doc": [...], "usage_notes": "..." }` },
  { slug: 'classify-update-pattern', prompt: (r) => `Classify update pattern for table: ${r.table_name}, records: ${r.record_count}, snapshots: ${r.snapshot_count}. Respond JSON: { "pattern": "append-only|upsert|delete-heavy|mixed", "confidence": "high|medium|low" }` },
  { slug: 'predict-storage-cost', prompt: (r) => `Predict storage cost for table: ${r.table_name}, size: ${r.file_size_bytes} bytes. Respond JSON: { "monthly_cost_usd": N, "cost_drivers": [...], "optimization_potential_pct": N }` },
  { slug: 'suggest-partition-evolution', prompt: (r) => `Suggest partition evolution strategy for table: ${r.table_name}, current partition: ${JSON.stringify(r.partition_spec)}. Respond JSON: { "new_partition_spec": {...}, "migration_steps": [...], "benefits": [...] }` },
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
