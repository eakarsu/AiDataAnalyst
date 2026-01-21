import { useState, useEffect } from 'react';
import api from '../services/api';
import { Activity as ActivityIcon, Plus, Eye, Edit, Trash2, Download, Share, Play, User } from 'lucide-react';

export default function Activity() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getActivity()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const getActionIcon = (action) => {
    const icons = { create: Plus, view: Eye, update: Edit, delete: Trash2, export: Download, share: Share, run_query: Play, login: User };
    const Icon = icons[action] || ActivityIcon;
    return <Icon className="h-4 w-4" />;
  };

  const getActionColor = (action) => {
    const colors = { create: 'bg-green-100 text-green-600', view: 'bg-blue-100 text-blue-600', update: 'bg-yellow-100 text-yellow-600', delete: 'bg-red-100 text-red-600', export: 'bg-purple-100 text-purple-600', share: 'bg-indigo-100 text-indigo-600', run_query: 'bg-cyan-100 text-cyan-600', login: 'bg-gray-100 text-gray-600' };
    return colors[action] || 'bg-gray-100 text-gray-600';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg"><ActivityIcon className="h-6 w-6 text-gray-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Activity Log</h1><p className="text-gray-500">Track all actions in your workspace</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
        </div>

        {data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No activity recorded yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((activity, idx) => (
              <div key={activity.id || idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 capitalize">{activity.action.replace('_', ' ')}</span>
                      {activity.entity_type && (
                        <span className="text-gray-500">
                          on <span className="capitalize">{activity.entity_type}</span>
                          {activity.entity_id && ` #${activity.entity_id}`}
                        </span>
                      )}
                    </div>
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        {Object.entries(activity.details).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-400 whitespace-nowrap">{formatTime(activity.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
