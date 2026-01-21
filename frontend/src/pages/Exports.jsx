import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Download, FileText, FileSpreadsheet, FileJson, File } from 'lucide-react';

export default function Exports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [formData, setFormData] = useState({ report_id: '', format: 'csv' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [exportsData, reportsData] = await Promise.all([api.getExports(), api.getReports()]);
      setData(exportsData);
      setReports(reportsData);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await api.createExport(formData.report_id, formData.format); setModalOpen(false); setFormData({ report_id: '', format: 'csv' }); loadData(); } catch (e) { console.error(e); }
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

  const columns = [
    { key: 'format', label: 'Format', render: (v) => <div className="flex items-center gap-2">{getFormatIcon(v)}<span className="uppercase">{v}</span></div> },
    { key: 'file_path', label: 'File', render: (v) => <span className="text-gray-500 truncate max-w-xs block font-mono text-sm">{v}</span> },
    { key: 'file_size', label: 'Size', render: (v) => formatFileSize(v) },
    { key: 'row_count', label: 'Rows', render: (v) => v?.toLocaleString() || '0' },
    { key: 'status', label: 'Status', render: (v) => <span className={`capitalize ${v === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>{v}</span> },
    { key: 'created_at', label: 'Created', render: (v) => new Date(v).toLocaleDateString() }
  ];

  const formats = ['csv', 'xlsx', 'pdf', 'json', 'parquet'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-50 rounded-lg"><Download className="h-6 w-6 text-purple-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Data Exports</h1><p className="text-gray-500">Export your data in various formats</p></div>
      </div>

      <DataTable title="Export History" data={data} columns={columns} loading={loading} detailPath="/exports" onAdd={() => setModalOpen(true)} addLabel="New Export" emptyMessage="No exports yet" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Export">
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Report</label><select value={formData.report_id} onChange={(e) => setFormData({ ...formData, report_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" required><option value="">Select a report...</option>{reports.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Format</label><select value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">{formats.map(f => <option key={f} value={f} className="uppercase">{f.toUpperCase()}</option>)}</select></div>
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"><Download className="h-4 w-4" />Export</button></div>
        </form>
      </Modal>
    </div>
  );
}
