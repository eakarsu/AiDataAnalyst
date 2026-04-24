import { useState, useEffect } from 'react';
import api from '../services/api';
import DataList from '../components/DataList';
import Modal from '../components/Modal';
import BarChartWidget from '../components/charts/BarChartWidget';
import toast from 'react-hot-toast';
import {
  AlertTriangle, CheckCircle, XCircle, Sparkles, ChevronRight,
  TrendingUp, TrendingDown, Target, Shield, Lightbulb, Clock, Activity, Plus
} from 'lucide-react';

function safeParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function getSeverityConfig(severity) {
  const configs = {
    critical: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', gradient: 'from-red-50 to-rose-50', border: 'border-red-200' },
    high: { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', gradient: 'from-orange-50 to-amber-50', border: 'border-orange-200' },
    medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', gradient: 'from-yellow-50 to-amber-50', border: 'border-yellow-200' },
    low: { color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', gradient: 'from-green-50 to-emerald-50', border: 'border-green-200' },
  };
  return configs[severity] || configs.medium;
}

function AnomalyDetail({ item, onResolve }) {
  const desc = safeParse(item.description, {});
  const causes = desc.possibleCauses || [];
  const recommendations = desc.recommendations || [];
  const sevConfig = getSeverityConfig(item.severity);
  const deviation = Number(item.deviation_percentage) || 0;
  const isPositive = deviation > 0;

  return (
    <div className="space-y-6">
      <div className={`bg-gradient-to-r ${sevConfig.gradient} border ${sevConfig.border} rounded-xl p-5`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <AlertTriangle className={`h-6 w-6 ${item.severity === 'critical' ? 'text-red-600' : item.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{item.metric_name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${sevConfig.color}`}>{(item.severity || 'medium').toUpperCase()}</span>
                <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {isPositive ? '+' : ''}{deviation}% deviation
                </span>
                {item.is_resolved ? (
                  <span className="flex items-center gap-1 text-sm text-green-600 font-medium"><CheckCircle className="h-4 w-4" />Resolved</span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-orange-600 font-medium"><Clock className="h-4 w-4" />Open</span>
                )}
              </div>
            </div>
          </div>
          {!item.is_resolved && (
            <button onClick={() => onResolve(item)} className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Mark Resolved
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Expected Value</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{Number(item.expected_value)?.toLocaleString()}</p>
        </div>
        <div className={`${isPositive ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-xl p-4 text-center`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isPositive ? 'text-red-600' : 'text-green-600'}`}>Actual Value</p>
          <p className={`text-3xl font-bold mt-1 ${isPositive ? 'text-red-700' : 'text-green-700'}`}>{Number(item.actual_value)?.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Deviation</p>
          <p className={`text-3xl font-bold mt-1 ${isPositive ? 'text-red-600' : 'text-green-600'}`}>{isPositive ? '+' : ''}{deviation}%</p>
        </div>
      </div>

      {desc.user_description && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Description</h4>
          <p className="text-gray-700 leading-relaxed">{desc.user_description}</p>
        </div>
      )}

      {causes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-red-500" /> Possible Causes (AI Analysis)</h4>
          <div className="space-y-2">
            {causes.map((cause, i) => (
              <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-3">
                <div className="w-6 h-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-sm text-red-800">{typeof cause === 'string' ? cause : cause.description || cause.cause || JSON.stringify(cause)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> AI Recommendations</h4>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                <ChevronRight className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{typeof rec === 'string' ? rec : rec.description || rec.title || JSON.stringify(rec)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {desc.requiresAction && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-red-600" />
          <p className="text-sm font-medium text-red-700">This anomaly requires immediate attention based on AI analysis.</p>
        </div>
      )}

      {item.detected_at && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> Detected: {new Date(item.detected_at).toLocaleString()}
          {item.resolved_at && <> | Resolved: {new Date(item.resolved_at).toLocaleString()}</>}
        </p>
      )}
    </div>
  );
}

export default function Anomalies() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [formData, setFormData] = useState({ metric_name: '', expected_value: '', actual_value: '', description: '' });
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState(null);

  useEffect(() => { loadData(); }, [page, search, sortField, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getAnomalies({ page, limit: 20, search, sort: sortField, order: sortOrder });
      setItems(result.data || result);
      setPagination(result.pagination || null);
    } catch (e) {
      toast.error('Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (item) => {
    try {
      await api.resolveAnomaly(item.id);
      toast.success('Anomaly marked as resolved');
      loadData();
      if (detailModal?.id === item.id) setDetailModal(null);
    } catch (e) {
      toast.error('Failed to resolve anomaly');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.createAnomaly(formData);
      setModalOpen(false);
      setFormData({ metric_name: '', expected_value: '', actual_value: '', description: '' });
      toast.success('Anomaly detected and analyzed');
      loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to detect anomaly');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    await api.deleteAnomaly(id);
  };

  const handleSearch = (value) => { setSearch(value); setPage(1); };

  const handleSort = (field) => {
    if (sortField === field) { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }
    else { setSortField(field); setSortOrder('asc'); }
    setPage(1);
  };

  const getSeverityColor = (severity) => {
    const colors = { critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  const columns = [
    { key: 'metric_name', label: 'Metric' },
    { key: 'expected_value', label: 'Expected', render: (v) => Number(v)?.toLocaleString() },
    { key: 'actual_value', label: 'Actual', render: (v) => Number(v)?.toLocaleString() },
    { key: 'deviation_percentage', label: 'Deviation', render: (v) => {
      const val = Number(v);
      return <span className={val > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>{val > 0 ? '+' : ''}{val}%</span>;
    }},
    { key: 'severity', label: 'Severity', render: (v) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(v)}`}>{v}</span> },
    { key: 'is_resolved', label: 'Status', render: (v) => v ? (
      <div className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /><span>Resolved</span></div>
    ) : (
      <div className="flex items-center gap-1 text-orange-600"><Activity className="h-4 w-4" /><span>Open</span></div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg"><AlertTriangle className="h-6 w-6 text-orange-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Anomalies</h1><p className="text-gray-500">AI-powered anomaly detection and analysis</p></div>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> Detect Anomaly
        </button>
      </div>

      {items.length > 0 && (
        <BarChartWidget
          title="Anomaly Deviations: Expected vs Actual"
          data={items.filter(a => !a.is_resolved).slice(0, 8).map(a => ({
            name: a.metric_name?.substring(0, 12) || 'Metric',
            expected: Number(a.expected_value) || 0,
            actual: Number(a.actual_value) || 0
          }))}
          xKey="name"
          bars={['expected', 'actual']}
          height={250}
        />
      )}

      <DataList
        title="All Anomalies"
        icon={AlertTriangle}
        iconColor="orange"
        items={items}
        columns={columns}
        loading={loading}
        entityType="anomalies"
        detailType="anomalies"
        pagination={pagination}
        onPageChange={setPage}
        onSearch={handleSearch}
        onSort={handleSort}
        onDelete={handleDelete}
        onRefresh={loadData}
        sortField={sortField}
        sortOrder={sortOrder}
        searchValue={search}
        onRowClick={(item) => setDetailModal(item)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Detect & Analyze Anomaly" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metric Name</label>
            <input value={formData.metric_name} onChange={(e) => setFormData({ ...formData, metric_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g., Monthly Active Users, Revenue, API Response Time" required />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Value</label>
              <input type="number" step="any" value={formData.expected_value} onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g., 10000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Value</label>
              <input type="number" step="any" value={formData.actual_value} onChange={(e) => setFormData({ ...formData, actual_value: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g., 7500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={2} placeholder="Describe the anomaly context..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Load Example</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFormData({ metric_name: 'Monthly Active Users', expected_value: '125000', actual_value: '87500', description: 'MAU dropped significantly this month after the latest app update v3.2 was released.' })} className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-full transition-colors">User Drop</button>
              <button type="button" onClick={() => setFormData({ metric_name: 'API Response Time (ms)', expected_value: '150', actual_value: '890', description: 'Average API response time spiked 6x during peak hours (2-5 PM EST).' })} className="px-3 py-1.5 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-full transition-colors">Latency Spike</button>
              <button type="button" onClick={() => setFormData({ metric_name: 'Daily Revenue ($)', expected_value: '45000', actual_value: '62300', description: 'Revenue exceeded forecast by 38% following the Black Friday promotion.' })} className="px-3 py-1.5 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-full transition-colors">Revenue Spike</button>
              <button type="button" onClick={() => setFormData({ metric_name: 'Error Rate (%)', expected_value: '0.5', actual_value: '4.8', description: 'Error rate jumped after deploying microservice v2.1.' })} className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-full transition-colors">Error Surge</button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Analyzing...</> : <><Sparkles className="h-4 w-4" />Detect & Analyze</>}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Anomaly Details" size="xl">
        {detailModal && <AnomalyDetail item={detailModal} onResolve={handleResolve} />}
      </Modal>
    </div>
  );
}
