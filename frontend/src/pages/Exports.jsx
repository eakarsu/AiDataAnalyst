import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Download, FileText, FileSpreadsheet, FileJson, File } from 'lucide-react';

export default function Exports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [dataSources, setDataSources] = useState([]);
  const [formData, setFormData] = useState({ source_id: '', format: 'xlsx' });
  const [exporting, setExporting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [exportsData, sourcesData] = await Promise.all([api.getExports(), api.getDataSources()]);
      setData(exportsData);
      setDataSources(sourcesData);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setExporting(true);
    try {
      await api.createExport(formData.source_id, formData.format);
      setModalOpen(false);
      setFormData({ source_id: '', format: 'xlsx' });
      loadData();
    } catch (e) { console.error(e); } finally { setExporting(false); }
  };

  const getFormatIcon = (format) => {
    const icons = { csv: FileSpreadsheet, xlsx: FileSpreadsheet, pdf: FileText, json: FileJson };
    const Icon = icons[format] || File;
    return <Icon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDownload = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(api.getExportDownloadUrl(item.id), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = item.file_path ? item.file_path.replace(/_[a-z0-9]{4}(\.\w+)$/, '$1') : `export.${item.format}`;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const columns = [
    { key: 'format', label: 'Format', render: (v) => <div className="flex items-center gap-2">{getFormatIcon(v)}<span className="uppercase">{v}</span></div> },
    { key: 'file_path', label: 'File', render: (v) => {
      const display = v ? v.replace(/_[a-z0-9]{4}(\.\w+)$/, '$1').replace(/_/g, ' ') : '';
      return <span className="text-gray-500 truncate max-w-xs block font-mono text-sm">{display}</span>;
    }},
    { key: 'file_size', label: 'Size', render: (v) => formatFileSize(v) },
    { key: 'row_count', label: 'Rows', render: (v) => v?.toLocaleString() || '0' },
    { key: 'status', label: 'Status', render: (v) => <span className={`capitalize ${v === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>{v}</span> },
    { key: 'created_at', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'id',
      label: 'Download',
      render: (v, item) => item.status === 'completed' ? (
        <button
          onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      ) : (
        <span className="text-xs text-gray-400">Processing...</span>
      )
    }
  ];

  const formats = ['xlsx', 'pdf'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-50 rounded-lg"><Download className="h-6 w-6 text-purple-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Data Exports</h1><p className="text-gray-500">Export your data in various formats</p></div>
      </div>

      <DataTable title="Export History" data={data} columns={columns} loading={loading} detailPath="/exports" onAdd={() => setModalOpen(true)} addLabel="New Export" emptyMessage="No exports yet" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Export Data Source">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
            <select
              value={formData.source_id}
              onChange={(e) => setFormData({ ...formData, source_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select a data source...</option>
              {dataSources.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.record_count?.toLocaleString() || 0} rows)
                </option>
              ))}
            </select>
            {dataSources.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No data sources available. Upload a CSV/Excel file on the Data Sources page first.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {formats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={exporting} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {exporting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Exporting...</> : <><Download className="h-4 w-4" />Export</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
