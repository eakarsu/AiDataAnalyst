import { ShieldCheck } from 'lucide-react';
import FeaturePage from '../../components/FeaturePage';

const columns = [
  { key: 'policy_name', label: 'Policy' },
  { key: 'policy_type', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'rls' ? 'bg-red-50 text-red-700' : v === 'mask' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>{v || '-'}</span> },
  { key: 'data_sensitivity', label: 'Sensitivity' },
  { key: 'effectiveness_score', label: 'Effectiveness', render: (v) => `${v || 0}%` },
  { key: 'is_active', label: 'Active', render: (v) => v ? <span className="text-green-500 text-xs font-medium">Active</span> : <span className="text-gray-400 text-xs">Inactive</span> },
  { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const formFields = [
  { key: 'policy_name', label: 'Policy Name', required: true, placeholder: 'e.g. pii_mask_email' },
  { key: 'policy_type', label: 'Policy Type', placeholder: 'rls | mask | column-level | object' },
  { key: 'data_sensitivity', label: 'Data Sensitivity', placeholder: 'public | internal | confidential | restricted' },
  { key: 'policy_rule', label: 'Policy Rule / SQL', placeholder: 'WHERE user_id = CURRENT_USER()', type: 'textarea' },
];

const aiVerbs = [
  'suggest-rls-rule', 'detect-overprovisioned-access', 'classify-data-sensitivity', 'predict-access-abuse',
  'recommend-policy-tightening', 'generate-policy-doc', 'summarize-access-events', 'score-policy-effectiveness',
  'validate-policy-syntax', 'suggest-mask-rule', 'detect-policy-conflict', 'classify-role-need',
  'recommend-jit-access', 'predict-policy-violation', 'generate-audit-export', 'redact-by-policy',
];

export default function WhAccessPolicies() {
  return (
    <FeaturePage
      title="Access Policies"
      description="Manage row-level security, masking, and data governance policies"
      icon={ShieldCheck}
      iconBg="bg-red-50"
      iconColor="text-red-600"
      apiPath="/wh/accessPolicies"
      columns={columns}
      createFields={formFields}
      aiVerbs={aiVerbs}
    />
  );
}
