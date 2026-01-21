import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Search, Sparkles, Clock, CheckCircle } from 'lucide-react';

export default function Queries() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getQueries()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try { await api.createQuery(query); setModalOpen(false); setQuery(''); loadData(); } catch (e) { console.error(e); } finally { setGenerating(false); }
  };

  const columns = [
    { key: 'natural_language_query', label: 'Query', render: (v) => <span className="truncate max-w-md block">{v}</span> },
    { key: 'execution_time', label: 'Time', render: (v) => <div className="flex items-center gap-1"><Clock className="h-4 w-4 text-gray-400" /><span>{v}ms</span></div> },
    { key: 'row_count', label: 'Rows', render: (v) => v?.toLocaleString() || '0' },
    { key: 'status', label: 'Status', render: (v) => <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" /><span className="capitalize">{v}</span></div> },
    { key: 'result_summary', label: 'Result', render: (v) => <span className="text-gray-500 truncate max-w-xs block">{v}</span> }
  ];

  const exampleQueries = [
    'Show me top 10 customers by revenue',
    'What is our churn rate by month?',
    'Compare sales across regions',
    'Which products have highest margins?'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-lg"><Search className="h-6 w-6 text-primary-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Natural Language Queries</h1><p className="text-gray-500">Ask questions in plain English, get SQL results</p></div>
      </div>

      <DataTable title="Query History" data={data} columns={columns} loading={loading} detailPath="/queries" onAdd={() => setModalOpen(true)} addLabel="New Query" emptyMessage="No queries yet. Ask your first question!" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Ask a Question" size="lg">
        <form onSubmit={handleQuery} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Your Question</label><textarea value={query} onChange={(e) => setQuery(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={3} placeholder="e.g., Show me top 10 customers by revenue this quarter" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Example Queries</label><div className="flex flex-wrap gap-2">{exampleQueries.map((eq, i) => (<button key={i} type="button" onClick={() => setQuery(eq)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors">{eq}</button>))}</div></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Processing...</> : <><Sparkles className="h-4 w-4" />Run Query</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
