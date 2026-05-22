import { Network } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'asset_name', label: 'Asset' },
  { key: 'asset_type', label: 'Type', render: (v) => <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs">{v || '-'}</span> },
  { key: 'upstream_count', label: 'Upstream' },
  { key: 'downstream_count', label: 'Downstream' },
  { key: 'lineage_completeness', label: 'Completeness', render: (v) => `${v || 0}%` },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'asset_name', label: 'Asset Name', required: true, placeholder: 'e.g. orders_table' },
  { key: 'asset_type', label: 'Asset Type', placeholder: 'table | view | model | dashboard | report' },
  { key: 'upstream_assets', label: 'Upstream Assets', placeholder: 'Comma-separated list' },
  { key: 'tags', label: 'Tags', placeholder: 'e.g. pii, critical' },
];

const aiVerbs = [
  'trace-upstream', 'trace-downstream', 'suggest-impact-radius', 'predict-breaking-change',
  'classify-lineage-gap', 'recommend-lineage-test', 'summarize-data-flow', 'score-lineage-completeness',
  'validate-column-level-lineage', 'detect-orphan-asset', 'suggest-tag-propagation', 'generate-lineage-doc',
  'classify-dependency-type', 'predict-cascade-failure', 'recommend-quarantine', 'summarize-blast-radius',
];

export default function WhLineage() {
  return (
    <FeaturePage
      title="Data Lineage"
      description="Track upstream/downstream asset dependencies and impact analysis"
      icon={Network}
      iconBg="bg-teal-50"
      iconColor="text-teal-600"
      apiPath="/wh/lineage"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
