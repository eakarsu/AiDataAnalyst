import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import cacheService from './cacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Extract JSON from AI response — handles code fences, leading text, any wrapping
function extractJSON(text) {
  if (!text) return text;
  // Find the first { and last } to extract the JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

// Fix single quotes to double quotes for JSON parsing
function fixQuotes(text) {
  // Replace Python-style booleans/null first
  let fixed = text
    .replace(/:\s*True\b/g, ': true')
    .replace(/:\s*False\b/g, ': false')
    .replace(/:\s*None\b/g, ': null');
  // Replace single quotes used as JSON delimiters with double quotes
  // Match: 'key' or 'value' in JSON context (after {, [, ,, : or before }, ], ,, :)
  fixed = fixed.replace(/'/g, '"');
  return fixed;
}

// Safe JSON parse that handles code fences, leading text, single quotes, truncation
function safeParseJSON(text) {
  if (!text) return null;

  // Step 1: Try direct parse
  try { return JSON.parse(text); } catch {}

  // Step 2: Extract JSON object from any wrapping text/code fences
  const extracted = extractJSON(text);
  try { return JSON.parse(extracted); } catch {}

  // Step 3: Fix single quotes and Python-style booleans
  const fixed = fixQuotes(extracted);
  try { return JSON.parse(fixed); } catch {}

  // Step 4: Try to repair truncated JSON by closing open brackets
  try {
    let repaired = fixed;
    const opens = (repaired.match(/\{/g) || []).length;
    const closes = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    // Remove trailing incomplete key/value (after last comma or colon)
    repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/, '');
    repaired = repaired.replace(/,\s*$/, '');
    // Close open brackets and braces
    for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
    for (let i = 0; i < opens - closes; i++) repaired += '}';
    return JSON.parse(repaired);
  } catch {}

  console.error('[safeParseJSON] FAILED to parse AI response. First 500 chars:', text.substring(0, 500));
  return null;
}

async function callOpenRouter(messages, model = OPENROUTER_MODEL) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Data Analyst'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 4096,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateInsight(data, context) {
  const messages = [
    {
      role: 'system',
      content: `You are an expert data analyst AI. Analyze the provided data and generate actionable business insights. Be specific, quantitative, and provide clear recommendations.

Format your response as JSON with these fields:
- title: a clear, compelling title for the insight
- insight_type: one of (opportunity/risk/trend/anomaly/optimization)
- content: a 2-3 sentence executive summary of the finding
- confidence: number 0-100
- impact: one of (high/medium/low)
- key_metrics: array of {name, value, trend (up/down/stable), change_percent} — 3-5 key numbers
- analysis_sections: array of {heading, body} — 2-4 detailed analysis paragraphs (body should be plain readable text, NOT JSON)
- recommendations: array of {title, description, priority (1-5), expected_impact} — 3-6 actionable items
- risks: array of short risk strings
- opportunities: array of short opportunity strings

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text before or after the JSON.`
    },
    {
      role: 'user',
      content: `Analyze this data and provide insights:\n\nContext: ${context}\n\nData: ${JSON.stringify(data)}`
    }
  ];

  const response = await callOpenRouter(messages);
  console.log('[generateInsight] AI response length:', response?.length, 'first 200 chars:', response?.substring(0, 200));
  const parsed = safeParseJSON(response);
  if (parsed) {
    parsed.key_metrics = parsed.key_metrics || [];
    parsed.analysis_sections = parsed.analysis_sections || [];
    parsed.recommendations = parsed.recommendations || [];
    parsed.risks = parsed.risks || [];
    parsed.opportunities = parsed.opportunities || [];
    return parsed;
  }
  console.warn('[generateInsight] Fallback: could not parse AI response as JSON');
  return {
    title: 'Data Analysis Insight',
    insight_type: 'trend',
    content: response,
    confidence: 85,
    impact: 'medium',
    key_metrics: [],
    analysis_sections: [{ heading: 'Analysis', body: response }],
    recommendations: [{ title: 'Review', description: 'Review the analysis for actionable items', priority: 3, expected_impact: 'medium' }],
    risks: [],
    opportunities: []
  };
}

export async function generateSQLFromNaturalLanguage(query, schema) {
  const messages = [
    {
      role: 'system',
      content: `You are an expert SQL developer. Convert natural language queries to SQL. The database uses PostgreSQL. Here is the schema:\n${schema}\n\nRespond with only the SQL query, no explanations.`
    },
    {
      role: 'user',
      content: query
    }
  ];

  return await callOpenRouter(messages);
}

export async function analyzeAnomaly(metric, expected, actual, historicalData) {
  const messages = [
    {
      role: 'system',
      content: 'You are an anomaly detection expert. Analyze the data deviation and provide insights. Format response as JSON with fields: severity (critical/high/medium/low), possibleCauses (array), recommendations (array), requiresAction (boolean). IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text.'
    },
    {
      role: 'user',
      content: `Metric: ${metric}\nExpected Value: ${expected}\nActual Value: ${actual}\nDeviation: ${((actual - expected) / expected * 100).toFixed(2)}%\nHistorical Data: ${JSON.stringify(historicalData)}`
    }
  ];

  const response = await callOpenRouter(messages);
  const parsed = safeParseJSON(response);
  if (parsed) return parsed;
  return {
    severity: Math.abs((actual - expected) / expected) > 0.5 ? 'high' : 'medium',
    possibleCauses: ['Requires further investigation'],
    recommendations: ['Review historical patterns', 'Check for external factors'],
    requiresAction: true
  };
}

export async function generatePrediction(historicalData, targetMetric, period) {
  const messages = [
    {
      role: 'system',
      content: 'You are a predictive analytics expert. Based on historical data, provide predictions. Format response as JSON with fields: predictedValue (number), confidenceInterval (object with lower and upper), accuracy (0-100), factors (array of influencing factors), trend (up/down/stable). IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text.'
    },
    {
      role: 'user',
      content: `Target Metric: ${targetMetric}\nPrediction Period: ${period}\nHistorical Data: ${JSON.stringify(historicalData)}`
    }
  ];

  const response = await callOpenRouter(messages);
  const parsed = safeParseJSON(response);
  if (parsed) return parsed;
  return {
    predictedValue: historicalData[historicalData.length - 1]?.value * 1.05 || 0,
    confidenceInterval: { lower: 0, upper: 0 },
    accuracy: 75,
    factors: ['Historical trends'],
    trend: 'stable'
  };
}

export async function generateReport(data, reportType, preferences) {
  const messages = [
    {
      role: 'system',
      content: `You are a business intelligence report generator. Create a comprehensive ${reportType} report based on the provided data. Include executive summary, key metrics, insights, and recommendations. Format as markdown.`
    },
    {
      role: 'user',
      content: `Report Type: ${reportType}\nPreferences: ${JSON.stringify(preferences)}\nData: ${JSON.stringify(data)}`
    }
  ];

  return await callOpenRouter(messages);
}

export async function chatWithData(message, context, conversationHistory = []) {
  const messages = [
    {
      role: 'system',
      content: `You are an AI data analyst assistant. Help users understand their data, answer questions, and provide insights. You have access to the following data context:\n${JSON.stringify(context)}\n\nBe helpful, specific, and provide actionable insights when possible.`
    },
    ...conversationHistory,
    {
      role: 'user',
      content: message
    }
  ];

  return await callOpenRouter(messages);
}

export async function suggestOptimizations(currentState, goals) {
  const messages = [
    {
      role: 'system',
      content: 'You are a business optimization expert. Analyze the current state and goals, then suggest specific optimizations. Format response as JSON with fields: optimizations (array of {title, description, expectedImpact, difficulty, priority}). IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text.'
    },
    {
      role: 'user',
      content: `Current State:\n${JSON.stringify(currentState)}\n\nGoals:\n${JSON.stringify(goals)}`
    }
  ];

  const response = await callOpenRouter(messages);
  const parsed = safeParseJSON(response);
  if (parsed) return parsed;
  return {
    optimizations: [{
      title: 'Review Current Metrics',
      description: 'Analyze current performance metrics for improvement opportunities',
      expectedImpact: 'Medium',
      difficulty: 'Low',
      priority: 1
    }]
  };
}

export async function summarizeData(data, format = 'executive') {
  const messages = [
    {
      role: 'system',
      content: `You are a data summarization expert. Create a ${format} summary of the provided data. Be concise but comprehensive. Highlight key points, trends, and notable items.`
    },
    {
      role: 'user',
      content: JSON.stringify(data)
    }
  ];

  return await callOpenRouter(messages);
}

// ==================== AI QUERY OPTIMIZER ====================
export async function optimizeQuery(query, schema, performance_context) {
  const cacheKey = `ai:optimizeQuery:${crypto.createHash('md5').update(JSON.stringify({ query, schema })).digest('hex')}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const messages = [
    {
      role: 'system',
      content: `You are an expert database query optimizer specializing in PostgreSQL. Analyze the provided query and suggest optimizations.

Format your response as JSON with fields:
- optimized_query: the improved SQL query string
- optimization_type: one of (index_optimization/query_rewrite/join_optimization/execution_plan_improvement)
- improvement_percentage: estimated improvement number (0-100)
- explanation: plain text detailed explanation of all changes made
- suggestions: array of {title, description, category} where category is (performance/readability/security/best_practice)
- index_recommendations: array of {table, columns, type, rationale} for recommended indexes
- complexity_before: plain text complexity assessment of original query
- complexity_after: plain text complexity assessment of optimized query
- warnings: array of short warning strings about the original query
- best_practices: array of short best practice tips relevant to this query

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text before or after the JSON.`
    },
    {
      role: 'user',
      content: `Original Query: ${query}\n\nSchema: ${schema}\n\nPerformance Context: ${JSON.stringify(performance_context)}`
    }
  ];

  const response = await callOpenRouter(messages);
  console.log('[optimizeQuery] AI response length:', response?.length);
  const parsed = safeParseJSON(response);
  if (parsed) {
    parsed.suggestions = (parsed.suggestions || []).map(s => typeof s === 'string' ? { title: s, description: s, category: 'performance' } : s);
    parsed.index_recommendations = (parsed.index_recommendations || []).map(r => typeof r === 'string' ? { table: 'N/A', columns: [r], type: 'btree', rationale: r } : r);
    parsed.warnings = parsed.warnings || [];
    parsed.best_practices = parsed.best_practices || [];
    cacheService.set(cacheKey, parsed, 1800); // cache 30 minutes
    return parsed;
  }
  console.warn('[optimizeQuery] Fallback: could not parse AI response');
  const fallback = {
    optimized_query: query,
    optimization_type: 'analysis',
    improvement_percentage: 0,
    explanation: response,
    suggestions: [{ title: 'Review', description: response, category: 'performance' }],
    index_recommendations: [],
    complexity_before: 'Unknown',
    complexity_after: 'Unknown',
    warnings: [],
    best_practices: []
  };
  cacheService.set(cacheKey, fallback, 600);
  return fallback;
}

// ==================== AI LOG ANALYZER ====================
export async function analyzeLogs(logs, context) {
  const messages = [
    {
      role: 'system',
      content: `You are an expert DevOps log analyzer. Analyze the provided logs thoroughly.

Format your response as JSON with fields:
- summary: plain text executive summary (2-3 sentences)
- severity: overall severity (critical/high/medium/low)
- health_score: number 0-100 representing overall system health
- patterns_detected: array of {pattern, frequency, description, affected_components, severity}
- root_causes: array of {cause, confidence (0-100), evidence, affected_logs_count}
- recommendations: array of {title, description, priority (1-5), expected_impact, category} where category is (immediate_fix/monitoring/optimization/prevention)
- key_stats: array of {label, value, trend (up/down/stable)} — 4-6 key statistics
- affected_services: array of short service name strings
- timeline_summary: plain text chronological narrative of events

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text before or after the JSON.`
    },
    {
      role: 'user',
      content: `Logs:\n${JSON.stringify(logs, null, 2)}\n\nContext: ${JSON.stringify(context)}`
    }
  ];

  const response = await callOpenRouter(messages);
  console.log('[analyzeLogs] AI response length:', response?.length);
  const parsed = safeParseJSON(response);
  if (parsed) {
    parsed.patterns_detected = (parsed.patterns_detected || []).map(p => typeof p === 'string' ? { pattern: p, frequency: 'N/A', description: p, affected_components: [], severity: 'medium' } : p);
    parsed.root_causes = (parsed.root_causes || []).map(r => typeof r === 'string' ? { cause: r, confidence: 50, evidence: r, affected_logs_count: 0 } : r);
    parsed.recommendations = (parsed.recommendations || []).map(r => typeof r === 'string' ? { title: r, description: r, priority: 3, expected_impact: 'medium', category: 'monitoring' } : r);
    parsed.key_stats = parsed.key_stats || [];
    parsed.affected_services = parsed.affected_services || [];
    return parsed;
  }
  console.warn('[analyzeLogs] Fallback: could not parse AI response');
  return {
    summary: response,
    severity: 'medium',
    health_score: 50,
    patterns_detected: [],
    root_causes: [],
    recommendations: [{ title: 'Manual Review', description: 'Review logs manually for detailed analysis', priority: 2, expected_impact: 'high', category: 'immediate_fix' }],
    key_stats: [],
    affected_services: [],
    timeline_summary: 'Unable to parse timeline'
  };
}

export async function classifyLogEntry(log_entry) {
  const messages = [
    {
      role: 'system',
      content: `You are a log classification expert. Analyze the log entry and classify it.

Format your response as JSON with fields:
- classification: one of (error/warning/info/debug/security/performance/business)
- severity: one of (critical/high/medium/low)
- root_cause: plain text likely root cause explanation
- solution: plain text recommended solution
- related_components: array of short affected system component names
- urgency: one of (immediate/soon/scheduled/monitor)
- confidence: number 0-100 for classification confidence
- impact_summary: one sentence describing potential impact

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text before or after the JSON.`
    },
    {
      role: 'user',
      content: JSON.stringify(log_entry)
    }
  ];

  const response = await callOpenRouter(messages);
  const parsed = safeParseJSON(response);
  if (parsed) return parsed;
  return {
    classification: 'unknown',
    severity: 'medium',
    root_cause: 'Requires manual analysis',
    solution: 'Review log context',
    related_components: [],
    urgency: 'scheduled',
    confidence: 50,
    impact_summary: 'Unknown impact'
  };
}

// ==================== AI DASHBOARD GENERATOR ====================
export async function generateDashboardLayout(requirements, available_data, user_role) {
  const messages = [
    {
      role: 'system',
      content: `You are a business intelligence dashboard designer. Create an optimal dashboard layout.

Format your response as JSON with fields:
- layout_config: {columns: 12, rows: number}
- widgets: array of {id, type (chart/kpi/table/gauge/map/heatmap), title, description, position: {x, y, width, height}, chart_type, refresh_interval}
- color_scheme: single color name (blue/green/purple/orange/teal/indigo/rose/amber)
- kpi_cards: array of {title, description, target_metric, format} — key performance indicators
- filters: array of {name, type (dropdown/date_range/search/toggle), description}
- ai_suggestions: array of {title, description, priority (1-5)} — layout improvement tips
- design_rationale: plain text explanation of why this layout was chosen
- data_requirements: array of short strings describing data needed for each widget

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text before or after the JSON.`
    },
    {
      role: 'user',
      content: `Requirements: ${requirements}\n\nAvailable Data: ${JSON.stringify(available_data)}\n\nUser Role: ${user_role}`
    }
  ];

  const response = await callOpenRouter(messages);
  console.log('[generateDashboardLayout] AI response length:', response?.length);
  const parsed = safeParseJSON(response);
  if (parsed) {
    parsed.widgets = (parsed.widgets || []).map((w, i) => ({ id: w.id || `widget_${i}`, type: w.type || 'chart', title: w.title || 'Widget', description: w.description || '', position: w.position || { x: 0, y: 0, width: 4, height: 3 }, ...w }));
    parsed.kpi_cards = (parsed.kpi_cards || []).map(k => typeof k === 'string' ? { title: k, description: k, target_metric: k, format: 'number' } : k);
    parsed.filters = (parsed.filters || []).map(f => typeof f === 'string' ? { name: f, type: 'dropdown', description: f } : f);
    parsed.ai_suggestions = (parsed.ai_suggestions || []).map(s => typeof s === 'string' ? { title: s, description: s, priority: 3 } : s);
    parsed.data_requirements = parsed.data_requirements || [];
    return parsed;
  }
  console.warn('[generateDashboardLayout] Fallback: could not parse AI response');
  return {
    layout_config: { columns: 12, rows: 8 },
    widgets: [],
    color_scheme: 'blue',
    kpi_cards: [],
    filters: [],
    ai_suggestions: [{ title: 'Review', description: response, priority: 3 }],
    design_rationale: response,
    data_requirements: []
  };
}

// ==================== AI DATA QUALITY SCORER ====================
export async function scoreDataQuality(data_sample, schema_info, context) {
  const cacheKey = `ai:scoreDataQuality:${crypto.createHash('md5').update(JSON.stringify({ data_sample, schema_info })).digest('hex')}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const messages = [
    {
      role: 'system',
      content: `You are a data quality expert. Analyze the provided data sample and score its quality.

Score each dimension from 0-100. Format your response as JSON with fields:
- overall_score: weighted average number (0-100)
- completeness_score, accuracy_score, consistency_score, timeliness_score, uniqueness_score, validity_score: numbers 0-100
- quality_grade: one of (A/B/C/D/F)
- analysis: plain text 2-3 sentence executive summary
- analysis_sections: array of {heading, body} — 2-4 detailed analysis paragraphs (body is plain readable text)
- issues_found: array of {column, issue_type, severity (critical/high/medium/low), affected_rows_percentage, description}
- recommendations: array of {title, description, priority (1-5), expected_improvement, category} where category is (data_cleaning/validation/monitoring/governance)
- strengths: array of short strings describing what's good about the data
- data_profile: {total_records, total_columns, null_percentage, duplicate_percentage}

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text before or after the JSON.`
    },
    {
      role: 'user',
      content: `Data Sample:\n${JSON.stringify(data_sample)}\n\nSchema: ${JSON.stringify(schema_info)}\n\nContext: ${context}`
    }
  ];

  const response = await callOpenRouter(messages);
  console.log('[scoreDataQuality] AI response length:', response?.length);
  const parsed = safeParseJSON(response);
  if (parsed) {
    parsed.issues_found = (parsed.issues_found || []).map(i => typeof i === 'string' ? { column: 'N/A', issue_type: i, severity: 'medium', affected_rows_percentage: 0, description: i } : i);
    parsed.recommendations = (parsed.recommendations || []).map(r => typeof r === 'string' ? { title: r, description: r, priority: 3, expected_improvement: 'N/A', category: 'data_cleaning' } : r);
    parsed.analysis_sections = parsed.analysis_sections || [];
    parsed.strengths = parsed.strengths || [];
    parsed.data_profile = parsed.data_profile || {};
    cacheService.set(cacheKey, parsed, 1800); // cache 30 minutes
    return parsed;
  }
  console.warn('[scoreDataQuality] Fallback: could not parse AI response');
  const fallback = {
    overall_score: 75,
    completeness_score: 80,
    accuracy_score: 75,
    consistency_score: 70,
    timeliness_score: 85,
    uniqueness_score: 90,
    validity_score: 70,
    quality_grade: 'C',
    analysis: response,
    analysis_sections: [{ heading: 'Analysis', body: response }],
    issues_found: [],
    recommendations: [{ title: 'Manual Review', description: 'Manual review recommended', priority: 2, expected_improvement: 'N/A', category: 'data_cleaning' }],
    strengths: [],
    data_profile: {}
  };
  cacheService.set(cacheKey, fallback, 600);
  return fallback;
}

// ==================== AI INSIGHT NARRATOR ====================
export async function generateNarrative(insight, audience, tone, format_type) {
  const messages = [
    {
      role: 'system',
      content: `You are a business intelligence storyteller. Transform data insights into compelling narratives.

Audience: ${audience} (executive/technical/general)
Tone: ${tone} (formal/conversational/urgent/analytical)
Format: ${format_type} (executive_summary/detailed_report/presentation/email)

Format your response as JSON with fields:
- title: compelling headline string
- executive_summary: plain text 2-3 sentence summary
- detailed_analysis: plain text full narrative (multiple paragraphs separated by newlines, NOT JSON)
- key_findings: array of short finding strings (bullet points)
- action_items: array of {action, owner, deadline, priority (1-5)}
- visualizations: array of short chart type strings (e.g. "bar_chart", "line_chart")
- key_metrics: array of {label, value, context} — 3-5 supporting statistics
- call_to_action: plain text string describing what the reader should do next
- next_steps: array of short next step strings

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text before or after the JSON.`
    },
    {
      role: 'user',
      content: JSON.stringify(insight)
    }
  ];

  const response = await callOpenRouter(messages);
  console.log('[generateNarrative] AI response length:', response?.length);
  const parsed = safeParseJSON(response);
  if (parsed) {
    parsed.key_findings = (parsed.key_findings || []).map(f => typeof f === 'object' ? (f.finding || f.description || JSON.stringify(f)) : f);
    parsed.action_items = (parsed.action_items || []).map(a => typeof a === 'string' ? { action: a, owner: 'TBD', deadline: 'TBD', priority: 3 } : a);
    parsed.key_metrics = parsed.key_metrics || [];
    parsed.next_steps = parsed.next_steps || [];
    return parsed;
  }
  console.warn('[generateNarrative] Fallback: could not parse AI response');
  return {
    title: insight.title || 'Data Insight',
    executive_summary: response,
    detailed_analysis: response,
    key_findings: [],
    action_items: [],
    visualizations: ['bar_chart'],
    key_metrics: [],
    call_to_action: 'Review and take action',
    next_steps: []
  };
}

// ==================== AI DATA PIPELINE BUILDER ====================
export async function generatePipelineDesign(requirements, data_sources, destination, constraints) {
  const messages = [
    {
      role: 'system',
      content: `You are an expert data engineer and pipeline architect. Design an optimal data pipeline based on the requirements.

Format your response as JSON with fields:
- name: descriptive pipeline name string
- description: plain text 1-2 sentence description of what this pipeline does
- steps: array of {id, name, type (extract/transform/validate/enrich/filter/aggregate/load/notify), description, config: {}, order, estimated_duration_seconds}
  Step types explained:
  - extract: Pull data from a source (API, database, file, stream)
  - transform: Clean, map, convert, reshape data
  - validate: Check data quality, schema, constraints
  - enrich: Add computed fields, lookups, AI enrichment
  - filter: Remove rows/columns based on conditions
  - aggregate: Group, sum, count, pivot operations
  - load: Write data to destination (database, file, API, warehouse)
  - notify: Send alerts/notifications on completion or failure
- source_config: {type (api/database/file/stream/webhook), format, connection_details, description}
- destination_config: {type (database/file/api/warehouse/dashboard), format, connection_details, description}
- error_handling: {retry_count, retry_delay_seconds, on_failure (stop/skip/alert), dead_letter_queue, alerting}
- schedule_recommendation: cron expression string or "manual"
- estimated_total_duration: total estimated seconds
- ai_suggestions: array of {title, description, priority (1-5), category (performance/reliability/cost/security)}
- data_flow_summary: plain text description of data movement through the pipeline
- scalability_notes: plain text notes on handling larger volumes
- monitoring_recommendations: array of short strings

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no code fences, no extra text before or after the JSON.`
    },
    {
      role: 'user',
      content: `Requirements: ${requirements}\n\nAvailable Data Sources: ${JSON.stringify(data_sources)}\n\nDestination: ${destination}\n\nConstraints: ${JSON.stringify(constraints)}`
    }
  ];

  const response = await callOpenRouter(messages);
  console.log('[generatePipelineDesign] AI response length:', response?.length);
  const parsed = safeParseJSON(response);
  if (parsed) {
    parsed.steps = (parsed.steps || []).map((s, i) => ({
      id: s.id || `step_${i + 1}`,
      name: s.name || `Step ${i + 1}`,
      type: s.type || 'transform',
      description: s.description || '',
      config: s.config || {},
      order: s.order || i + 1,
      estimated_duration_seconds: s.estimated_duration_seconds || 10,
      ...s
    }));
    parsed.source_config = parsed.source_config || {};
    parsed.destination_config = parsed.destination_config || {};
    parsed.error_handling = parsed.error_handling || { retry_count: 3, retry_delay_seconds: 30, on_failure: 'alert' };
    parsed.ai_suggestions = (parsed.ai_suggestions || []).map(s => typeof s === 'string' ? { title: s, description: s, priority: 3, category: 'performance' } : s);
    parsed.monitoring_recommendations = parsed.monitoring_recommendations || [];
    return parsed;
  }
  console.warn('[generatePipelineDesign] Fallback: could not parse AI response');
  return {
    name: 'Custom Pipeline',
    description: response,
    steps: [],
    source_config: {},
    destination_config: {},
    error_handling: { retry_count: 3, retry_delay_seconds: 30, on_failure: 'alert' },
    schedule_recommendation: 'manual',
    estimated_total_duration: 60,
    ai_suggestions: [{ title: 'Review', description: response, priority: 3, category: 'performance' }],
    data_flow_summary: response,
    scalability_notes: 'Review pipeline design for scalability',
    monitoring_recommendations: []
  };
}

export default {
  generateInsight,
  generateSQLFromNaturalLanguage,
  analyzeAnomaly,
  generatePrediction,
  generateReport,
  chatWithData,
  suggestOptimizations,
  summarizeData,
  // New AI features
  optimizeQuery,
  analyzeLogs,
  classifyLogEntry,
  generateDashboardLayout,
  scoreDataQuality,
  generateNarrative,
  generatePipelineDesign
};
