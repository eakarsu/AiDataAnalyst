/**
 * Custom Views feature routes
 *
 * Endpoints:
 *   GET  /api/custom-views/datasets          -> list available datasets + columns
 *   GET  /api/custom-views/dataset/:id       -> dataset preview rows (synthesized)
 *   POST /api/custom-views/run-query         -> execute a (mock) SQL query, return rows
 *   POST /api/custom-views/schedule-report   -> persist scheduled report
 *
 * Data is synthesized so the feature is self-contained and does not depend
 * on any real DB tables being seeded. The scheduled_reports table is created
 * lazily on first POST.
 */
import { Router } from 'express';
import authObj from '../middleware/auth.js';
import pool from '../config/database.js';

const auth = authObj.authenticateToken;
const router = Router();

// ---------- synthesized dataset registry ----------
const DATASETS = [
  {
    id: 'sales_2026',
    name: 'Sales 2026',
    description: 'Quarterly sales transactions for FY2026',
    columns: [
      { name: 'order_id',     type: 'integer' },
      { name: 'customer',     type: 'string'  },
      { name: 'region',       type: 'string'  },
      { name: 'product',      type: 'string'  },
      { name: 'units',        type: 'integer' },
      { name: 'revenue',      type: 'number'  },
      { name: 'order_date',   type: 'date'    },
    ],
  },
  {
    id: 'users_signups',
    name: 'User Signups',
    description: 'Self-service user signups by channel',
    columns: [
      { name: 'user_id',      type: 'integer' },
      { name: 'email',        type: 'string'  },
      { name: 'channel',      type: 'string'  },
      { name: 'plan',         type: 'string'  },
      { name: 'mrr',          type: 'number'  },
      { name: 'signup_date',  type: 'date'    },
    ],
  },
  {
    id: 'product_events',
    name: 'Product Events',
    description: 'Telemetry events from product usage',
    columns: [
      { name: 'event_id',     type: 'integer' },
      { name: 'user_id',      type: 'integer' },
      { name: 'event_name',   type: 'string'  },
      { name: 'platform',     type: 'string'  },
      { name: 'duration_ms',  type: 'integer' },
      { name: 'event_ts',     type: 'date'    },
    ],
  },
];

function pad(n) { return n < 10 ? `0${n}` : `${n}`; }
function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function synthRows(datasetId, count = 15) {
  const ds = DATASETS.find(d => d.id === datasetId);
  if (!ds) return [];
  const out = [];
  const regions  = ['NA', 'EMEA', 'APAC', 'LATAM'];
  const products = ['Pro Plan', 'Team Plan', 'Enterprise', 'Starter'];
  const channels = ['organic', 'paid_search', 'referral', 'social'];
  const plans    = ['free', 'pro', 'team', 'enterprise'];
  const events   = ['page_view', 'query_run', 'export', 'share', 'login'];
  const platforms= ['web', 'ios', 'android', 'desktop'];

  for (let i = 0; i < count; i++) {
    if (datasetId === 'sales_2026') {
      out.push({
        order_id:   1000 + i,
        customer:   `Acme ${i + 1}`,
        region:     regions[i % regions.length],
        product:    products[i % products.length],
        units:      ((i * 7) % 19) + 1,
        revenue:    +(((i * 137.4) % 9000) + 250).toFixed(2),
        order_date: dateStr(i * 2),
      });
    } else if (datasetId === 'users_signups') {
      out.push({
        user_id:     5000 + i,
        email:       `user${i + 1}@example.com`,
        channel:     channels[i % channels.length],
        plan:        plans[i % plans.length],
        mrr:         +(((i * 23.7) % 499) + 9).toFixed(2),
        signup_date: dateStr(i),
      });
    } else if (datasetId === 'product_events') {
      out.push({
        event_id:    900000 + i,
        user_id:     5000 + (i % 12),
        event_name:  events[i % events.length],
        platform:    platforms[i % platforms.length],
        duration_ms: ((i * 311) % 4500) + 120,
        event_ts:    dateStr(i),
      });
    }
  }
  return out;
}

// ---------- routes ----------
router.get('/datasets', auth, (req, res) => {
  res.json({
    datasets: DATASETS.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      columns: d.columns,
      row_count: 15,
    })),
  });
});

router.get('/dataset/:id', auth, (req, res) => {
  const ds = DATASETS.find(d => d.id === req.params.id);
  if (!ds) return res.status(404).json({ error: 'Dataset not found' });
  res.json({
    id:       ds.id,
    name:     ds.name,
    columns:  ds.columns,
    rows:     synthRows(ds.id, 15),
  });
});

router.post('/run-query', auth, (req, res) => {
  const { sql, dataset } = req.body || {};
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'sql (string) is required' });
  }
  // Pick a dataset to base rows on; default to first
  const dsId = dataset || (DATASETS.find(d => sql.toLowerCase().includes(d.id))?.id) || DATASETS[0].id;
  const ds   = DATASETS.find(d => d.id === dsId) || DATASETS[0];
  const rows = synthRows(ds.id, 15);
  res.json({
    sql,
    dataset: ds.id,
    columns: ds.columns,
    rows,
    row_count: rows.length,
    executed_at: new Date().toISOString(),
    duration_ms: 23 + Math.floor(Math.random() * 80),
  });
});

let scheduledReportsReady = false;
async function ensureScheduledReportsTable() {
  if (scheduledReportsReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scheduled_reports (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER,
      name        VARCHAR(255) NOT NULL,
      sql_query   TEXT         NOT NULL,
      frequency   VARCHAR(32)  NOT NULL,
      recipients  TEXT         NOT NULL,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `);
  scheduledReportsReady = true;
}

router.post('/schedule-report', auth, async (req, res) => {
  const { name, sql, frequency, recipients } = req.body || {};
  if (!name || !sql || !frequency || !recipients) {
    return res.status(400).json({ error: 'name, sql, frequency, recipients are required' });
  }
  const freqOk = ['daily', 'weekly'].includes(String(frequency).toLowerCase());
  if (!freqOk) return res.status(400).json({ error: 'frequency must be daily or weekly' });

  const recipientsList = Array.isArray(recipients)
    ? recipients.join(',')
    : String(recipients);

  try {
    await ensureScheduledReportsTable();
    const result = await pool.query(
      `INSERT INTO scheduled_reports (user_id, name, sql_query, frequency, recipients)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, sql_query, frequency, recipients, created_at`,
      [req.user?.id || null, name, sql, frequency, recipientsList]
    );
    res.json({ ok: true, report: result.rows[0] });
  } catch (err) {
    console.error('schedule-report error:', err);
    res.status(500).json({ error: 'Failed to schedule report', detail: err.message });
  }
});

export default router;
