import { BarChart3 } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'chart_name', label: 'Chart Name' },
  { key: 'chart_type', label: 'Type', render: (v) => <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">{v || '-'}</span> },
  { key: 'chart_purpose', label: 'Purpose' },
  { key: 'effectiveness_score', label: 'Effectiveness', render: (v) => <span className={`text-xs font-medium ${v >= 80 ? 'text-green-600' : v >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{v || 0}</span> },
  { key: 'data_source_range', label: 'Data Range', render: (v) => v ? <span className="font-mono text-xs">{v}</span> : '-' },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'chart_name', label: 'Chart Name', required: true, placeholder: 'e.g. Monthly Revenue Trend' },
  { key: 'chart_type', label: 'Chart Type', placeholder: 'bar | line | pie | scatter | area | heatmap' },
  { key: 'chart_purpose', label: 'Purpose', placeholder: 'comparison | distribution | trend | composition | relationship' },
  { key: 'data_source_range', label: 'Data Source Range', placeholder: 'e.g. A1:D24' },
];

const aiVerbs = [
  'suggest-chart-type', 'detect-misleading-chart', 'classify-data-shape', 'recommend-axis',
  'predict-chart-confusion', 'generate-chart-caption', 'summarize-chart-insight', 'score-chart-effectiveness',
  'validate-chart-config', 'suggest-color-palette', 'detect-low-info-chart', 'recommend-chart-simplification',
  'classify-chart-purpose', 'predict-chart-perf', 'generate-chart-alt-text', 'suggest-annotation',
];

export default function SsChartsApi() {
  return (
    <FeaturePage
      title="Charts API"
      description="Configure, optimize, and analyze spreadsheet chart visualizations"
      icon={BarChart3}
      iconBg="bg-amber-50"
      iconColor="text-amber-600"
      apiPath="/ss/chartsApi"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
