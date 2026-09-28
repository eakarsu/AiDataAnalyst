const API_URL = '/api';
const AUTH_URL = '/api/auth';

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

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return response.text();
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

  logout() {
    return this.request(`${AUTH_URL}/logout`, { method: 'POST' });
  },

  forgotPassword(email) {
    return this.request(`${AUTH_URL}/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(token, newPassword) {
    return this.request(`${AUTH_URL}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  verifyEmail(token) {
    return this.request(`${AUTH_URL}/verify-email`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  resendVerification() {
    return this.request(`${AUTH_URL}/resend-verification`, { method: 'POST' });
  },

  getMe() {
    return this.request(`${AUTH_URL}/me`);
  },

  // Stats
  getStats() {
    return this.request(`${API_URL}/stats`);
  },

  // Data Sources
  getDataSources(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/data-sources${qs ? '?' + qs : ''}`);
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
  getDashboards(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/dashboards${qs ? '?' + qs : ''}`);
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
  getReports(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/reports${qs ? '?' + qs : ''}`);
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
  getInsights(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/insights${qs ? '?' + qs : ''}`);
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
  getQueries(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/queries${qs ? '?' + qs : ''}`);
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
  getAlerts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/alerts${qs ? '?' + qs : ''}`);
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
  getPredictions(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/predictions${qs ? '?' + qs : ''}`);
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
  getAnomalies(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/anomalies${qs ? '?' + qs : ''}`);
  },

  getAnomaly(id) {
    return this.request(`${API_URL}/anomalies/${id}`);
  },

  resolveAnomaly(id) {
    return this.request(`${API_URL}/anomalies/${id}/resolve`, { method: 'PATCH' });
  },

  createAnomaly(data) {
    return this.request(`${API_URL}/anomalies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  analyzeAnomaly(data) {
    return this.request(`${API_URL}/anomalies/analyze`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Exports
  getExports(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/exports${qs ? '?' + qs : ''}`);
  },

  getExport(id) {
    return this.request(`${API_URL}/exports/${id}`);
  },

  createExport(source_id, format) {
    return this.request(`${API_URL}/exports`, {
      method: 'POST',
      body: JSON.stringify({ source_id, format }),
    });
  },

  // Jobs
  getJobs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/jobs${qs ? '?' + qs : ''}`);
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
  getIntegrations(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/integrations${qs ? '?' + qs : ''}`);
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

  // Upload
  getUploadedData(sourceId, page = 1, limit = 50) {
    return this.request(`${API_URL}/upload/${sourceId}/data?page=${page}&limit=${limit}`);
  },

  getUploadedColumns(sourceId) {
    return this.request(`${API_URL}/upload/${sourceId}/columns`);
  },

  // Dashboard Sharing
  shareDashboard(id) {
    return this.request(`${API_URL}/dashboards/${id}/share`, { method: 'POST' });
  },

  unshareDashboard(id) {
    return this.request(`${API_URL}/dashboards/${id}/share`, { method: 'DELETE' });
  },

  // Export Download
  getExportDownloadUrl(id) {
    return `${API_URL}/exports/${id}/download`;
  },

  // Cache Stats
  getCacheStats() {
    return this.request(`${API_URL}/cache/stats`);
  },

  // Password Change
  changePassword(currentPassword, newPassword) {
    return this.request(`${AUTH_URL}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
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

  // Query Optimizer
  getQueryOptimizations(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/query-optimizations${qs ? '?' + qs : ''}`);
  },

  getQueryOptimization(id) {
    return this.request(`${API_URL}/query-optimizations/${id}`);
  },

  createQueryOptimization(data) {
    return this.request(`${API_URL}/query-optimizations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteQueryOptimization(id) {
    return this.request(`${API_URL}/query-optimizations/${id}`, { method: 'DELETE' });
  },

  // Log Analyzer
  getLogEntries(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/log-entries${qs ? '?' + qs : ''}`);
  },

  getLogEntry(id) {
    return this.request(`${API_URL}/log-entries/${id}`);
  },

  createLogEntry(data) {
    return this.request(`${API_URL}/log-entries`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteLogEntry(id) {
    return this.request(`${API_URL}/log-entries/${id}`, { method: 'DELETE' });
  },

  getLogAnalyses(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/log-analysis${qs ? '?' + qs : ''}`);
  },

  getLogAnalysis(id) {
    return this.request(`${API_URL}/log-analysis/${id}`);
  },

  createLogAnalysis(data) {
    return this.request(`${API_URL}/log-analysis`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteLogAnalysis(id) {
    return this.request(`${API_URL}/log-analysis/${id}`, { method: 'DELETE' });
  },

  // Dashboard Generator
  getDashboardConfigs() {
    return this.request(`${API_URL}/dashboard-configs`);
  },

  getDashboardConfig(id) {
    return this.request(`${API_URL}/dashboard-configs/${id}`);
  },

  generateDashboardConfig(data) {
    return this.request(`${API_URL}/dashboard-configs/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteDashboardConfig(id) {
    return this.request(`${API_URL}/dashboard-configs/${id}`, { method: 'DELETE' });
  },

  // Data Quality
  getDataQualityScores() {
    return this.request(`${API_URL}/data-quality`);
  },

  getDataQualityScore(id) {
    return this.request(`${API_URL}/data-quality/${id}`);
  },

  analyzeDataQuality(data) {
    return this.request(`${API_URL}/data-quality/analyze`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteDataQualityScore(id) {
    return this.request(`${API_URL}/data-quality/${id}`, { method: 'DELETE' });
  },

  // Insight Narratives
  getNarratives() {
    return this.request(`${API_URL}/narratives`);
  },

  getNarrative(id) {
    return this.request(`${API_URL}/narratives/${id}`);
  },

  generateNarrative(data) {
    return this.request(`${API_URL}/narratives/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteNarrative(id) {
    return this.request(`${API_URL}/narratives/${id}`, { method: 'DELETE' });
  },

  // Pipeline Builder
  getPipelines(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${API_URL}/pipelines${qs ? '?' + qs : ''}`);
  },

  getPipeline(id) {
    return this.request(`${API_URL}/pipelines/${id}`);
  },

  generatePipeline(data) {
    return this.request(`${API_URL}/pipelines/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  createPipeline(data) {
    return this.request(`${API_URL}/pipelines`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePipeline(id, data) {
    return this.request(`${API_URL}/pipelines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  runPipeline(id) {
    return this.request(`${API_URL}/pipelines/${id}/run`, {
      method: 'POST',
    });
  },

  getPipelineRuns(id) {
    return this.request(`${API_URL}/pipelines/${id}/runs`);
  },

  deletePipeline(id) {
    return this.request(`${API_URL}/pipelines/${id}`, { method: 'DELETE' });
  },

  // Update methods
  updateDataSource(id, data) {
    return this.request(`${API_URL}/data-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateDashboard(id, data) {
    return this.request(`${API_URL}/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateReport(id, data) {
    return this.request(`${API_URL}/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateAlert(id, data) {
    return this.request(`${API_URL}/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateJob(id, data) {
    return this.request(`${API_URL}/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateIntegration(id, data) {
    return this.request(`${API_URL}/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteInsight(id) {
    return this.request(`${API_URL}/insights/${id}`, { method: 'DELETE' });
  },

  deleteQuery(id) {
    return this.request(`${API_URL}/queries/${id}`, { method: 'DELETE' });
  },

  deletePrediction(id) {
    return this.request(`${API_URL}/predictions/${id}`, { method: 'DELETE' });
  },

  deleteAnomaly(id) {
    return this.request(`${API_URL}/anomalies/${id}`, { method: 'DELETE' });
  },

  deleteExport(id) {
    return this.request(`${API_URL}/exports/${id}`, { method: 'DELETE' });
  },

  // Bulk operations
  bulkDelete(entityType, ids) {
    return this.request(`${API_URL}/bulk-delete/${entityType}`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  bulkUpdate(entityType, ids, updates) {
    return this.request(`${API_URL}/bulk-update/${entityType}`, {
      method: 'POST',
      body: JSON.stringify({ ids, updates }),
    });
  },

  // CSV/PDF export
  exportCSV(entityType) {
    return this.request(`${API_URL}/export-csv/${entityType}`);
  },

  exportPDF(entityType) {
    return this.request(`${API_URL}/export-pdf/${entityType}`);
  },

  // === New AI Features (custom non-CRUD) ===
  aiCohortComparison(payload) {
    return this.request(`${API_URL}/ai/cohort-comparison`, { method: 'POST', body: JSON.stringify(payload) });
  },
  aiSchemaAdvisor(payload) {
    return this.request(`${API_URL}/ai/schema-advisor`, { method: 'POST', body: JSON.stringify(payload) });
  },
  aiDataGovernance(payload) {
    return this.request(`${API_URL}/ai/data-governance`, { method: 'POST', body: JSON.stringify(payload) });
  },
  aiMultiSourceMerge(payload) {
    return this.request(`${API_URL}/ai/multi-source-merge`, { method: 'POST', body: JSON.stringify(payload) });
  },
  aiAutoAlertRules(payload) {
    return this.request(`${API_URL}/ai/auto-alert-rules`, { method: 'POST', body: JSON.stringify(payload) });
  },
  aiDataLineage(payload) {
    return this.request(`${API_URL}/ai/data-lineage`, { method: 'POST', body: JSON.stringify(payload) });
  },
  aiQueryCostOptimizer(payload) {
    return this.request(`${API_URL}/ai/query-cost-optimizer`, { method: 'POST', body: JSON.stringify(payload) });
  },
  aiForecastAccuracy(payload) {
    return this.request(`${API_URL}/ai/forecast-accuracy`, { method: 'POST', body: JSON.stringify(payload) });
  },
  aiSqlFromIntent(payload) {
    return this.request(`${API_URL}/ai/sql-from-intent`, { method: 'POST', body: JSON.stringify(payload) });
  },
  aiSuggestVisualizations(payload) {
    return this.request(`${API_URL}/ai/suggest-visualizations`, { method: 'POST', body: JSON.stringify(payload) });
  },
  aiDetectAnomalies(payload) {
    return this.request(`${API_URL}/ai/detect-anomalies`, { method: 'POST', body: JSON.stringify(payload) });
  },
};

export default api;
