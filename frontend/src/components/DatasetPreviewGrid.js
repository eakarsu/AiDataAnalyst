import { useEffect, useState } from 'react';
import { Table2, Database } from 'lucide-react';

const TYPE_COLOR = {
  integer: 'bg-blue-100 text-blue-700',
  number:  'bg-indigo-100 text-indigo-700',
  string:  'bg-emerald-100 text-emerald-700',
  date:    'bg-amber-100 text-amber-700',
};

export default function DatasetPreviewGrid({ datasetId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!datasetId) return;
    let aborted = false;
    setLoading(true);
    setError(null);
    fetch(`/api/custom-views/dataset/${datasetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load dataset')))
      .then(j => { if (!aborted) setData(j); })
      .catch(e => { if (!aborted) setError(e.message); })
      .finally(() => { if (!aborted) setLoading(false); });
    return () => { aborted = true; };
  }, [datasetId, token]);

  if (!datasetId) {
    return (
      <div className="p-6 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm flex items-center gap-2">
        <Database className="h-4 w-4" /> Pick a dataset to see a preview.
      </div>
    );
  }
  if (loading) return <div className="p-4 text-sm text-gray-500">Loading preview...</div>;
  if (error)   return <div className="p-4 text-sm text-red-600">Error: {error}</div>;
  if (!data)   return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-primary-600" />
          <span className="font-semibold text-gray-900">{data.name}</span>
          <span className="text-xs text-gray-500">({data.rows.length} rows)</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {data.columns.map(c => (
            <span
              key={c.name}
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[c.type] || 'bg-gray-100 text-gray-700'}`}
              title={`${c.name}: ${c.type}`}
            >
              {c.name}:{c.type}
            </span>
          ))}
        </div>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {data.columns.map(c => (
                <th key={c.name} className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className={i % 2 ? 'bg-gray-50/50' : ''}>
                {data.columns.map(c => (
                  <td key={c.name} className="px-3 py-1.5 text-gray-800 whitespace-nowrap border-b border-gray-100">
                    {String(row[c.name])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
