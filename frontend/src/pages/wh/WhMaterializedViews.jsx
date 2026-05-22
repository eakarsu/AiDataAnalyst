import { Layers } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'view_name', label: 'View Name' },
  { key: 'mv_pattern', label: 'Pattern', render: (v) => <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">{v || '-'}</span> },
  { key: 'roi_score', label: 'ROI Score', render: (v) => <span className={`text-xs font-medium ${v >= 80 ? 'text-green-600' : v >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{v || 0}</span> },
  { key: 'hit_count', label: 'Hits' },
  { key: 'is_stale', label: 'Stale', render: (v) => v ? <span className="text-red-500 text-xs">Yes</span> : <span className="text-green-500 text-xs">No</span> },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'view_name', label: 'View Name', required: true, placeholder: 'e.g. mv_daily_revenue' },
  { key: 'base_query', label: 'Base Query', required: true, placeholder: 'SELECT ...', type: 'textarea' },
  { key: 'mv_pattern', label: 'Pattern', placeholder: 'aggregate | join | filter' },
  { key: 'refresh_schedule', label: 'Refresh Schedule', placeholder: 'e.g. 0 * * * * (every hour)' },
];

const aiVerbs = [
  'suggest-mv-candidate', 'detect-stale-mv', 'predict-mv-refresh-cost', 'recommend-mv-eviction',
  'classify-mv-usage', 'generate-mv-ddl', 'summarize-mv-hits', 'score-mv-roi',
  'validate-mv-grain', 'suggest-incremental-refresh', 'detect-mv-overlap', 'recommend-mv-consolidation',
  'classify-mv-pattern', 'predict-refresh-window', 'generate-mv-doc', 'suggest-precompute-strategy',
];

export default function WhMaterializedViews() {
  return (
    <FeaturePage
      title="Materialized Views"
      description="Manage pre-computed views for query acceleration and ROI optimization"
      icon={Layers}
      iconBg="bg-emerald-50"
      iconColor="text-emerald-600"
      apiPath="/wh/materializedViews"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
