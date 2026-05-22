import { Code } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'cell_ref', label: 'Cell Ref', render: (v) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{v || '-'}</span> },
  { key: 'formula_text', label: 'Formula', render: (v) => <span className="font-mono text-xs text-blue-700 truncate max-w-xs block">{v || '-'}</span> },
  { key: 'formula_type', label: 'Type' },
  { key: 'is_volatile', label: 'Volatile', render: (v) => v ? <span className="text-yellow-500 text-xs">Yes</span> : <span className="text-gray-400 text-xs">No</span> },
  { key: 'is_circular', label: 'Circular', render: (v) => v ? <span className="text-red-500 text-xs">Yes</span> : <span className="text-green-500 text-xs">No</span> },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'cell_ref', label: 'Cell Reference', required: true, placeholder: 'e.g. B5' },
  { key: 'formula_text', label: 'Formula', required: true, placeholder: '=SUM(A1:A10)' },
  { key: 'formula_type', label: 'Formula Type', placeholder: 'lookup | math | text | logical | date | array' },
  { key: 'grid_id', label: 'Grid ID', placeholder: 'Optional parent grid ID' },
];

const aiVerbs = [
  'explain-formula', 'suggest-formula-fix', 'detect-circular-ref', 'classify-formula-type',
  'recommend-simplification', 'predict-formula-error', 'generate-formula-doc', 'summarize-formula-usage',
  'validate-formula-syntax', 'suggest-array-formula', 'detect-volatile-formula', 'recommend-named-range',
  'classify-formula-perf-impact', 'predict-recompute-cost', 'suggest-power-formula', 'explain-result-mismatch',
];

export default function SsFormulaEngine() {
  return (
    <FeaturePage
      title="Formula Engine"
      description="Manage, validate, and optimize spreadsheet formulas"
      icon={Code}
      iconBg="bg-blue-50"
      iconColor="text-blue-600"
      apiPath="/ss/formulaEngine"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
