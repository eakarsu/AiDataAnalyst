import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';
const router = Router();
router.use(authenticateToken);

const TABLE = 'collab_presence_sessions';
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
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND is_archived=false AND (session_token ILIKE $2 OR active_cell ILIKE $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`, [req.user.id, q, limit, offset]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-parent/:gridId', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND grid_id=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.gridId]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-secondary/:idle', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id=$1 AND is_idle=$2 AND is_archived=false ORDER BY created_at DESC`, [req.user.id, req.params.idle]);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows: byGroup } = await pool.query(`SELECT is_idle, COUNT(*) as count FROM collab_presence_sessions WHERE user_id=$1 GROUP BY is_idle`, [req.user.id]);
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, grid_id, session_token) VALUES ($1,$2,$3) RETURNING *`, [req.user.id, item.grid_id||null, item.session_token||Math.random().toString(36)]);
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
      const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, session_token) VALUES ($1,$2) RETURNING *`, [req.user.id, item.session_token||'imported']);
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
    const { rows } = await pool.query(`INSERT INTO ${TABLE} (user_id, grid_id, session_token, cursor_position, active_cell) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [req.user.id, req.body.grid_id||null, req.body.session_token||crypto.randomUUID(), JSON.stringify(req.body.cursor_position||{}), req.body.active_cell||null]);
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
  { slug: 'classify-edit-conflict', prompt: (r) => `Classify edit conflict in session: ${r.session_token}, cell: ${r.active_cell}. Respond JSON: { "conflict_type": "concurrent|sequential|merge", "severity": "low|medium|high" }` },
  { slug: 'suggest-merge-resolution', prompt: (r) => `Suggest merge resolution for conflict in session: ${r.session_token}. Respond JSON: { "resolution": "...", "winner": "...", "strategy": "last-write|manual|merge" }` },
  { slug: 'detect-stale-cursor', prompt: (r) => `Detect stale cursor in session: ${r.session_token}, is_idle: ${r.is_idle}, idle_since: ${r.idle_since}. Respond JSON: { "stale": true|false, "minutes_stale": N, "action": "..." }` },
  { slug: 'predict-collision', prompt: (r) => `Predict edit collision risk in session: ${r.session_token}, cell: ${r.active_cell}. Respond JSON: { "collision_risk": "low|medium|high", "hotspot_cells": [...] }` },
  { slug: 'recommend-lock-strategy', prompt: (r) => `Recommend lock strategy for session: ${r.session_token}. Respond JSON: { "strategy": "optimistic|pessimistic|cell-level", "rationale": "..." }` },
  { slug: 'generate-presence-summary', prompt: (r) => `Generate presence summary for session: ${r.session_token}. Respond JSON: { "summary": "...", "active_users": N, "cells_edited": [...] }` },
  { slug: 'summarize-collab-session', prompt: (r) => `Summarize collaboration session: ${r.session_token}. Respond JSON: { "duration": "...", "edits_count": N, "participants": N, "key_changes": [...] }` },
  { slug: 'score-collab-health', prompt: (r) => `Score collaboration health for session: ${r.session_token}, score: ${r.health_score}. Respond JSON: { "health_score": 0-100, "issues": [...], "recommendations": [...] }` },
  { slug: 'validate-presence-state', prompt: (r) => `Validate presence state for session: ${r.session_token}, cursor: ${JSON.stringify(r.cursor_position)}. Respond JSON: { "valid": true|false, "inconsistencies": [...] }` },
  { slug: 'suggest-mention', prompt: (r) => `Suggest users to mention in session: ${r.session_token}. Respond JSON: { "suggested_mentions": [...], "rationale": "..." }` },
  { slug: 'detect-idle-user', prompt: (r) => `Detect idle users in session: ${r.session_token}, is_idle: ${r.is_idle}, idle_since: ${r.idle_since}. Respond JSON: { "idle_detected": true|false, "idle_duration_min": N, "action": "..." }` },
  { slug: 'recommend-handoff', prompt: (r) => `Recommend handoff strategy for session: ${r.session_token}. Respond JSON: { "handoff_to": "...", "context_summary": "...", "action_items": [...] }` },
  { slug: 'classify-comment-priority', prompt: (r) => `Classify priority of comments in session: ${r.session_token}: ${JSON.stringify(r.comments)}. Respond JSON: { "priorities": [{ "comment": "...", "priority": "high|medium|low" }] }` },
  { slug: 'predict-comment-resolution', prompt: (r) => `Predict comment resolution time for session: ${r.session_token}, comments: ${JSON.stringify(r.comments)}. Respond JSON: { "avg_resolution_hours": N, "blockers": [...] }` },
  { slug: 'generate-edit-summary', prompt: (r) => `Generate edit summary for session: ${r.session_token}, summary: ${r.edit_summary}. Respond JSON: { "summary": "...", "changes_by_type": {...}, "impact": "..." }` },
  { slug: 'suggest-collab-workflow', prompt: (r) => `Suggest collaboration workflow for session: ${r.session_token}. Respond JSON: { "workflow": "...", "roles": [...], "best_practices": [...] }` },
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
