import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Database, BarChart3, FileText, Lightbulb, Search, Bell, TrendingUp, AlertTriangle, Download, Calendar, Palette, Plug, Clock, CheckCircle, XCircle } from 'lucide-react';

const typeConfig = {
  'data-sources': { title: 'Data Source', icon: Database, color: 'blue', fetch: api.getDataSource.bind(api) },
  'dashboards': { title: 'Dashboard', icon: BarChart3, color: 'purple', fetch: api.getDashboard.bind(api) },
  'reports': { title: 'Report', icon: FileText, color: 'green', fetch: api.getReport.bind(api) },
  'insights': { title: 'AI Insight', icon: Lightbulb, color: 'yellow', fetch: api.getInsight.bind(api) },
  'queries': { title: 'Query', icon: Search, color: 'primary', fetch: api.getQuery.bind(api) },
  'alerts': { title: 'Alert', icon: Bell, color: 'red', fetch: api.getAlert.bind(api) },
  'predictions': { title: 'Prediction', icon: TrendingUp, color: 'green', fetch: api.getPrediction.bind(api) },
  'anomalies': { title: 'Anomaly', icon: AlertTriangle, color: 'orange', fetch: api.getAnomaly.bind(api) },
  'exports': { title: 'Export', icon: Download, color: 'purple', fetch: api.getExport.bind(api) },
  'jobs': { title: 'Scheduled Job', icon: Calendar, color: 'blue', fetch: api.getJob.bind(api) },
  'templates': { title: 'Template', icon: Palette, color: 'pink', fetch: api.getTemplate.bind(api) },
  'integrations': { title: 'Integration', icon: Plug, color: 'indigo', fetch: api.getIntegration.bind(api) },
};

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  primary: 'bg-primary-50 text-primary-600',
  red: 'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600',
  pink: 'bg-pink-50 text-pink-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

export default function DetailView() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = typeConfig[type];

  useEffect(() => {
    if (config) {
      loadData();
    } else {
      setError('Invalid resource type');
      setLoading(false);
    }
  }, [type, id]);

  const loadData = async () => {
    try {
      const result = await config.fetch(id);
      setData(result);
    } catch (e) {
      setError('Failed to load data');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderValue = (key, value) => {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
    if (typeof value === 'boolean') return value ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-gray-400" />;
    if (typeof value === 'object') return <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto max-w-lg">{JSON.stringify(value, null, 2)}</pre>;
    if (key.includes('date') || key.includes('_at') || key.includes('time')) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date.toLocaleString();
    }
    if (typeof value === 'number' && value > 1000 && !key.includes('id')) return value.toLocaleString();
    return String(value);
  };

  const formatKey = (key) => {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Invalid resource type'}</p>
        <button onClick={() => navigate(-1)} className="text-primary-600 hover:text-primary-700">Go back</button>
      </div>
    );
  }

  const Icon = config.icon;
  const excludeKeys = ['id', 'user_id', 'created_at', 'updated_at'];
  const mainFields = data ? Object.entries(data).filter(([k]) => !excludeKeys.includes(k)) : [];
  const metaFields = data ? Object.entries(data).filter(([k]) => ['created_at', 'updated_at'].includes(k)) : [];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${colorClasses[config.color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data?.name || data?.title || data?.metric_name || `${config.title} #${id}`}</h1>
            <p className="text-gray-500">{config.title} Details</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6">
            {mainFields.map(([key, value]) => (
              <div key={key} className="grid sm:grid-cols-3 gap-2">
                <dt className="text-sm font-medium text-gray-500">{formatKey(key)}</dt>
                <dd className="sm:col-span-2 text-gray-900">{renderValue(key, value)}</dd>
              </div>
            ))}
          </div>

          {metaFields.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Metadata</h3>
              <div className="grid gap-4">
                {metaFields.map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{formatKey(key)}:</span>
                    <span>{renderValue(key, value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
