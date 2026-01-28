import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AreaChartWidget({ data, title, areas = [], xKey = 'name', height = 300 }) {
  const defaultColors = [
    { stroke: '#4F46E5', fill: '#4F46E5' },
    { stroke: '#10B981', fill: '#10B981' },
    { stroke: '#F59E0B', fill: '#F59E0B' },
    { stroke: '#EF4444', fill: '#EF4444' },
    { stroke: '#8B5CF6', fill: '#8B5CF6' },
  ];

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">No data available</div>
      </div>
    );
  }

  const areaKeys = areas.length > 0 ? areas : Object.keys(data[0]).filter(k => k !== xKey && typeof data[0][k] === 'number');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {title && <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          />
          <Legend />
          {areaKeys.map((key, idx) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={defaultColors[idx % defaultColors.length].stroke}
              fill={defaultColors[idx % defaultColors.length].fill}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
