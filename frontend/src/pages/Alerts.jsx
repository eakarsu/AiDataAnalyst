import { useState, useEffect } from 'react';
import api from '../services/api';
import DataList from '../components/DataList';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Bell, ToggleLeft, ToggleRight, Plus } from 'lucide-react';

export default function Alerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', condition: '', threshold: '', frequency: 'hourly' });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState(null);

  useEffect(() => { loadData(); }, [page, search, sortField, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getAlerts({ page, limit: 20, search, sort: sortField, order: sortOrder });
      setItems(result.data || result);
      setPagination(result.pagination || null);
    } catch (e) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createAlert(formData);
      setModalOpen(false);
      setFormData({ name: '', condition: '', threshold: '', frequency: 'hourly' });
      toast.success('Alert created successfully');
      loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to create alert');
    }
  };

  const handleToggle = async (item) => {
    try {
      await api.toggleAlert(item.id);
      toast.success(`Alert ${item.is_active ? 'paused' : 'activated'}`);
      loadData();
    } catch (e) {
      toast.error('Failed to toggle alert');
    }
  };

  const handleDelete = async (id) => {
    await api.deleteAlert(id);
  };

  const handleSearch = (value) => { setSearch(value); setPage(1); };

  const handleSort = (field) => {
    if (sortField === field) { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }
    else { setSortField(field); setSortOrder('asc'); }
    setPage(1);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><Bell className="h-6 w-6 text-red-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Alerts</h1><p className="text-gray-500">Set up notifications for important metrics</p></div>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> Create Alert
        </button>
      </div>

      <DataList
        title="All Alerts"
        icon={Bell}
        iconColor="red"
        items={items}
        columns={columns}
        loading={loading}
        entityType="alerts"
        detailType="alerts"
        pagination={pagination}
        onPageChange={setPage}
        onSearch={handleSearch}
        onSort={handleSort}
        onDelete={handleDelete}
        onRefresh={loadData}
        sortField={sortField}
        sortOrder={sortOrder}
        searchValue={search}
      />

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
