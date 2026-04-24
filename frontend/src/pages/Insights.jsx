import { useState, useEffect } from 'react';
import api from '../services/api';
import DataList from '../components/DataList';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import {
  Lightbulb, Sparkles, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Target, Zap, Clock, ArrowRight,
  BarChart3, Shield, ChevronRight, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, Activity, Plus
} from 'lucide-react';

const testInputs = [
  { label: 'Sales Trends', text: 'Analyze our sales data for the past 6 months. Identify top-performing products, revenue trends, and seasonal patterns.' },
  { label: 'Customer Churn', text: 'Examine customer churn patterns. What are the leading indicators of churn and which customer segments are most at risk?' },
  { label: 'Revenue Forecast', text: 'Based on historical revenue data, provide insights on expected growth trajectory and potential risks for next quarter.' },
  { label: 'Cost Optimization', text: 'Analyze operational costs across departments. Identify areas of overspending and recommend cost-saving opportunities.' },
  { label: 'User Engagement', text: 'Review user engagement metrics including DAU, session duration, and feature adoption. What areas need improvement?' },
  { label: 'Market Comparison', text: 'Compare our performance metrics against industry benchmarks. Where do we outperform and where do we lag behind?' },
  { label: 'Anomaly Detection', text: 'Scan recent data for unusual patterns or anomalies that may indicate issues or opportunities we should investigate.' },
  { label: 'Conversion Funnel', text: 'Analyze the conversion funnel from lead to customer. Identify drop-off points and suggest improvements.' },
];

function safeParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function TrendIcon({ trend }) {
  if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-green-500" />;
  if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
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
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[p] || styles[3]}`}>
      P{p} {labels[p] || ''}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const v = Number(value) || 0;
  const color = v >= 80 ? 'bg-green-500' : v >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${v}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700">{v}%</span>
    </div>
  );
}

function InsightDetail({ insight, onDigDeeper, onReanalyze, onChallenge, onActionPlan }) {
  const dataPoints = safeParse(insight.data_points, {});
  const keyMetrics = dataPoints.key_metrics || [];
  const analysisSections = dataPoints.analysis_sections || [];
  const risks = dataPoints.risks || [];
  const opportunities = dataPoints.opportunities || [];
  const recommendations = safeParse(insight.recommendations, []);

  const getTypeConfig = (type) => {
    const configs = {
      opportunity: { icon: Target, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Opportunity' },
      risk: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Risk' },
      trend: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Trend' },
      anomaly: { icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Anomaly' },
      optimization: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Optimization' },
    };
    return configs[type] || configs.trend;
  };

  const typeConfig = getTypeConfig(insight.insight_type);
  const TypeIcon = typeConfig.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
          <TypeIcon className="h-4 w-4" />{typeConfig.label}
        </span>
        <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg border ${
          insight.impact === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
          insight.impact === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
          'bg-green-50 text-green-700 border-green-200'
        }`}>
          {insight.impact?.charAt(0).toUpperCase() + insight.impact?.slice(1)} Impact
        </span>
        {insight.created_at && (
          <span className="flex items-center gap-1.5 text-sm text-gray-500"><Clock className="h-4 w-4" />{new Date(insight.created_at).toLocaleString()}</span>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Confidence Level</p>
        <ConfidenceBar value={insight.confidence} />
      </div>

      {insight.content && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-primary-800 uppercase tracking-wide mb-2">Executive Summary</h4>
          <p className="text-gray-700 leading-relaxed">{insight.content}</p>
        </div>
      )}

      {keyMetrics.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-gray-500" /> Key Metrics</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {keyMetrics.map((m, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{m.name}</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-gray-900">{m.value}</span>
                  {m.trend && <TrendIcon trend={m.trend} />}
                </div>
                {m.change_percent != null && (
                  <p className={`text-xs mt-1 font-medium ${m.trend === 'up' ? 'text-green-600' : m.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                    {m.change_percent > 0 ? '+' : ''}{m.change_percent}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysisSections.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Detailed Analysis</h4>
          <div className="space-y-4">
            {analysisSections.map((section, i) => (
              <div key={i} className="border-l-4 border-primary-300 pl-4">
                <h5 className="font-semibold text-gray-800 mb-1">{section.heading}</h5>
                <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Recommendations</h4>
          <div className="space-y-3">
            {recommendations.map((rec, i) => {
              const r = typeof rec === 'string' ? { title: rec, description: rec, priority: 3 } : rec;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ChevronRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                        <h5 className="font-semibold text-gray-800">{r.title}</h5>
                      </div>
                      {r.description && r.description !== r.title && (<p className="text-sm text-gray-600 ml-6">{r.description}</p>)}
                      {r.expected_impact && (<p className="text-xs text-gray-500 ml-6 mt-1">Expected impact: <span className="font-medium capitalize">{r.expected_impact}</span></p>)}
                    </div>
                    <PriorityBadge priority={r.priority} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(risks.length > 0 || opportunities.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {risks.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-800 uppercase tracking-wide mb-2 flex items-center gap-2"><XCircle className="h-4 w-4" /> Risks</h4>
              <ul className="space-y-1.5">
                {risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {typeof r === 'string' ? r : r.description || JSON.stringify(r)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {opportunities.length > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-2 flex items-center gap-2"><Target className="h-4 w-4" /> Opportunities</h4>
              <ul className="space-y-1.5">
                {opportunities.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    {typeof o === 'string' ? o : o.description || JSON.stringify(o)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        <button onClick={onDigDeeper} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm">
          <ArrowRight className="h-4 w-4" /> Dig Deeper
        </button>
        <button onClick={onReanalyze} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <Sparkles className="h-4 w-4" /> Re-analyze
        </button>
        <button onClick={onChallenge} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
          <AlertTriangle className="h-4 w-4" /> Challenge This
        </button>
        <button onClick={onActionPlan} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
          <Target className="h-4 w-4" /> Action Plan
        </button>
      </div>
    </div>
  );
}

export default function Insights() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [context, setContext] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState(null);

  useEffect(() => { loadData(); }, [page, search, sortField, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getInsights({ page, limit: 20, search, sort: sortField, order: sortOrder });
      setItems(result.data || result);
      setPagination(result.pagination || null);
    } catch (e) {
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.generateInsight({ sample: true }, context);
      setModalOpen(false);
      setContext('');
      toast.success('Insight generated successfully');
      loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to generate insight');
    } finally {
      setGenerating(false);
    }
  };

  const handleRowClick = (item) => {
    setSelectedInsight(item);
    setDetailModalOpen(true);
  };

  const openGenerateWith = (prefill) => {
    setDetailModalOpen(false);
    setContext(prefill);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    await api.deleteInsight(id);
  };

  const handleSearch = (value) => { setSearch(value); setPage(1); };

  const handleSort = (field) => {
    if (sortField === field) { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }
    else { setSortField(field); setSortOrder('asc'); }
    setPage(1);
  };

  const getTypeIcon = (type) => {
    const icons = { opportunity: Target, risk: AlertTriangle, trend: TrendingUp, optimization: Zap, default: Lightbulb };
    const Icon = icons[type] || icons.default;
    return <Icon className="h-4 w-4" />;
  };

  const getImpactColor = (impact) => {
    const colors = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };
    return colors[impact] || 'bg-gray-100 text-gray-700';
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'insight_type', label: 'Type', render: (v) => <div className="flex items-center gap-2">{getTypeIcon(v)}<span className="capitalize">{v}</span></div> },
    { key: 'confidence', label: 'Confidence', render: (v) => (
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${Number(v) >= 80 ? 'bg-green-500' : Number(v) >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${v}%` }} />
        </div>
        <span className="text-sm font-medium">{v}%</span>
      </div>
    )},
    { key: 'impact', label: 'Impact', render: (v) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(v)}`}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`capitalize ${v === 'new' ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>{v}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-50 rounded-lg"><Lightbulb className="h-6 w-6 text-yellow-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">AI Insights</h1><p className="text-gray-500">AI-powered insights and recommendations</p></div>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> Generate Insight
        </button>
      </div>

      <DataList
        title="All Insights"
        icon={Lightbulb}
        iconColor="yellow"
        items={items}
        columns={columns}
        loading={loading}
        entityType="insights"
        detailType="insights"
        pagination={pagination}
        onPageChange={setPage}
        onSearch={handleSearch}
        onSort={handleSort}
        onDelete={handleDelete}
        onRefresh={loadData}
        sortField={sortField}
        sortOrder={sortOrder}
        searchValue={search}
        onRowClick={handleRowClick}
      />

      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={selectedInsight?.title || 'Insight Details'} size="lg">
        {selectedInsight && (
          <InsightDetail
            insight={selectedInsight}
            onDigDeeper={() => openGenerateWith(`Follow up on insight: "${selectedInsight.title}". ${selectedInsight.content || ''} Provide deeper analysis and updated recommendations.`)}
            onReanalyze={() => openGenerateWith(`Re-analyze: ${selectedInsight.title}. Previous finding: ${selectedInsight.content || ''}. Has anything changed?`)}
            onChallenge={() => openGenerateWith(`Provide counter-arguments and risks for: "${selectedInsight.title}". Challenge the assumptions and identify blind spots.`)}
            onActionPlan={() => openGenerateWith(`Create an action plan based on: "${selectedInsight.title}". Include specific steps, timelines, and responsible parties.`)}
          />
        )}
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate AI Insight" size="lg">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Context (what would you like insights about?)</label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={4} placeholder="e.g., Analyze our sales data for Q4 opportunities..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Test Inputs</label>
            <div className="flex flex-wrap gap-2">
              {testInputs.map((input, i) => (
                <button key={i} type="button" onClick={() => setContext(input.text)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">
                  {input.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setModalOpen(false); setContext(''); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Generating...</> : <><Sparkles className="h-4 w-4" />Generate Insight</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
