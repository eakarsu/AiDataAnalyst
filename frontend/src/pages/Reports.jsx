import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FileText, Clock, CheckCircle } from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'financial', description: '', schedule: 'weekly' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getReports()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await api.createReport(formData); setModalOpen(false); setFormData({ name: '', type: 'financial', description: '', schedule: 'weekly' }); loadData(); } catch (e) { console.error(e); }
  };

  const handleDelete = async (item) => {
    if (confirm('Delete this report?')) { try { await api.deleteReport(item.id); loadData(); } catch (e) { console.error(e); } }
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
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-lg"><FileText className="h-6 w-6 text-primary-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Reports</h1><p className="text-gray-500">Generate and schedule automated reports</p></div>
      </div>

      <DataTable title="All Reports" data={data} columns={columns} loading={loading} detailPath="/reports" onAdd={() => setModalOpen(true)} addLabel="Create Report" onDelete={handleDelete} emptyMessage="No reports created yet" />

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
