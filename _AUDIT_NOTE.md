# Audit Apply Notes — AiDataAnalyst

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_02.md` (lines 842-873).

The audit reports 5 routes / 0 AI endpoints. Inspection shows ~8 AI endpoints
in `routes/aiNew.js` (cohort-comparison, schema-advisor, data-governance,
multi-source-merge, auto-alert-rules, data-lineage, query-cost-optimizer,
forecast-accuracy) plus richer `routes/api.js` (data-sources, dashboards,
reports, insights/generate, queries, alerts, predictions). Audit metadata is
stale.

Per apply-pass policy this pass is **backlog-only**: the codebase already has
a substantial ESM-based AI surface and the audit's "missing AI" list is
largely satisfied.

## Original audit recommendations

### Missing AI counterparts (audit, partly already covered)
- `/query-builder`, `/generate-dashboard`, `/analyze-data`, `/predict-trends`,
  `/optimize-queries` (note: `/query-cost-optimizer` exists),
  `/suggest-visualizations`, `/detect-anomalies`, `/auto-generate-report`.

### Missing non-AI features
- Database connectors (SQL, NoSQL, cloud DWs).
- Real-time streaming.
- Data quality monitoring.
- Advanced visualization library (Plotly, D3).
- Alert/notification system for anomalies.

### Custom feature suggestions
- Agentic SQL query generation.
- Automated insights generation.
- Predictive analytics auto-detection.
- Data quality automation.
- Dashboard generation from intent.

## Implemented in this pass

None. Backlog-only.

## Backlog (prioritized)

### Mechanical, low-risk
1. `/api/ai/sql-from-intent` — natural-language to SQL given a schema spec.
2. `/api/ai/suggest-visualizations` — recommend chart types for a column set.
3. `/api/ai/detect-anomalies` — describe a column and return anomaly findings.

### Needs product decision
- Persistence model for generated SQL / dashboards.
- Choice of viz library (front-end constraint).

### Needs credentials / external SDK
- Database drivers / cloud-DW SDKs (Snowflake, BigQuery, Redshift).
- Streaming (Kafka, Kinesis, PubSub).

### Too risky / large refactor
- Full BI dashboard renderer.
- Agentic SQL with execution + autocorrect loop.

## Apply pass 3 (frontend)

- **Action**: LEFT-AS-IS.
- `frontend/src/services/api.js` already exposes typed methods for every `routes/aiNew.js` endpoint (`/ai/cohort-comparison`, `/ai/schema-advisor`, `/ai/data-governance`, `/ai/multi-source-merge`, `/ai/auto-alert-rules`, `/ai/data-lineage`, `/ai/query-cost-optimizer`, `/ai/forecast-accuracy`).
- `frontend/src/pages/AIFeaturesNew.jsx` provides a UI catalog keyed by those slugs.
- JWT Bearer auth via shared client; no FE work needed.
- Files modified this pass: none.
