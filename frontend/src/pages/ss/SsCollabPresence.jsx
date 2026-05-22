import { Users } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'session_token', label: 'Session', render: (v) => <span className="font-mono text-xs truncate max-w-[120px] block">{v || '-'}</span> },
  { key: 'active_cell', label: 'Active Cell', render: (v) => v ? <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{v}</span> : '-' },
  { key: 'is_idle', label: 'Idle', render: (v) => v ? <span className="text-yellow-500 text-xs">Idle</span> : <span className="text-green-500 text-xs">Active</span> },
  { key: 'health_score', label: 'Health', render: (v) => <span className={`text-xs font-medium ${v >= 80 ? 'text-green-600' : v >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{v || 0}</span> },
  { key: 'edit_count', label: 'Edits' },
  { key: 'created_at', label: 'Started', render: (v) => v ? new Date(v).toLocaleString() : '-' },
];

const formFields = [
  { key: 'session_token', label: 'Session Token', placeholder: 'Auto-generated if left blank' },
  { key: 'active_cell', label: 'Active Cell', placeholder: 'e.g. B3' },
  { key: 'grid_id', label: 'Grid ID', placeholder: 'Optional parent grid ID' },
];

const aiVerbs = [
  'classify-edit-conflict', 'suggest-merge-resolution', 'detect-stale-cursor', 'predict-collision',
  'recommend-lock-strategy', 'generate-presence-summary', 'summarize-collab-session', 'score-collab-health',
  'validate-presence-state', 'suggest-mention', 'detect-idle-user', 'recommend-handoff',
  'classify-comment-priority', 'predict-comment-resolution', 'generate-edit-summary', 'suggest-collab-workflow',
];

export default function SsCollabPresence() {
  return (
    <FeaturePage
      title="Collab Presence"
      description="Real-time collaboration sessions, cursor tracking, and conflict resolution"
      icon={Users}
      iconBg="bg-sky-50"
      iconColor="text-sky-600"
      apiPath="/ss/collabPresence"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
