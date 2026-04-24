import { useState, useEffect } from 'react';
import api from '../services/api';
import DataList from '../components/DataList';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FileText, Clock, CheckCircle, Plus } from 'lucide-react';

export default function Reports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'financial', description: '', schedule: 'weekly' });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState(null);

  useEffect(() => { loadData(); }, [page, search, sortField, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getReports({ page, limit: 20, search, sort: sortField, order: sortOrder });
      setItems(result.data || result);
      setPagination(result.pagination || null);
    } catch (e) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createReport(formData);
      setModalOpen(false);
      setFormData({ name: '', type: 'financial', description: '', schedule: 'weekly' });
      toast.success('Report created successfully');
      loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to create report');
    }
  };

  const handleDelete = async (id) => {
    await api.deleteReport(id);
  };

  const handleSearch = (value) => { setSearch(value); setPage(1); };

  const handleSort = (field) => {
    if (sortField === field) { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }
    else { setSortField(field); setSortOrder('asc'); }
    setPage(1);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (v) => <span className="capitalize">{v}</span> },
    { key: 'schedule', label: 'Schedule', render: (v) => <div className="flex items-center gap-1"><Clock className="h-4 w-4 text-gray-400" /><span className="capitalize">{v || 'Manual'}</span></div> },
    { key: 'status', label: 'Status', render: (v) => <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" /><span className="capitalize">{v}</span></div> },
    { key: 'description', label: 'Description', render: (v) => <span className="text-gray-500 truncate max-w-xs block">{v}</span> }
  ];

  const reportTypes = ['financial', 'sales', 'marketing', 'analytics', 'product', 'operations', 'hr', 'support', 'inventory', 'predictive'];
  const schedules = ['daily', 'weekly', 'monthly', 'quarterly'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg"><FileText className="h-6 w-6 text-primary-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Reports</h1><p className="text-gray-500">Generate and schedule automated reports</p></div>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> Create Report
        </button>
      </div>

      <DataList
        title="All Reports"
        icon={FileText}
        iconColor="green"
        items={items}
        columns={columns}
        loading={loading}
        entityType="reports"
        detailType="reports"
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Report">
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Monthly Revenue Report" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">{reportTypes.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label><select value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">{schedules.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={3} placeholder="Report description" /></div>
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">Create Report</button></div>
        </form>
      </Modal>
    </div>
  );
}
