import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plug, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function Integrations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ service_name: '', service_type: 'crm', sync_frequency: 'daily' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getIntegrations()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await api.createIntegration(formData); setModalOpen(false); setFormData({ service_name: '', service_type: 'crm', sync_frequency: 'daily' }); loadData(); } catch (e) { console.error(e); }
  };

  const handleDelete = async (item) => {
    if (confirm('Disconnect this integration?')) { try { await api.deleteIntegration(item.id); loadData(); } catch (e) { console.error(e); } }
  };

  const getStatusIcon = (status) => {
    if (status === 'connected') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'syncing') return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const columns = [
    { key: 'service_name', label: 'Service' },
    { key: 'service_type', label: 'Type', render: (v) => <span className="capitalize">{v?.replace('_', ' ')}</span> },
    { key: 'status', label: 'Status', render: (v) => <div className="flex items-center gap-2">{getStatusIcon(v)}<span className="capitalize">{v}</span></div> },
    { key: 'sync_frequency', label: 'Sync', render: (v) => <span className="capitalize">{v?.replace('_', ' ')}</span> },
    { key: 'last_sync', label: 'Last Sync', render: (v) => v ? new Date(v).toLocaleString() : 'Never' }
  ];

  const serviceTypes = ['crm', 'analytics', 'payment', 'accounting', 'communication', 'project_management', 'support', 'email', 'advertising', 'ecommerce', 'storage', 'data_warehouse', 'visualization'];
  const frequencies = ['real_time', 'hourly', 'daily', 'weekly'];
  const popularServices = ['Salesforce', 'HubSpot', 'Google Analytics', 'Stripe', 'Slack', 'Zendesk', 'Mailchimp', 'Shopify'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg"><Plug className="h-6 w-6 text-indigo-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Integrations</h1><p className="text-gray-500">Connect your favorite tools and services</p></div>
      </div>

      <DataTable title="Connected Services" data={data} columns={columns} loading={loading} detailPath="/integrations" onAdd={() => setModalOpen(true)} addLabel="Add Integration" onDelete={handleDelete} emptyMessage="No integrations connected yet" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Integration">
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label><input type="text" value={formData.service_name} onChange={(e) => setFormData({ ...formData, service_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Salesforce" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Popular Services</label><div className="flex flex-wrap gap-2">{popularServices.map((s, i) => (<button key={i} type="button" onClick={() => setFormData({ ...formData, service_name: s })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors">{s}</button>))}</div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={formData.service_type} onChange={(e) => setFormData({ ...formData, service_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">{serviceTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Sync Frequency</label><select value={formData.sync_frequency} onChange={(e) => setFormData({ ...formData, sync_frequency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">{frequencies.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}</select></div>
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">Connect</button></div>
        </form>
      </Modal>
    </div>
  );
}
