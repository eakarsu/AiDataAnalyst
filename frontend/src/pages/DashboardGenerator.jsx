import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
  LayoutGrid, Sparkles, Palette, BarChart3, PieChart, Table, Gauge, Map,
  CheckCircle, Wand2, ChevronRight, Filter, Lightbulb, Database, FileText
} from 'lucide-react';

function safeParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function PriorityBadge({ priority }) {
  const p = Number(priority) || 3;
  const styles = {
    1: 'bg-red-100 text-red-700 border-red-200',
    2: 'bg-orange-100 text-orange-700 border-orange-200',
    3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    4: 'bg-blue-100 text-blue-700 border-blue-200',
    5: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[p] || styles[3]}`}>P{p}</span>;
}

const COLOR_MAP = {
  blue: '#3b82f6', green: '#22c55e', purple: '#a855f7', orange: '#f97316',
  red: '#ef4444', yellow: '#eab308', pink: '#ec4899', indigo: '#6366f1',
  teal: '#14b8a6', cyan: '#06b6d4', lime: '#84cc16', amber: '#f59e0b',
  emerald: '#10b981', rose: '#f43f5e', violet: '#8b5cf6', sky: '#0ea5e9',
};

function getColorHex(color) { return COLOR_MAP[color] || '#6b7280'; }

function getWidgetIcon(type) {
  const icons = { chart: BarChart3, pie: PieChart, table: Table, kpi: Gauge, gauge: Gauge, map: Map, heatmap: LayoutGrid };
  const Icon = icons[type] || BarChart3;
  return <Icon className="h-4 w-4" />;
}

function DashboardDetail({ item }) {
  const widgets = safeParse(item.widgets, []);
  const layout = safeParse(item.layout_config, {});
  const suggestions = safeParse(item.ai_suggestions, []);
  const dataSources = safeParse(item.data_sources, []);
  const colorHex = getColorHex(item.color_scheme);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-50 to-purple-50 border border-fuchsia-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Wand2 className="h-6 w-6 text-fuchsia-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-fuchsia-800">AI Generated Dashboard</h3>
            <p className="text-sm text-fuchsia-600 mt-1">{item.prompt}</p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: colorHex }} />
                <span className="text-sm font-medium capitalize text-gray-600">{item.color_scheme}</span>
              </div>
              <span className="text-sm text-gray-500">{widgets.length} widgets</span>
              <span className="text-sm text-gray-500">{layout.columns || 12} columns</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {dataSources.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-amber-500" /> Key Performance Indicators
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {dataSources.map((kpi, i) => {
              const k = typeof kpi === 'string' ? { title: kpi, description: kpi } : kpi;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{k.title || k.target_metric || k.name || `KPI ${i+1}`}</p>
                  <p className="text-sm text-gray-600 mt-1">{k.description || k.format || ''}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Widgets List */}
      {widgets.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-blue-500" /> Dashboard Widgets
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {widgets.map((widget, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: colorHex + '15', color: colorHex }}>
                    {getWidgetIcon(widget.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-800 truncate">{widget.title}</h5>
                    {widget.description && <p className="text-sm text-gray-500 mt-0.5">{widget.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded" style={{ backgroundColor: colorHex + '20', color: colorHex }}>{widget.type}</span>
                      {widget.chart_type && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{widget.chart_type}</span>}
                      {widget.position && <span className="text-xs text-gray-400">{widget.position.width}x{widget.position.height}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Layout Preview */}
      {widgets.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Layout Preview</h4>
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="grid grid-cols-12 gap-2" style={{ minHeight: '200px' }}>
              {widgets.map((widget, i) => (
                <div key={i} className="rounded-lg flex items-center justify-center text-xs font-medium p-2"
                  style={{
                    gridColumn: `span ${Math.min(widget.position?.width || 4, 12)}`,
                    gridRow: `span ${widget.position?.height || 2}`,
                    backgroundColor: colorHex + '30',
                    color: colorHex,
                    border: `1px solid ${colorHex}40`
                  }}>
                  <div className="flex flex-col items-center gap-1 text-center">
                    {getWidgetIcon(widget.type)}
                    <span className="text-[10px] opacity-75 truncate max-w-full px-1">{widget.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" /> AI Suggestions
          </h4>
          <div className="space-y-3">
            {suggestions.map((s, i) => {
              const sug = typeof s === 'string' ? { title: s, description: s, priority: 3 } : s;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ChevronRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                        <h5 className="font-semibold text-gray-800">{sug.title}</h5>
                      </div>
                      {sug.description && sug.description !== sug.title && (
                        <p className="text-sm text-gray-600 ml-6">{sug.description}</p>
                      )}
                    </div>
                    {sug.priority && <PriorityBadge priority={sug.priority} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardGenerator() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [formData, setFormData] = useState({ requirements: '', user_role: 'analyst' });
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setConfigs(await api.getDashboardConfigs()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.generateDashboardConfig(formData);
      setModalOpen(false);
      setFormData({ requirements: '', user_role: 'analyst' });
      loadData();
    } catch (e) { console.error(e); } finally { setGenerating(false); }
  };

  const handleDelete = async (item) => {
    if (confirm('Delete this dashboard config?')) {
      try { await api.deleteDashboardConfig(item.id); loadData(); } catch (e) { console.error(e); }
    }
  };

  const examplePrompts = [
    'Executive dashboard showing revenue, customer metrics, and key KPIs',
    'Sales performance dashboard with pipeline, quotas, and team comparison',
    'Marketing analytics with campaign ROI and channel attribution',
    'Customer success metrics with churn, NPS, and engagement scores'
  ];

  const columns = [
    { key: 'prompt', label: 'Requirements', render: (v) => <span className="truncate max-w-xs block">{v?.substring(0, 60)}...</span> },
    { key: 'color_scheme', label: 'Color', render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: getColorHex(v) }} />
        <span className="capitalize text-sm">{v}</span>
      </div>
    )},
    { key: 'widgets', label: 'Widgets', render: (v) => <span className="text-gray-600">{safeParse(v, []).length} widgets</span> },
    { key: 'ai_generated', label: 'AI Generated', render: (v) => v ? <div className="flex items-center gap-1 text-purple-600"><Sparkles className="h-4 w-4" /><span>Yes</span></div> : <span className="text-gray-500">No</span> },
    { key: 'created_at', label: 'Created', render: (v) => new Date(v).toLocaleDateString() }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-fuchsia-50 rounded-lg"><Wand2 className="h-6 w-6 text-fuchsia-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Dashboard Generator</h1>
          <p className="text-gray-500">Generate custom dashboards with AI-powered layouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fuchsia-50 rounded-lg"><LayoutGrid className="h-5 w-5 text-fuchsia-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{configs.length}</p><p className="text-sm text-gray-500">Dashboards</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{configs.reduce((a,b) => a + safeParse(b.widgets, []).length, 0)}</p><p className="text-sm text-gray-500">Total Widgets</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Sparkles className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{configs.filter(c => c.ai_generated).length}</p><p className="text-sm text-gray-500">AI Generated</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><Palette className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{new Set(configs.map(c => c.color_scheme)).size}</p><p className="text-sm text-gray-500">Color Schemes</p></div>
          </div>
        </div>
      </div>

      <DataTable title="Dashboard Configurations" data={configs} columns={columns} loading={loading} onRowClick={(item) => setDetailModal(item)} onAdd={() => setModalOpen(true)} onDelete={handleDelete} addLabel="Generate Dashboard" emptyMessage="No dashboard configs yet. Generate one with AI!" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate AI Dashboard" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dashboard Requirements</label>
            <textarea value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={4} placeholder="Describe what you want your dashboard to show..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, i) => (
                <button key={i} type="button" onClick={() => setFormData({ ...formData, requirements: prompt })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">{prompt.substring(0, 40)}...</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
            <select value={formData.user_role} onChange={(e) => setFormData({ ...formData, user_role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="executive">Executive</option><option value="manager">Manager</option><option value="analyst">Analyst</option><option value="developer">Developer</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Generating...</> : <><Wand2 className="h-4 w-4" />Generate Dashboard</>}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Dashboard Configuration" size="xl">
        {detailModal && <DashboardDetail item={detailModal} />}
      </Modal>
    </div>
  );
}
