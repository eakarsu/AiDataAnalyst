import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FileUpload from '../components/FileUpload';
import { Database, CheckCircle, AlertCircle, RefreshCw, Upload } from 'lucide-react';

export default function DataSources() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'PostgreSQL', connection_string: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await api.getDataSources();
      setData(result);
    } catch (error) {
      console.error('Error loading data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createDataSource(formData);
      setModalOpen(false);
      setFormData({ name: '', type: 'PostgreSQL', connection_string: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error creating data source:', error);
    }
  };

  const handleDelete = async (item) => {
    if (confirm('Are you sure you want to delete this data source?')) {
      try {
        await api.deleteDataSource(item.id);
        loadData();
      } catch (error) {
        console.error('Error deleting data source:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <span className="capitalize">{value}</span>
        </div>
      )
    },
    {
      key: 'record_count',
      label: 'Records',
      render: (value) => value?.toLocaleString() || '0'
    },
    { key: 'description', label: 'Description', render: (value) => <span className="text-gray-500 truncate max-w-xs block">{value}</span> }
  ];

  const dataTypes = ['PostgreSQL', 'MySQL', 'MongoDB', 'Salesforce', 'Google Analytics', 'Snowflake', 'BigQuery', 'API Integration', 'CSV/Excel'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-lg">
          <Database className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Sources</h1>
          <p className="text-gray-500">Manage your connected data sources</p>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Upload className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Upload Data File</h2>
        </div>
        <div className="p-6">
          <FileUpload onUploadComplete={() => loadData()} />
        </div>
      </div>

      <DataTable
        title="All Data Sources"
        data={data}
        columns={columns}
        loading={loading}
        detailPath="/data-sources"
        onAdd={() => setModalOpen(true)}
        addLabel="Add Data Source"
        onDelete={handleDelete}
        emptyMessage="No data sources connected yet"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Data Source">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="My Database"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {dataTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Connection String</label>
            <input
              type="text"
              value={formData.connection_string}
              onChange={(e) => setFormData({ ...formData, connection_string: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="postgresql://user:pass@host:5432/db"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Brief description of this data source"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Add Data Source
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
