import { Table2 } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'table_name', label: 'Table Name' },
  { key: 'namespace', label: 'Namespace' },
  { key: 'format_version', label: 'Format', render: (v) => <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">v{v || 2}</span> },
  { key: 'record_count', label: 'Records', render: (v) => v?.toLocaleString() || '0' },
  { key: 'snapshot_count', label: 'Snapshots' },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'table_name', label: 'Table Name', required: true, placeholder: 'e.g. events_v2' },
  { key: 'namespace', label: 'Namespace', placeholder: 'e.g. analytics.raw' },
  { key: 'storage_location', label: 'Storage Location', placeholder: 's3://bucket/path/' },
  { key: 'format_version', label: 'Format Version', placeholder: '2' },
];

const aiVerbs = [
  'suggest-partition-key', 'optimize-file-size', 'detect-small-files', 'recommend-compaction',
  'predict-query-pruning', 'classify-cold-data', 'summarize-table-stats', 'score-table-health',
  'suggest-z-order', 'validate-schema-evolution', 'detect-snapshot-bloat', 'recommend-vacuum',
  'generate-table-doc', 'classify-update-pattern', 'predict-storage-cost', 'suggest-partition-evolution',
];

export default function WhParquetIceberg() {
  return (
    <FeaturePage
      title="Parquet / Iceberg Tables"
      description="Manage Iceberg table format, snapshots, and storage optimization"
      icon={Table2}
      iconBg="bg-indigo-50"
      iconColor="text-indigo-600"
      apiPath="/wh/parquetIceberg"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
