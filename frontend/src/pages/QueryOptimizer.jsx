import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
  Zap, Sparkles, TrendingUp, Database, CheckCircle, AlertTriangle,
  ChevronRight, Shield, Code, ArrowRight, Gauge, BookOpen, XCircle
} from 'lucide-react';

function safeParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function ImprovementGauge({ value }) {
  const v = Number(value) || 0;
  const color = v >= 50 ? 'text-green-600' : v >= 25 ? 'text-yellow-600' : 'text-orange-600';
  const bg = v >= 50 ? 'bg-green-500' : v >= 25 ? 'bg-yellow-500' : 'bg-orange-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${bg}`} style={{ width: `${Math.min(v, 100)}%` }} />
      </div>
      <span className={`text-lg font-bold ${color}`}>{v}%</span>
    </div>
  );
}

function CategoryBadge({ category }) {
  const styles = {
    performance: 'bg-green-100 text-green-700 border-green-200',
    readability: 'bg-blue-100 text-blue-700 border-blue-200',
    security: 'bg-red-100 text-red-700 border-red-200',
    best_practice: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[category] || styles.performance}`}>
      {(category || 'performance').replace(/_/g, ' ')}
    </span>
  );
}

function OptimizationDetail({ item }) {
  const suggestions = safeParse(item.suggestions, []);
  const indexRecs = safeParse(item.index_recommendations, []);

  const getTypeConfig = (type) => {
    const configs = {
      query_rewrite: { label: 'Query Rewrite', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      index_optimization: { label: 'Index Optimization', color: 'bg-green-50 text-green-700 border-green-200' },
      join_optimization: { label: 'Join Optimization', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      execution_plan_improvement: { label: 'Execution Plan', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    };
    return configs[type] || { label: type || 'Analysis', color: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const typeConfig = getTypeConfig(item.optimization_type);

  return (
    <div className="space-y-6">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg border ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <Database className="h-4 w-4" />
          {new Date(item.created_at).toLocaleString()}
        </span>
      </div>

      {/* Performance improvement */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">Estimated Performance Improvement</p>
        <ImprovementGauge value={item.improvement_percentage} />
      </div>

      {/* Query comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-red-400" /> Original Query
          </h4>
          <pre className="bg-gray-900 text-red-300 p-4 rounded-xl overflow-auto text-sm font-mono leading-relaxed max-h-48">{item.original_query}</pre>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-green-400" /> Optimized Query
          </h4>
          <pre className="bg-gray-900 text-green-300 p-4 rounded-xl overflow-auto text-sm font-mono leading-relaxed max-h-48">{item.optimized_query}</pre>
        </div>
      </div>

      {/* AI Explanation */}
      {item.ai_analysis && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-primary-800 uppercase tracking-wide mb-2">AI Analysis</h4>
          <p className="text-gray-700 leading-relaxed">{item.ai_analysis}</p>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" /> Suggestions
          </h4>
          <div className="space-y-3">
            {suggestions.map((s, i) => {
              const sug = typeof s === 'string' ? { title: s, description: s, category: 'performance' } : s;
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
                    <CategoryBadge category={sug.category} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Index Recommendations */}
      {indexRecs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-500" /> Index Recommendations
          </h4>
          <div className="space-y-3">
            {indexRecs.map((idx, i) => {
              const rec = typeof idx === 'string' ? { table: 'N/A', columns: [idx], type: 'btree', rationale: idx } : idx;
              return (
                <div key={i} className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-4 w-4 text-purple-600" />
                    <code className="font-mono text-sm font-semibold text-purple-800">
                      CREATE INDEX ON {rec.table} ({Array.isArray(rec.columns) ? rec.columns.join(', ') : rec.columns})
                    </code>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded text-xs font-medium">{rec.type || 'btree'}</span>
                    {rec.rationale && <span className="text-purple-600">{rec.rationale}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {indexRecs.length === 0 && (
        <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-4 rounded-xl">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span>No additional indexes needed</span>
        </div>
      )}
    </div>
  );
}

export default function QueryOptimizer() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [formData, setFormData] = useState({ original_query: '', schema: '', performance_context: '' });
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getQueryOptimizations()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.createQueryOptimization(formData);
      setModalOpen(false);
      setFormData({ original_query: '', schema: '', performance_context: '' });
      loadData();
    } catch (e) { console.error(e); } finally { setGenerating(false); }
  };

  const handleDelete = async (item) => {
    if (confirm('Delete this optimization?')) {
      try { await api.deleteQueryOptimization(item.id); loadData(); } catch (e) { console.error(e); }
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'query_rewrite': 'bg-blue-100 text-blue-700',
      'index_optimization': 'bg-green-100 text-green-700',
      'join_optimization': 'bg-purple-100 text-purple-700',
      'execution_plan_improvement': 'bg-orange-100 text-orange-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const columns = [
    { key: 'original_query', label: 'Original Query', render: (v) => <span className="font-mono text-xs truncate max-w-xs block">{v?.substring(0, 60)}...</span> },
    { key: 'optimization_type', label: 'Type', render: (v) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(v)}`}>{v?.replace(/_/g, ' ')}</span> },
    { key: 'improvement_percentage', label: 'Improvement', render: (v) => (
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${Number(v) >= 50 ? 'bg-green-500' : Number(v) >= 25 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${v}%` }} />
        </div>
        <span className="text-sm font-medium">{v}%</span>
      </div>
    )},
    { key: 'suggestions', label: 'Suggestions', render: (v) => {
      const s = safeParse(v, []);
      return <span className="text-gray-600">{s.length} suggestion{s.length !== 1 ? 's' : ''}</span>;
    }},
    { key: 'status', label: 'Status', render: (v) => (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="capitalize">{v}</span>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-50 rounded-lg"><Zap className="h-6 w-6 text-yellow-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Query Optimizer</h1>
            <p className="text-gray-500">Optimize your database queries with AI-powered suggestions</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Database className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              <p className="text-sm text-gray-500">Total Optimizations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.length > 0 ? Math.round(data.reduce((a,b) => a + Number(b.improvement_percentage || 0), 0) / data.length) : 0}%</p>
              <p className="text-sm text-gray-500">Avg Improvement</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Zap className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.filter(d => Number(d.improvement_percentage) > 50).length}</p>
              <p className="text-sm text-gray-500">High Impact</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.reduce((a,b) => a + (safeParse(b.index_recommendations, []).length), 0)}</p>
              <p className="text-sm text-gray-500">Index Recommendations</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        title="Query Optimizations"
        data={data}
        columns={columns}
        loading={loading}
        onRowClick={(item) => setDetailModal(item)}
        onAdd={() => setModalOpen(true)}
        onDelete={handleDelete}
        addLabel="Optimize Query"
        emptyMessage="No optimizations yet. Submit a query to optimize!"
      />

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Optimize SQL Query" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SQL Query to Optimize</label>
            <textarea
              value={formData.original_query}
              onChange={(e) => setFormData({ ...formData, original_query: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              rows={6}
              placeholder="SELECT * FROM orders WHERE..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Database Schema (optional)</label>
            <textarea
              value={formData.schema}
              onChange={(e) => setFormData({ ...formData, schema: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              rows={3}
              placeholder="Tables: orders(id, customer_id, total, date), customers(id, name, email)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Performance Context (optional)</label>
            <input
              value={formData.performance_context}
              onChange={(e) => setFormData({ ...formData, performance_context: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Query takes 5 seconds, 1M rows in orders table"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Load Example</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFormData({ original_query: 'SELECT * FROM orders o LEFT JOIN customers c ON o.customer_id = c.id LEFT JOIN products p ON o.product_id = p.id WHERE o.created_at > \'2024-01-01\' AND c.country = \'US\' ORDER BY o.total DESC', schema: 'Tables: orders(id, customer_id, product_id, total, status, created_at) with 2M rows, customers(id, name, email, country) with 500K rows, products(id, name, category, price) with 10K rows', performance_context: 'Query takes 8 seconds, no indexes on created_at or country columns' })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">Slow Join Query</button>
              <button type="button" onClick={() => setFormData({ original_query: 'SELECT customer_id, COUNT(*) as order_count, SUM(total) as revenue FROM orders WHERE status != \'cancelled\' GROUP BY customer_id HAVING SUM(total) > 1000 ORDER BY revenue DESC LIMIT 100', schema: 'Tables: orders(id, customer_id, total, status, created_at) with 5M rows. No index on status column.', performance_context: 'Aggregation takes 12 seconds on production, runs hourly for reporting dashboard' })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">Heavy Aggregation</button>
              <button type="button" onClick={() => setFormData({ original_query: 'SELECT p.name, p.category, COUNT(DISTINCT o.customer_id) as unique_buyers, SUM(o.quantity) as total_sold, AVG(o.total) as avg_order_value FROM products p INNER JOIN order_items oi ON p.id = oi.product_id INNER JOIN orders o ON oi.order_id = o.id WHERE o.created_at BETWEEN \'2024-06-01\' AND \'2024-12-31\' GROUP BY p.name, p.category ORDER BY total_sold DESC', schema: 'Tables: products(id, name, category, price), order_items(id, order_id, product_id, quantity, unit_price), orders(id, customer_id, total, created_at). Products: 50K rows, order_items: 10M rows, orders: 3M rows.', performance_context: 'Used for weekly product performance report, currently takes 25 seconds' })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">Product Analytics</button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Optimizing...</> : <><Sparkles className="h-4 w-4" />Optimize Query</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Optimization Details" size="xl">
        {detailModal && <OptimizationDetail item={detailModal} />}
      </Modal>
    </div>
  );
}
