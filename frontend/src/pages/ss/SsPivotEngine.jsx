import { PieChart } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'pivot_name', label: 'Pivot Name' },
  { key: 'aggregation_type', label: 'Aggregation', render: (v) => <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-xs">{v || '-'}</span> },
  { key: 'use_case', label: 'Use Case' },
  { key: 'clarity_score', label: 'Clarity', render: (v) => <span className={`text-xs font-medium ${v >= 80 ? 'text-green-600' : v >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{v || 0}</span> },
  { key: 'refresh_cost_estimate', label: 'Est. Cost' },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'pivot_name', label: 'Pivot Name', required: true, placeholder: 'e.g. Sales by Region Q1' },
  { key: 'aggregation_type', label: 'Aggregation', placeholder: 'sum | count | average | min | max' },
  { key: 'use_case', label: 'Use Case', placeholder: 'reporting | exploration | monitoring | presentation' },
  { key: 'grid_id', label: 'Grid ID', placeholder: 'Optional parent grid ID' },
];

const aiVerbs = [
  'suggest-pivot-config', 'detect-pivot-pattern', 'classify-grouping-key', 'recommend-aggregation',
  'predict-pivot-perf', 'generate-pivot-summary', 'summarize-pivot-result', 'score-pivot-clarity',
  'validate-pivot-completeness', 'suggest-row-vs-column', 'detect-pivot-fanout', 'recommend-pivot-simplification',
  'classify-pivot-use-case', 'predict-pivot-refresh-cost', 'generate-pivot-narrative', 'suggest-drill-down',
];

export default function SsPivotEngine() {
  return (
    <FeaturePage
      title="Pivot Engine"
      description="Build and optimize pivot table configurations and aggregations"
      icon={PieChart}
      iconBg="bg-rose-50"
      iconColor="text-rose-600"
      apiPath="/ss/pivotEngine"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
