import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataSources from './pages/DataSources';
import Dashboards from './pages/Dashboards';
import Reports from './pages/Reports';
import Insights from './pages/Insights';
import Queries from './pages/Queries';
import Alerts from './pages/Alerts';
import Predictions from './pages/Predictions';
import Anomalies from './pages/Anomalies';
import Exports from './pages/Exports';
import Jobs from './pages/Jobs';
import Templates from './pages/Templates';
import Integrations from './pages/Integrations';
import Activity from './pages/Activity';
import AIChat from './pages/AIChat';
import Settings from './pages/Settings';
import DataExplorer from './pages/DataExplorer';
import Team from './pages/Team';
import PublicDashboard from './pages/PublicDashboard';
import Layout from './components/Layout';
import DetailView from './pages/DetailView';

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return token ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/public/dashboard/:token" element={<PublicDashboard />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="data-sources" element={<DataSources />} />
        <Route path="dashboards" element={<Dashboards />} />
        <Route path="reports" element={<Reports />} />
        <Route path="insights" element={<Insights />} />
        <Route path="queries" element={<Queries />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="predictions" element={<Predictions />} />
        <Route path="anomalies" element={<Anomalies />} />
        <Route path="exports" element={<Exports />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="templates" element={<Templates />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="activity" element={<Activity />} />
        <Route path="ai-chat" element={<AIChat />} />
        <Route path="data-explorer" element={<DataExplorer />} />
        <Route path="team" element={<Team />} />
        <Route path="settings" element={<Settings />} />
        <Route path=":type/:id" element={<DetailView />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
