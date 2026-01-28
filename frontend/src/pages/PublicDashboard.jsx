import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Brain, Eye, Calendar, User } from 'lucide-react';
import LineChartWidget from '../components/charts/LineChartWidget';
import BarChartWidget from '../components/charts/BarChartWidget';

export default function PublicDashboard() {
  const { token } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [token]);

  const loadDashboard = async () => {
    try {
      const response = await fetch(`/public/dashboard/${token}`);
      if (!response.ok) {
        throw new Error('Dashboard not found or no longer shared');
      }
      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-4 bg-red-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Not Found</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Sample chart data for the shared dashboard
  const trendData = [
    { month: 'Jan', value: 400 },
    { month: 'Feb', value: 600 },
    { month: 'Mar', value: 550 },
    { month: 'Apr', value: 780 },
    { month: 'May', value: 690 },
    { month: 'Jun', value: 850 },
  ];

  const comparisonData = [
    { name: 'Source A', records: 1200 },
    { name: 'Source B', records: 890 },
    { name: 'Source C', records: 650 },
    { name: 'Source D', records: 1500 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-gray-900">AI Data Analyst</span>
          </div>
          <span className="text-sm text-gray-500">Shared Dashboard</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-gray-500 mt-1">{dashboard.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {dashboard.owner_name}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {dashboard.views} views
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(dashboard.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <LineChartWidget data={trendData} title="Trend Overview" xKey="month" lines={['value']} />
          <BarChartWidget data={comparisonData} title="Data Comparison" xKey="name" bars={['records']} />
        </div>

        <div className="text-center text-sm text-gray-400 py-4">
          Powered by AI Data Analyst
        </div>
      </div>
    </div>
  );
}
