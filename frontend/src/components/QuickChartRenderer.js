import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3, LineChart as LineIcon } from 'lucide-react';

const NUMERIC = new Set(['integer', 'number']);

export default function QuickChartRenderer({ datasetId, token }) {
  const [data, setData] = useState(null);
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!datasetId) return;
    let aborted = false;
    setError(null);
    fetch(`/api/custom-views/dataset/${datasetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load dataset')))
      .then(j => {
        if (aborted) return;
        setData(j);
        const firstStr = j.columns.find(c => !NUMERIC.has(c.type));
        const firstNum = j.columns.find(c => NUMERIC.has(c.type));
        setXCol(firstStr?.name || j.columns[0]?.name || '');
        setYCol(firstNum?.name || j.columns[1]?.name || '');
      })
      .catch(e => { if (!aborted) setError(e.message); });
    return () => { aborted = true; };
  }, [datasetId, token]);

  const xType = useMemo(() => data?.columns.find(c => c.name === xCol)?.type, [data, xCol]);
  // line if x is date/numeric, bar if x is categorical string
  const chartType = useMemo(() => {
    if (!xType) return 'bar';
    if (xType === 'date' || NUMERIC.has(xType)) return 'line';
    return 'bar';
  }, [xType]);

  if (!datasetId) {
    return (
      <div className="p-6 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
        Pick a dataset to render a chart.
      </div>
    );
  }
  if (error) return <div className="p-4 text-sm text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-4 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {chartType === 'line'
            ? <LineIcon className="h-4 w-4 text-primary-600" />
            : <BarChart3 className="h-4 w-4 text-primary-600" />}
          <span className="font-semibold text-gray-900">Quick Chart</span>
          <span className="text-xs text-gray-500 uppercase">{chartType}</span>
        </div>
        <div className="flex gap-2 items-center text-sm">
          <label className="text-gray-600">X:</label>
          <select
            value={xCol}
            onChange={e => setXCol(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {data.columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <label className="text-gray-600">Y:</label>
          <select
            value={yCol}
            onChange={e => setYCol(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {data.columns.filter(c => NUMERIC.has(c.type)).map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="p-4" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xCol} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yCol} stroke="#4f46e5" strokeWidth={2} dot />
            </LineChart>
          ) : (
            <BarChart data={data.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xCol} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yCol} fill="#4f46e5" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
