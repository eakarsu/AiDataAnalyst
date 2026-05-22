import { PlugZap } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'source_type', label: 'Source Type', render: (v) => <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{v || '-'}</span> },
  { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>{v || '-'}</span> },
  { key: 'run_count', label: 'Runs' },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'name', label: 'Connector Name', required: true, placeholder: 'e.g. Postgres Production' },
  { key: 'source_type', label: 'Source Type', placeholder: 'e.g. postgres, mysql, s3, bigquery' },
  { key: 'incremental_key', label: 'Incremental Key', placeholder: 'e.g. updated_at' },
  { key: 'status', label: 'Status', placeholder: 'active | paused' },
];

const aiVerbs = [
  'classify-source-type', 'suggest-schema-mapping', 'detect-schema-drift',
  'predict-ingestion-failure', 'recommend-retry-strategy', 'generate-connector-config',
  'summarize-ingestion-run', 'score-data-freshness', 'validate-source-credentials',
  'suggest-incremental-key', 'detect-duplicate-source', 'classify-pii-fields',
  'generate-source-doc', 'predict-ingestion-cost', 'recommend-throttling',
  'detect-source-decommission',
];

export default function WhIngestionConnectors() {
  return (
    <FeaturePage
      title="Ingestion Connectors"
      description="Manage and monitor data ingestion connectors"
      icon={PlugZap}
      iconBg="bg-blue-50"
      iconColor="text-blue-600"
      apiPath="/wh/ingestionConnectors"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
