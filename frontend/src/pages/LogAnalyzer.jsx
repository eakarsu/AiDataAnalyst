import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PieChartWidget from '../components/charts/PieChartWidget';
import BarChartWidget from '../components/charts/BarChartWidget';
import {
  FileText, Sparkles, AlertCircle, AlertTriangle, Info, Bug, Shield,
  CheckCircle, XCircle, Clock, ChevronRight, Activity, Heart,
  Server, ArrowUpRight, ArrowDownRight, Minus, Target
} from 'lucide-react';

function safeParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function HealthScore({ value }) {
  const v = Number(value) || 0;
  const color = v >= 80 ? 'text-green-600' : v >= 60 ? 'text-yellow-600' : v >= 40 ? 'text-orange-600' : 'text-red-600';
  const bg = v >= 80 ? 'bg-green-500' : v >= 60 ? 'bg-yellow-500' : v >= 40 ? 'bg-orange-500' : 'bg-red-500';
  const label = v >= 80 ? 'Healthy' : v >= 60 ? 'Warning' : v >= 40 ? 'Degraded' : 'Critical';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">System Health</span>
        <span className={`text-xs font-semibold ${color}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${bg}`} style={{ width: `${v}%` }} />
        </div>
        <span className={`text-lg font-bold ${color}`}>{v}%</span>
      </div>
    </div>
  );
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
  const labels = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low', 5: 'Info' };
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[p] || styles[3]}`}>P{p} {labels[p] || ''}</span>;
}

function TrendIcon({ trend }) {
  if (trend === 'up') return <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />;
  if (trend === 'down') return <ArrowDownRight className="h-3.5 w-3.5 text-green-500" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400" />;
}

function getSeverityConfig(severity) {
  const configs = {
    critical: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
    high: { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
    medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
    low: { color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  };
  return configs[severity] || configs.medium;
}

function AnalysisDetail({ data }) {
  const patterns = safeParse(data.patterns_detected, []);
  const rootCauses = safeParse(data.root_causes, []);
  const recommendations = safeParse(data.recommendations, []);
  const sevConfig = getSeverityConfig(data.severity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl p-5 border ${sevConfig.color}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{data.analysis_name}</h3>
            <p className="text-sm opacity-75 mt-1">Analyzed {data.log_count} logs on {new Date(data.created_at).toLocaleString()}</p>
          </div>
          <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg border ${sevConfig.color}`}>
            {data.severity?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{data.log_count}</p>
          <p className="text-sm text-gray-500">Logs Analyzed</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{data.error_count}</p>
          <p className="text-sm text-gray-500">Errors Found</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">{data.warning_count}</p>
          <p className="text-sm text-gray-500">Warnings Found</p>
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-primary-800 uppercase tracking-wide mb-2">Executive Summary</h4>
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Patterns Detected */}
      {patterns.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-500" /> Patterns Detected
          </h4>
          <div className="space-y-3">
            {patterns.map((p, i) => {
              const pat = typeof p === 'string' ? { pattern: p, frequency: 'N/A', description: p, severity: 'medium' } : p;
              const patSev = getSeverityConfig(pat.severity);
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`h-2 w-2 rounded-full ${patSev.dot}`} />
                        <h5 className="font-semibold text-gray-800">{pat.pattern}</h5>
                      </div>
                      <p className="text-sm text-gray-600 ml-4">{pat.description}</p>
                      {pat.affected_components && Array.isArray(pat.affected_components) && pat.affected_components.length > 0 && (
                        <div className="flex gap-1.5 ml-4 mt-2">
                          {pat.affected_components.map((c, j) => (
                            <span key={j} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">Freq: {pat.frequency}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Root Causes */}
      {rootCauses.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-red-500" /> Root Causes
          </h4>
          <div className="space-y-3">
            {rootCauses.map((r, i) => {
              const rc = typeof r === 'string' ? { cause: r, confidence: 50, evidence: r } : r;
              return (
                <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h5 className="font-semibold text-red-800">{rc.cause}</h5>
                      {rc.evidence && <p className="text-sm text-red-600 mt-1">{rc.evidence}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-red-700">{rc.confidence}%</p>
                      <p className="text-xs text-red-500">confidence</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> Recommendations
          </h4>
          <div className="space-y-3">
            {recommendations.map((r, i) => {
              const rec = typeof r === 'string' ? { title: r, description: r, priority: 3, category: 'monitoring' } : r;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ChevronRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                        <h5 className="font-semibold text-gray-800">{rec.title || rec.action}</h5>
                      </div>
                      {rec.description && rec.description !== (rec.title || rec.action) && (
                        <p className="text-sm text-gray-600 ml-6">{rec.description}</p>
                      )}
                      {rec.expected_impact && <p className="text-xs text-gray-500 ml-6 mt-1">Impact: <span className="font-medium capitalize">{rec.expected_impact}</span></p>}
                    </div>
                    <PriorityBadge priority={rec.priority} />
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

function EntryDetail({ data }) {
  const sevConfig = getSeverityConfig(data.ai_severity);
  return (
    <div className="space-y-6">
      {/* Log message */}
      <div className="bg-gray-900 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          {data.level?.toUpperCase() === 'ERROR' ? <XCircle className="h-4 w-4 text-red-400" /> :
           data.level?.toUpperCase() === 'WARN' ? <AlertTriangle className="h-4 w-4 text-yellow-400" /> :
           <Info className="h-4 w-4 text-blue-400" />}
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${
            data.level?.toUpperCase() === 'ERROR' ? 'bg-red-900 text-red-300' :
            data.level?.toUpperCase() === 'WARN' ? 'bg-yellow-900 text-yellow-300' :
            'bg-blue-900 text-blue-300'
          }`}>{data.level?.toUpperCase()}</span>
          <span className="text-gray-400 text-sm">{data.source}</span>
          <span className="text-gray-500 text-xs ml-auto">{new Date(data.timestamp).toLocaleString()}</span>
        </div>
        <p className="text-white font-mono text-sm leading-relaxed">{data.message}</p>
        {data.stack_trace && <pre className="mt-4 text-red-400 text-xs overflow-auto border-t border-gray-700 pt-3">{data.stack_trace}</pre>}
      </div>

      {/* AI Classification */}
      {data.ai_classification && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-3">AI Classification</h4>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1.5 text-sm font-semibold bg-purple-200 text-purple-800 rounded-lg">{data.ai_classification}</span>
              <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg border ${sevConfig.color}`}>{data.ai_severity}</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-3">Root Cause</h4>
            <p className="text-blue-900 text-sm leading-relaxed">{data.ai_root_cause}</p>
          </div>
        </div>
      )}

      {/* Solution */}
      {data.ai_solution && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Recommended Solution
          </h4>
          <p className="text-green-900 leading-relaxed">{data.ai_solution}</p>
        </div>
      )}
    </div>
  );
}

export default function LogAnalyzer() {
  const [logEntries, setLogEntries] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('entries');
  const [modalOpen, setModalOpen] = useState(false);
  const [analysisModal, setAnalysisModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [formData, setFormData] = useState({ source: '', level: 'ERROR', message: '', metadata: '' });
  const [analysisName, setAnalysisName] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [entries, analysisData] = await Promise.all([api.getLogEntries(), api.getLogAnalyses()]);
      setLogEntries(entries);
      setAnalyses(analysisData);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.createLogEntry({ ...formData, timestamp: new Date().toISOString(), metadata: formData.metadata ? JSON.parse(formData.metadata) : {} });
      setModalOpen(false);
      setFormData({ source: '', level: 'ERROR', message: '', metadata: '' });
      loadData();
    } catch (e) { console.error(e); alert('Error: ' + e.message); } finally { setGenerating(false); }
  };

  const handleRunAnalysis = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.createLogAnalysis({ analysis_name: analysisName || 'Log Analysis ' + new Date().toLocaleString() });
      setAnalysisModal(false);
      setAnalysisName('');
      loadData();
    } catch (e) { console.error(e); } finally { setGenerating(false); }
  };

  const handleDeleteEntry = async (item) => { if (confirm('Delete this log entry?')) { try { await api.deleteLogEntry(item.id); loadData(); } catch (e) { console.error(e); } } };
  const handleDeleteAnalysis = async (item) => { if (confirm('Delete this analysis?')) { try { await api.deleteLogAnalysis(item.id); loadData(); } catch (e) { console.error(e); } } };

  const getLevelColor = (level) => {
    const colors = { 'ERROR': 'bg-red-100 text-red-700', 'WARN': 'bg-yellow-100 text-yellow-700', 'INFO': 'bg-blue-100 text-blue-700', 'DEBUG': 'bg-gray-100 text-gray-700' };
    return colors[level?.toUpperCase()] || 'bg-gray-100 text-gray-700';
  };

  const entryColumns = [
    { key: 'source', label: 'Source', render: (v) => <span className="font-medium">{v}</span> },
    { key: 'level', label: 'Level', render: (v) => <span className={`px-2 py-0.5 text-xs font-medium rounded ${getLevelColor(v)}`}>{v?.toUpperCase()}</span> },
    { key: 'message', label: 'Message', render: (v) => <span className="truncate max-w-md block text-sm">{v}</span> },
    { key: 'ai_classification', label: 'AI Class', render: (v) => v ? <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">{v}</span> : '-' },
    { key: 'ai_severity', label: 'Severity', render: (v) => v ? <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityConfig(v).color}`}>{v}</span> : '-' },
    { key: 'timestamp', label: 'Time', render: (v) => <span className="text-gray-500 text-sm">{new Date(v).toLocaleString()}</span> }
  ];

  const analysisColumns = [
    { key: 'analysis_name', label: 'Analysis Name' },
    { key: 'log_count', label: 'Logs', render: (v) => v?.toLocaleString() },
    { key: 'error_count', label: 'Errors', render: (v) => <span className="text-red-600 font-medium">{v}</span> },
    { key: 'warning_count', label: 'Warnings', render: (v) => <span className="text-yellow-600 font-medium">{v}</span> },
    { key: 'severity', label: 'Severity', render: (v) => <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityConfig(v).color}`}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <div className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /><span className="capitalize">{v}</span></div> }
  ];

  const errorCount = logEntries.filter(l => l.level?.toUpperCase() === 'ERROR').length;
  const warnCount = logEntries.filter(l => l.level?.toUpperCase() === 'WARN').length;
  const infoCount = logEntries.filter(l => l.level?.toUpperCase() === 'INFO').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg"><FileText className="h-6 w-6 text-indigo-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Log Analyzer</h1>
          <p className="text-gray-500">Analyze application logs with AI-powered insights</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-2xl font-bold text-gray-900">{logEntries.length}</p><p className="text-sm text-gray-500">Total Logs</p></div>
        <div className="bg-white rounded-xl border border-red-200 p-4"><p className="text-2xl font-bold text-red-600">{errorCount}</p><p className="text-sm text-gray-500">Errors</p></div>
        <div className="bg-white rounded-xl border border-yellow-200 p-4"><p className="text-2xl font-bold text-yellow-600">{warnCount}</p><p className="text-sm text-gray-500">Warnings</p></div>
        <div className="bg-white rounded-xl border border-blue-200 p-4"><p className="text-2xl font-bold text-blue-600">{infoCount}</p><p className="text-sm text-gray-500">Info</p></div>
        <div className="bg-white rounded-xl border border-purple-200 p-4"><p className="text-2xl font-bold text-purple-600">{analyses.length}</p><p className="text-sm text-gray-500">Analyses</p></div>
      </div>

      {logEntries.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <PieChartWidget title="Log Level Distribution" data={[{ name: 'Error', value: errorCount }, { name: 'Warning', value: warnCount }, { name: 'Info', value: infoCount }, { name: 'Debug', value: logEntries.filter(l => l.level?.toUpperCase() === 'DEBUG').length }]} height={250} />
          <BarChartWidget title="Logs by Source" data={Object.entries(logEntries.reduce((acc, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc; }, {})).slice(0, 8).map(([name, count]) => ({ name, count }))} xKey="name" bars={['count']} height={250} />
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button onClick={() => setActiveTab('entries')} className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'entries' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Log Entries ({logEntries.length})</button>
          <button onClick={() => setActiveTab('analysis')} className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'analysis' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Analysis Results ({analyses.length})</button>
        </nav>
      </div>

      {activeTab === 'entries' ? (
        <DataTable title="Log Entries" data={logEntries} columns={entryColumns} loading={loading} onRowClick={(item) => setDetailModal({ type: 'entry', data: item })} onAdd={() => setModalOpen(true)} onDelete={handleDeleteEntry} addLabel="Add Log Entry" emptyMessage="No log entries yet" />
      ) : (
        <DataTable title="Analysis Results" data={analyses} columns={analysisColumns} loading={loading} onRowClick={(item) => setDetailModal({ type: 'analysis', data: item })} onAdd={() => setAnalysisModal(true)} onDelete={handleDeleteAnalysis} addLabel="Run Analysis" emptyMessage="No analyses yet. Run one to analyze your logs!" />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Log Entry" size="lg">
        <form onSubmit={handleSubmitEntry} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="api-gateway, auth-service, etc." required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="ERROR">ERROR</option><option value="WARN">WARN</option><option value="INFO">INFO</option><option value="DEBUG">DEBUG</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={3} placeholder="Error message or log content..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON, optional)</label>
            <textarea value={formData.metadata} onChange={(e) => setFormData({ ...formData, metadata: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm" rows={2} placeholder='{"service": "api", "endpoint": "/users"}' />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Load Example</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFormData({ source: 'api-gateway', level: 'ERROR', message: 'Connection timeout after 30000ms while connecting to upstream service auth-service:8443. Retry attempt 3/3 failed. Circuit breaker opened.', metadata: '{"service": "api-gateway", "endpoint": "/api/v2/users/authenticate", "upstream": "auth-service:8443", "latency_ms": 30000, "retry_count": 3, "trace_id": "abc-123-def"}' })} className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-full transition-colors">API Timeout Error</button>
              <button type="button" onClick={() => setFormData({ source: 'payment-service', level: 'ERROR', message: 'PaymentProcessingException: Card declined - insufficient funds. Transaction ID: txn_9f8e7d6c. Customer: cust_abc123. Amount: $299.99 USD.', metadata: '{"service": "payment-service", "transaction_id": "txn_9f8e7d6c", "customer_id": "cust_abc123", "amount": 299.99, "currency": "USD", "error_code": "card_declined"}' })} className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-full transition-colors">Payment Failure</button>
              <button type="button" onClick={() => setFormData({ source: 'database-pool', level: 'WARN', message: 'Connection pool utilization at 92% (46/50 connections active). Slow query detected on table "analytics_events" taking 4.2s. Consider increasing pool size or optimizing queries.', metadata: '{"service": "database-pool", "pool_size": 50, "active_connections": 46, "idle_connections": 4, "slow_query_table": "analytics_events", "query_duration_ms": 4200}' })} className="px-3 py-1.5 text-sm bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-full transition-colors">DB Pool Warning</button>
              <button type="button" onClick={() => setFormData({ source: 'auth-service', level: 'WARN', message: 'Multiple failed login attempts detected for user admin@company.com from IP 203.0.113.42. 8 failures in last 5 minutes. Account temporarily locked per security policy.', metadata: '{"service": "auth-service", "user_email": "admin@company.com", "source_ip": "203.0.113.42", "failed_attempts": 8, "time_window_minutes": 5, "action": "account_locked", "geo_location": "Unknown"}' })} className="px-3 py-1.5 text-sm bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-full transition-colors">Security Alert</button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Analyzing...</> : <><Sparkles className="h-4 w-4" />Add & Analyze</>}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={analysisModal} onClose={() => setAnalysisModal(false)} title="Run Log Analysis" size="md">
        <form onSubmit={handleRunAnalysis} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Name</label>
            <input value={analysisName} onChange={(e) => setAnalysisName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Daily Error Analysis" />
          </div>
          <p className="text-sm text-gray-500">AI will analyze the most recent 100 log entries to identify patterns, root causes, and provide recommendations.</p>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setAnalysisModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Analyzing...</> : <><Sparkles className="h-4 w-4" />Run Analysis</>}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.type === 'entry' ? 'Log Entry Details' : 'Analysis Details'} size="xl">
        {detailModal?.type === 'entry' && detailModal.data && <EntryDetail data={detailModal.data} />}
        {detailModal?.type === 'analysis' && detailModal.data && <AnalysisDetail data={detailModal.data} />}
      </Modal>
    </div>
  );
}
