import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import {
  Database,
  BarChart3,
  FileText,
  Lightbulb,
  Bell,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentInsights, setRecentInsights] = useState([]);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, insightsData, anomaliesData] = await Promise.all([
        api.getStats(),
        api.getInsights(),
        api.getAnomalies()
      ]);
      setStats(statsData);
      setRecentInsights(insightsData.slice(0, 5));
      setRecentAnomalies(anomaliesData.filter(a => !a.is_resolved).slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const quickStats = [
    { title: 'Data Sources', value: stats?.dataSources || 0, icon: Database, path: '/data-sources', color: 'blue' },
    { title: 'Dashboards', value: stats?.dashboards || 0, icon: BarChart3, path: '/dashboards', color: 'purple' },
    { title: 'Reports', value: stats?.reports || 0, icon: FileText, path: '/reports', color: 'green' },
    { title: 'New Insights', value: stats?.newInsights || 0, icon: Lightbulb, path: '/insights', color: 'yellow' },
    { title: 'Active Alerts', value: stats?.activeAlerts || 0, icon: Bell, path: '/alerts', color: 'red' },
    { title: 'Anomalies', value: stats?.unresolvedAnomalies || 0, icon: AlertTriangle, path: '/anomalies', color: 'orange' },
  ];

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome to your AI-powered analytics hub</p>
        </div>
        <button
          onClick={() => navigate('/ai-chat')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <Sparkles className="h-5 w-5" />
          <span>Ask AI Assistant</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickStats.map((stat) => (
          <Card
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            href={stat.path}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent AI Insights */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Recent AI Insights</h2>
            </div>
            <button
              onClick={() => navigate('/insights')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentInsights.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No insights available yet
              </div>
            ) : (
              recentInsights.map((insight) => (
                <div
                  key={insight.id}
                  onClick={() => navigate(`/insights/${insight.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{insight.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{insight.content}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getImpactColor(insight.impact)}`}>
                      {insight.impact}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Anomalies */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Active Anomalies</h2>
            </div>
            <button
              onClick={() => navigate('/anomalies')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentAnomalies.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No active anomalies detected
              </div>
            ) : (
              recentAnomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  onClick={() => navigate(`/anomalies/${anomaly.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{anomaly.metric_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Expected: {anomaly.expected_value} | Actual: {anomaly.actual_value}
                        <span className={`ml-2 ${anomaly.deviation_percentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ({anomaly.deviation_percentage > 0 ? '+' : ''}{anomaly.deviation_percentage}%)
                        </span>
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <h2 className="text-xl font-semibold">Ready to discover more insights?</h2>
            <p className="text-primary-100 mt-1">
              Ask our AI assistant to analyze your data or explore our prediction models.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/queries')}
              className="px-4 py-2 bg-white text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition-colors"
            >
              Natural Language Query
            </button>
            <button
              onClick={() => navigate('/predictions')}
              className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-400 transition-colors flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              View Predictions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
