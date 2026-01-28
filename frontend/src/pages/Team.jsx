import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Share2, Mail, Globe, Lock, Eye } from 'lucide-react';

export default function Team() {
  const [sharedDashboards, setSharedDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const dashboards = await api.getDashboards();
      setSharedDashboards(dashboards.filter(d => d.is_public || d.share_token));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteSuccess(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setTimeout(() => setInviteSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-50 rounded-lg">
          <Users className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500">Collaborate and share dashboards with your team</p>
        </div>
      </div>

      {/* Invite Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Invite Collaborator</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send Invite
            </button>
          </form>
          {inviteSuccess && (
            <p className="mt-3 text-sm text-green-600">{inviteSuccess}</p>
          )}
        </div>
      </div>

      {/* Shared Dashboards */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Shared Dashboards</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {sharedDashboards.length === 0 ? (
            <div className="p-8 text-center">
              <Globe className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="mt-3 text-gray-500">No shared dashboards yet</p>
              <p className="text-sm text-gray-400 mt-1">Share a dashboard from the Dashboards page to collaborate with your team</p>
            </div>
          ) : (
            sharedDashboards.map(dashboard => (
              <div key={dashboard.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${dashboard.is_public ? 'bg-green-50' : 'bg-gray-50'}`}>
                    {dashboard.is_public ? (
                      <Globe className="h-5 w-5 text-green-600" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{dashboard.name}</h3>
                    <p className="text-sm text-gray-500">{dashboard.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {dashboard.views || 0} views
                  </span>
                  {dashboard.share_token && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                      Shared
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
