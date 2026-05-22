import { Wand2 } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'source_range', label: 'Source Range', render: (v) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{v || '-'}</span> },
  { key: 'target_range', label: 'Target Range', render: (v) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{v || '-'}</span> },
  { key: 'fill_mode', label: 'Fill Mode', render: (v) => v ? <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs">{v}</span> : '-' },
  { key: 'fill_direction', label: 'Direction' },
  { key: 'confidence_score', label: 'Confidence', render: (v) => `${v || 0}%` },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'source_range', label: 'Source Range', required: true, placeholder: 'e.g. A1:A5' },
  { key: 'target_range', label: 'Target Range', required: true, placeholder: 'e.g. A6:A20' },
  { key: 'fill_mode', label: 'Fill Mode', placeholder: 'linear | categorical | formula | AI' },
  { key: 'fill_direction', label: 'Fill Direction', placeholder: 'down | right | up | left' },
];

const aiVerbs = [
  'predict-next-value', 'suggest-pattern', 'classify-fill-mode', 'detect-anomaly-in-fill',
  'generate-test-fill-data', 'recommend-fill-source', 'summarize-fill-actions', 'score-fill-confidence',
  'validate-fill-result', 'suggest-extrapolation', 'detect-pattern-break', 'recommend-interpolation',
  'classify-fill-direction', 'predict-fill-quality', 'generate-fill-explanation', 'suggest-fill-skip',
];

export default function SsAiFillDown() {
  return (
    <FeaturePage
      title="AI Fill Down"
      description="Intelligently fill cell ranges using AI-detected patterns"
      icon={Wand2}
      iconBg="bg-violet-50"
      iconColor="text-violet-600"
      apiPath="/ss/aiFillDown"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
