import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { DetailSkeleton } from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';
import { ArrowLeft, Database, BarChart3, FileText, Lightbulb, Search, Bell, TrendingUp, AlertTriangle, Download, Calendar, Palette, Plug, Clock, CheckCircle, XCircle, Zap, ScrollText, Wand2, ShieldCheck, BookOpen, Trash2, Edit2, Save, X } from 'lucide-react';

const typeConfig = {
  'data-sources': { title: 'Data Source', icon: Database, color: 'blue', fetch: api.getDataSource.bind(api), delete: api.deleteDataSource.bind(api), update: api.updateDataSource.bind(api), editableFields: ['name', 'type', 'description', 'status'] },
  'dashboards': { title: 'Dashboard', icon: BarChart3, color: 'purple', fetch: api.getDashboard.bind(api), delete: api.deleteDashboard.bind(api), update: api.updateDashboard.bind(api), editableFields: ['name', 'description'] },
  'reports': { title: 'Report', icon: FileText, color: 'green', fetch: api.getReport.bind(api), delete: api.deleteReport.bind(api), update: api.updateReport.bind(api), editableFields: ['name', 'type', 'description', 'schedule'] },
  'insights': { title: 'AI Insight', icon: Lightbulb, color: 'yellow', fetch: api.getInsight.bind(api), delete: api.deleteInsight.bind(api) },
  'queries': { title: 'Query', icon: Search, color: 'primary', fetch: api.getQuery.bind(api), delete: api.deleteQuery.bind(api) },
  'alerts': { title: 'Alert', icon: Bell, color: 'red', fetch: api.getAlert.bind(api), delete: api.deleteAlert.bind(api), update: api.updateAlert.bind(api), editableFields: ['name', 'condition', 'threshold', 'frequency'] },
  'predictions': { title: 'Prediction', icon: TrendingUp, color: 'green', fetch: api.getPrediction.bind(api), delete: api.deletePrediction.bind(api) },
  'anomalies': { title: 'Anomaly', icon: AlertTriangle, color: 'orange', fetch: api.getAnomaly.bind(api), delete: api.deleteAnomaly.bind(api) },
  'exports': { title: 'Export', icon: Download, color: 'purple', fetch: api.getExport.bind(api), delete: api.deleteExport.bind(api) },
  'jobs': { title: 'Scheduled Job', icon: Calendar, color: 'blue', fetch: api.getJob.bind(api), delete: api.deleteJob.bind(api), update: api.updateJob.bind(api), editableFields: ['job_name', 'job_type', 'cron_expression'] },
  'templates': { title: 'Template', icon: Palette, color: 'pink', fetch: api.getTemplate.bind(api) },
  'integrations': { title: 'Integration', icon: Plug, color: 'indigo', fetch: api.getIntegration.bind(api), delete: api.deleteIntegration.bind(api), update: api.updateIntegration.bind(api), editableFields: ['service_name', 'service_type', 'sync_frequency', 'status'] },
  'query-optimizations': { title: 'Query Optimization', icon: Zap, color: 'yellow', fetch: api.getQueryOptimization.bind(api), delete: api.deleteQueryOptimization.bind(api) },
  'log-entries': { title: 'Log Entry', icon: ScrollText, color: 'indigo', fetch: api.getLogEntry.bind(api), delete: api.deleteLogEntry.bind(api) },
  'log-analysis': { title: 'Log Analysis', icon: ScrollText, color: 'indigo', fetch: api.getLogAnalysis.bind(api), delete: api.deleteLogAnalysis.bind(api) },
  'dashboard-configs': { title: 'Dashboard Config', icon: Wand2, color: 'pink', fetch: api.getDashboardConfig.bind(api), delete: api.deleteDashboardConfig.bind(api) },
  'data-quality': { title: 'Data Quality Score', icon: ShieldCheck, color: 'green', fetch: api.getDataQualityScore.bind(api), delete: api.deleteDataQualityScore.bind(api) },
  'narratives': { title: 'Narrative', icon: BookOpen, color: 'pink', fetch: api.getNarrative.bind(api), delete: api.deleteNarrative.bind(api) },
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
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });

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

  const handleDelete = () => {
    if (!config.delete) return;
    setConfirmDialog({
      open: true,
      title: `Delete ${config.title}?`,
      message: `Are you sure you want to delete this ${config.title}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await config.delete(id);
          toast.success(`${config.title} deleted successfully`);
          navigate(-1);
        } catch (e) {
          toast.error('Failed to delete');
        }
      },
    });
  };

  const startEditing = () => {
    const fields = {};
    config.editableFields?.forEach(field => {
      fields[field] = data[field] || '';
    });
    setEditData(fields);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await config.update(id, editData);
      setData(updated);
      setEditing(false);
      toast.success(`${config.title} updated successfully`);
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const renderValue = (key, value) => {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
    if (typeof value === 'boolean') return value ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-gray-400" />;
    if (typeof value === 'object') return <pre className="text-sm bg-gray-50 p-3 rounded-lg overflow-auto max-w-lg border">{JSON.stringify(value, null, 2)}</pre>;
    if (key.includes('date') || key.includes('_at') || key.includes('time')) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date.toLocaleString();
    }
    if (typeof value === 'number' && value > 1000 && !key.includes('id')) return value.toLocaleString();
    if (key === 'content' || key === 'description' || key === 'detailed_analysis' || key === 'executive_summary' || key === 'ai_analysis') {
      return <p className="text-gray-700 whitespace-pre-wrap">{String(value)}</p>;
    }
    return String(value);
  };

  const formatKey = (key) => {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) return <DetailSkeleton />;

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
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colorClasses[config.color]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data?.name || data?.title || data?.metric_name || data?.analysis_name || data?.job_name || data?.service_name || `${config.title} #${id}`}</h1>
              <p className="text-gray-500">{config.title} Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-lg"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                {config.update && config.editableFields && (
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 border border-primary-200 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                )}
                {config.delete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6">
            {mainFields.map(([key, value]) => (
              <div key={key} className="grid sm:grid-cols-3 gap-2">
                <dt className="text-sm font-medium text-gray-500">{formatKey(key)}</dt>
                <dd className="sm:col-span-2 text-gray-900">
                  {editing && config.editableFields?.includes(key) ? (
                    <input
                      type="text"
                      value={editData[key] || ''}
                      onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    renderValue(key, value)
                  )}
                </dd>
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

      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
