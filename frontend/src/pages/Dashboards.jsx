import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { BarChart3, Eye, Globe, Lock } from 'lucide-react';

export default function Dashboards() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', is_public: false });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await api.getDashboards();
      setData(result);
    } catch (error) {
      console.error('Error loading dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createDashboard(formData);
      setModalOpen(false);
      setFormData({ name: '', description: '', is_public: false });
      loadData();
    } catch (error) {
      console.error('Error creating dashboard:', error);
    }
  };

  const handleDelete = async (item) => {
    if (confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await api.deleteDashboard(item.id);
        loadData();
      } catch (error) {
        console.error('Error deleting dashboard:', error);
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (value) => <span className="text-gray-500 truncate max-w-xs block">{value}</span> },
    {
      key: 'is_public',
      label: 'Visibility',
      render: (value) => (
        <div className="flex items-center gap-2">
          {value ? <Globe className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-gray-400" />}
          <span>{value ? 'Public' : 'Private'}</span>
        </div>
      )
    },
    {
      key: 'views',
      label: 'Views',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4 text-gray-400" />
          <span>{value?.toLocaleString() || 0}</span>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-lg">
          <BarChart3 className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboards</h1>
          <p className="text-gray-500">Create and manage your analytics dashboards</p>
        </div>
      </div>

      <DataTable
        title="All Dashboards"
        data={data}
        columns={columns}
        loading={loading}
        detailPath="/dashboards"
        onAdd={() => setModalOpen(true)}
        addLabel="Create Dashboard"
        onDelete={handleDelete}
        emptyMessage="No dashboards created yet"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Dashboard">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Sales Dashboard"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Dashboard description"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_public" className="text-sm text-gray-700">Make this dashboard public</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">Create Dashboard</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
