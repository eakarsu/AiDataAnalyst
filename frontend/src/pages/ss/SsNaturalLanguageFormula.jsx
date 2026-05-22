import { MessageSquare } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'natural_language', label: 'Question', render: (v) => <span className="italic text-gray-700">{v || '-'}</span> },
  { key: 'generated_formula', label: 'Formula', render: (v) => <span className="font-mono text-xs text-blue-700">{v || '-'}</span> },
  { key: 'intent_class', label: 'Intent', render: (v) => v ? <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">{v}</span> : '-' },
  { key: 'confidence_score', label: 'Confidence', render: (v) => `${v || 0}%` },
  { key: 'validation_passed', label: 'Valid', render: (v) => v ? <span className="text-green-500 text-xs">Yes</span> : <span className="text-gray-400 text-xs">No</span> },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'natural_language', label: 'Natural Language Question', required: true, placeholder: 'e.g. Sum all sales where region is East' },
  { key: 'generated_formula', label: 'Generated Formula', placeholder: '=SUMIF(...)' },
  { key: 'intent_class', label: 'Intent Class', placeholder: 'sum | count | average | filter | lookup | rank' },
];

const aiVerbs = [
  'nl-to-formula', 'formula-to-nl', 'suggest-question-rewrite', 'detect-ambiguity',
  'classify-intent', 'recommend-disambiguation-prompt', 'generate-test-cases', 'summarize-formula-history',
  'score-translation-confidence', 'validate-result-against-intent', 'suggest-alternative-formula',
  'detect-missing-context', 'recommend-data-source', 'classify-question-difficulty',
  'generate-followup-question', 'explain-translation',
];

export default function SsNaturalLanguageFormula() {
  return (
    <FeaturePage
      title="Natural Language Formula"
      description="Convert plain English questions into spreadsheet formulas"
      icon={MessageSquare}
      iconBg="bg-indigo-50"
      iconColor="text-indigo-600"
      apiPath="/ss/naturalLanguageFormula"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
