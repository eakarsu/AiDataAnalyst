import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Lightbulb, Sparkles, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';

export default function Insights() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [context, setContext] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getInsights()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.generateInsight({ sample: true }, context);
      setModalOpen(false);
      setContext('');
      loadData();
    } catch (e) { console.error(e); } finally { setGenerating(false); }
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
    { key: 'confidence', label: 'Confidence', render: (v) => <span>{v}%</span> },
    { key: 'impact', label: 'Impact', render: (v) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(v)}`}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`capitalize ${v === 'new' ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>{v}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-50 rounded-lg"><Lightbulb className="h-6 w-6 text-yellow-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">AI Insights</h1><p className="text-gray-500">AI-powered insights and recommendations</p></div>
      </div>

      <DataTable title="All Insights" data={data} columns={columns} loading={loading} detailPath="/insights" onAdd={() => setModalOpen(true)} addLabel="Generate Insight" emptyMessage="No insights generated yet" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate AI Insight">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Context (what would you like insights about?)</label><textarea value={context} onChange={(e) => setContext(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={4} placeholder="e.g., Analyze our sales data for Q4 opportunities..." required /></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Generating...</> : <><Sparkles className="h-4 w-4" />Generate Insight</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
