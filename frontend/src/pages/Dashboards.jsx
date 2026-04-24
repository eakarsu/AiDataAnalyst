import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DataList from '../components/DataList';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { BarChart3, Eye, Globe, Lock, Share2, Copy, Plus } from 'lucide-react';

export default function Dashboards() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', is_public: false });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState(null);

  useEffect(() => { loadData(); }, [page, search, sortField, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getDashboards({ page, limit: 20, search, sort: sortField, order: sortOrder });
      setItems(result.data || result);
      setPagination(result.pagination || null);
    } catch (error) {
      toast.error('Failed to load dashboards');
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
      toast.success('Dashboard created successfully');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to create dashboard');
    }
  };

  const handleDelete = async (id) => {
    await api.deleteDashboard(id);
  };

  const handleShare = async (item) => {
    try {
      const result = await api.shareDashboard(item.id);
      setShareUrl(`${window.location.origin}/public/dashboard/${result.shareToken}`);
      setShareModalOpen(true);
      toast.success('Dashboard shared');
      loadData();
    } catch (error) {
      toast.error('Failed to share dashboard');
    }
  };

  const handleUnshare = async (item) => {
    try {
      await api.unshareDashboard(item.id);
      toast.success('Dashboard unshared');
      loadData();
    } catch (error) {
      toast.error('Failed to unshare dashboard');
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard');
  };

  const handleSearch = (value) => { setSearch(value); setPage(1); };

  const handleSort = (field) => {
    if (sortField === field) { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }
    else { setSortField(field); setSortOrder('asc'); }
    setPage(1);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (value) => <span className="text-gray-500 truncate max-w-xs block">{value}</span> },
    { key: 'is_public', label: 'Visibility', render: (value) => (
      <div className="flex items-center gap-2">
        {value ? <Globe className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-gray-400" />}
        <span>{value ? 'Public' : 'Private'}</span>
      </div>
    )},
    { key: 'views', label: 'Views', render: (value) => (
      <div className="flex items-center gap-1"><Eye className="h-4 w-4 text-gray-400" /><span>{value?.toLocaleString() || 0}</span></div>
    )},
    { key: 'id', label: 'Share', render: (value, item) => (
      <button
        onClick={(e) => { e.stopPropagation(); item.share_token ? handleUnshare(item) : handleShare(item); }}
        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
          item.share_token ? 'text-green-700 bg-green-50 hover:bg-green-100' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <Share2 className="h-3.5 w-3.5" />
        {item.share_token ? 'Shared' : 'Share'}
      </button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg"><BarChart3 className="h-6 w-6 text-primary-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Dashboards</h1><p className="text-gray-500">Create and manage your analytics dashboards</p></div>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> Create Dashboard
        </button>
      </div>

      <DataList
        title="All Dashboards"
        icon={BarChart3}
        iconColor="purple"
        items={items}
        columns={columns}
        loading={loading}
        entityType="dashboards"
        detailType="dashboards"
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Dashboard">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Sales Dashboard" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" rows={3} placeholder="Dashboard description" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_public" checked={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <label htmlFor="is_public" className="text-sm text-gray-700">Make this dashboard public</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">Create Dashboard</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} title="Share Dashboard">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Anyone with this link can view the dashboard:</p>
          <div className="flex items-center gap-2">
            <input type="text" value={shareUrl} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono" />
            <button onClick={copyShareUrl} className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Copy link">
              <Copy className="h-5 w-5" />
            </button>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => setShareModalOpen(false)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">Done</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
