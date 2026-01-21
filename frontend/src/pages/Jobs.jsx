import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Calendar, Play, Pause, Clock } from 'lucide-react';

export default function Jobs() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ job_name: '', job_type: 'report', cron_expression: '0 8 * * *' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getJobs()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await api.createJob(formData); setModalOpen(false); setFormData({ job_name: '', job_type: 'report', cron_expression: '0 8 * * *' }); loadData(); } catch (e) { console.error(e); }
  };

  const handleToggle = async (item) => {
    try { await api.toggleJob(item.id); loadData(); } catch (e) { console.error(e); }
  };

  const handleDelete = async (item) => {
    if (confirm('Delete this job?')) { try { await api.deleteJob(item.id); loadData(); } catch (e) { console.error(e); } }
  };

  const columns = [
    { key: 'job_name', label: 'Name' },
    { key: 'job_type', label: 'Type', render: (v) => <span className="capitalize">{v?.replace('_', ' ')}</span> },
    { key: 'cron_expression', label: 'Schedule', render: (v) => <span className="font-mono text-sm text-gray-500">{v}</span> },
    { key: 'last_run', label: 'Last Run', render: (v) => v ? new Date(v).toLocaleString() : 'Never' },
    { key: 'status', label: 'Status', render: (v, item) => (
      <button onClick={(e) => { e.stopPropagation(); handleToggle(item); }} className="flex items-center gap-1">
        {v === 'active' ? <Play className="h-4 w-4 text-green-500" /> : <Pause className="h-4 w-4 text-gray-400" />}
        <span className={v === 'active' ? 'text-green-600' : 'text-gray-500'}>{v}</span>
      </button>
    )}
  ];

  const jobTypes = ['report', 'data_sync', 'ai_analysis', 'export', 'notification', 'maintenance'];
  const cronPresets = [
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily at 8 AM', value: '0 8 * * *' },
    { label: 'Weekly on Monday', value: '0 9 * * 1' },
    { label: 'Monthly on 1st', value: '0 7 1 * *' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg"><Calendar className="h-6 w-6 text-blue-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Scheduled Jobs</h1><p className="text-gray-500">Automate recurring tasks</p></div>
      </div>

      <DataTable title="All Jobs" data={data} columns={columns} loading={loading} detailPath="/jobs" onAdd={() => setModalOpen(true)} addLabel="Create Job" onDelete={handleDelete} emptyMessage="No scheduled jobs yet" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Scheduled Job">
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={formData.job_name} onChange={(e) => setFormData({ ...formData, job_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Daily Sales Report" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={formData.job_type} onChange={(e) => setFormData({ ...formData, job_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">{jobTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Cron Expression</label><input type="text" value={formData.cron_expression} onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Presets</label><div className="flex flex-wrap gap-2">{cronPresets.map((p, i) => (<button key={i} type="button" onClick={() => setFormData({ ...formData, cron_expression: p.value })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors">{p.label}</button>))}</div></div>
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">Create Job</button></div>
        </form>
      </Modal>
    </div>
  );
}
