import { Router } from 'express';
import crypto from 'crypto';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole, validatePagination, validateId, handleValidation } from '../middleware/validate.js';
import { body, query } from 'express-validator';
import aiService from '../services/aiService.js';
import cacheService from '../services/cacheService.js';
import exportService from '../services/exportService.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== HELPERS ====================
function buildPaginatedQuery(baseQuery, req, allowedSorts = ['created_at']) {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 25, 100);
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const sort = allowedSorts.includes(req.query.sort) ? req.query.sort : allowedSorts[0];
  const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

  return { page, limit, offset, search, sort, order };
}

async function paginatedResponse(res, baseCountQuery, baseDataQuery, params, pagination, searchClause = '') {
  const { page, limit, offset, sort, order } = pagination;

  const countQuery = baseCountQuery + searchClause;
  const dataQuery = baseDataQuery + searchClause + ` ORDER BY ${sort} ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, params),
    pool.query(dataQuery, [...params, limit, offset]),
  ]);

  const total = parseInt(countResult.rows[0].count);
  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  };
}

// ==================== DATA SOURCES ====================
router.get('/data-sources', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'name', 'type', 'status', 'record_count']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (name ILIKE $2 OR type ILIKE $2 OR description ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM data_sources WHERE user_id = $1',
      'SELECT * FROM data_sources WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching data sources:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/data-sources/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM data_sources WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching data source:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/data-sources', async (req, res) => {
  try {
    const { name, type, connection_string, description } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

    const result = await pool.query(
      'INSERT INTO data_sources (user_id, name, type, connection_string, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, name, type, connection_string, description]
    );
    cacheService.invalidateUser(req.user.id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating data source:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/data-sources/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM data_sources WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    cacheService.invalidateUser(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting data source:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DASHBOARDS ====================
router.get('/dashboards', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'name', 'views']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (name ILIKE $2 OR description ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM dashboards WHERE user_id = $1',
      'SELECT * FROM dashboards WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/dashboards/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/dashboards', async (req, res) => {
  try {
    const { name, description, is_public } = req.body;
    const result = await pool.query(
      'INSERT INTO dashboards (user_id, name, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, description, is_public || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/dashboards/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM dashboards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== REPORTS ====================
router.get('/reports', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'name', 'type', 'status']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (name ILIKE $2 OR type ILIKE $2 OR description ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM reports WHERE user_id = $1',
      'SELECT * FROM reports WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/reports/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reports WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reports', async (req, res) => {
  try {
    const { name, type, query, description, dashboard_id, schedule } = req.body;
    const result = await pool.query(
      'INSERT INTO reports (user_id, dashboard_id, name, type, query, description, schedule) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, dashboard_id, name, type, query, description, schedule]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/reports/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM reports WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== AI INSIGHTS ====================
router.get('/insights', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'title', 'confidence', 'impact', 'status']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (title ILIKE $2 OR content ILIKE $2 OR insight_type ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM ai_insights WHERE user_id = $1',
      'SELECT * FROM ai_insights WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/insights/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ai_insights WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching insight:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/insights/generate', async (req, res) => {
  try {
    const { data, context } = req.body;

    const cacheKey = `user:${req.user.id}:insight:${crypto.createHash('md5').update(JSON.stringify({ data, context })).digest('hex')}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.status(201).json({ ...cached, cached: true });
    }

    const insight = await aiService.generateInsight(data, context);

    const dataPoints = {
      key_metrics: insight.key_metrics || [],
      analysis_sections: insight.analysis_sections || [],
      risks: insight.risks || [],
      opportunities: insight.opportunities || []
    };

    const recommendations = (insight.recommendations || []).map(rec => {
      if (typeof rec === 'string') return { title: rec, description: rec, priority: 3, expected_impact: 'medium' };
      return rec;
    });

    const result = await pool.query(
      'INSERT INTO ai_insights (user_id, title, insight_type, content, confidence, impact, recommendations, data_points) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, insight.title, insight.insight_type, insight.content, insight.confidence, insight.impact, JSON.stringify(recommendations), JSON.stringify(dataPoints)]
    );

    cacheService.set(cacheKey, result.rows[0], 900);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error generating insight:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/insights/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE ai_insights SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating insight:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== QUERIES ====================
router.get('/queries', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'status', 'execution_time']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (natural_language_query ILIKE $2 OR generated_sql ILIKE $2 OR result_summary ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM queries WHERE user_id = $1',
      'SELECT * FROM queries WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/queries/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM queries WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Query not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching query:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/queries', async (req, res) => {
  try {
    const { natural_language_query } = req.body;

    const cacheKey = `user:${req.user.id}:query:${crypto.createHash('md5').update(natural_language_query).digest('hex')}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.status(201).json({ ...cached, cached: true });
    }

    const schema = `Tables: users, data_sources, dashboards, reports, ai_insights, queries, alerts, predictions, anomalies`;
    const generatedSQL = await aiService.generateSQLFromNaturalLanguage(natural_language_query, schema);

    const result = await pool.query(
      'INSERT INTO queries (user_id, natural_language_query, generated_sql, result_summary, execution_time, row_count, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, natural_language_query, generatedSQL, 'Query generated successfully', 100, 0, 'completed']
    );

    cacheService.set(cacheKey, result.rows[0], 600);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating query:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ALERTS ====================
router.get('/alerts', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'name', 'frequency', 'trigger_count']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (name ILIKE $2 OR condition ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM alerts WHERE user_id = $1',
      'SELECT * FROM alerts WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/alerts/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM alerts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/alerts', async (req, res) => {
  try {
    const { name, condition, threshold, frequency, notification_channels } = req.body;
    const result = await pool.query(
      'INSERT INTO alerts (user_id, name, condition, threshold, frequency, notification_channels) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, name, condition, threshold, frequency, JSON.stringify(notification_channels || ['email'])]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/alerts/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE alerts SET is_active = NOT is_active WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling alert:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/alerts/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM alerts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== PREDICTIONS ====================
router.get('/predictions', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'target_metric', 'accuracy', 'status']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (target_metric ILIKE $2 OR model_type ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM predictions WHERE user_id = $1',
      'SELECT * FROM predictions WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/predictions/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM predictions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prediction not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/predictions/generate', async (req, res) => {
  try {
    const { historical_data, target_metric, period } = req.body;

    const cacheKey = `user:${req.user.id}:prediction:${crypto.createHash('md5').update(JSON.stringify({ target_metric, period })).digest('hex')}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.status(201).json({ ...cached, cached: true });
    }

    const prediction = await aiService.generatePrediction(historical_data, target_metric, period);

    const result = await pool.query(
      'INSERT INTO predictions (user_id, model_type, target_metric, prediction_period, predicted_value, confidence_interval, accuracy, features_used) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, 'ai_generated', target_metric, period, prediction.predictedValue, JSON.stringify(prediction.confidenceInterval), prediction.accuracy, JSON.stringify(prediction.factors)]
    );

    cacheService.set(cacheKey, result.rows[0], 1800);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error generating prediction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ANOMALIES ====================
router.get('/anomalies', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['detected_at', 'metric_name', 'severity', 'deviation_percentage']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (metric_name ILIKE $2 OR severity ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM anomalies WHERE user_id = $1',
      'SELECT * FROM anomalies WHERE user_id = $1',
      params,
      { ...pg, sort: pg.sort === 'created_at' ? 'detected_at' : pg.sort },
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/anomalies/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM anomalies WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching anomaly:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/anomalies/:id/resolve', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE anomalies SET is_resolved = true, resolved_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error resolving anomaly:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/anomalies/analyze', async (req, res) => {
  try {
    const { metric, expected, actual, historical_data } = req.body;
    const analysis = await aiService.analyzeAnomaly(metric, expected, actual, historical_data);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing anomaly:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/anomalies', async (req, res) => {
  try {
    const { metric_name, expected_value, actual_value, description, historical_data } = req.body;

    const expected = Number(expected_value) || 0;
    const actual = Number(actual_value) || 0;
    const deviation = expected !== 0 ? ((actual - expected) / expected * 100) : 0;

    const analysis = await aiService.analyzeAnomaly(metric_name, expected, actual, historical_data || []);

    const result = await pool.query(
      `INSERT INTO anomalies (user_id, metric_name, expected_value, actual_value, deviation_percentage, severity, description, detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [
        req.user.id,
        metric_name,
        expected,
        actual,
        Math.round(deviation * 100) / 100,
        analysis.severity || 'medium',
        JSON.stringify({
          user_description: description || '',
          ai_severity: analysis.severity,
          possibleCauses: analysis.possibleCauses || [],
          recommendations: analysis.recommendations || [],
          requiresAction: analysis.requiresAction
        })
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating anomaly:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DATA EXPORTS ====================
router.get('/exports', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'format', 'file_size', 'status']);
    const params = [req.user.id];

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM data_exports WHERE user_id = $1',
      'SELECT * FROM data_exports WHERE user_id = $1',
      params,
      pg
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching exports:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/exports/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM data_exports WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Export not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching export:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/exports', async (req, res) => {
  try {
    const { source_id, format } = req.body;

    if (!source_id) {
      return res.status(400).json({ error: 'Data source is required' });
    }

    const sourceResult = await pool.query(
      'SELECT * FROM data_sources WHERE id = $1 AND user_id = $2',
      [source_id, req.user.id]
    );

    if (sourceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    const source = sourceResult.rows[0];
    const tableName = source.connection_string;
    const exportTitle = source.name;

    let exportData = [];
    let columns = [];
    try {
      const colResult = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = $1 AND column_name != 'id'
        ORDER BY ordinal_position
      `, [tableName]);
      columns = colResult.rows.map(r => r.column_name);

      const dataResult = await pool.query(`SELECT ${columns.map(c => `"${c}"`).join(', ')} FROM "${tableName}" LIMIT 10000`);
      exportData = dataResult.rows;
    } catch (dbErr) {
      exportData = [{ name: source.name, type: source.type, status: source.status, records: source.record_count }];
      columns = ['name', 'type', 'status', 'records'];
    }

    let exportResult;
    if (format === 'pdf') {
      exportResult = await exportService.generatePDF({
        title: exportTitle,
        metadata: { Source: exportTitle, Format: 'PDF', Rows: exportData.length, Type: source.type },
        data: exportData,
        columns,
        sourceName: source.name
      });
    } else {
      exportResult = await exportService.generateExcel({
        title: exportTitle,
        metadata: { Source: exportTitle, Format: format.toUpperCase(), Type: source.type },
        data: exportData,
        columns,
        sourceName: source.name
      });
    }

    const result = await pool.query(
      'INSERT INTO data_exports (user_id, report_id, format, file_path, file_size, row_count, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, null, format, exportResult.fileName, exportResult.fileSize, exportData.length, 'completed']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating export:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download export
router.get('/exports/:id/download', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM data_exports WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Export not found' });
    }

    const exportRecord = result.rows[0];
    const filePath = exportService.getFilePath(exportRecord.file_path);

    const fs = await import('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Export file not found on disk' });
    }

    res.download(filePath, exportRecord.file_path);
  } catch (error) {
    console.error('Error downloading export:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CSV EXPORT (any entity) ====================
router.get('/export-csv/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const tableMap = {
      'data-sources': 'data_sources',
      'dashboards': 'dashboards',
      'reports': 'reports',
      'insights': 'ai_insights',
      'queries': 'queries',
      'alerts': 'alerts',
      'predictions': 'predictions',
      'anomalies': 'anomalies',
      'exports': 'data_exports',
      'jobs': 'scheduled_jobs',
      'integrations': 'integrations',
      'query-optimizations': 'query_optimizations',
      'log-entries': 'log_entries',
      'log-analysis': 'log_analysis',
      'data-quality': 'data_quality_scores',
      'narratives': 'insight_narratives',
    };

    const tableName = tableMap[entityType];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity type' });

    const result = await pool.query(
      `SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY id DESC`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    const headers = Object.keys(result.rows[0]);
    const csvRows = [headers.join(',')];

    result.rows.forEach(row => {
      const values = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entityType}-export.csv"`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== PDF EXPORT (any entity) ====================
router.get('/export-pdf/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const tableMap = {
      'data-sources': 'data_sources',
      'dashboards': 'dashboards',
      'reports': 'reports',
      'insights': 'ai_insights',
      'queries': 'queries',
      'alerts': 'alerts',
      'predictions': 'predictions',
      'anomalies': 'anomalies',
      'jobs': 'scheduled_jobs',
      'integrations': 'integrations',
    };

    const tableName = tableMap[entityType];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity type' });

    const result = await pool.query(
      `SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY id DESC LIMIT 100`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    const columns = Object.keys(result.rows[0]).filter(k => !['user_id', 'password'].includes(k));

    const exportResult = await exportService.generatePDF({
      title: `${entityType} Export`,
      metadata: { Type: entityType, Rows: result.rows.length, Date: new Date().toISOString() },
      data: result.rows,
      columns,
      sourceName: entityType,
    });

    res.json({ fileName: exportResult.fileName, fileSize: exportResult.fileSize });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== BULK DELETE ====================
router.post('/bulk-delete/:entityType', requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { entityType } = req.params;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const tableMap = {
      'data-sources': 'data_sources',
      'dashboards': 'dashboards',
      'reports': 'reports',
      'insights': 'ai_insights',
      'queries': 'queries',
      'alerts': 'alerts',
      'predictions': 'predictions',
      'anomalies': 'anomalies',
      'exports': 'data_exports',
      'jobs': 'scheduled_jobs',
      'integrations': 'integrations',
      'query-optimizations': 'query_optimizations',
      'log-entries': 'log_entries',
      'log-analysis': 'log_analysis',
      'data-quality': 'data_quality_scores',
      'narratives': 'insight_narratives',
    };

    const tableName = tableMap[entityType];
    if (!tableName) return res.status(400).json({ error: 'Invalid entity type' });

    const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
    const result = await pool.query(
      `DELETE FROM ${tableName} WHERE user_id = $1 AND id IN (${placeholders}) RETURNING id`,
      [req.user.id, ...ids]
    );

    cacheService.invalidateUser(req.user.id);
    res.json({ success: true, deleted: result.rows.length });
  } catch (error) {
    console.error('Error bulk deleting:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== BULK UPDATE ====================
router.post('/bulk-update/:entityType', requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { entityType } = req.params;
    const { ids, updates } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const tableMap = {
      'data-sources': { table: 'data_sources', allowed: ['name', 'type', 'status', 'description'] },
      'dashboards': { table: 'dashboards', allowed: ['name', 'description', 'is_public'] },
      'reports': { table: 'reports', allowed: ['name', 'type', 'status', 'description', 'schedule'] },
      'insights': { table: 'ai_insights', allowed: ['status'] },
      'alerts': { table: 'alerts', allowed: ['name', 'condition', 'threshold', 'frequency', 'is_active'] },
      'jobs': { table: 'scheduled_jobs', allowed: ['status', 'cron_expression'] },
      'integrations': { table: 'integrations', allowed: ['status', 'sync_frequency'] },
      'anomalies': { table: 'anomalies', allowed: ['is_resolved', 'severity'] },
    };

    const config = tableMap[entityType];
    if (!config) return res.status(400).json({ error: 'Invalid entity type for bulk update' });

    const setClauses = [];
    const values = [req.user.id];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(updates)) {
      if (config.allowed.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const placeholders = ids.map((_, i) => `$${paramIndex + i}`).join(', ');
    values.push(...ids);

    const result = await pool.query(
      `UPDATE ${config.table} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE user_id = $1 AND id IN (${placeholders}) RETURNING *`,
      values
    );

    cacheService.invalidateUser(req.user.id);
    res.json({ success: true, updated: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('Error bulk updating:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== SCHEDULED JOBS ====================
router.get('/jobs', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'job_name', 'status', 'job_type']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (job_name ILIKE $2 OR job_type ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM scheduled_jobs WHERE user_id = $1',
      'SELECT * FROM scheduled_jobs WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scheduled_jobs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/jobs', async (req, res) => {
  try {
    const { job_type, job_name, cron_expression, config } = req.body;
    const result = await pool.query(
      'INSERT INTO scheduled_jobs (user_id, job_type, job_name, cron_expression, config) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, job_type, job_name, cron_expression, JSON.stringify(config || {})]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/jobs/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE scheduled_jobs SET status = CASE WHEN status = 'active' THEN 'paused' ELSE 'active' END WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/jobs/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM scheduled_jobs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== TEMPLATES ====================
router.get('/templates', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM templates ORDER BY usage_count DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM templates WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== INTEGRATIONS ====================
router.get('/integrations', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'service_name', 'service_type', 'status']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (service_name ILIKE $2 OR service_type ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM integrations WHERE user_id = $1',
      'SELECT * FROM integrations WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/integrations/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM integrations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching integration:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/integrations', async (req, res) => {
  try {
    const { service_name, service_type, credentials, sync_frequency } = req.body;
    const result = await pool.query(
      'INSERT INTO integrations (user_id, service_name, service_type, credentials, sync_frequency) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, service_name, service_type, JSON.stringify(credentials || {}), sync_frequency || 'daily']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating integration:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/integrations/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM integrations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting integration:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ACTIVITY LOG ====================
router.get('/activity', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== AI CHAT ====================
router.post('/ai/chat', async (req, res) => {
  try {
    const { message, context, history } = req.body;
    const response = await aiService.chatWithData(message, context, history || []);
    res.json({ response });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/ai/generate-report', async (req, res) => {
  try {
    const { data, report_type, preferences } = req.body;
    const report = await aiService.generateReport(data, report_type, preferences);
    res.json({ report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/ai/optimizations', async (req, res) => {
  try {
    const { current_state, goals } = req.body;
    const optimizations = await aiService.suggestOptimizations(current_state, goals);
    res.json(optimizations);
  } catch (error) {
    console.error('Error getting optimizations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/ai/summarize', async (req, res) => {
  try {
    const { data, format } = req.body;
    const summary = await aiService.summarizeData(data, format);
    res.json({ summary });
  } catch (error) {
    console.error('Error summarizing data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DASHBOARD SHARING ====================
router.post('/dashboards/:id/share', async (req, res) => {
  try {
    const shareToken = crypto.randomBytes(32).toString('hex');
    const result = await pool.query(
      'UPDATE dashboards SET share_token = $1, is_public = true WHERE id = $2 AND user_id = $3 RETURNING *',
      [shareToken, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({ shareToken, shareUrl: `/public/dashboard/${shareToken}`, dashboard: result.rows[0] });
  } catch (error) {
    console.error('Error sharing dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/dashboards/:id/share', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE dashboards SET share_token = NULL, is_public = false WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({ success: true, dashboard: result.rows[0] });
  } catch (error) {
    console.error('Error unsharing dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CACHE STATS ====================
router.get('/cache/stats', async (req, res) => {
  try {
    res.json(cacheService.getStats());
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== STATS ====================
router.get('/stats', async (req, res) => {
  try {
    const [dataSources, dashboards, reports, insights, alerts, anomalies, queryOptimizations, logAnalysis, dataQuality] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM data_sources WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) FROM dashboards WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) FROM reports WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) FROM ai_insights WHERE user_id = $1 AND status = $2', [req.user.id, 'new']),
      pool.query('SELECT COUNT(*) FROM alerts WHERE user_id = $1 AND is_active = true', [req.user.id]),
      pool.query('SELECT COUNT(*) FROM anomalies WHERE user_id = $1 AND is_resolved = false', [req.user.id]),
      pool.query('SELECT COUNT(*) FROM query_optimizations WHERE user_id = $1', [req.user.id]).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COUNT(*) FROM log_analysis WHERE user_id = $1', [req.user.id]).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COUNT(*) FROM data_quality_scores WHERE user_id = $1', [req.user.id]).catch(() => ({ rows: [{ count: 0 }] }))
    ]);

    res.json({
      dataSources: parseInt(dataSources.rows[0].count),
      dashboards: parseInt(dashboards.rows[0].count),
      reports: parseInt(reports.rows[0].count),
      newInsights: parseInt(insights.rows[0].count),
      activeAlerts: parseInt(alerts.rows[0].count),
      unresolvedAnomalies: parseInt(anomalies.rows[0].count),
      queryOptimizations: parseInt(queryOptimizations.rows[0].count),
      logAnalysis: parseInt(logAnalysis.rows[0].count),
      dataQualityScores: parseInt(dataQuality.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== QUERY OPTIMIZER ====================
router.get('/query-optimizations', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'optimization_type', 'improvement_percentage']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (original_query ILIKE $2 OR optimization_type ILIKE $2 OR ai_analysis ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM query_optimizations WHERE user_id = $1',
      'SELECT * FROM query_optimizations WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching query optimizations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/query-optimizations/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM query_optimizations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Query optimization not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching query optimization:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/query-optimizations', async (req, res) => {
  try {
    const { original_query, schema, performance_context } = req.body;

    const optimization = await aiService.optimizeQuery(original_query, schema || 'Default schema', performance_context || {});

    const result = await pool.query(
      `INSERT INTO query_optimizations (user_id, original_query, optimized_query, optimization_type, improvement_percentage, suggestions, index_recommendations, ai_analysis, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed') RETURNING *`,
      [
        req.user.id,
        original_query,
        optimization.optimized_query,
        optimization.optimization_type,
        optimization.improvement_percentage,
        JSON.stringify(optimization.suggestions),
        JSON.stringify(optimization.index_recommendations),
        optimization.explanation
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating query optimization:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/query-optimizations/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM query_optimizations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting query optimization:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== LOG ANALYZER ====================
router.get('/log-entries', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'source', 'level', 'ai_severity']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (source ILIKE $2 OR message ILIKE $2 OR level ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM log_entries WHERE user_id = $1',
      'SELECT * FROM log_entries WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching log entries:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/log-entries/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM log_entries WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching log entry:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/log-entries', async (req, res) => {
  try {
    const { source, level, message, timestamp, metadata, stack_trace } = req.body;

    const classification = await aiService.classifyLogEntry({ source, level, message, metadata, stack_trace });

    const result = await pool.query(
      `INSERT INTO log_entries (user_id, source, level, message, timestamp, metadata, stack_trace, analyzed, ai_classification, ai_severity, ai_root_cause, ai_solution)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11) RETURNING *`,
      [
        req.user.id,
        source,
        level,
        message,
        timestamp || new Date(),
        JSON.stringify(metadata || {}),
        stack_trace,
        classification.classification,
        classification.severity,
        classification.root_cause,
        classification.solution
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating log entry:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/log-entries/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM log_entries WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting log entry:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/log-analysis', async (req, res) => {
  try {
    const pg = buildPaginatedQuery('', req, ['created_at', 'analysis_name', 'severity', 'log_count']);
    const params = [req.user.id];
    let searchClause = '';

    if (pg.search) {
      searchClause = ` AND (analysis_name ILIKE $2 OR summary ILIKE $2)`;
      params.push(`%${pg.search}%`);
    }

    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM log_analysis WHERE user_id = $1',
      'SELECT * FROM log_analysis WHERE user_id = $1',
      params,
      pg,
      searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching log analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/log-analysis/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM log_analysis WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log analysis not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching log analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/log-analysis', async (req, res) => {
  try {
    const { analysis_name, logs, context } = req.body;

    let logsToAnalyze = logs;
    if (!logsToAnalyze) {
      const logsResult = await pool.query(
        'SELECT * FROM log_entries WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 100',
        [req.user.id]
      );
      logsToAnalyze = logsResult.rows;
    }

    const analysis = await aiService.analyzeLogs(logsToAnalyze, context || {});

    const errorCount = logsToAnalyze.filter(l => l.level === 'error' || l.level === 'ERROR').length;
    const warningCount = logsToAnalyze.filter(l => l.level === 'warning' || l.level === 'WARN').length;

    const result = await pool.query(
      `INSERT INTO log_analysis (user_id, analysis_name, log_count, error_count, warning_count, patterns_detected, root_causes, recommendations, summary, severity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed') RETURNING *`,
      [
        req.user.id,
        analysis_name || 'Log Analysis ' + new Date().toISOString(),
        logsToAnalyze.length,
        errorCount,
        warningCount,
        JSON.stringify(analysis.patterns_detected),
        JSON.stringify(analysis.root_causes),
        JSON.stringify(analysis.recommendations),
        analysis.summary,
        analysis.severity
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating log analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/log-analysis/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM log_analysis WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting log analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DASHBOARD GENERATOR ====================
router.get('/dashboard-configs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboard_configs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching dashboard configs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/dashboard-configs/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboard_configs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard config not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching dashboard config:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/dashboard-configs/generate', async (req, res) => {
  try {
    const { requirements, user_role } = req.body;

    const dataSourcesResult = await pool.query(
      'SELECT * FROM data_sources WHERE user_id = $1',
      [req.user.id]
    );

    const layout = await aiService.generateDashboardLayout(
      requirements,
      dataSourcesResult.rows,
      user_role || 'analyst'
    );

    const dashboardResult = await pool.query(
      'INSERT INTO dashboards (user_id, name, description, layout) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, 'AI Generated Dashboard', requirements, JSON.stringify(layout.layout_config)]
    );

    const result = await pool.query(
      `INSERT INTO dashboard_configs (user_id, dashboard_id, ai_generated, prompt, layout_config, widgets, color_scheme, data_sources, ai_suggestions)
       VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id,
        dashboardResult.rows[0].id,
        requirements,
        JSON.stringify(layout.layout_config),
        JSON.stringify(layout.widgets),
        layout.color_scheme,
        JSON.stringify(layout.kpi_cards),
        JSON.stringify(layout.ai_suggestions)
      ]
    );

    res.status(201).json({ ...result.rows[0], dashboard: dashboardResult.rows[0] });
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/dashboard-configs/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM dashboard_configs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting dashboard config:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DATA QUALITY SCORER ====================
router.get('/data-quality', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT dqs.*, ds.name as data_source_name
       FROM data_quality_scores dqs
       LEFT JOIN data_sources ds ON dqs.data_source_id = ds.id
       WHERE dqs.user_id = $1
       ORDER BY dqs.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data quality scores:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/data-quality/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT dqs.*, ds.name as data_source_name
       FROM data_quality_scores dqs
       LEFT JOIN data_sources ds ON dqs.data_source_id = ds.id
       WHERE dqs.id = $1 AND dqs.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data quality score not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching data quality score:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/data-quality/analyze', async (req, res) => {
  try {
    const { data_source_id, sample_data, context } = req.body;

    let dataToAnalyze = sample_data;
    let schemaInfo = {};
    let sourceId = data_source_id;

    if (data_source_id && !sample_data) {
      const sourceResult = await pool.query(
        'SELECT * FROM data_sources WHERE id = $1 AND user_id = $2',
        [data_source_id, req.user.id]
      );

      if (sourceResult.rows.length > 0) {
        const source = sourceResult.rows[0];
        try {
          const tableData = await pool.query(
            `SELECT * FROM "${source.connection_string}" LIMIT 100`
          );
          dataToAnalyze = tableData.rows;

          const colResult = await pool.query(`
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_name = $1
          `, [source.connection_string]);
          schemaInfo = colResult.rows;
        } catch (e) {
          dataToAnalyze = [source];
          schemaInfo = { type: 'metadata' };
        }
      }
    }

    const quality = await aiService.scoreDataQuality(dataToAnalyze || [], schemaInfo, context || 'General data quality assessment');

    const result = await pool.query(
      `INSERT INTO data_quality_scores
       (user_id, data_source_id, overall_score, completeness_score, accuracy_score, consistency_score, timeliness_score, uniqueness_score, validity_score, issues_found, recommendations, ai_analysis, records_analyzed, columns_analyzed, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'completed') RETURNING *`,
      [
        req.user.id,
        sourceId,
        quality.overall_score,
        quality.completeness_score,
        quality.accuracy_score,
        quality.consistency_score,
        quality.timeliness_score,
        quality.uniqueness_score,
        quality.validity_score,
        JSON.stringify(quality.issues_found),
        JSON.stringify(quality.recommendations),
        quality.analysis,
        dataToAnalyze?.length || 0,
        Object.keys(dataToAnalyze?.[0] || {}).length
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error analyzing data quality:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/data-quality/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM data_quality_scores WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting data quality score:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== INSIGHT NARRATOR ====================
router.get('/narratives', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, i.title as insight_title
       FROM insight_narratives n
       LEFT JOIN ai_insights i ON n.insight_id = i.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching narratives:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/narratives/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, i.title as insight_title, i.content as insight_content
       FROM insight_narratives n
       LEFT JOIN ai_insights i ON n.insight_id = i.id
       WHERE n.id = $1 AND n.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Narrative not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching narrative:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/narratives/generate', async (req, res) => {
  try {
    const { insight_id, insight_data, audience, tone, format_type } = req.body;

    let insight = insight_data;
    let insightIdToUse = insight_id;

    if (insight_id && !insight_data) {
      const insightResult = await pool.query(
        'SELECT * FROM ai_insights WHERE id = $1 AND user_id = $2',
        [insight_id, req.user.id]
      );
      if (insightResult.rows.length > 0) {
        insight = insightResult.rows[0];
      }
    }

    const narrative = await aiService.generateNarrative(
      insight || { title: 'General Insight', content: 'No specific insight provided' },
      audience || 'general',
      tone || 'professional',
      format_type || 'executive_summary'
    );

    const result = await pool.query(
      `INSERT INTO insight_narratives
       (user_id, insight_id, narrative_type, title, executive_summary, detailed_analysis, key_findings, action_items, visualizations, audience, tone, word_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        req.user.id,
        insightIdToUse,
        format_type || 'executive_summary',
        narrative.title,
        narrative.executive_summary,
        narrative.detailed_analysis,
        JSON.stringify(narrative.key_findings),
        JSON.stringify(narrative.action_items),
        JSON.stringify(narrative.visualizations),
        audience || 'general',
        tone || 'professional',
        narrative.detailed_analysis?.split(' ').length || 0
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error generating narrative:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/narratives/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM insight_narratives WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting narrative:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== UPDATE ROUTES ====================
router.put('/data-sources/:id', async (req, res) => {
  try {
    const { name, type, connection_string, description, status } = req.body;
    const result = await pool.query(
      `UPDATE data_sources SET name = COALESCE($1, name), type = COALESCE($2, type), connection_string = COALESCE($3, connection_string), description = COALESCE($4, description), status = COALESCE($5, status), updated_at = NOW() WHERE id = $6 AND user_id = $7 RETURNING *`,
      [name, type, connection_string, description, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    cacheService.invalidateUser(req.user.id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating data source:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/dashboards/:id', async (req, res) => {
  try {
    const { name, description, is_public, layout } = req.body;
    const result = await pool.query(
      `UPDATE dashboards SET name = COALESCE($1, name), description = COALESCE($2, description), is_public = COALESCE($3, is_public), layout = COALESCE($4, layout), updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, description, is_public, layout ? JSON.stringify(layout) : null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/reports/:id', async (req, res) => {
  try {
    const { name, type, query, description, schedule } = req.body;
    const result = await pool.query(
      `UPDATE reports SET name = COALESCE($1, name), type = COALESCE($2, type), query = COALESCE($3, query), description = COALESCE($4, description), schedule = COALESCE($5, schedule), updated_at = NOW() WHERE id = $6 AND user_id = $7 RETURNING *`,
      [name, type, query, description, schedule, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/alerts/:id', async (req, res) => {
  try {
    const { name, condition, threshold, frequency, notification_channels } = req.body;
    const result = await pool.query(
      `UPDATE alerts SET name = COALESCE($1, name), condition = COALESCE($2, condition), threshold = COALESCE($3, threshold), frequency = COALESCE($4, frequency), notification_channels = COALESCE($5, notification_channels), updated_at = NOW() WHERE id = $6 AND user_id = $7 RETURNING *`,
      [name, condition, threshold, frequency, notification_channels ? JSON.stringify(notification_channels) : null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/jobs/:id', async (req, res) => {
  try {
    const { job_type, job_name, cron_expression, config, status } = req.body;
    const result = await pool.query(
      `UPDATE scheduled_jobs SET job_type = COALESCE($1, job_type), job_name = COALESCE($2, job_name), cron_expression = COALESCE($3, cron_expression), config = COALESCE($4, config), status = COALESCE($5, status), updated_at = NOW() WHERE id = $6 AND user_id = $7 RETURNING *`,
      [job_type, job_name, cron_expression, config ? JSON.stringify(config) : null, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/integrations/:id', async (req, res) => {
  try {
    const { service_name, service_type, credentials, sync_frequency, status } = req.body;
    const result = await pool.query(
      `UPDATE integrations SET service_name = COALESCE($1, service_name), service_type = COALESCE($2, service_type), credentials = COALESCE($3, credentials), sync_frequency = COALESCE($4, sync_frequency), status = COALESCE($5, status), updated_at = NOW() WHERE id = $6 AND user_id = $7 RETURNING *`,
      [service_name, service_type, credentials ? JSON.stringify(credentials) : null, sync_frequency, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating integration:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/insights/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ai_insights WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting insight:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/queries/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM queries WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/predictions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM predictions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/anomalies/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM anomalies WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting anomaly:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/exports/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM data_exports WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting export:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DATA PIPELINE BUILDER ====================

// List pipelines
router.get('/pipelines', async (req, res) => {
  try {
    const pagination = buildPaginatedQuery('', req, ['created_at', 'name', 'status', 'last_run']);
    const searchClause = pagination.search ? ` AND (name ILIKE $2 OR description ILIKE $2)` : '';
    const params = pagination.search ? [req.user.id, `%${pagination.search}%`] : [req.user.id];
    const result = await paginatedResponse(
      res,
      'SELECT COUNT(*) FROM data_pipelines WHERE user_id = $1' ,
      'SELECT * FROM data_pipelines WHERE user_id = $1',
      params, pagination, searchClause
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single pipeline
router.get('/pipelines/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM data_pipelines WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pipeline not found' });
    // Also get recent runs
    const runs = await pool.query('SELECT * FROM pipeline_runs WHERE pipeline_id = $1 ORDER BY created_at DESC LIMIT 10', [req.params.id]);
    res.json({ ...result.rows[0], recent_runs: runs.rows });
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// AI-generate a pipeline design
router.post('/pipelines/generate', async (req, res) => {
  try {
    const { requirements, destination, constraints } = req.body;
    if (!requirements) return res.status(400).json({ error: 'Requirements are required' });

    const cacheKey = cacheService.generateKey('pipeline', req.user.id, { requirements, destination });
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    // Get user's data sources for context
    const sources = await pool.query('SELECT id, name, type, status, record_count FROM data_sources WHERE user_id = $1', [req.user.id]);

    const aiResult = await aiService.generatePipelineDesign(
      requirements,
      sources.rows,
      destination || 'database',
      constraints || {}
    );

    // Save to database
    const result = await pool.query(
      `INSERT INTO data_pipelines (user_id, name, description, steps, source_config, destination_config, error_handling, ai_suggestions, schedule, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft') RETURNING *`,
      [
        req.user.id,
        aiResult.name || 'AI-Generated Pipeline',
        aiResult.description || '',
        JSON.stringify(aiResult.steps || []),
        JSON.stringify(aiResult.source_config || {}),
        JSON.stringify(aiResult.destination_config || {}),
        JSON.stringify(aiResult.error_handling || {}),
        JSON.stringify(aiResult.ai_suggestions || []),
        aiResult.schedule_recommendation || null
      ]
    );

    const response = {
      ...result.rows[0],
      ai_design: aiResult
    };

    cacheService.set(cacheKey, response, 600);
    res.json(response);
  } catch (error) {
    console.error('Error generating pipeline:', error);
    res.status(500).json({ error: 'Failed to generate pipeline design' });
  }
});

// Create pipeline manually
router.post('/pipelines', async (req, res) => {
  try {
    const { name, description, steps, source_config, destination_config, error_handling, schedule, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Pipeline name is required' });

    const result = await pool.query(
      `INSERT INTO data_pipelines (user_id, name, description, steps, source_config, destination_config, error_handling, schedule, tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft') RETURNING *`,
      [
        req.user.id, name, description || '',
        JSON.stringify(steps || []),
        JSON.stringify(source_config || {}),
        JSON.stringify(destination_config || {}),
        JSON.stringify(error_handling || {}),
        schedule || null,
        JSON.stringify(tags || [])
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pipeline:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update pipeline
router.put('/pipelines/:id', async (req, res) => {
  try {
    const { name, description, steps, source_config, destination_config, error_handling, schedule, tags, status } = req.body;
    const result = await pool.query(
      `UPDATE data_pipelines SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        steps = COALESCE($3, steps),
        source_config = COALESCE($4, source_config),
        destination_config = COALESCE($5, destination_config),
        error_handling = COALESCE($6, error_handling),
        schedule = COALESCE($7, schedule),
        tags = COALESCE($8, tags),
        status = COALESCE($9, status),
        updated_at = NOW()
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [
        name, description,
        steps ? JSON.stringify(steps) : null,
        source_config ? JSON.stringify(source_config) : null,
        destination_config ? JSON.stringify(destination_config) : null,
        error_handling ? JSON.stringify(error_handling) : null,
        schedule,
        tags ? JSON.stringify(tags) : null,
        status,
        req.params.id, req.user.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pipeline not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Simulate a pipeline run
router.post('/pipelines/:id/run', async (req, res) => {
  try {
    const pipeline = await pool.query('SELECT * FROM data_pipelines WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (pipeline.rows.length === 0) return res.status(404).json({ error: 'Pipeline not found' });

    const p = pipeline.rows[0];
    const steps = typeof p.steps === 'string' ? JSON.parse(p.steps) : (p.steps || []);

    // Simulate step execution
    const stepResults = steps.map((step, i) => ({
      step_id: step.id || `step_${i + 1}`,
      step_name: step.name,
      status: Math.random() > 0.1 ? 'completed' : 'warning',
      records_in: Math.floor(Math.random() * 10000) + 1000,
      records_out: Math.floor(Math.random() * 9000) + 900,
      duration_ms: Math.floor(Math.random() * 5000) + 500,
      started_at: new Date(Date.now() - (steps.length - i) * 3000).toISOString(),
      completed_at: new Date(Date.now() - (steps.length - i - 1) * 3000).toISOString()
    }));

    const totalDuration = stepResults.reduce((sum, s) => sum + s.duration_ms, 0);
    const totalRecords = stepResults[0]?.records_in || 0;
    const failedRecords = Math.floor(totalRecords * 0.02);

    const run = await pool.query(
      `INSERT INTO pipeline_runs (pipeline_id, user_id, status, started_at, completed_at, duration, records_processed, records_failed, step_results)
       VALUES ($1, $2, 'completed', NOW() - INTERVAL '${totalDuration} milliseconds', NOW(), $3, $4, $5, $6) RETURNING *`,
      [req.params.id, req.user.id, totalDuration, totalRecords, failedRecords, JSON.stringify(stepResults)]
    );

    // Update pipeline stats
    await pool.query(
      `UPDATE data_pipelines SET last_run = NOW(), run_count = run_count + 1, status = 'active',
       avg_duration = CASE WHEN avg_duration = 0 THEN $1 ELSE (avg_duration + $1) / 2 END,
       updated_at = NOW() WHERE id = $2`,
      [totalDuration, req.params.id]
    );

    res.json(run.rows[0]);
  } catch (error) {
    console.error('Error running pipeline:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pipeline runs
router.get('/pipelines/:id/runs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pipeline_runs WHERE pipeline_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 50',
      [req.params.id, req.user.id]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching pipeline runs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete pipeline
router.delete('/pipelines/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM data_pipelines WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
