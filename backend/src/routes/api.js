import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import aiService from '../services/aiService.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== DATA SOURCES ====================
router.get('/data-sources', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM data_sources WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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
    const result = await pool.query(
      'INSERT INTO data_sources (user_id, name, type, connection_string, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, name, type, connection_string, description]
    );
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
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting data source:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DASHBOARDS ====================
router.get('/dashboards', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboards WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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
    const result = await pool.query(
      'SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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
    const result = await pool.query(
      'SELECT * FROM ai_insights WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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
    const insight = await aiService.generateInsight(data, context);

    const result = await pool.query(
      'INSERT INTO ai_insights (user_id, title, insight_type, content, confidence, impact, recommendations) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, insight.title, insight.insight_type, insight.content, insight.confidence, insight.impact, JSON.stringify(insight.recommendations)]
    );

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
    const result = await pool.query(
      'SELECT * FROM queries WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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

    // Generate SQL from natural language using AI
    const schema = `Tables: users, data_sources, dashboards, reports, ai_insights, queries, alerts, predictions, anomalies`;
    const generatedSQL = await aiService.generateSQLFromNaturalLanguage(natural_language_query, schema);

    const result = await pool.query(
      'INSERT INTO queries (user_id, natural_language_query, generated_sql, result_summary, execution_time, row_count, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, natural_language_query, generatedSQL, 'Query generated successfully', 100, 0, 'completed']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating query:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ALERTS ====================
router.get('/alerts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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
    const result = await pool.query(
      'SELECT * FROM predictions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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
    const prediction = await aiService.generatePrediction(historical_data, target_metric, period);

    const result = await pool.query(
      'INSERT INTO predictions (user_id, model_type, target_metric, prediction_period, predicted_value, confidence_interval, accuracy, features_used) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, 'ai_generated', target_metric, period, prediction.predictedValue, JSON.stringify(prediction.confidenceInterval), prediction.accuracy, JSON.stringify(prediction.factors)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error generating prediction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ANOMALIES ====================
router.get('/anomalies', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM anomalies WHERE user_id = $1 ORDER BY detected_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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

// ==================== DATA EXPORTS ====================
router.get('/exports', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM data_exports WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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
    const { report_id, format } = req.body;
    const result = await pool.query(
      'INSERT INTO data_exports (user_id, report_id, format, file_path, file_size, row_count, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, report_id, format, `/exports/export_${Date.now()}.${format}`, 0, 0, 'processing']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating export:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== SCHEDULED JOBS ====================
router.get('/jobs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scheduled_jobs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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
    const result = await pool.query(
      'SELECT * FROM integrations WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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

// ==================== AI REPORT GENERATION ====================
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

// ==================== AI OPTIMIZATIONS ====================
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

// ==================== AI SUMMARY ====================
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

// ==================== STATS ====================
router.get('/stats', async (req, res) => {
  try {
    const [dataSources, dashboards, reports, insights, alerts, anomalies] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM data_sources WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) FROM dashboards WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) FROM reports WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) FROM ai_insights WHERE user_id = $1 AND status = $2', [req.user.id, 'new']),
      pool.query('SELECT COUNT(*) FROM alerts WHERE user_id = $1 AND is_active = true', [req.user.id]),
      pool.query('SELECT COUNT(*) FROM anomalies WHERE user_id = $1 AND is_resolved = false', [req.user.id])
    ]);

    res.json({
      dataSources: parseInt(dataSources.rows[0].count),
      dashboards: parseInt(dashboards.rows[0].count),
      reports: parseInt(reports.rows[0].count),
      newInsights: parseInt(insights.rows[0].count),
      activeAlerts: parseInt(alerts.rows[0].count),
      unresolvedAnomalies: parseInt(anomalies.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
