import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Lightbulb, Sparkles, TrendingUp, AlertTriangle, Target, Zap, Clock, ArrowRight } from 'lucide-react';

const testInputs = [
  { label: 'Sales Trends', text: 'Analyze our sales data for the past 6 months. Identify top-performing products, revenue trends, and seasonal patterns.' },
  { label: 'Customer Churn', text: 'Examine customer churn patterns. What are the leading indicators of churn and which customer segments are most at risk?' },
  { label: 'Revenue Forecast', text: 'Based on historical revenue data, provide insights on expected growth trajectory and potential risks for next quarter.' },
  { label: 'Cost Optimization', text: 'Analyze operational costs across departments. Identify areas of overspending and recommend cost-saving opportunities.' },
  { label: 'User Engagement', text: 'Review user engagement metrics including DAU, session duration, and feature adoption. What areas need improvement?' },
  { label: 'Market Comparison', text: 'Compare our performance metrics against industry benchmarks. Where do we outperform and where do we lag behind?' },
  { label: 'Anomaly Detection', text: 'Scan recent data for unusual patterns or anomalies that may indicate issues or opportunities we should investigate.' },
  { label: 'Conversion Funnel', text: 'Analyze the conversion funnel from lead to customer. Identify drop-off points and suggest improvements.' },
];

export default function Insights() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [context, setContext] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getInsights()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.generateInsight({ sample: true }, context);
      setModalOpen(false);
      setContext('');
      loadData();
    } catch (e) { console.error(e); } finally { setGenerating(false); }
  };

  const handleRowClick = (item) => {
    setSelectedInsight(item);
    setDetailModalOpen(true);
  };

  const handleUseAsContext = (insight) => {
    setDetailModalOpen(false);
    setContext(`Follow up on insight: "${insight.title}". ${insight.content || ''} Provide deeper analysis and updated recommendations.`);
    setModalOpen(true);
  };

  const getTypeIcon = (type) => {
    const icons = { opportunity: Target, risk: AlertTriangle, trend: TrendingUp, optimization: Zap, default: Lightbulb };
    const Icon = icons[type] || icons.default;
    return <Icon className="h-4 w-4" />;
  };

  const getImpactColor = (impact) => {
    const colors = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };
    return colors[impact] || 'bg-gray-100 text-gray-700';
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'insight_type', label: 'Type', render: (v) => <div className="flex items-center gap-2">{getTypeIcon(v)}<span className="capitalize">{v}</span></div> },
    { key: 'confidence', label: 'Confidence', render: (v) => <span>{v}%</span> },
    { key: 'impact', label: 'Impact', render: (v) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(v)}`}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`capitalize ${v === 'new' ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>{v}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-50 rounded-lg"><Lightbulb className="h-6 w-6 text-yellow-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">AI Insights</h1><p className="text-gray-500">AI-powered insights and recommendations</p></div>
      </div>

      <DataTable
        title="All Insights"
        data={data}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        onAdd={() => setModalOpen(true)}
        addLabel="Generate Insight"
        emptyMessage="No insights generated yet"
      />

      {/* Detail Modal - shown on row click */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={selectedInsight?.title || 'Insight Details'} size="lg">
        {selectedInsight && (
          <div className="space-y-4">
            {/* Meta info */}
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-700 rounded-full">
                {getTypeIcon(selectedInsight.insight_type)}
                <span className="capitalize">{selectedInsight.insight_type}</span>
              </span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getImpactColor(selectedInsight.impact)}`}>
                Impact: {selectedInsight.impact}
              </span>
              <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                Confidence: {selectedInsight.confidence}%
              </span>
              {selectedInsight.created_at && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(selectedInsight.created_at).toLocaleString()}
                </span>
              )}
            </div>

            {/* Content */}
            {selectedInsight.content && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedInsight.content}</p>
              </div>
            )}

            {/* Recommendations */}
            {selectedInsight.recommendations && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Recommendations</h4>
                <div className="text-sm text-yellow-700">
                  {(() => {
                    let recs = selectedInsight.recommendations;
                    if (typeof recs === 'string') {
                      try { recs = JSON.parse(recs); } catch (e) { return <p>{recs}</p>; }
                    }
                    if (Array.isArray(recs)) {
                      return (
                        <ul className="list-disc list-inside space-y-1">
                          {recs.map((rec, i) => <li key={i}>{typeof rec === 'string' ? rec : JSON.stringify(rec)}</li>)}
                        </ul>
                      );
                    }
                    return <pre className="whitespace-pre-wrap">{JSON.stringify(recs, null, 2)}</pre>;
                  })()}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => handleUseAsContext(selectedInsight)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
                Dig Deeper
              </button>
              <button
                onClick={() => { setDetailModalOpen(false); setContext(`Re-analyze: ${selectedInsight.title}. Previous finding: ${selectedInsight.content || ''}. Has anything changed?`); setModalOpen(true); }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Re-analyze
              </button>
              <button
                onClick={() => { setDetailModalOpen(false); setContext(`Provide counter-arguments and risks for: "${selectedInsight.title}". Challenge the assumptions and identify blind spots.`); setModalOpen(true); }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <AlertTriangle className="h-4 w-4" />
                Challenge This
              </button>
              <button
                onClick={() => { setDetailModalOpen(false); setContext(`Create an action plan based on: "${selectedInsight.title}". Include specific steps, timelines, and responsible parties.`); setModalOpen(true); }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Target className="h-4 w-4" />
                Action Plan
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate AI Insight" size="lg">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Context (what would you like insights about?)</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={4}
              placeholder="e.g., Analyze our sales data for Q4 opportunities..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Test Inputs</label>
            <div className="flex flex-wrap gap-2">
              {testInputs.map((input, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setContext(input.text)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-700 rounded-full transition-colors"
                >
                  {input.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setModalOpen(false); setContext(''); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Generating...</> : <><Sparkles className="h-4 w-4" />Generate Insight</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
