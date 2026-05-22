import { Grid } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'sheet_name', label: 'Sheet' },
  { key: 'sheet_purpose', label: 'Purpose', render: (v) => v ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{v}</span> : '-' },
  { key: 'row_count', label: 'Rows' },
  { key: 'col_count', label: 'Columns' },
  { key: 'quality_score', label: 'Quality', render: (v) => <span className={`text-xs font-medium ${v >= 80 ? 'text-green-600' : v >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{v || 0}</span> },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'sheet_name', label: 'Sheet Name', required: true, placeholder: 'e.g. Q1 Sales Data' },
  { key: 'sheet_purpose', label: 'Sheet Purpose', placeholder: 'dashboard | data-entry | report | pivot' },
  { key: 'workbook_id', label: 'Workbook ID', placeholder: 'Optional parent workbook' },
];

const aiVerbs = [
  'suggest-cell-format', 'detect-data-anomaly', 'classify-cell-type', 'predict-cell-value',
  'recommend-conditional-format', 'generate-summary-row', 'summarize-sheet-changes', 'score-sheet-quality',
  'validate-cell-formula', 'suggest-data-validation', 'detect-merged-cell-issue', 'recommend-frozen-pane',
  'classify-sheet-purpose', 'predict-grid-perf-issue', 'generate-sheet-doc', 'suggest-sheet-template',
];

export default function SsCellGrid() {
  return (
    <FeaturePage
      title="Cell Grid"
      description="Manage spreadsheet grids, cell data, and sheet configurations"
      icon={Grid}
      iconBg="bg-green-50"
      iconColor="text-green-600"
      apiPath="/ss/cellGrid"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
