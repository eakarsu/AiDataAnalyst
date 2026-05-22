import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
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
// New AI Feature Pages
import QueryOptimizer from './pages/QueryOptimizer';
import LogAnalyzer from './pages/LogAnalyzer';
import DashboardGenerator from './pages/DashboardGenerator';
import DataQuality from './pages/DataQuality';
import Narratives from './pages/Narratives';
import PipelineBuilder from './pages/PipelineBuilder';
import AIFeaturesNew from './pages/AIFeaturesNew';
import CustomViewsPage from './pages/CustomViewsPage';
import SemanticMetricDrift from './pages/SemanticMetricDrift';

// // === Batch 02 Gaps & Frontend Mounts ===
import CfAgenticSqlQueryGeneration from './pages/CfAgenticSqlQueryGeneration';
import CfAutomatedInsightsGeneration from './pages/CfAutomatedInsightsGeneration';
import CfPredictiveAnalytics from './pages/CfPredictiveAnalytics';
import CfDataQualityAutomation from './pages/CfDataQualityAutomation';
import CfDashboardGenerationFromIntent from './pages/CfDashboardGenerationFromIntent';
import GapMissingQueryBuilderGenerateDashboardAnalyzeDataPredic from './pages/GapMissingQueryBuilderGenerateDashboardAnalyzeDataPredic';
import GapNoDatabaseConnectorsSqlNosqlCloudDataWarehousesOnly from './pages/GapNoDatabaseConnectorsSqlNosqlCloudDataWarehousesOnly';
import GapNoRealTimeDataStreaming from './pages/GapNoRealTimeDataStreaming';
import GapNoDataQualityMonitoringEngine from './pages/GapNoDataQualityMonitoringEngine';
import GapNoAdvancedVisualizationLibraryPlotlyD3DeckGlOnBacke from './pages/GapNoAdvancedVisualizationLibraryPlotlyD3DeckGlOnBacke';
import GapNoSmsNotification from './pages/GapNoSmsNotification';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

// Warehouse Feature Pages
import WhIngestionConnectors from './pages/wh/WhIngestionConnectors';
import WhParquetIceberg from './pages/wh/WhParquetIceberg';
import WhQueryEngine from './pages/wh/WhQueryEngine';
import WhTransformDbt from './pages/wh/WhTransformDbt';
import WhSemanticLayer from './pages/wh/WhSemanticLayer';
import WhLineage from './pages/wh/WhLineage';
import WhAccessPolicies from './pages/wh/WhAccessPolicies';
import WhMaterializedViews from './pages/wh/WhMaterializedViews';

// Spreadsheet Feature Pages
import SsCellGrid from './pages/ss/SsCellGrid';
import SsFormulaEngine from './pages/ss/SsFormulaEngine';
import SsAiFillDown from './pages/ss/SsAiFillDown';
import SsNaturalLanguageFormula from './pages/ss/SsNaturalLanguageFormula';
import SsPivotEngine from './pages/ss/SsPivotEngine';
import SsChartsApi from './pages/ss/SsChartsApi';
import SsCollabPresence from './pages/ss/SsCollabPresence';

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
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

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
        {/* New AI Feature Routes */}
        <Route path="query-optimizer" element={<QueryOptimizer />} />
        <Route path="log-analyzer" element={<LogAnalyzer />} />
        <Route path="dashboard-generator" element={<DashboardGenerator />} />
        <Route path="data-quality" element={<DataQuality />} />
        <Route path="narratives" element={<Narratives />} />
        <Route path="pipeline-builder" element={<PipelineBuilder />} />
        <Route path="ai-features" element={<AIFeaturesNew />} />
        <Route path="custom-views" element={<CustomViewsPage />} />
        <Route path="semantic-metric-drift" element={<SemanticMetricDrift />} />
        {/* Data Warehouse Routes */}
        <Route path="wh/ingestion-connectors" element={<WhIngestionConnectors />} />
        <Route path="wh/parquet-iceberg" element={<WhParquetIceberg />} />
        <Route path="wh/query-engine" element={<WhQueryEngine />} />
        <Route path="wh/transform-dbt" element={<WhTransformDbt />} />
        <Route path="wh/semantic-layer" element={<WhSemanticLayer />} />
        <Route path="wh/lineage" element={<WhLineage />} />
        <Route path="wh/access-policies" element={<WhAccessPolicies />} />
        <Route path="wh/materialized-views" element={<WhMaterializedViews />} />
        {/* Spreadsheet Routes */}
        <Route path="ss/cell-grid" element={<SsCellGrid />} />
        <Route path="ss/formula-engine" element={<SsFormulaEngine />} />
        <Route path="ss/ai-fill-down" element={<SsAiFillDown />} />
        <Route path="ss/natural-language-formula" element={<SsNaturalLanguageFormula />} />
        <Route path="ss/pivot-engine" element={<SsPivotEngine />} />
        <Route path="ss/charts-api" element={<SsChartsApi />} />
        <Route path="ss/collab-presence" element={<SsCollabPresence />} />
        <Route path=":type/:id" element={<DetailView />} />
      </Route>
    
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/agentic-sql-query-generation" element={<CfAgenticSqlQueryGeneration />} />
        <Route path="/cf/automated-insights-generation" element={<CfAutomatedInsightsGeneration />} />
        <Route path="/cf/predictive-analytics" element={<CfPredictiveAnalytics />} />
        <Route path="/cf/data-quality-automation" element={<CfDataQualityAutomation />} />
        <Route path="/cf/dashboard-generation-from-intent" element={<CfDashboardGenerationFromIntent />} />
        <Route path="/gap/missing-query-builder-generate-dashboard-analyze-data-predic" element={<GapMissingQueryBuilderGenerateDashboardAnalyzeDataPredic />} />
        <Route path="/gap/no-database-connectors-sql-nosql-cloud-data-warehouses-only" element={<GapNoDatabaseConnectorsSqlNosqlCloudDataWarehousesOnly />} />
        <Route path="/gap/no-real-time-data-streaming" element={<GapNoRealTimeDataStreaming />} />
        <Route path="/gap/no-data-quality-monitoring-engine" element={<GapNoDataQualityMonitoringEngine />} />
        <Route path="/gap/no-advanced-visualization-library-plotly-d3-deck-gl-on-backe" element={<GapNoAdvancedVisualizationLibraryPlotlyD3DeckGlOnBacke />} />
        <Route path="/gap/no-sms-notification" element={<GapNoSmsNotification />} />
      </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#fff', color: '#333', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
