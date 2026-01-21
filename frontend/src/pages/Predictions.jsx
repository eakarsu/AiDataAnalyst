import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { TrendingUp, ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react';

export default function Predictions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ target_metric: '', period: 'next_month', historical_data: [] });
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getPredictions()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try { await api.generatePrediction(formData); setModalOpen(false); setFormData({ target_metric: '', period: 'next_month', historical_data: [] }); loadData(); } catch (e) { console.error(e); } finally { setGenerating(false); }
  };

  const getTrendIcon = (accuracy) => {
    if (accuracy > 90) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (accuracy > 80) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  const columns = [
    { key: 'target_metric', label: 'Metric' },
    { key: 'model_type', label: 'Model', render: (v) => <span className="capitalize">{v?.replace('_', ' ')}</span> },
    { key: 'prediction_period', label: 'Period', render: (v) => <span className="capitalize">{v?.replace('_', ' ')}</span> },
    { key: 'predicted_value', label: 'Predicted Value', render: (v) => v?.toLocaleString() },
    { key: 'accuracy', label: 'Accuracy', render: (v, item) => <div className="flex items-center gap-1">{getTrendIcon(v)}<span className={v > 90 ? 'text-green-600' : v > 80 ? 'text-yellow-600' : 'text-red-600'}>{v}%</span></div> },
    { key: 'status', label: 'Status', render: (v) => <span className="capitalize text-green-600">{v}</span> }
  ];

  const periods = ['next_hour', 'next_day', 'next_week', 'next_month', 'next_quarter', 'next_year'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="h-6 w-6 text-green-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Predictions</h1><p className="text-gray-500">AI-powered forecasting and predictions</p></div>
      </div>

      <DataTable title="All Predictions" data={data} columns={columns} loading={loading} detailPath="/predictions" onAdd={() => setModalOpen(true)} addLabel="New Prediction" emptyMessage="No predictions generated yet" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate Prediction">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Metric</label><input type="text" value={formData.target_metric} onChange={(e) => setFormData({ ...formData, target_metric: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Monthly Revenue" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Prediction Period</label><select value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">{periods.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}</select></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Generating...</> : <><Sparkles className="h-4 w-4" />Generate Prediction</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
