import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
  BookOpen, Sparkles, FileText, Users, Mic, CheckCircle, List,
  ArrowRight, ChevronRight, BarChart3, Clock, Target, MessageSquare
} from 'lucide-react';

function safeParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function PriorityBadge({ priority }) {
  const p = Number(priority) || 3;
  const styles = {
    1: 'bg-red-100 text-red-700 border-red-200',
    2: 'bg-orange-100 text-orange-700 border-orange-200',
    3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    4: 'bg-blue-100 text-blue-700 border-blue-200',
    5: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const labels = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low', 5: 'Info' };
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[p] || styles[3]}`}>P{p} {labels[p] || ''}</span>;
}

const FORMAT_CONFIG = {
  executive_summary: { label: 'Executive Summary', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  detailed_report: { label: 'Detailed Report', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  presentation: { label: 'Presentation', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  email: { label: 'Email', color: 'bg-pink-100 text-pink-700 border-pink-200' },
};

const TONE_CONFIG = {
  formal: { color: 'bg-blue-100 text-blue-700 border-blue-200' },
  professional: { color: 'bg-gray-100 text-gray-700 border-gray-200' },
  conversational: { color: 'bg-green-100 text-green-700 border-green-200' },
  urgent: { color: 'bg-red-100 text-red-700 border-red-200' },
  analytical: { color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const AUDIENCE_ICONS = { executive: Users, technical: FileText, general: BookOpen };

function NarrativeDetail({ item }) {
  const keyFindings = safeParse(item.key_findings, []);
  const actionItems = safeParse(item.action_items, []);
  const visualizations = safeParse(item.visualizations, []);
  const formatConf = FORMAT_CONFIG[item.narrative_type] || FORMAT_CONFIG.executive_summary;
  const toneConf = TONE_CONFIG[item.tone] || TONE_CONFIG.professional;
  const AudienceIcon = AUDIENCE_ICONS[item.audience] || BookOpen;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-rose-800">{item.title}</h2>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${formatConf.color}`}>
            {formatConf.label}
          </span>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${toneConf.color}`}>
            {item.tone}
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg border bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1">
            <AudienceIcon className="h-3.5 w-3.5" />
            {item.audience}
          </span>
          <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {item.word_count} words
          </span>
          {item.created_at && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              {new Date(item.created_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      {item.executive_summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Executive Summary
          </h3>
          <p className="text-blue-900 leading-relaxed text-lg">{item.executive_summary}</p>
        </div>
      )}

      {/* Key Findings */}
      {keyFindings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> Key Findings
          </h3>
          <div className="space-y-2">
            {keyFindings.map((finding, i) => {
              const text = typeof finding === 'object' ? (finding.finding || finding.description || finding.text || JSON.stringify(finding)) : finding;
              return (
                <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <span className="text-gray-700 leading-relaxed">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      {item.detailed_analysis && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Detailed Analysis</h3>
          <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{item.detailed_analysis}</div>
        </div>
      )}

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" /> Action Items
          </h3>
          <div className="space-y-3">
            {actionItems.map((action, i) => {
              const a = typeof action === 'string' ? { action: action, priority: 3 } : action;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ChevronRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                        <h5 className="font-semibold text-gray-800">{a.action}</h5>
                      </div>
                      <div className="flex flex-wrap gap-3 ml-6 text-sm text-gray-500">
                        {a.owner && a.owner !== 'TBD' && <span>Owner: <span className="font-medium text-gray-700">{a.owner}</span></span>}
                        {a.deadline && a.deadline !== 'TBD' && <span>Due: <span className="font-medium text-gray-700">{a.deadline}</span></span>}
                      </div>
                    </div>
                    <PriorityBadge priority={a.priority} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visualizations */}
      {visualizations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-500" /> Recommended Visualizations
          </h3>
          <div className="flex flex-wrap gap-2">
            {visualizations.map((viz, i) => {
              const label = typeof viz === 'object' ? (viz.type || viz.name || JSON.stringify(viz)) : viz;
              return (
                <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm font-medium capitalize">
                  {label.replace(/_/g, ' ')}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Narratives() {
  const [narratives, setNarratives] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [formData, setFormData] = useState({
    insight_id: '', insight_data: '', audience: 'general', tone: 'professional', format_type: 'executive_summary'
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [narrativesData, insightsData] = await Promise.all([api.getNarratives(), api.getInsights()]);
      setNarratives(narrativesData);
      setInsights(insightsData);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const payload = { ...formData, insight_data: formData.insight_data ? JSON.parse(formData.insight_data) : null };
      await api.generateNarrative(payload);
      setModalOpen(false);
      setFormData({ insight_id: '', insight_data: '', audience: 'general', tone: 'professional', format_type: 'executive_summary' });
      loadData();
    } catch (e) { console.error(e); alert('Error: ' + e.message); } finally { setGenerating(false); }
  };

  const handleDelete = async (item) => {
    if (confirm('Delete this narrative?')) {
      try { await api.deleteNarrative(item.id); loadData(); } catch (e) { console.error(e); }
    }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (v) => <span className="font-medium">{v}</span> },
    { key: 'insight_title', label: 'Source', render: (v) => v || <span className="text-gray-400">Custom</span> },
    { key: 'narrative_type', label: 'Format', render: (v) => {
      const conf = FORMAT_CONFIG[v] || FORMAT_CONFIG.executive_summary;
      return <span className={`px-2 py-0.5 text-xs font-medium rounded-lg border ${conf.color}`}>{conf.label}</span>;
    }},
    { key: 'audience', label: 'Audience', render: (v) => {
      const Icon = AUDIENCE_ICONS[v] || BookOpen;
      return <div className="flex items-center gap-1"><Icon className="h-4 w-4 text-gray-400" /><span className="capitalize">{v}</span></div>;
    }},
    { key: 'tone', label: 'Tone', render: (v) => {
      const conf = TONE_CONFIG[v] || TONE_CONFIG.professional;
      return <span className={`px-2 py-0.5 text-xs font-medium rounded-lg border ${conf.color}`}>{v}</span>;
    }},
    { key: 'word_count', label: 'Words', render: (v) => v?.toLocaleString() || '0' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-50 rounded-lg"><BookOpen className="h-6 w-6 text-rose-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insight Narrator</h1>
          <p className="text-gray-500">Transform data insights into compelling narratives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-lg"><BookOpen className="h-5 w-5 text-rose-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{narratives.length}</p><p className="text-sm text-gray-500">Narratives</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg"><FileText className="h-5 w-5 text-indigo-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{narratives.filter(n => n.narrative_type === 'executive_summary').length}</p><p className="text-sm text-gray-500">Exec Summaries</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg"><List className="h-5 w-5 text-teal-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{narratives.filter(n => n.narrative_type === 'detailed_report').length}</p><p className="text-sm text-gray-500">Reports</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg"><Mic className="h-5 w-5 text-orange-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{narratives.reduce((a,b) => a + (b.word_count || 0), 0).toLocaleString()}</p><p className="text-sm text-gray-500">Total Words</p></div>
          </div>
        </div>
      </div>

      <DataTable title="Insight Narratives" data={narratives} columns={columns} loading={loading} onRowClick={(item) => setDetailModal(item)} onAdd={() => setModalOpen(true)} onDelete={handleDelete} addLabel="Generate Narrative" emptyMessage="No narratives yet. Transform an insight into a story!" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate Insight Narrative" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Insight (optional)</label>
            <select value={formData.insight_id} onChange={(e) => setFormData({ ...formData, insight_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">Select an existing insight</option>
              {insights.map(insight => <option key={insight.id} value={insight.id}>{insight.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Or Provide Custom Data (JSON)</label>
            <textarea value={formData.insight_data} onChange={(e) => setFormData({ ...formData, insight_data: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm" rows={4} placeholder='{"title": "Sales Growth", "content": "Sales increased 25% in Q4", "impact": "high"}' />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Load Example</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFormData({ ...formData, insight_data: '{"title": "Q4 Revenue Surge Driven by Enterprise Deals", "content": "Revenue increased 34% QoQ in Q4, driven primarily by 12 new enterprise contracts averaging $250K ARR. SMB segment grew 8%. Total ARR reached $18.5M, exceeding the $16M target by 15.6%. Customer acquisition cost decreased 12% while lifetime value increased 22%.", "impact": "high", "confidence": 92, "insight_type": "trend"}', audience: 'executive', tone: 'formal', format_type: 'executive_summary' })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">Revenue Report</button>
              <button type="button" onClick={() => setFormData({ ...formData, insight_data: '{"title": "Critical Infrastructure Reliability Gap", "content": "System uptime dropped to 97.2% in November, below our 99.9% SLA target. Root cause: 3 major incidents traced to database connection pool exhaustion during peak hours. Average incident resolution time was 47 minutes. Affected 2,300 customers across 15 enterprise accounts.", "impact": "high", "confidence": 88, "insight_type": "risk"}', audience: 'technical', tone: 'urgent', format_type: 'detailed_report' })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">Incident Report</button>
              <button type="button" onClick={() => setFormData({ ...formData, insight_data: '{"title": "Customer Churn Reduction Success", "content": "Monthly churn rate decreased from 4.2% to 2.1% after implementing the proactive engagement program. Key drivers: automated health scoring identified 340 at-risk accounts, 78% of which were retained through targeted interventions. Net Promoter Score improved from 32 to 58. Annual retention rate now at 91%.", "impact": "high", "confidence": 95, "insight_type": "opportunity"}', audience: 'general', tone: 'conversational', format_type: 'presentation' })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">Churn Analysis</button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <select value={formData.audience} onChange={(e) => setFormData({ ...formData, audience: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="executive">Executive</option><option value="technical">Technical</option><option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
              <select value={formData.tone} onChange={(e) => setFormData({ ...formData, tone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="formal">Formal</option><option value="professional">Professional</option><option value="conversational">Conversational</option><option value="urgent">Urgent</option><option value="analytical">Analytical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select value={formData.format_type} onChange={(e) => setFormData({ ...formData, format_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="executive_summary">Executive Summary</option><option value="detailed_report">Detailed Report</option><option value="presentation">Presentation</option><option value="email">Email</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Generating...</> : <><Sparkles className="h-4 w-4" />Generate Narrative</>}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Narrative Details" size="xl">
        {detailModal && <NarrativeDetail item={detailModal} />}
      </Modal>
    </div>
  );
}
