import { BookOpen } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'metric_name', label: 'Metric' },
  { key: 'metric_type', label: 'Type', render: (v) => <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">{v || '-'}</span> },
  { key: 'grain', label: 'Grain' },
  { key: 'quality_score', label: 'Quality', render: (v) => <span className={`text-xs font-medium ${v >= 80 ? 'text-green-600' : v >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{v || 0}</span> },
  { key: 'is_deprecated', label: 'Deprecated', render: (v) => v ? <span className="text-red-500 text-xs">Yes</span> : <span className="text-green-500 text-xs">No</span> },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'metric_name', label: 'Metric Name', required: true, placeholder: 'e.g. monthly_active_users' },
  { key: 'metric_type', label: 'Metric Type', placeholder: 'simple | ratio | cumulative | derived' },
  { key: 'grain', label: 'Grain', placeholder: 'e.g. day, week, month' },
  { key: 'formula', label: 'Formula / Definition', placeholder: 'e.g. COUNT(DISTINCT user_id)', type: 'textarea' },
];

const aiVerbs = [
  'suggest-metric-definition', 'detect-metric-drift', 'classify-dimension', 'predict-metric-usage',
  'recommend-pre-aggregation', 'generate-metric-doc', 'summarize-metric-tree', 'score-metric-quality',
  'validate-metric-formula', 'suggest-synonym', 'detect-metric-duplicate', 'recommend-deprecation',
  'classify-grain', 'predict-query-fanout', 'generate-glossary-entry', 'suggest-row-level-security-rule',
];

export default function WhSemanticLayer() {
  return (
    <FeaturePage
      title="Semantic Layer"
      description="Define and manage metrics, dimensions, and business logic"
      icon={BookOpen}
      iconBg="bg-purple-50"
      iconColor="text-purple-600"
      apiPath="/wh/semanticLayer"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
