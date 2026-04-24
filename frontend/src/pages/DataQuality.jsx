import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import BarChartWidget from '../components/charts/BarChartWidget';
import {
  ShieldCheck, Sparkles, CheckCircle, AlertTriangle, XCircle,
  Database, Target, TrendingUp, ChevronRight, BarChart3, Award
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
  const labels = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low', 5: 'Info' };
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[p] || styles[3]}`}>P{p} {labels[p] || ''}</span>;
}

function ScoreBar({ value, label }) {
  const v = Number(value) || 0;
  const color = v >= 90 ? 'bg-green-500' : v >= 70 ? 'bg-blue-500' : v >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  const textColor = v >= 90 ? 'text-green-600' : v >= 70 ? 'text-blue-600' : v >= 50 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{v.toFixed(0)}%</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function getGradeConfig(score) {
  const v = Number(score) || 0;
  if (v >= 90) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-500', ring: 'ring-green-200' };
  if (v >= 80) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-500', ring: 'ring-blue-200' };
  if (v >= 70) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-500', ring: 'ring-yellow-200' };
  if (v >= 60) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-500', ring: 'ring-orange-200' };
  return { grade: 'F', color: 'text-red-600', bg: 'bg-red-500', ring: 'ring-red-200' };
}

function QualityDetail({ item }) {
  const issues = safeParse(item.issues_found, []);
  const recommendations = safeParse(item.recommendations, []);
  const grade = getGradeConfig(item.overall_score);

  const dimensions = [
    { label: 'Completeness', value: item.completeness_score },
    { label: 'Accuracy', value: item.accuracy_score },
    { label: 'Consistency', value: item.consistency_score },
    { label: 'Timeliness', value: item.timeliness_score },
    { label: 'Uniqueness', value: item.uniqueness_score },
    { label: 'Validity', value: item.validity_score },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Overall Data Quality Score</p>
            <p className="text-4xl font-bold text-emerald-700 mt-1">{Number(item.overall_score).toFixed(1)}%</p>
            <p className="text-sm text-emerald-600 mt-1">{item.data_source_name || 'Sample Data'}</p>
          </div>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold ${grade.bg} ring-4 ${grade.ring} shadow-lg`}>
            {grade.grade}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" /> Quality Dimensions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-white border border-gray-200 rounded-xl p-5">
          {dimensions.map(({ label, value }) => (
            <ScoreBar key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      {item.ai_analysis && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-primary-800 uppercase tracking-wide mb-2">AI Analysis</h4>
          <p className="text-gray-700 leading-relaxed">{item.ai_analysis}</p>
        </div>
      )}

      {/* Issues Found */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" /> Issues Found ({issues.length})
        </h4>
        {issues.length > 0 ? (
          <div className="space-y-3">
            {issues.map((issue, i) => {
              const iss = typeof issue === 'string' ? { column: 'N/A', issue_type: issue, severity: 'medium', description: issue, affected_rows_percentage: 0 } : issue;
              const sevStyles = {
                critical: 'border-red-200 bg-red-50',
                high: 'border-orange-200 bg-orange-50',
                medium: 'border-yellow-200 bg-yellow-50',
                low: 'border-green-200 bg-green-50',
              };
              return (
                <div key={i} className={`rounded-xl p-4 border ${sevStyles[iss.severity] || sevStyles.medium}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-800">{iss.column}</span>
                        <span className="text-xs text-gray-500">{iss.issue_type?.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">{iss.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded capitalize ${
                        iss.severity === 'critical' || iss.severity === 'high' ? 'bg-red-100 text-red-700' :
                        iss.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>{iss.severity}</span>
                      {iss.affected_rows_percentage != null && (
                        <p className="text-xs text-gray-500 mt-1">{iss.affected_rows_percentage}% of rows</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-xl border border-green-200">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">No issues found!</span>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> Recommendations
          </h4>
          <div className="space-y-3">
            {recommendations.map((rec, i) => {
              const r = typeof rec === 'string' ? { title: rec, description: rec, priority: 3 } : rec;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ChevronRight className="h-4 w-4 text-primary-500 flex-shrink-0" />
                        <h5 className="font-semibold text-gray-800">{r.title || r.action}</h5>
                      </div>
                      {r.description && r.description !== (r.title || r.action) && (
                        <p className="text-sm text-gray-600 ml-6">{r.description}</p>
                      )}
                      <div className="flex gap-3 ml-6 mt-1">
                        {r.expected_improvement && <span className="text-xs text-green-600 font-medium">+{r.expected_improvement} improvement</span>}
                        {r.category && <span className="text-xs text-gray-500 capitalize">{r.category?.replace(/_/g, ' ')}</span>}
                      </div>
                    </div>
                    <PriorityBadge priority={r.priority} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-5">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Records Analyzed</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{item.records_analyzed?.toLocaleString() || '0'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Columns Analyzed</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{item.columns_analyzed || '0'}</p>
        </div>
      </div>
    </div>
  );
}

export default function DataQuality() {
  const [scores, setScores] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [formData, setFormData] = useState({ data_source_id: '', context: '' });
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [scoresData, sourcesData] = await Promise.all([api.getDataQualityScores(), api.getDataSources()]);
      setScores(scoresData);
      setDataSources(sourcesData);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.analyzeDataQuality(formData);
      setModalOpen(false);
      setFormData({ data_source_id: '', context: '' });
      loadData();
    } catch (e) { console.error(e); } finally { setGenerating(false); }
  };

  const handleDelete = async (item) => {
    if (confirm('Delete this quality score?')) {
      try { await api.deleteDataQualityScore(item.id); loadData(); } catch (e) { console.error(e); }
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const columns = [
    { key: 'data_source_name', label: 'Data Source', render: (v) => (
      <div className="flex items-center gap-2"><Database className="h-4 w-4 text-gray-400" /><span className="font-medium">{v || 'Sample Data'}</span></div>
    )},
    { key: 'overall_score', label: 'Score', render: (v) => {
      const g = getGradeConfig(v);
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
            <div className={`h-full rounded-full ${g.bg}`} style={{ width: `${v}%` }} />
          </div>
          <span className={`text-sm font-bold ${g.color}`}>{Number(v).toFixed(0)}%</span>
          <span className={`px-1.5 py-0.5 text-xs font-bold text-white rounded ${g.bg}`}>{g.grade}</span>
        </div>
      );
    }},
    { key: 'completeness_score', label: 'Complete', render: (v) => <span className={`px-2 py-0.5 text-xs font-medium rounded ${getScoreColor(v)}`}>{Number(v).toFixed(0)}%</span> },
    { key: 'accuracy_score', label: 'Accuracy', render: (v) => <span className={`px-2 py-0.5 text-xs font-medium rounded ${getScoreColor(v)}`}>{Number(v).toFixed(0)}%</span> },
    { key: 'issues_found', label: 'Issues', render: (v) => {
      const issues = safeParse(v, []);
      return issues.length > 0 ? <span className="flex items-center gap-1 text-orange-600"><AlertTriangle className="h-4 w-4" />{issues.length}</span> : <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" />None</span>;
    }},
    { key: 'records_analyzed', label: 'Records', render: (v) => v?.toLocaleString() || '0' }
  ];

  const avgScore = scores.length > 0 ? scores.reduce((a,b) => a + Number(b.overall_score), 0) / scores.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 rounded-lg"><ShieldCheck className="h-6 w-6 text-emerald-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Data Quality Scorer</h1>
          <p className="text-gray-500">Analyze and score data quality with AI-powered insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg"><Target className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{avgScore.toFixed(1)}%</p><p className="text-sm text-gray-500">Avg Quality</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Database className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{scores.length}</p><p className="text-sm text-gray-500">Analyzed</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><Award className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{scores.filter(s => Number(s.overall_score) >= 90).length}</p><p className="text-sm text-gray-500">Grade A</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{scores.reduce((a,b) => a + safeParse(b.issues_found, []).length, 0)}</p><p className="text-sm text-gray-500">Total Issues</p></div>
          </div>
        </div>
      </div>

      {scores.length > 0 && (
        <BarChartWidget
          title="Average Quality Scores by Dimension"
          data={[
            { name: 'Completeness', score: scores.reduce((a,b) => a + Number(b.completeness_score), 0) / scores.length },
            { name: 'Accuracy', score: scores.reduce((a,b) => a + Number(b.accuracy_score), 0) / scores.length },
            { name: 'Consistency', score: scores.reduce((a,b) => a + Number(b.consistency_score), 0) / scores.length },
            { name: 'Timeliness', score: scores.reduce((a,b) => a + Number(b.timeliness_score), 0) / scores.length },
            { name: 'Uniqueness', score: scores.reduce((a,b) => a + Number(b.uniqueness_score), 0) / scores.length },
            { name: 'Validity', score: scores.reduce((a,b) => a + Number(b.validity_score), 0) / scores.length }
          ]}
          xKey="name" bars={['score']} height={250}
        />
      )}

      <DataTable title="Data Quality Scores" data={scores} columns={columns} loading={loading} onRowClick={(item) => setDetailModal(item)} onAdd={() => setModalOpen(true)} onDelete={handleDelete} addLabel="Analyze Data Quality" emptyMessage="No quality scores yet. Analyze a data source!" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Analyze Data Quality" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
            <select value={formData.data_source_id} onChange={(e) => setFormData({ ...formData, data_source_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">Select a data source (optional)</option>
              {dataSources.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Leave empty to analyze sample data</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Context</label>
            <textarea value={formData.context} onChange={(e) => setFormData({ ...formData, context: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={3} placeholder="Any specific quality concerns or focus areas..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Load Example</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFormData({ ...formData, context: 'Analyze customer data quality for our CRM migration. Key concerns: duplicate records, missing email addresses, inconsistent phone number formats, and outdated addresses. We have 50,000 customer records spanning 5 years. Data comes from 3 different legacy systems that were merged.' })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">CRM Migration</button>
              <button type="button" onClick={() => setFormData({ ...formData, context: 'Assess quality of our e-commerce product catalog. Issues reported: missing product images (15% of SKUs), inconsistent category taxonomy, duplicate products with different IDs, price discrepancies between channels, and incomplete product descriptions. Catalog has 25,000 active SKUs.' })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">Product Catalog</button>
              <button type="button" onClick={() => setFormData({ ...formData, context: 'Evaluate financial transaction data quality for regulatory audit preparation. Focus areas: transaction timestamp accuracy, currency conversion consistency, missing merchant codes, reconciliation gaps between systems, and PII data masking compliance. Dataset covers 2M transactions over 12 months.' })} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors">Financial Audit</button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Analyzing...</> : <><Sparkles className="h-4 w-4" />Analyze Quality</>}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Data Quality Details" size="xl">
        {detailModal && <QualityDetail item={detailModal} />}
      </Modal>
    </div>
  );
}
