import { Search } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'query_text', label: 'Query', render: (v) => <span className="truncate max-w-xs block font-mono text-xs">{v || '-'}</span> },
  { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'success' ? 'bg-green-50 text-green-700' : v === 'failed' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{v || '-'}</span> },
  { key: 'execution_time_ms', label: 'Time (ms)' },
  { key: 'rows_scanned', label: 'Rows Scanned', render: (v) => v?.toLocaleString() || '0' },
  { key: 'engine_type', label: 'Engine' },
  { key: 'created_at', label: 'Run At', render: (v) => v ? new Date(v).toLocaleString() : '-' },
];

const formFields = [
  { key: 'query_text', label: 'SQL Query', required: true, placeholder: 'SELECT * FROM ...', type: 'textarea' },
  { key: 'engine_type', label: 'Engine Type', placeholder: 'e.g. trino, spark, duckdb' },
  { key: 'catalog', label: 'Catalog', placeholder: 'e.g. iceberg_catalog' },
];

const aiVerbs = [
  'explain-query-plan', 'suggest-rewrite', 'detect-anti-pattern', 'predict-query-cost',
  'classify-query-intent', 'recommend-index-or-mv', 'generate-test-data', 'summarize-slow-queries',
  'validate-sql-syntax', 'suggest-optimization', 'score-query-quality', 'detect-cartesian-join',
  'recommend-cte-extraction', 'predict-resource-need', 'classify-query-pattern', 'generate-query-from-nl',
];

export default function WhQueryEngine() {
  return (
    <FeaturePage
      title="Query Engine"
      description="Run, analyze, and optimize warehouse queries"
      icon={Search}
      iconBg="bg-cyan-50"
      iconColor="text-cyan-600"
      apiPath="/wh/queryEngine"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
