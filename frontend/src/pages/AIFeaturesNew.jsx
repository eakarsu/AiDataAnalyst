import { useState } from 'react';
import api from '../services/api';
import { Sparkles, BarChart3, Layers, ShieldAlert, GitMerge, Bell, Network, DollarSign, TrendingUp, CheckCircle2, Database, PieChart, AlertTriangle } from 'lucide-react';

const FEATURES = [
  {
    key: 'cohort-comparison',
    title: 'Cohort Comparison',
    icon: BarChart3,
    color: 'blue',
    desc: 'Compare metrics across cohorts with statistical significance',
    fields: [
      { name: 'metric', label: 'Metric Name', type: 'text', required: true, placeholder: 'e.g., conversion_rate' },
      { name: 'cohorts', label: 'Cohorts (JSON array, ≥2 entries)', type: 'textarea', required: true,
        placeholder: '[{"name":"Control","values":[12,15,18]},{"name":"Variant A","values":[20,22,19]}]' },
      { name: 'context', label: 'Business Context', type: 'text', placeholder: 'A/B test on checkout page' },
    ],
    apiCall: api.aiCohortComparison.bind(api),
    parseFields: ['cohorts'],
  },
  {
    key: 'schema-advisor',
    title: 'Schema Advisor',
    icon: Layers,
    color: 'purple',
    desc: 'Analyze schema, detect drift, suggest normalization improvements',
    fields: [
      { name: 'table_name', label: 'Table Name', type: 'text', placeholder: 'e.g., orders' },
      { name: 'schema_definition', label: 'Schema Definition (DDL or JSON)', type: 'textarea', required: true,
        placeholder: 'CREATE TABLE orders (id INT, customer_name VARCHAR(255), customer_email VARCHAR(255), ...)' },
    ],
    apiCall: api.aiSchemaAdvisor.bind(api),
  },
  {
    key: 'data-governance',
    title: 'Data Governance Crawler',
    icon: ShieldAlert,
    color: 'red',
    desc: 'Scan tables, identify PII/PHI, suggest masking & compliance gaps',
    fields: [
      { name: 'data_source_ids', label: 'Data Source IDs (CSV, leave blank for all)', type: 'text', placeholder: '12,17,33' },
      { name: 'scan_depth', label: 'Scan Depth', type: 'select', options: [['standard', 'Standard'], ['deep', 'Deep']] },
    ],
    apiCall: api.aiDataGovernance.bind(api),
    transform: (data) => ({
      ...data,
      data_source_ids: data.data_source_ids ? data.data_source_ids.split(',').map(s => parseInt(s.trim())).filter(Boolean) : undefined,
    }),
  },
  {
    key: 'multi-source-merge',
    title: 'Multi-Source Merger',
    icon: GitMerge,
    color: 'indigo',
    desc: 'AI suggests join columns and merge strategy for two data sources',
    fields: [
      { name: 'source_id_a', label: 'Source A ID', type: 'number', required: true },
      { name: 'source_id_b', label: 'Source B ID', type: 'number', required: true },
      { name: 'merge_goal', label: 'Merge Goal', type: 'text', placeholder: 'Combine for unified customer view' },
    ],
    apiCall: api.aiMultiSourceMerge.bind(api),
  },
  {
    key: 'auto-alert-rules',
    title: 'Auto Alert Rules',
    icon: Bell,
    color: 'amber',
    desc: 'AI suggests anomaly thresholds based on data distribution',
    fields: [
      { name: 'metric_name', label: 'Metric Name', type: 'text', required: true, placeholder: 'response_time_ms' },
      { name: 'sample_values', label: 'Sample Values (JSON array)', type: 'textarea', required: true,
        placeholder: '[123,140,98,200,150,135,180]' },
      { name: 'business_context', label: 'Business Context', type: 'text', placeholder: 'API endpoint latency' },
      { name: 'severity_preference', label: 'Severity Preference', type: 'select',
        options: [['balanced', 'Balanced'], ['conservative', 'Conservative (fewer alerts)'], ['aggressive', 'Aggressive (catch all)']] },
    ],
    apiCall: api.aiAutoAlertRules.bind(api),
    parseFields: ['sample_values'],
  },
  {
    key: 'data-lineage',
    title: 'Data Lineage Tracker',
    icon: Network,
    color: 'teal',
    desc: 'Map data transformations across uploads & reports',
    fields: [
      { name: 'focus_source_id', label: 'Focus Source ID (optional)', type: 'number', placeholder: 'leave blank for graph' },
      { name: 'depth', label: 'Trace Depth', type: 'select', options: [['standard', 'Standard'], ['deep', 'Deep']] },
    ],
    apiCall: api.aiDataLineage.bind(api),
  },
  {
    key: 'query-cost-optimizer',
    title: 'Query Cost Optimizer',
    icon: DollarSign,
    color: 'green',
    desc: 'Estimate query cost, suggest materialized views & incremental loads',
    fields: [
      { name: 'sql_query', label: 'SQL Query', type: 'textarea', required: true,
        placeholder: 'SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id' },
      { name: 'table_stats', label: 'Table Stats (JSON, optional)', type: 'textarea',
        placeholder: '{"orders":{"row_count":5000000,"size_mb":1200}}' },
      { name: 'current_runtime_ms', label: 'Current Runtime (ms)', type: 'number', placeholder: '8000' },
      { name: 'frequency_per_day', label: 'Executions per Day', type: 'number', placeholder: '24' },
    ],
    apiCall: api.aiQueryCostOptimizer.bind(api),
    parseFields: ['table_stats'],
  },
  {
    key: 'forecast-accuracy',
    title: 'Forecast Accuracy Scorer',
    icon: TrendingUp,
    color: 'pink',
    desc: 'Compare actual outcomes to AI predictions, suggest retraining',
    fields: [
      { name: 'prediction_id', label: 'Prediction ID (optional)', type: 'number', placeholder: 'leave blank for window' },
      { name: 'actual_outcome', label: 'Actual Outcome (numeric, optional)', type: 'number' },
      { name: 'evaluation_window_days', label: 'Evaluation Window (days)', type: 'number', placeholder: '30' },
    ],
    apiCall: api.aiForecastAccuracy.bind(api),
  },
  {
    key: 'sql-from-intent',
    title: 'SQL from Intent',
    icon: Database,
    color: 'blue',
    desc: 'Translate a business intent into a SQL query for the supplied schema',
    fields: [
      { name: 'intent', label: 'Intent (plain English)', type: 'textarea', required: true,
        placeholder: 'Total revenue per customer in the last 30 days, ordered descending' },
      { name: 'schema', label: 'Schema (JSON or DDL, optional)', type: 'textarea',
        placeholder: '[{"table":"orders","columns":["id","customer_id","total","created_at"]}]' },
      { name: 'dialect', label: 'Dialect', type: 'select',
        options: [['postgres', 'PostgreSQL'], ['mysql', 'MySQL'], ['sqlite', 'SQLite'], ['ansi', 'ANSI']] },
    ],
    apiCall: api.aiSqlFromIntent.bind(api),
    parseFields: ['schema'],
  },
  {
    key: 'suggest-visualizations',
    title: 'Suggest Visualizations',
    icon: PieChart,
    color: 'teal',
    desc: 'Recommend chart types and encodings for a column set',
    fields: [
      { name: 'columns', label: 'Columns (JSON array)', type: 'textarea', required: true,
        placeholder: '[{"name":"date","type":"date"},{"name":"revenue","type":"number"}]' },
      { name: 'sample_rows', label: 'Sample Rows (JSON array, optional)', type: 'textarea',
        placeholder: '[{"date":"2025-01-01","revenue":1000}]' },
      { name: 'goal', label: 'Analysis Goal', type: 'text', placeholder: 'compare segments over time' },
    ],
    apiCall: api.aiSuggestVisualizations.bind(api),
    parseFields: ['columns', 'sample_rows'],
  },
  {
    key: 'detect-anomalies',
    title: 'Detect Anomalies',
    icon: AlertTriangle,
    color: 'red',
    desc: 'Surface anomalies in a numeric series with severities and reasons',
    fields: [
      { name: 'metric_name', label: 'Metric Name', type: 'text', required: true, placeholder: 'orders_per_hour' },
      { name: 'values', label: 'Values (JSON array)', type: 'textarea', required: true,
        placeholder: '[12,14,11,13,80,12,11]' },
      { name: 'timestamps', label: 'Timestamps (JSON array, optional)', type: 'textarea',
        placeholder: '["2025-01-01T00:00Z", ...]' },
      { name: 'business_context', label: 'Business Context', type: 'text', placeholder: 'order intake during business hours' },
    ],
    apiCall: api.aiDetectAnomalies.bind(api),
    parseFields: ['values', 'timestamps'],
  },
];

const COLORS = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', btn: 'bg-blue-600 hover:bg-blue-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', btn: 'bg-purple-600 hover:bg-purple-700' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', btn: 'bg-red-600 hover:bg-red-700' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', btn: 'bg-amber-600 hover:bg-amber-700' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', btn: 'bg-teal-600 hover:bg-teal-700' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', btn: 'bg-green-600 hover:bg-green-700' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', btn: 'bg-pink-600 hover:bg-pink-700' },
};

function renderResult(obj, depth = 0) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return <span className="text-gray-700">{String(obj)}</span>;
  }
  if (Array.isArray(obj)) {
    return (
      <div className="space-y-2 ml-3">
        {obj.map((item, i) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
            {typeof item === 'object' ? renderResult(item, depth + 1) : <span className="text-gray-700">{String(item)}</span>}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2 ml-2">
      {Object.entries(obj).map(([k, v]) => (
        <div key={k}>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{k.replace(/_/g, ' ')}</div>
          <div className="text-sm">
            {typeof v === 'object' && v !== null ? renderResult(v, depth + 1) : <span className="text-gray-700">{String(v)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ feature }) {
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const Icon = feature.icon;
  const c = COLORS[feature.color] || COLORS.blue;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let payload = { ...formData };
      // Parse JSON fields
      if (feature.parseFields) {
        for (const f of feature.parseFields) {
          if (payload[f]) {
            try { payload[f] = JSON.parse(payload[f]); } catch { throw new Error(`${f} must be valid JSON`); }
          }
        }
      }
      // Apply transform
      if (feature.transform) payload = feature.transform(payload);
      // Coerce numbers
      for (const field of feature.fields) {
        if (field.type === 'number' && payload[field.name] !== undefined && payload[field.name] !== '') {
          payload[field.name] = Number(payload[field.name]);
        }
      }
      const res = await feature.apiCall(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white border ${c.border} rounded-xl p-5 shadow-sm`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{feature.title}</h3>
          <p className="text-sm text-gray-500">{feature.desc}</p>
        </div>
        <button
          type="button"
          className="text-xs text-gray-500 hover:text-gray-800"
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? 'Collapse' : 'Open'}
        </button>
      </div>

      {expanded && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {feature.fields.map(field => (
            <div key={field.name}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                />
              ) : field.type === 'select' ? (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                >
                  <option value="">-- default --</option>
                  {field.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : (
                <input
                  type={field.type}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 ${c.btn} text-white rounded-lg flex items-center gap-2 disabled:opacity-50 text-sm font-medium`}
            >
              {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Running...</> : <><Sparkles className="h-4 w-4" />Run AI Analysis</>}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-2 max-h-[600px] overflow-auto">
              {result.cached && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded mb-3">
                  <CheckCircle2 className="h-3 w-3" /> CACHED
                </div>
              )}
              {result.raw ? (
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">{result.raw}</pre>
              ) : (
                renderResult(result)
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default function AIFeaturesNew() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-50 rounded-lg">
          <Sparkles className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Features (Custom Non-CRUD)</h1>
          <p className="text-gray-500">11 advanced AI-powered analyses: cohort comparison, schema advisor, data governance, multi-source merge, auto alert rules, lineage, cost optimizer, forecast accuracy, SQL from intent, suggest visualizations, detect anomalies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {FEATURES.map(feature => (
          <FeatureCard key={feature.key} feature={feature} />
        ))}
      </div>
    </div>
  );
}
