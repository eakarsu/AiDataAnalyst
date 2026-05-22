import { useEffect, useMemo, useState } from 'react';
import { Play, Plus, Trash2, Code } from 'lucide-react';

const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE'];

export default function QueryBuilder({ token }) {
  const [datasets, setDatasets] = useState([]);
  const [table, setTable] = useState('');
  const [selectedCols, setSelectedCols] = useState([]);
  const [whereClauses, setWhereClauses] = useState([]);
  const [orderBy, setOrderBy] = useState('');
  const [orderDir, setOrderDir] = useState('ASC');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/custom-views/datasets', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(j => {
        setDatasets(j.datasets || []);
        if (j.datasets?.[0]) {
          setTable(j.datasets[0].id);
          setSelectedCols(j.datasets[0].columns.slice(0, 3).map(c => c.name));
          setOrderBy(j.datasets[0].columns[0]?.name || '');
        }
      })
      .catch(e => setError(e.message));
  }, [token]);

  const currentDs = useMemo(() => datasets.find(d => d.id === table), [datasets, table]);

  const sql = useMemo(() => {
    if (!table) return '';
    const cols = selectedCols.length ? selectedCols.join(', ') : '*';
    let q = `SELECT ${cols}\nFROM ${table}`;
    const validWhere = whereClauses.filter(w => w.column && w.value !== '');
    if (validWhere.length) {
      q += `\nWHERE ${validWhere.map(w => {
        const v = isNaN(Number(w.value)) ? `'${w.value}'` : w.value;
        return `${w.column} ${w.op} ${v}`;
      }).join(' AND ')}`;
    }
    if (orderBy) q += `\nORDER BY ${orderBy} ${orderDir}`;
    return q + ';';
  }, [table, selectedCols, whereClauses, orderBy, orderDir]);

  function changeTable(id) {
    setTable(id);
    const ds = datasets.find(d => d.id === id);
    setSelectedCols(ds ? ds.columns.slice(0, 3).map(c => c.name) : []);
    setWhereClauses([]);
    setOrderBy(ds?.columns[0]?.name || '');
  }

  function toggleCol(name) {
    setSelectedCols(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  }

  function addWhere() {
    if (!currentDs) return;
    setWhereClauses(prev => [...prev, {
      column: currentDs.columns[0].name,
      op: '=',
      value: '',
    }]);
  }

  function updateWhere(i, patch) {
    setWhereClauses(prev => prev.map((w, idx) => idx === i ? { ...w, ...patch } : w));
  }

  function removeWhere(i) {
    setWhereClauses(prev => prev.filter((_, idx) => idx !== i));
  }

  async function runQuery() {
    setRunning(true); setError(null); setResult(null);
    try {
      const r = await fetch('/api/custom-views/run-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sql, dataset: table }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || 'Query failed');
      }
      setResult(await r.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <Code className="h-4 w-4 text-primary-600" />
        <span className="font-semibold text-gray-900">Visual Query Builder</span>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Table</label>
          <select
            value={table}
            onChange={e => changeTable(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Columns</label>
          <div className="flex flex-wrap gap-2">
            {currentDs?.columns.map(c => (
              <button
                key={c.name}
                onClick={() => toggleCol(c.name)}
                className={`px-2 py-1 rounded text-xs border ${
                  selectedCols.includes(c.name)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-gray-50 text-gray-700 border-gray-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-700">WHERE</label>
            <button
              onClick={addWhere}
              className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
            >
              <Plus className="h-3 w-3" /> Add filter
            </button>
          </div>
          <div className="space-y-2">
            {whereClauses.map((w, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  value={w.column}
                  onChange={e => updateWhere(i, { column: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  {currentDs?.columns.map(c => <option key={c.name}>{c.name}</option>)}
                </select>
                <select
                  value={w.op}
                  onChange={e => updateWhere(i, { op: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  {OPERATORS.map(o => <option key={o}>{o}</option>)}
                </select>
                <input
                  value={w.value}
                  onChange={e => updateWhere(i, { value: e.target.value })}
                  placeholder="value"
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                />
                <button onClick={() => removeWhere(i)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {whereClauses.length === 0 && (
              <div className="text-xs text-gray-400">No filters</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ORDER BY</label>
            <select
              value={orderBy}
              onChange={e => setOrderBy(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">(none)</option>
              {currentDs?.columns.map(c => <option key={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Direction</label>
            <select
              value={orderDir}
              onChange={e => setOrderDir(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option>ASC</option>
              <option>DESC</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Generated SQL</label>
          <pre className="bg-gray-900 text-green-200 text-xs rounded p-3 whitespace-pre-wrap overflow-x-auto">
{sql}
          </pre>
        </div>

        <button
          onClick={runQuery}
          disabled={running || !sql}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-sm px-3 py-2 rounded"
        >
          <Play className="h-4 w-4" /> {running ? 'Running...' : 'Run'}
        </button>

        {error && <div className="text-sm text-red-600">{error}</div>}

        {result && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 border-b">
              {result.row_count} rows in {result.duration_ms} ms
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {result.columns.map(c => (
                      <th key={c.name} className="px-2 py-1 text-left font-semibold text-gray-700 border-b">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className={i % 2 ? 'bg-gray-50/50' : ''}>
                      {result.columns.map(c => (
                        <td key={c.name} className="px-2 py-1 text-gray-800 whitespace-nowrap border-b border-gray-100">
                          {String(row[c.name])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
