import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateInsight, scoreDataQuality } from '../services/aiService.js';
import cacheService from '../services/cacheService.js';
import crypto from 'crypto';

// Direct OpenRouter call for new endpoints
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// 3-strategy parser: direct → extract+fix → repair-truncation
function parseAIJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    let extracted = text.substring(firstBrace, lastBrace + 1);
    try { return JSON.parse(extracted); } catch {}
    let fixed = extracted
      .replace(/:\s*True\b/g, ': true')
      .replace(/:\s*False\b/g, ': false')
      .replace(/:\s*None\b/g, ': null')
      .replace(/'/g, '"');
    try { return JSON.parse(fixed); } catch {}
    try {
      let repaired = fixed.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/, '').replace(/,\s*$/, '');
      const opens = (repaired.match(/\{/g) || []).length;
      const closes = (repaired.match(/\}/g) || []).length;
      const openBrk = (repaired.match(/\[/g) || []).length;
      const closeBrk = (repaired.match(/\]/g) || []).length;
      for (let i = 0; i < openBrk - closeBrk; i++) repaired += ']';
      for (let i = 0; i < opens - closes; i++) repaired += '}';
      return JSON.parse(repaired);
    } catch {}
  }
  return null;
}

class NoKeyError extends Error {
  constructor() { super('AI not configured: OPENROUTER_API_KEY missing'); this.statusCode = 503; }
}

async function callAI(messages) {
  if (!OPENROUTER_API_KEY) throw new NoKeyError();
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Data Analyst'
    },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages, max_tokens: 4096, temperature: 0.7 })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${err}`);
  }
  const data = await response.json();
  const text = data.choices[0].message.content;
  const parsed = parseAIJson(text);
  return parsed !== null ? parsed : { raw: text };
}

// Persistent cache helper backed by ai_results JSONB table.
// Falls back gracefully if table is unavailable.
async function getOrCreateAiResultsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        feature TEXT NOT NULL,
        cache_key TEXT NOT NULL,
        result JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, feature, cache_key)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ai_results_lookup ON ai_results (user_id, feature, cache_key)`);
  } catch (err) {
    console.error('[ai_results] init error:', err.message);
  }
}
getOrCreateAiResultsTable();

async function getCachedDb(userId, feature, payload) {
  try {
    const key = crypto.createHash('md5').update(JSON.stringify(payload || {})).digest('hex');
    const r = await pool.query(
      `SELECT result FROM ai_results WHERE user_id = $1 AND feature = $2 AND cache_key = $3 AND expires_at > NOW() LIMIT 1`,
      [userId || 0, feature, key]
    );
    return r.rows.length ? r.rows[0].result : null;
  } catch { return null; }
}
async function setCachedDb(userId, feature, payload, result, ttlSeconds = 1800) {
  try {
    const key = crypto.createHash('md5').update(JSON.stringify(payload || {})).digest('hex');
    await pool.query(
      `INSERT INTO ai_results (user_id, feature, cache_key, result, expires_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW() + ($5 || ' seconds')::interval)
       ON CONFLICT (user_id, feature, cache_key)
       DO UPDATE SET result = EXCLUDED.result, expires_at = EXCLUDED.expires_at, created_at = NOW()`,
      [userId || 0, feature, key, JSON.stringify(result), String(ttlSeconds)]
    );
  } catch {}
}

const router = Router();
router.use(authenticateToken);

// ==================== NEW AI FEATURE 1: Cohort Comparison ====================
// POST /api/ai/cohort-comparison
// Compare metrics across user-defined cohorts with AI statistical analysis.
router.post('/cohort-comparison', async (req, res) => {
  try {
    const { cohorts, metric, context } = req.body;

    if (!cohorts || !Array.isArray(cohorts) || cohorts.length < 2) {
      return res.status(400).json({ error: 'cohorts must be an array with at least 2 entries' });
    }
    if (!metric || typeof metric !== 'string') {
      return res.status(400).json({ error: 'metric is required' });
    }

    const cacheKey = `user:${req.user.id}:cohort:${crypto.createHash('md5').update(JSON.stringify({ cohorts, metric })).digest('hex')}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const result = await callAI([
      {
        role: 'system',
        content: `You are an expert statistician and data analyst specializing in cohort analysis.
Compare the provided cohorts on the specified metric and deliver a comprehensive statistical analysis.

Format your response as JSON with fields:
- summary: plain text executive summary (2-3 sentences)
- winner: name of the best-performing cohort
- statistical_significance: one of (high/medium/low/insufficient_data)
- cohort_results: array of {name, mean, median, std_dev, sample_size, percentile_25, percentile_75, trend}
- comparison_matrix: array of {cohort_a, cohort_b, difference, percentage_difference, significance}
- key_findings: array of short finding strings
- recommendations: array of {title, description, priority (1-5), target_cohort}
- visualizations: array of recommended chart types (e.g. "box_plot", "bar_chart")
- assumptions: array of statistical assumptions made

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `Compare these cohorts on the metric "${metric}":\n\nCohorts: ${JSON.stringify(cohorts)}\n\nContext: ${context || 'General business analysis'}`
      }
    ]);

    cacheService.set(cacheKey, result, 900);
    await setCachedDb(req.user.id, 'cohort-comparison', { cohorts, metric }, result, 900);
    res.json(result);
  } catch (err) {
    console.error('[cohort-comparison] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW AI FEATURE 2: Schema Advisor ====================
// POST /api/ai/schema-advisor
// Analyze table schema, detect drift, suggest normalization improvements.
router.post('/schema-advisor', async (req, res) => {
  try {
    const { data_source_id, schema_definition, table_name } = req.body;

    let schemaInfo = schema_definition;

    // If data_source_id provided, fetch source metadata
    if (data_source_id && !schemaInfo) {
      const dsResult = await pool.query(
        'SELECT * FROM data_sources WHERE id = $1 AND user_id = $2',
        [data_source_id, req.user.id]
      );
      if (dsResult.rows.length === 0) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      schemaInfo = JSON.stringify(dsResult.rows[0]);
    }

    if (!schemaInfo) {
      return res.status(400).json({ error: 'schema_definition or data_source_id is required' });
    }

    const cacheKey = `user:${req.user.id}:schema-advisor:${crypto.createHash('md5').update(JSON.stringify({ schemaInfo, table_name })).digest('hex')}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const result = await callAI([
      {
        role: 'system',
        content: `You are an expert database architect specializing in schema design, normalization, and schema drift detection.

Analyze the provided schema and return a comprehensive advisory report.

Format your response as JSON with fields:
- overall_health: one of (excellent/good/fair/poor)
- health_score: number 0-100
- normalization_form: current normalization level (1NF/2NF/3NF/BCNF/not_normalized)
- drift_indicators: array of {field, issue, severity (critical/high/medium/low), description}
- normalization_issues: array of {table, issue_type, affected_columns, recommendation, example_fix}
- redundancy_detected: array of {columns, description, impact}
- index_opportunities: array of {columns, reason, expected_improvement}
- naming_convention_issues: array of {field, current, suggested, reason}
- recommendations: array of {title, description, priority (1-5), effort (low/medium/high), category (normalization/performance/naming/constraints/indexing)}
- suggested_schema: plain text SQL DDL for the improved schema
- migration_notes: array of short strings about migration considerations

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `Analyze this schema${table_name ? ` for table "${table_name}"` : ''}:\n\n${typeof schemaInfo === 'string' ? schemaInfo : JSON.stringify(schemaInfo, null, 2)}`
      }
    ]);

    cacheService.set(cacheKey, result, 1800);
    await setCachedDb(req.user.id, 'schema-advisor', { schemaInfo, table_name }, result, 1800);
    res.json(result);
  } catch (err) {
    console.error('[schema-advisor] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW AI FEATURE 3: Data Governance ====================
// POST /api/ai/data-governance
// Scan user data sources, identify potential PII fields, suggest masking strategies.
router.post('/data-governance', async (req, res) => {
  try {
    const { data_source_ids, scan_depth } = req.body;

    // Fetch user's data sources
    let query = 'SELECT id, name, type, description, status, record_count FROM data_sources WHERE user_id = $1';
    const params = [req.user.id];

    if (data_source_ids && Array.isArray(data_source_ids) && data_source_ids.length > 0) {
      query += ` AND id = ANY($2::int[])`;
      params.push(data_source_ids);
    }
    query += ' ORDER BY created_at DESC LIMIT 20';

    const dsResult = await pool.query(query, params);
    if (dsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No data sources found' });
    }

    const cacheKey = `user:${req.user.id}:data-governance:${crypto.createHash('md5').update(JSON.stringify({ ids: dsResult.rows.map(r => r.id), scan_depth })).digest('hex')}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const result = await callAI([
      {
        role: 'system',
        content: `You are a data governance and privacy expert specializing in PII detection, data classification, and regulatory compliance (GDPR, CCPA, HIPAA).

Scan the provided data sources to identify potential PII fields and recommend governance strategies.

Format your response as JSON with fields:
- governance_score: overall data governance score 0-100
- risk_level: one of (critical/high/medium/low)
- pii_fields_detected: array of {data_source, field_name, pii_type (name/email/phone/ssn/dob/address/ip/financial/health/biometric/other), confidence (0-100), risk_level, notes}
- sensitive_data_categories: array of {category, count, regulation_relevance (GDPR/CCPA/HIPAA/PCI-DSS/multiple/none)}
- masking_strategies: array of {pii_type, strategy (hash/tokenize/redact/pseudonymize/encrypt/generalize), implementation_notes, use_case}
- compliance_gaps: array of {regulation, gap, severity, remediation}
- data_retention_recommendations: array of {data_source, current_retention, recommended_retention, reason}
- access_control_recommendations: array of {resource, current_access, recommended_access, justification}
- immediate_actions: array of short urgent action strings
- long_term_roadmap: array of {action, timeline, priority (1-5), effort (low/medium/high)}

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `Perform a data governance scan on these ${scan_depth === 'deep' ? 'deep' : 'standard'} data sources:\n\n${JSON.stringify(dsResult.rows, null, 2)}`
      }
    ]);

    cacheService.set(cacheKey, result, 1800);
    await setCachedDb(req.user.id, 'data-governance', { ids: dsResult.rows.map(r => r.id), scan_depth }, { ...result, scanned_sources: dsResult.rows.length }, 1800);
    res.json({ ...result, scanned_sources: dsResult.rows.length });
  } catch (err) {
    console.error('[data-governance] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW AI FEATURE 4: Multi-Source Merge ====================
// POST /api/ai/multi-source-merge
// Accept two dataset IDs, use AI to suggest join columns and merge strategy.
router.post('/multi-source-merge', async (req, res) => {
  try {
    const { source_id_a, source_id_b, merge_goal } = req.body;

    if (!source_id_a || !source_id_b) {
      return res.status(400).json({ error: 'source_id_a and source_id_b are required' });
    }
    if (source_id_a === source_id_b) {
      return res.status(400).json({ error: 'source_id_a and source_id_b must be different' });
    }

    const [resultA, resultB] = await Promise.all([
      pool.query('SELECT * FROM data_sources WHERE id = $1 AND user_id = $2', [source_id_a, req.user.id]),
      pool.query('SELECT * FROM data_sources WHERE id = $1 AND user_id = $2', [source_id_b, req.user.id])
    ]);

    if (resultA.rows.length === 0) return res.status(404).json({ error: 'Data source A not found' });
    if (resultB.rows.length === 0) return res.status(404).json({ error: 'Data source B not found' });

    const sourceA = resultA.rows[0];
    const sourceB = resultB.rows[0];

    const cacheKey = `user:${req.user.id}:multi-merge:${crypto.createHash('md5').update(JSON.stringify({ source_id_a, source_id_b, merge_goal })).digest('hex')}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const result = await callAI([
      {
        role: 'system',
        content: `You are an expert data integration architect. Analyze two data sources and recommend the optimal merge/join strategy.

Format your response as JSON with fields:
- merge_feasibility: one of (high/medium/low/not_recommended)
- recommended_join_type: one of (inner/left/right/full_outer/cross/union)
- join_column_candidates: array of {column_a, column_b, confidence (0-100), data_type_match (exact/compatible/needs_cast), notes}
- primary_join_recommendation: {column_a, column_b, join_type, rationale}
- data_quality_risks: array of {risk, severity (high/medium/low), mitigation}
- merge_strategy: {approach (sql_join/etl_pipeline/api_federation/stream_merge), steps: array of strings, estimated_record_count}
- column_mapping: array of {source_a_column, source_b_column, action (join_key/keep_a/keep_b/merge/rename/drop), output_name}
- deduplication_strategy: {needed (boolean), approach, key_columns}
- sample_sql: SQL query demonstrating the recommended merge
- post_merge_validation: array of short validation check strings
- performance_considerations: array of short performance tip strings

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `Recommend how to merge these two data sources:

Source A (ID: ${sourceA.id}):
${JSON.stringify(sourceA, null, 2)}

Source B (ID: ${sourceB.id}):
${JSON.stringify(sourceB, null, 2)}

Merge Goal: ${merge_goal || 'Combine datasets for unified analysis'}`
      }
    ]);

    cacheService.set(cacheKey, result, 1800);
    await setCachedDb(req.user.id, 'multi-source-merge', { source_id_a, source_id_b, merge_goal }, { ...result, source_a: sourceA, source_b: sourceB }, 1800);
    res.json({ ...result, source_a: sourceA, source_b: sourceB });
  } catch (err) {
    console.error('[multi-source-merge] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW AI FEATURE 5: Auto Alert Rules ====================
// POST /api/ai/auto-alert-rules
// AI suggests anomaly thresholds based on data distribution; persists alert rules.
router.post('/auto-alert-rules', async (req, res) => {
  try {
    const { metric_name, sample_values, business_context, severity_preference } = req.body;

    if (!metric_name || !Array.isArray(sample_values) || sample_values.length === 0) {
      return res.status(400).json({ error: 'metric_name and non-empty sample_values array required' });
    }

    const cached = await getCachedDb(req.user.id, 'auto-alert-rules', { metric_name, sample_values, severity_preference });
    if (cached) return res.json({ ...cached, cached: true });

    const result = await callAI([
      {
        role: 'system',
        content: `You are an SRE / data observability expert. Suggest alert thresholds based on a metric's distribution.
Format your response as JSON with fields:
- metric_summary: { mean, median, std_dev, min, max, p25, p75, p95, p99 }
- distribution_type: one of (normal/skewed_left/skewed_right/bimodal/uniform/exponential/unknown)
- recommended_rules: array of {name, condition (e.g. "value > p99 + 2*std"), threshold_value, severity (info/warning/critical), rationale, expected_trigger_rate_pct}
- baseline_window_recommendation: time window suggestion (e.g. "last 7 days")
- suppression_rules: array of {condition, reason}
- notification_channels: array of {severity, channel}
- false_positive_mitigations: array of strings

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `Metric: ${metric_name}
Severity preference: ${severity_preference || 'balanced'}
Business context: ${business_context || 'general operational metric'}
Sample values (${sample_values.length} points): ${JSON.stringify(sample_values.slice(0, 200))}`
      }
    ]);

    // Persist auto-suggested rules into the alerts table for later use
    if (result.recommended_rules && Array.isArray(result.recommended_rules)) {
      for (const rule of result.recommended_rules.slice(0, 5)) {
        try {
          await pool.query(
            `INSERT INTO alerts (user_id, name, condition, threshold, frequency, notification_channels, is_active)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
            [
              req.user.id,
              `[AI] ${rule.name || metric_name}`,
              rule.condition || `${metric_name} threshold`,
              parseFloat(rule.threshold_value) || 0,
              'hourly',
              JSON.stringify(['email']),
              false  // require manual activation
            ]
          );
        } catch {}
      }
    }

    await setCachedDb(req.user.id, 'auto-alert-rules', { metric_name, sample_values, severity_preference }, result, 1800);
    res.json(result);
  } catch (err) {
    console.error('[auto-alert-rules] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW AI FEATURE 6: Data Lineage Tracker ====================
// POST /api/ai/data-lineage
// Map data transformations across uploads / data sources.
router.post('/data-lineage', async (req, res) => {
  try {
    const { focus_source_id, depth } = req.body;

    const cached = await getCachedDb(req.user.id, 'data-lineage', { focus_source_id, depth });
    if (cached) return res.json({ ...cached, cached: true });

    const dsResult = await pool.query(
      'SELECT id, name, type, description, status, record_count, created_at FROM data_sources WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    const pipelinesResult = await pool.query(
      'SELECT id, name, description, source_config, destination_config, steps, status FROM data_pipelines WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    const reportsResult = await pool.query(
      'SELECT id, name, type, query, dashboard_id FROM reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );

    if (dsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No data sources found to trace lineage' });
    }

    const result = await callAI([
      {
        role: 'system',
        content: `You are a data lineage / metadata management expert. Build a lineage graph from the provided data sources, pipelines, and reports.

Format your response as JSON with fields:
- lineage_graph: { nodes: array of {id, name, type (source/pipeline/report/dashboard), metadata}, edges: array of {from, to, transformation, confidence (0-100)} }
- focus_node_id: string (the focused source's id, if any)
- upstream_dependencies: array of {node_id, name, role}
- downstream_consumers: array of {node_id, name, role}
- transformation_chain: ordered array of steps from raw source to final consumer
- redundant_data_paths: array of {nodes_involved, description, suggested_consolidation}
- column_origin_traces: array of {column_name, traced_back_to (node_id), confidence}
- impact_analysis: { if_source_changes: array of impacted nodes, if_source_deleted: array of broken consumers }
- recommendations: array of {title, description, priority (1-5), category (consolidation/documentation/governance/performance)}
- documentation_gaps: array of strings

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `Trace data lineage${focus_source_id ? ` focused on source ID ${focus_source_id}` : ' across all user data'}, depth=${depth || 'standard'}.

Data sources:
${JSON.stringify(dsResult.rows, null, 2)}

Data pipelines:
${JSON.stringify(pipelinesResult.rows, null, 2)}

Reports:
${JSON.stringify(reportsResult.rows, null, 2)}`
      }
    ]);

    await setCachedDb(req.user.id, 'data-lineage', { focus_source_id, depth }, { ...result, source_count: dsResult.rows.length }, 1800);
    res.json({ ...result, source_count: dsResult.rows.length });
  } catch (err) {
    console.error('[data-lineage] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW AI FEATURE 7: Query Cost Optimizer ====================
// POST /api/ai/query-cost-optimizer
// Estimate PostgreSQL query cost, suggest materialized views or incremental loads.
router.post('/query-cost-optimizer', async (req, res) => {
  try {
    const { sql_query, table_stats, current_runtime_ms, frequency_per_day } = req.body;
    if (!sql_query) {
      return res.status(400).json({ error: 'sql_query is required' });
    }

    const cached = await getCachedDb(req.user.id, 'query-cost-optimizer', { sql_query, table_stats, current_runtime_ms, frequency_per_day });
    if (cached) return res.json({ ...cached, cached: true });

    const result = await callAI([
      {
        role: 'system',
        content: `You are a PostgreSQL cost-based query optimization expert.
Given a query, table statistics, and runtime, estimate cost and recommend cost-reduction strategies (materialized views, incremental loads, indexes, query rewrites).

Format your response as JSON with fields:
- estimated_cost: { relative_cost (low/medium/high/extreme), estimated_rows_scanned, full_scan_risk (boolean), join_cost ("low"|"medium"|"high"), io_cost ("low"|"medium"|"high") }
- monthly_cost_impact: { current_seconds_per_day, current_seconds_per_month, projected_savings_seconds, projected_savings_pct }
- materialized_view_candidate: { recommended (boolean), suggested_definition_sql, refresh_strategy ("on_demand"|"incremental"|"scheduled"), refresh_frequency, expected_savings_pct }
- incremental_load_strategy: { applicable (boolean), key_column, partition_strategy, batch_size_recommendation }
- index_recommendations: array of {columns, type, create_statement, expected_improvement_pct}
- query_rewrites: array of {original_pattern, rewritten_pattern, reason, expected_improvement_pct}
- partitioning_suggestion: { recommended (boolean), partition_key, partition_type, rationale }
- caching_strategy: { layer ("application"|"redis"|"materialized_view"|"none"), ttl_seconds, invalidation_strategy }
- overall_recommendation: 1-paragraph summary
- priority_actions: array of {action, effort ("low"|"medium"|"high"), expected_savings_pct, priority (1-5)}

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `SQL Query:
\`\`\`sql
${sql_query}
\`\`\`

Table statistics: ${JSON.stringify(table_stats || {})}
Current runtime: ${current_runtime_ms || 'unknown'} ms
Execution frequency: ${frequency_per_day || 'unknown'} times/day`
      }
    ]);

    // Persist into query_optimizations
    try {
      await pool.query(
        `INSERT INTO query_optimizations
         (user_id, original_query, optimization_type, improvement_percentage, suggestions, index_recommendations, ai_analysis)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
        [
          req.user.id,
          sql_query,
          'cost-optimizer',
          parseFloat(result.monthly_cost_impact?.projected_savings_pct) || 0,
          JSON.stringify(result.priority_actions || []),
          JSON.stringify(result.index_recommendations || []),
          result.overall_recommendation || ''
        ]
      );
    } catch {}

    await setCachedDb(req.user.id, 'query-cost-optimizer', { sql_query, table_stats, current_runtime_ms, frequency_per_day }, result, 3600);
    res.json(result);
  } catch (err) {
    console.error('[query-cost-optimizer] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW AI FEATURE 8: Forecast Accuracy Scorer ====================
// POST /api/ai/forecast-accuracy
// Compare actual outcomes to AI predictions over time, suggest retraining strategy.
router.post('/forecast-accuracy', async (req, res) => {
  try {
    const { prediction_id, actual_outcome, evaluation_window_days } = req.body;

    const cached = await getCachedDb(req.user.id, 'forecast-accuracy', { prediction_id, actual_outcome, evaluation_window_days });
    if (cached) return res.json({ ...cached, cached: true });

    let userPredictions = [];
    if (prediction_id) {
      const r = await pool.query('SELECT * FROM predictions WHERE id = $1 AND user_id = $2', [prediction_id, req.user.id]);
      if (r.rows.length === 0) return res.status(404).json({ error: 'Prediction not found' });
      userPredictions = r.rows;
    } else {
      const r = await pool.query(
        `SELECT * FROM predictions WHERE user_id = $1 AND created_at > NOW() - ($2 || ' days')::interval
         ORDER BY created_at DESC LIMIT 50`,
        [req.user.id, String(evaluation_window_days || 30)]
      );
      userPredictions = r.rows;
    }

    if (userPredictions.length === 0) {
      return res.status(404).json({ error: 'No predictions found in the evaluation window' });
    }

    const result = await callAI([
      {
        role: 'system',
        content: `You are a forecasting model evaluation expert. Score the accuracy of predictions vs actuals and suggest retraining/model-improvement strategy.

Format your response as JSON with fields:
- accuracy_summary: { mean_absolute_error, mape_pct, rmse, r_squared, sample_size, confidence ("high"|"medium"|"low") }
- per_prediction_scores: array of {prediction_id, predicted, actual, abs_error, pct_error, within_confidence_interval (boolean)}
- bias_analysis: { systematic_bias ("over_forecast"|"under_forecast"|"none"), magnitude_pct, drift_detected (boolean), drift_direction }
- accuracy_trend: { improving (boolean), trend_pct_change, time_window }
- model_diagnosis: { primary_failure_mode, contributing_factors: array of strings }
- retraining_recommendation: { recommended (boolean), priority ("immediate"|"soon"|"monitor"), strategy ("full_retrain"|"incremental"|"feature_engineering"|"model_swap"), data_requirements, expected_accuracy_improvement_pct }
- feature_engineering_suggestions: array of {feature, rationale, expected_lift_pct}
- alternative_models: array of {model_type, rationale, expected_accuracy_pct}
- monitoring_recommendations: array of {metric, threshold, alert_severity}
- next_steps: array of {action, owner_role, timeline_days}

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `Score forecast accuracy for these predictions${actual_outcome !== undefined ? ` (actual outcome supplied: ${actual_outcome})` : ''}:

${JSON.stringify(userPredictions, null, 2)}

Evaluation window: ${evaluation_window_days || 30} days`
      }
    ]);

    // Update predictions with computed accuracy if available
    if (result.per_prediction_scores && Array.isArray(result.per_prediction_scores)) {
      for (const score of result.per_prediction_scores) {
        if (score.prediction_id && score.pct_error !== undefined) {
          try {
            await pool.query(
              `UPDATE predictions SET accuracy = $1 WHERE id = $2 AND user_id = $3`,
              [Math.max(0, 100 - Math.abs(parseFloat(score.pct_error) || 0)), score.prediction_id, req.user.id]
            );
          } catch {}
        }
      }
    }

    await setCachedDb(req.user.id, 'forecast-accuracy', { prediction_id, actual_outcome, evaluation_window_days }, { ...result, prediction_count: userPredictions.length }, 1800);
    res.json({ ...result, prediction_count: userPredictions.length });
  } catch (err) {
    console.error('[forecast-accuracy] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW AI FEATURE 9: SQL From Intent ====================
// POST /api/ai/sql-from-intent
// Natural-language description -> SQL query against the user's described schema.
router.post('/sql-from-intent', async (req, res) => {
  try {
    const { intent, schema, dialect } = req.body || {};
    if (!intent || typeof intent !== 'string') {
      return res.status(400).json({ error: 'intent (string) is required' });
    }
    let schemaSpec = schema;
    if (!schemaSpec) {
      try {
        const ds = await pool.query(
          `SELECT id, name, type, description FROM data_sources WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
          [req.user.id]
        );
        schemaSpec = ds.rows;
      } catch { schemaSpec = []; }
    }
    const cached = await getCachedDb(req.user.id, 'sql-from-intent', { intent, schemaSpec, dialect });
    if (cached) return res.json({ ...cached, cached: true });
    const result = await callAI([
      {
        role: 'system',
        content: `You are an expert SQL author. Translate a business intent into a SQL query for the supplied schema.
Format your response as JSON with fields:
- dialect: "postgres" | "mysql" | "sqlite" | "ansi"
- sql: the SQL query string
- assumptions: array of strings about column meanings inferred
- referenced_tables: array of strings
- referenced_columns: array of {table, column}
- explain: 1-paragraph plain-language summary of what the SQL does
- safety_notes: array of strings about destructive ops, missing WHERE, etc.
- alternative_queries: array of {label, sql, reason}
IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `Intent: ${intent}\nDialect: ${dialect || 'postgres'}\nSchema: ${typeof schemaSpec === 'string' ? schemaSpec : JSON.stringify(schemaSpec, null, 2)}`
      }
    ]);
    await setCachedDb(req.user.id, 'sql-from-intent', { intent, schemaSpec, dialect }, result, 1800);
    res.json(result);
  } catch (err) {
    console.error('[sql-from-intent] Error:', err.message);
    if (err && err.statusCode === 503) return res.status(503).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW AI FEATURE 10: Suggest Visualizations ====================
// POST /api/ai/suggest-visualizations
// Given a column set / sample, recommend chart types, encodings, and motivations.
router.post('/suggest-visualizations', async (req, res) => {
  try {
    const { columns, sample_rows, goal } = req.body || {};
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({ error: 'columns must be a non-empty array' });
    }
    const cached = await getCachedDb(req.user.id, 'suggest-visualizations', { columns, sample_rows, goal });
    if (cached) return res.json({ ...cached, cached: true });
    const result = await callAI([
      {
        role: 'system',
        content: `You are a data visualization expert. Recommend appropriate chart types for the supplied columns.
Format your response as JSON with fields:
- column_inferred_types: array of {column, inferred_type ("numeric"|"categorical"|"temporal"|"text"|"boolean"|"geo"), cardinality_hint}
- recommendations: array of {chart_type ("bar"|"line"|"area"|"scatter"|"heatmap"|"box"|"histogram"|"pie"|"map"|"table"|"funnel"), encoding: {x, y, color, size, facet}, rationale, priority (1-5), warnings}
- best_overall: {chart_type, why}
- avoid: array of {chart_type, reason}
- libraries: {recharts: array of chart components, plotly: array of trace types}
- accessibility_notes: array of strings
IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `Goal: ${goal || 'general exploratory analysis'}
Columns: ${JSON.stringify(columns)}
Sample rows: ${JSON.stringify((sample_rows || []).slice(0, 25))}`
      }
    ]);
    await setCachedDb(req.user.id, 'suggest-visualizations', { columns, sample_rows, goal }, result, 1800);
    res.json(result);
  } catch (err) {
    console.error('[suggest-visualizations] Error:', err.message);
    if (err && err.statusCode === 503) return res.status(503).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW AI FEATURE 11: Detect Anomalies ====================
// POST /api/ai/detect-anomalies
// Describe a numeric series and surface anomaly findings.
router.post('/detect-anomalies', async (req, res) => {
  try {
    const { metric_name, values, timestamps, business_context } = req.body || {};
    if (!metric_name || !Array.isArray(values) || values.length === 0) {
      return res.status(400).json({ error: 'metric_name and non-empty values array required' });
    }
    const cached = await getCachedDb(req.user.id, 'detect-anomalies', { metric_name, values, timestamps, business_context });
    if (cached) return res.json({ ...cached, cached: true });
    const result = await callAI([
      {
        role: 'system',
        content: `You are an anomaly-detection expert. Given a numeric series, identify anomalies and explain them.
Format your response as JSON with fields:
- summary: { value_count, mean, median, std_dev, min, max }
- distribution_assessment: { type ("normal"|"skewed"|"bimodal"|"sparse"|"unknown"), notes }
- anomalies: array of {index, value, timestamp, severity ("critical"|"high"|"medium"|"low"), z_score_estimate, reason, suggested_action}
- contextual_anomalies: array of {window, description}
- trend_assessment: { direction ("up"|"down"|"flat"|"cyclical"), strength ("strong"|"moderate"|"weak"), seasonality_hint }
- recommended_thresholds: { warning, critical }
- false_positive_risks: array of strings
- next_steps: array of {action, priority (1-5)}
IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences.`
      },
      {
        role: 'user',
        content: `Metric: ${metric_name}
Business context: ${business_context || 'general operational metric'}
Values (${values.length}): ${JSON.stringify(values.slice(0, 200))}
Timestamps: ${JSON.stringify((timestamps || []).slice(0, 200))}`
      }
    ]);
    await setCachedDb(req.user.id, 'detect-anomalies', { metric_name, values, timestamps, business_context }, result, 1800);
    res.json(result);
  } catch (err) {
    console.error('[detect-anomalies] Error:', err.message);
    if (err && err.statusCode === 503) return res.status(503).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;
