import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DatasetPreviewGrid from '../components/DatasetPreviewGrid.js';
import QuickChartRenderer from '../components/QuickChartRenderer.js';
import QueryBuilder from '../components/QueryBuilder.js';
import ScheduledReportForm from '../components/ScheduledReportForm.js';
import { Sparkles } from 'lucide-react';

export default function CustomViewsPage() {
  const { token } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/custom-views/datasets', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(j => {
        setDatasets(j.datasets || []);
        if (j.datasets?.[0]) setSelectedDataset(j.datasets[0].id);
      })
      .catch(() => {});
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-600" /> Analyst Views
          </h1>
          <p className="text-sm text-gray-500">
            Preview datasets, render quick charts, build SQL visually, and schedule reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Dataset</label>
          <select
            value={selectedDataset}
            onChange={e => setSelectedDataset(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
          >
            {datasets.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DatasetPreviewGrid datasetId={selectedDataset} token={token} />
        <QuickChartRenderer  datasetId={selectedDataset} token={token} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <QueryBuilder        token={token} />
        <ScheduledReportForm token={token} />
      </div>
    </div>
  );
}
