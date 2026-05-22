import { GitBranch } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'model_name', label: 'Model' },
  { key: 'model_layer', label: 'Layer', render: (v) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'staging' ? 'bg-yellow-50 text-yellow-700' : v === 'mart' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{v || '-'}</span> },
  { key: 'materialization', label: 'Materialization' },
  { key: 'test_coverage', label: 'Test Coverage', render: (v) => `${v || 0}%` },
  { key: 'build_time_ms', label: 'Build Time', render: (v) => v ? `${v}ms` : '-' },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'model_name', label: 'Model Name', required: true, placeholder: 'e.g. dim_customers' },
  { key: 'model_layer', label: 'Layer', placeholder: 'staging | intermediate | mart' },
  { key: 'materialization', label: 'Materialization', placeholder: 'table | view | incremental | ephemeral' },
  { key: 'schema', label: 'Schema', placeholder: 'e.g. analytics' },
];

const aiVerbs = [
  'suggest-model-name', 'detect-circular-ref', 'classify-model-layer', 'recommend-test',
  'predict-build-time', 'generate-yml-doc', 'summarize-model-dag', 'score-coverage',
  'validate-ref-targets', 'suggest-snapshot-key', 'detect-stale-model', 'recommend-incremental-strategy',
  'classify-materialization', 'predict-warehouse-cost', 'suggest-macro', 'generate-staging-model',
];

export default function WhTransformDbt() {
  return (
    <FeaturePage
      title="dbt Transforms"
      description="Manage dbt models, tests, and transformation layers"
      icon={GitBranch}
      iconBg="bg-orange-50"
      iconColor="text-orange-600"
      apiPath="/wh/transformDbt"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
