const API_URL = '/api';
const AUTH_URL = '/auth';

let authToken = null;

const api = {
  setToken(token) {
    authToken = token;
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  },

  // Auth
  login(email, password) {
    return this.request(`${AUTH_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register(email, password, name) {
    return this.request(`${AUTH_URL}/register`, {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  getDemoCredentials() {
    return this.request(`${AUTH_URL}/demo-credentials`);
  },

  // Stats
  getStats() {
    return this.request(`${API_URL}/stats`);
  },

  // Data Sources
  getDataSources() {
    return this.request(`${API_URL}/data-sources`);
  },

  getDataSource(id) {
    return this.request(`${API_URL}/data-sources/${id}`);
  },

  createDataSource(data) {
    return this.request(`${API_URL}/data-sources`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteDataSource(id) {
    return this.request(`${API_URL}/data-sources/${id}`, { method: 'DELETE' });
  },

  // Dashboards
  getDashboards() {
    return this.request(`${API_URL}/dashboards`);
  },

  getDashboard(id) {
    return this.request(`${API_URL}/dashboards/${id}`);
  },

  createDashboard(data) {
    return this.request(`${API_URL}/dashboards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteDashboard(id) {
    return this.request(`${API_URL}/dashboards/${id}`, { method: 'DELETE' });
  },

  // Reports
  getReports() {
    return this.request(`${API_URL}/reports`);
  },

  getReport(id) {
    return this.request(`${API_URL}/reports/${id}`);
  },

  createReport(data) {
    return this.request(`${API_URL}/reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteReport(id) {
    return this.request(`${API_URL}/reports/${id}`, { method: 'DELETE' });
  },

  // Insights
  getInsights() {
    return this.request(`${API_URL}/insights`);
  },

  getInsight(id) {
    return this.request(`${API_URL}/insights/${id}`);
  },

  generateInsight(data, context) {
    return this.request(`${API_URL}/insights/generate`, {
      method: 'POST',
      body: JSON.stringify({ data, context }),
    });
  },

  updateInsightStatus(id, status) {
    return this.request(`${API_URL}/insights/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Queries
  getQueries() {
    return this.request(`${API_URL}/queries`);
  },

  getQuery(id) {
    return this.request(`${API_URL}/queries/${id}`);
  },

  createQuery(natural_language_query) {
    return this.request(`${API_URL}/queries`, {
      method: 'POST',
      body: JSON.stringify({ natural_language_query }),
    });
  },

  // Alerts
  getAlerts() {
    return this.request(`${API_URL}/alerts`);
  },

  getAlert(id) {
    return this.request(`${API_URL}/alerts/${id}`);
  },

  createAlert(data) {
    return this.request(`${API_URL}/alerts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  toggleAlert(id) {
    return this.request(`${API_URL}/alerts/${id}/toggle`, { method: 'PATCH' });
  },

  deleteAlert(id) {
    return this.request(`${API_URL}/alerts/${id}`, { method: 'DELETE' });
  },

  // Predictions
  getPredictions() {
    return this.request(`${API_URL}/predictions`);
  },

  getPrediction(id) {
    return this.request(`${API_URL}/predictions/${id}`);
  },

  generatePrediction(data) {
    return this.request(`${API_URL}/predictions/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Anomalies
  getAnomalies() {
    return this.request(`${API_URL}/anomalies`);
  },

  getAnomaly(id) {
    return this.request(`${API_URL}/anomalies/${id}`);
  },

  resolveAnomaly(id) {
    return this.request(`${API_URL}/anomalies/${id}/resolve`, { method: 'PATCH' });
  },

  analyzeAnomaly(data) {
    return this.request(`${API_URL}/anomalies/analyze`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Exports
  getExports() {
    return this.request(`${API_URL}/exports`);
  },

  getExport(id) {
    return this.request(`${API_URL}/exports/${id}`);
  },

  createExport(report_id, format) {
    return this.request(`${API_URL}/exports`, {
      method: 'POST',
      body: JSON.stringify({ report_id, format }),
    });
  },

  // Jobs
  getJobs() {
    return this.request(`${API_URL}/jobs`);
  },

  getJob(id) {
    return this.request(`${API_URL}/jobs/${id}`);
  },

  createJob(data) {
    return this.request(`${API_URL}/jobs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  toggleJob(id) {
    return this.request(`${API_URL}/jobs/${id}/toggle`, { method: 'PATCH' });
  },

  deleteJob(id) {
    return this.request(`${API_URL}/jobs/${id}`, { method: 'DELETE' });
  },

  // Templates
  getTemplates() {
    return this.request(`${API_URL}/templates`);
  },

  getTemplate(id) {
    return this.request(`${API_URL}/templates/${id}`);
  },

  // Integrations
  getIntegrations() {
    return this.request(`${API_URL}/integrations`);
  },

  getIntegration(id) {
    return this.request(`${API_URL}/integrations/${id}`);
  },

  createIntegration(data) {
    return this.request(`${API_URL}/integrations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteIntegration(id) {
    return this.request(`${API_URL}/integrations/${id}`, { method: 'DELETE' });
  },

  // Activity
  getActivity() {
    return this.request(`${API_URL}/activity`);
  },

  // AI Features
  aiChat(message, context, history) {
    return this.request(`${API_URL}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, context, history }),
    });
  },

  aiGenerateReport(data, report_type, preferences) {
    return this.request(`${API_URL}/ai/generate-report`, {
      method: 'POST',
      body: JSON.stringify({ data, report_type, preferences }),
    });
  },

  aiOptimizations(current_state, goals) {
    return this.request(`${API_URL}/ai/optimizations`, {
      method: 'POST',
      body: JSON.stringify({ current_state, goals }),
    });
  },

  aiSummarize(data, format) {
    return this.request(`${API_URL}/ai/summarize`, {
      method: 'POST',
      body: JSON.stringify({ data, format }),
    });
  },
};

export default api;
