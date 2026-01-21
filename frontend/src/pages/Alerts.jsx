import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Bell, ToggleLeft, ToggleRight, Mail, MessageSquare } from 'lucide-react';

export default function Alerts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', condition: '', threshold: '', frequency: 'hourly' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getAlerts()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await api.createAlert(formData); setModalOpen(false); setFormData({ name: '', condition: '', threshold: '', frequency: 'hourly' }); loadData(); } catch (e) { console.error(e); }
  };

  const handleToggle = async (item) => {
    try { await api.toggleAlert(item.id); loadData(); } catch (e) { console.error(e); }
  };

  const handleDelete = async (item) => {
    if (confirm('Delete this alert?')) { try { await api.deleteAlert(item.id); loadData(); } catch (e) { console.error(e); } }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'condition', label: 'Condition', render: (v) => <span className="text-gray-500 truncate max-w-xs block font-mono text-sm">{v}</span> },
    { key: 'threshold', label: 'Threshold', render: (v) => v?.toLocaleString() },
    { key: 'frequency', label: 'Frequency', render: (v) => <span className="capitalize">{v}</span> },
    { key: 'trigger_count', label: 'Triggers', render: (v) => v || 0 },
    { key: 'is_active', label: 'Status', render: (v, item) => (
      <button onClick={(e) => { e.stopPropagation(); handleToggle(item); }} className="flex items-center gap-1">
        {v ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6 text-gray-400" />}
        <span className={v ? 'text-green-600' : 'text-gray-500'}>{v ? 'Active' : 'Paused'}</span>
      </button>
    )}
  ];

  const frequencies = ['real_time', 'hourly', 'daily', 'weekly'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-50 rounded-lg"><Bell className="h-6 w-6 text-red-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Alerts</h1><p className="text-gray-500">Set up notifications for important metrics</p></div>
      </div>

      <DataTable title="All Alerts" data={data} columns={columns} loading={loading} detailPath="/alerts" onAdd={() => setModalOpen(true)} addLabel="Create Alert" onDelete={handleDelete} emptyMessage="No alerts configured yet" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Alert">
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Revenue Drop Alert" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Condition</label><input type="text" value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm" placeholder="daily_revenue < threshold" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label><input type="number" value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="50000" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Check Frequency</label><select value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">{frequencies.map(f => <option key={f} value={f} className="capitalize">{f.replace('_', ' ')}</option>)}</select></div>
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">Create Alert</button></div>
        </form>
      </Modal>
    </div>
  );
}
