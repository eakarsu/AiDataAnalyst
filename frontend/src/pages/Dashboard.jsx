import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import { CardSkeleton } from '../components/LoadingSkeleton';
import LineChartWidget from '../components/charts/LineChartWidget';
import BarChartWidget from '../components/charts/BarChartWidget';
import PieChartWidget from '../components/charts/PieChartWidget';
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
  Sparkles,
  Zap,
  ScrollText,
  ShieldCheck,
  Wand2,
  BookOpen,
  Search,
  Download,
  Calendar,
  Palette,
  Plug,
  MessageSquare,
  Table2,
  Users,
  Settings
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
      const insightsArr = insightsData?.data || insightsData || [];
      const anomaliesArr = anomaliesData?.data || anomaliesData || [];
      setRecentInsights(Array.isArray(insightsArr) ? insightsArr.slice(0, 5) : []);
      setRecentAnomalies(Array.isArray(anomaliesArr) ? anomaliesArr.filter(a => !a.is_resolved).slice(0, 5) : []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome to your AI-powered analytics hub</p>
          </div>
        </div>
        <CardSkeleton count={6} />
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

  const aiFeatures = [
    { title: 'Query Optimizer', description: 'Optimize SQL queries with AI', icon: Zap, path: '/query-optimizer', color: 'yellow' },
    { title: 'Log Analyzer', description: 'Analyze logs with DevOps AI', icon: ScrollText, path: '/log-analyzer', color: 'indigo' },
    { title: 'Dashboard Generator', description: 'Generate dashboards with AI', icon: Wand2, path: '/dashboard-generator', color: 'pink' },
    { title: 'Data Quality', description: 'Score your data quality', icon: ShieldCheck, path: '/data-quality', color: 'emerald' },
    { title: 'Narratives', description: 'Transform insights to stories', icon: BookOpen, path: '/narratives', color: 'rose' },
  ];

  const allMenuItems = [
    { title: 'Data Sources', description: 'Manage connected databases', icon: Database, path: '/data-sources', color: 'blue' },
    { title: 'Dashboards', description: 'View and create dashboards', icon: BarChart3, path: '/dashboards', color: 'purple' },
    { title: 'Reports', description: 'Business intelligence reports', icon: FileText, path: '/reports', color: 'green' },
    { title: 'AI Insights', description: 'AI-generated insights', icon: Lightbulb, path: '/insights', color: 'yellow' },
    { title: 'Queries', description: 'Natural language queries', icon: Search, path: '/queries', color: 'blue' },
    { title: 'Alerts', description: 'Alert management', icon: Bell, path: '/alerts', color: 'red' },
    { title: 'Predictions', description: 'ML predictions', icon: TrendingUp, path: '/predictions', color: 'green' },
    { title: 'Anomalies', description: 'Anomaly detection', icon: AlertTriangle, path: '/anomalies', color: 'orange' },
    { title: 'Exports', description: 'Data export management', icon: Download, path: '/exports', color: 'purple' },
    { title: 'Scheduled Jobs', description: 'Automated tasks', icon: Calendar, path: '/jobs', color: 'blue' },
    { title: 'Templates', description: 'Dashboard templates', icon: Palette, path: '/templates', color: 'pink' },
    { title: 'Integrations', description: 'Third-party services', icon: Plug, path: '/integrations', color: 'indigo' },
    { title: 'Activity Log', description: 'User activity tracking', icon: Activity, path: '/activity', color: 'gray' },
    { title: 'AI Assistant', description: 'Chat with your data', icon: MessageSquare, path: '/ai-chat', color: 'blue' },
    { title: 'Data Explorer', description: 'Explore uploaded data', icon: Table2, path: '/data-explorer', color: 'green' },
    { title: 'Team', description: 'Team management', icon: Users, path: '/team', color: 'purple' },
    { title: 'Settings', description: 'Application settings', icon: Settings, path: '/settings', color: 'gray' },
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

      {/* Quick Stats - Clickable cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickStats.map((stat) => (
          <div
            key={stat.title}
            onClick={() => navigate(stat.path)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-primary-300 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${stat.color}-50 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.title}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <LineChartWidget
          title="Activity Trends"
          data={[
            { name: 'Mon', queries: 12, insights: 5 },
            { name: 'Tue', queries: 19, insights: 8 },
            { name: 'Wed', queries: 15, insights: 6 },
            { name: 'Thu', queries: 22, insights: 10 },
            { name: 'Fri', queries: 18, insights: 7 },
            { name: 'Sat', queries: 8, insights: 3 },
            { name: 'Sun', queries: 6, insights: 2 },
          ]}
          xKey="name"
          lines={['queries', 'insights']}
          height={250}
        />
        <BarChartWidget
          title="Data Sources Comparison"
          data={[
            { name: 'PostgreSQL', records: stats?.dataSources > 0 ? 1200 : 0 },
            { name: 'CSV/Excel', records: stats?.dataSources > 0 ? 850 : 0 },
            { name: 'API', records: stats?.dataSources > 0 ? 630 : 0 },
          ]}
          xKey="name"
          bars={['records']}
          height={250}
        />
        <PieChartWidget
          title="Insight Distribution"
          data={[
            { name: 'Trends', value: stats?.newInsights > 0 ? 35 : 0 },
            { name: 'Anomalies', value: stats?.unresolvedAnomalies || 0 },
            { name: 'Predictions', value: 20 },
            { name: 'Alerts', value: stats?.activeAlerts || 0 },
          ]}
          height={250}
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent AI Insights - Clickable rows */}
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

        {/* Active Anomalies - Clickable rows */}
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

      {/* AI Features - Clickable cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {aiFeatures.map((feature) => (
            <div
              key={feature.title}
              onClick={() => navigate(feature.path)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-primary-300 cursor-pointer transition-all group"
            >
              <div className={`p-2 rounded-lg bg-${feature.color}-50 w-fit mb-3 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`h-5 w-5 text-${feature.color}-600`} />
              </div>
              <h3 className="font-medium text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All Menu Items - Clickable card grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {allMenuItems.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md hover:border-primary-300 cursor-pointer transition-all group"
            >
              <div className={`p-1.5 rounded-lg bg-${item.color}-50 w-fit mb-2 group-hover:scale-110 transition-transform`}>
                <item.icon className={`h-4 w-4 text-${item.color}-600`} />
              </div>
              <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
            </div>
          ))}
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
