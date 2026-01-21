import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function Anomalies() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getAnomalies()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleResolve = async (item) => {
    try { await api.resolveAnomaly(item.id); loadData(); } catch (e) { console.error(e); }
  };

  const getSeverityColor = (severity) => {
    const colors = { critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  const columns = [
    { key: 'metric_name', label: 'Metric' },
    { key: 'expected_value', label: 'Expected', render: (v) => v?.toLocaleString() },
    { key: 'actual_value', label: 'Actual', render: (v) => v?.toLocaleString() },
    { key: 'deviation_percentage', label: 'Deviation', render: (v) => <span className={v > 0 ? 'text-red-600' : 'text-green-600'}>{v > 0 ? '+' : ''}{v}%</span> },
    { key: 'severity', label: 'Severity', render: (v) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(v)}`}>{v}</span> },
    { key: 'is_resolved', label: 'Status', render: (v, item) => v ? (
      <div className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /><span>Resolved</span></div>
    ) : (
      <button onClick={(e) => { e.stopPropagation(); handleResolve(item); }} className="flex items-center gap-1 text-orange-600 hover:text-orange-700">
        <XCircle className="h-4 w-4" /><span>Mark Resolved</span>
      </button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-50 rounded-lg"><AlertTriangle className="h-6 w-6 text-orange-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Anomalies</h1><p className="text-gray-500">Detected data anomalies and deviations</p></div>
      </div>

      <DataTable title="All Anomalies" data={data} columns={columns} loading={loading} detailPath="/anomalies" emptyMessage="No anomalies detected" />
    </div>
  );
}
