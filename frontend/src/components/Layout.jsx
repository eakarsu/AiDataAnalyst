import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Brain,
  LayoutDashboard,
  Database,
  BarChart3,
  FileText,
  Lightbulb,
  Search,
  Bell,
  TrendingUp,
  AlertTriangle,
  Download,
  Calendar,
  Palette,
  Plug,
  Activity,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Data Sources', path: '/data-sources', icon: Database },
  { name: 'Dashboards', path: '/dashboards', icon: BarChart3 },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'AI Insights', path: '/insights', icon: Lightbulb },
  { name: 'Queries', path: '/queries', icon: Search },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Predictions', path: '/predictions', icon: TrendingUp },
  { name: 'Anomalies', path: '/anomalies', icon: AlertTriangle },
  { name: 'Exports', path: '/exports', icon: Download },
  { name: 'Scheduled Jobs', path: '/jobs', icon: Calendar },
  { name: 'Templates', path: '/templates', icon: Palette },
  { name: 'Integrations', path: '/integrations', icon: Plug },
  { name: 'Activity Log', path: '/activity', icon: Activity },
  { name: 'AI Assistant', path: '/ai-chat', icon: MessageSquare },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-gray-900">AI Data Analyst</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-600 rounded-xl flex-shrink-0">
                <Brain className="h-6 w-6 text-white" />
              </div>
              {sidebarOpen && (
                <span className="font-bold text-gray-900 whitespace-nowrap">AI Data Analyst</span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className={`h-5 w-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        } pt-16 lg:pt-0`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
