import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit3, Zap, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = '/api';
let _authToken = null;
function getToken() {
  if (_authToken) return _authToken;
  try { return JSON.parse(localStorage.getItem('token') || 'null'); } catch { return null; }
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function AIVerbPanel({ apiPath, itemId, verbs, onClose }) {
  const [loading, setLoading] = useState(false);
  const [activeVerb, setActiveVerb] = useState(null);
  const [result, setResult] = useState(null);

  const runVerb = async (slug) => {
    setLoading(true);
    setActiveVerb(slug);
    setResult(null);
    try {
      const data = await apiFetch(`${apiPath}/ai/${slug}`, {
        method: 'POST',
        body: JSON.stringify({ id: itemId }),
      });
      setResult(data.result);
      toast.success(`AI: ${slug} complete`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">AI Verbs</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-56 flex-shrink-0 border-r border-gray-100 overflow-y-auto p-3">
            <div className="space-y-1">
              {verbs.map((v) => (
                <button
                  key={v}
                  onClick={() => runVerb(v)}
                  disabled={loading}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                    activeVerb === v ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="flex items-center gap-2 text-violet-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                <span className="text-sm">Running {activeVerb}...</span>
              </div>
            )}
            {!loading && result && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">{activeVerb}</p>
                <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-auto whitespace-pre-wrap text-gray-700">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
            {!loading && !result && (
              <p className="text-sm text-gray-400">Select an AI verb to run it on this item.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateEditModal({ isOpen, onClose, onSave, fields, initialData, title }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm(initialData || {});
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  value={form[f.key] || ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  rows={3}
                  required={f.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder={f.placeholder || ''}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={form[f.key] || ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  required={f.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder={f.placeholder || ''}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">
              {saving ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div> : null}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeaturePage({
  title,
  description,
  icon: Icon,
  iconBg = 'bg-violet-50',
  iconColor = 'text-violet-600',
  apiPath,
  columns,
  formFields,
  aiVerbs,
  createFields,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [aiItem, setAiItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page, limit: 20, ...(search ? { q: search } : {}) }).toString();
      const endpoint = search ? `${apiPath}/search?${qs}` : `${apiPath}?${qs}`;
      const data = await apiFetch(endpoint);
      setItems(data.data || []);
      setPagination(data.pagination || null);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [apiPath, page, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    await apiFetch(apiPath, { method: 'POST', body: JSON.stringify(form) });
    toast.success('Created');
    load();
  };

  const handleEdit = async (form) => {
    await apiFetch(`${apiPath}/${editItem.id}`, { method: 'PUT', body: JSON.stringify(form) });
    toast.success('Updated');
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await apiFetch(`${apiPath}/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const fields = createFields || formFields || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBg} rounded-lg`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-500 text-sm">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={`Search ${title}...`}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Icon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No items yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-gray-700">
                        {c.render ? c.render(item[c.key], item) : (
                          <span className="truncate max-w-xs block">{String(item[c.key] ?? '-')}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {aiVerbs?.length > 0 && (
                          <button
                            onClick={() => setAiItem(item)}
                            className="p-1.5 text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                            title="AI Verbs"
                          >
                            <Zap className="h-4 w-4" />
                          </button>
                        )}
                        {fields.length > 0 && (
                          <button
                            onClick={() => setEditItem(item)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-600 px-2">{page} / {pagination.totalPages}</span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateEditModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
        fields={fields}
        title={`New ${title}`}
      />

      {/* Edit Modal */}
      <CreateEditModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={handleEdit}
        fields={fields}
        initialData={editItem}
        title={`Edit ${title}`}
      />

      {/* AI Verbs Panel */}
      {aiItem && (
        <AIVerbPanel
          apiPath={apiPath}
          itemId={aiItem.id}
          verbs={aiVerbs}
          onClose={() => setAiItem(null)}
        />
      )}
    </div>
  );
}
