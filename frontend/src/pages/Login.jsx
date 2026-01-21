import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Brain, Eye, EyeOff, Sparkles, BarChart3, Zap, Shield, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = async () => {
    try {
      const credentials = await api.getDemoCredentials();
      setEmail(credentials.email);
      setPassword(credentials.password);
    } catch (err) {
      setEmail('demo@aianalyst.com');
      setPassword('demo123456');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AI Data Analyst</span>
          </div>
        </div>

        <div className="space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Transform Your Data Into
            <span className="block text-primary-200">Actionable Insights</span>
          </h1>
          <p className="text-lg text-primary-100 max-w-md">
            Harness the power of AI to analyze your data, discover patterns, and make data-driven decisions with confidence.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white">
              <div className="p-2 bg-white/10 rounded-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <span>AI-Powered Analytics & Insights</span>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="p-2 bg-white/10 rounded-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span>Real-time Dashboards & Reports</span>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="p-2 bg-white/10 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <span>Predictive Analytics & Forecasting</span>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="p-2 bg-white/10 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <span>Anomaly Detection & Alerts</span>
            </div>
          </div>
        </div>

        <div className="text-primary-200 text-sm">
          Trusted by data teams worldwide
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-2 bg-primary-600 rounded-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">AI Data Analyst</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-500 mt-2">
                {isRegister
                  ? 'Start your data analytics journey'
                  : 'Sign in to access your analytics dashboard'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Please wait...</span>
                  </>
                ) : (
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Quick Access</span>
                </div>
              </div>

              <button
                onClick={handleAutoFill}
                className="mt-4 w-full py-3 px-4 border-2 border-dashed border-primary-300 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                <span>Auto-fill Demo Credentials</span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {isRegister
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
