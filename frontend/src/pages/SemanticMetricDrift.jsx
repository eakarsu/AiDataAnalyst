import { useEffect, useState } from 'react';

export default function SemanticMetricDrift() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/semantic-metric-drift').then((res) => res.json()).then(setData).catch(() => setData(null));
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Semantic Metric Drift</h1>
      <p className="text-gray-600 mb-6">Detect metric definition changes before dashboards and alerts silently shift.</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {data && Object.entries(data.summary).map(([key, value]) => <div key={key} className="bg-white border rounded-lg p-4"><div className="text-xs uppercase text-gray-500">{key.replaceAll('_', ' ')}</div><div className="text-2xl font-bold">{value}</div></div>)}
      </div>
      <div className="bg-white border rounded-lg">
        {(data?.drifts || []).map((item) => <div key={item.metric} className="p-4 border-b"><strong>{item.metric}</strong><div>{item.source} - {item.change} - {item.impact} - {item.action}</div></div>)}
      </div>
    </div>
  );
}
