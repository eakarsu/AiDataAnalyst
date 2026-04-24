import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  GitBranch, Sparkles, Play, Plus, Trash2, ChevronRight, ChevronDown,
  Database, ArrowRight, CheckCircle, XCircle, Clock, AlertTriangle,
  Settings, RefreshCw, Zap, ArrowDown, Eye, Edit3, Save, X,
  Filter, Layers, Upload, Download, Bell, Shield, BarChart3, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

function safeParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

const STEP_TYPES = [
  { value: 'extract', label: 'Extract', icon: Download, color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'Pull data from source' },
  { value: 'transform', label: 'Transform', icon: RefreshCw, color: 'bg-purple-100 text-purple-700 border-purple-200', desc: 'Clean & reshape data' },
  { value: 'validate', label: 'Validate', icon: Shield, color: 'bg-green-100 text-green-700 border-green-200', desc: 'Check data quality' },
  { value: 'enrich', label: 'Enrich', icon: Sparkles, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', desc: 'Add computed fields' },
  { value: 'filter', label: 'Filter', icon: Filter, color: 'bg-orange-100 text-orange-700 border-orange-200', desc: 'Remove rows/columns' },
  { value: 'aggregate', label: 'Aggregate', icon: Layers, color: 'bg-indigo-100 text-indigo-700 border-indigo-200', desc: 'Group & summarize' },
  { value: 'load', label: 'Load', icon: Upload, color: 'bg-teal-100 text-teal-700 border-teal-200', desc: 'Write to destination' },
  { value: 'notify', label: 'Notify', icon: Bell, color: 'bg-pink-100 text-pink-700 border-pink-200', desc: 'Send alerts' },
];

function StepTypeBadge({ type }) {
  const config = STEP_TYPES.find(s => s.value === type) || STEP_TYPES[1];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    paused: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    running: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

function PipelineFlowDiagram({ steps }) {
  if (!steps || steps.length === 0) return <p className="text-gray-400 text-sm italic">No steps defined</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => {
        const config = STEP_TYPES.find(s => s.value === step.type) || STEP_TYPES[1];
        const Icon = config.icon;
        return (
          <div key={step.id || i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.color}`}>
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{step.name}</span>
            </div>
            {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-gray-400" />}
          </div>
        );
      })}
    </div>
  );
}

function RunResultView({ run }) {
  const stepResults = safeParse(run.step_results, []);
  const errorLog = safeParse(run.error_log, []);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <StatusBadge status={run.status} />
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Duration</p>
          <p className="text-lg font-bold text-gray-900">{run.duration ? `${(run.duration / 1000).toFixed(1)}s` : 'N/A'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Records</p>
          <p className="text-lg font-bold text-gray-900">{(run.records_processed || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Failed</p>
          <p className={`text-lg font-bold ${run.records_failed > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {(run.records_failed || 0).toLocaleString()}
          </p>
        </div>
      </div>
      {stepResults.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Step Results</h4>
          <div className="space-y-2">
            {stepResults.map((sr, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  {sr.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : sr.status === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{sr.step_name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{sr.records_in?.toLocaleString()} in / {sr.records_out?.toLocaleString()} out</span>
                  <span>{sr.duration_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {errorLog.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-600 mb-2">Errors</h4>
          {errorLog.map((err, i) => (
            <div key={i} className="p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700">{typeof err === 'string' ? err : JSON.stringify(err)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineDetail({ pipeline, onClose, onRefresh }) {
  const [runs, setRuns] = useState([]);
  const [running, setRunning] = useState(false);
  const [expandedRun, setExpandedRun] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const steps = safeParse(pipeline.steps, []);
  const sourceConfig = safeParse(pipeline.source_config, {});
  const destConfig = safeParse(pipeline.destination_config, {});
  const errorHandling = safeParse(pipeline.error_handling, {});
  const aiSuggestions = safeParse(pipeline.ai_suggestions, []);
  const tags = safeParse(pipeline.tags, []);

  useEffect(() => {
    loadRuns();
  }, [pipeline.id]);

  async function loadRuns() {
    try {
      const result = await api.getPipelineRuns(pipeline.id);
      setRuns(result.data || []);
    } catch {}
  }

  async function handleRun() {
    setRunning(true);
    try {
      await api.runPipeline(pipeline.id);
      toast.success('Pipeline run completed!');
      await loadRuns();
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRunning(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this pipeline?')) return;
    try {
      await api.deletePipeline(pipeline.id);
      toast.success('Pipeline deleted');
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function toggleStatus() {
    const newStatus = pipeline.status === 'active' ? 'paused' : 'active';
    try {
      await api.updatePipeline(pipeline.id, { status: newStatus });
      toast.success(`Pipeline ${newStatus}`);
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'steps', label: `Steps (${steps.length})` },
    { id: 'runs', label: `Runs (${runs.length})` },
    { id: 'config', label: 'Configuration' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <GitBranch className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">{pipeline.name}</h2>
              <StatusBadge status={pipeline.status} />
            </div>
            <p className="text-sm text-gray-500">{pipeline.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRun} disabled={running} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
              {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? 'Running...' : 'Run'}
            </button>
            <button onClick={toggleStatus} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              {pipeline.status === 'active' ? <Clock className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
            </button>
            <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
              <Trash2 className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-xs text-indigo-600 font-medium mb-1">Total Runs</p>
                  <p className="text-2xl font-bold text-indigo-900">{pipeline.run_count || 0}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium mb-1">Avg Duration</p>
                  <p className="text-2xl font-bold text-green-900">{pipeline.avg_duration ? `${(pipeline.avg_duration / 1000).toFixed(1)}s` : 'N/A'}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-medium mb-1">Steps</p>
                  <p className="text-2xl font-bold text-blue-900">{steps.length}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xs text-purple-600 font-medium mb-1">Schedule</p>
                  <p className="text-sm font-bold text-purple-900">{pipeline.schedule || 'Manual'}</p>
                </div>
              </div>

              {/* Flow diagram */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Pipeline Flow</h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <PipelineFlowDiagram steps={steps} />
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" /> AI Suggestions
                  </h3>
                  <div className="space-y-2">
                    {aiSuggestions.map((s, i) => (
                      <div key={i} className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-amber-900">{s.title}</span>
                          <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">{s.category}</span>
                        </div>
                        <p className="text-xs text-amber-700">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-3">
              {steps.length === 0 && <p className="text-gray-400 italic text-sm">No steps configured</p>}
              {steps.map((step, i) => (
                <div key={step.id || i} className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">{i + 1}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{step.name}</h4>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                    </div>
                    <StepTypeBadge type={step.type} />
                  </div>
                  {step.config && Object.keys(step.config).length > 0 && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <pre className="text-xs text-gray-600 overflow-x-auto">{JSON.stringify(step.config, null, 2)}</pre>
                    </div>
                  )}
                  {step.estimated_duration_seconds && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Est. {step.estimated_duration_seconds}s
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'runs' && (
            <div className="space-y-3">
              {runs.length === 0 && <p className="text-gray-400 italic text-sm">No runs yet. Click Run to execute this pipeline.</p>}
              {runs.map((run) => (
                <div key={run.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={run.status} />
                      <span className="text-sm text-gray-600">Run #{run.id}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{run.records_processed?.toLocaleString()} records</span>
                      <span>{run.duration ? `${(run.duration / 1000).toFixed(1)}s` : ''}</span>
                      <span>{new Date(run.created_at).toLocaleString()}</span>
                      {expandedRun === run.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>
                  {expandedRun === run.id && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <RunResultView run={run} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2"><Database className="h-4 w-4" /> Source</h4>
                  {Object.keys(sourceConfig).length > 0 ? (
                    <div className="space-y-1">
                      {Object.entries(sourceConfig).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                          <span className="text-blue-600 font-medium">{k}:</span>
                          <span className="text-blue-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-blue-400 italic">Not configured</p>}
                </div>
                <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                  <h4 className="text-sm font-semibold text-teal-800 mb-2 flex items-center gap-2"><Upload className="h-4 w-4" /> Destination</h4>
                  {Object.keys(destConfig).length > 0 ? (
                    <div className="space-y-1">
                      {Object.entries(destConfig).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                          <span className="text-teal-600 font-medium">{k}:</span>
                          <span className="text-teal-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-teal-400 italic">Not configured</p>}
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2"><Shield className="h-4 w-4" /> Error Handling</h4>
                {Object.keys(errorHandling).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(errorHandling).map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <span className="text-red-600 font-medium">{k.replace(/_/g, ' ')}:</span>
                        <span className="text-red-900 ml-1">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-red-400 italic">Default error handling</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PipelineBuilder() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // AI Generator form
  const [requirements, setRequirements] = useState('');
  const [destination, setDestination] = useState('database');
  const [constraints, setConstraints] = useState('');

  // Manual form
  const [manualName, setManualName] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualSteps, setManualSteps] = useState([]);

  useEffect(() => {
    loadPipelines();
  }, []);

  async function loadPipelines() {
    try {
      const result = await api.getPipelines();
      setPipelines(result.data || []);
    } catch (err) {
      toast.error('Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!requirements.trim()) return toast.error('Please describe your pipeline requirements');
    setGenerating(true);
    try {
      const result = await api.generatePipeline({
        requirements,
        destination,
        constraints: constraints ? { notes: constraints } : {}
      });
      toast.success('Pipeline generated!');
      setShowGenerator(false);
      setRequirements('');
      setConstraints('');
      await loadPipelines();
      setSelectedPipeline(result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleManualCreate() {
    if (!manualName.trim()) return toast.error('Pipeline name is required');
    try {
      await api.createPipeline({
        name: manualName,
        description: manualDesc,
        steps: manualSteps
      });
      toast.success('Pipeline created!');
      setShowManual(false);
      setManualName('');
      setManualDesc('');
      setManualSteps([]);
      await loadPipelines();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function addManualStep() {
    setManualSteps(prev => [...prev, {
      id: `step_${prev.length + 1}`,
      name: '',
      type: 'transform',
      description: '',
      config: {},
      order: prev.length + 1,
      estimated_duration_seconds: 10
    }]);
  }

  function updateManualStep(index, field, value) {
    setManualSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function removeManualStep(index) {
    setManualSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <GitBranch className="h-6 w-6 text-indigo-600" />
            </div>
            AI Data Pipeline Builder
          </h1>
          <p className="text-gray-500 mt-1">Design, build, and manage data pipelines with AI assistance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManual(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Manual
          </button>
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            AI Generate
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg"><GitBranch className="h-5 w-5 text-indigo-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pipelines.length}</p>
              <p className="text-xs text-gray-500">Total Pipelines</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pipelines.filter(p => p.status === 'active').length}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Activity className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pipelines.reduce((s, p) => s + (p.run_count || 0), 0)}</p>
              <p className="text-xs text-gray-500">Total Runs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><BarChart3 className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pipelines.reduce((s, p) => s + safeParse(p.steps, []).length, 0)}</p>
              <p className="text-xs text-gray-500">Total Steps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipelines List */}
      {pipelines.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <GitBranch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pipelines yet</h3>
          <p className="text-gray-500 mb-6">Create your first data pipeline manually or let AI design one for you.</p>
          <button
            onClick={() => setShowGenerator(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
          >
            <Sparkles className="h-5 w-5" />
            Generate with AI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pipelines.map((pipeline) => {
            const steps = safeParse(pipeline.steps, []);
            const tags = safeParse(pipeline.tags, []);
            return (
              <div
                key={pipeline.id}
                onClick={() => setSelectedPipeline(pipeline)}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{pipeline.name}</h3>
                  </div>
                  <StatusBadge status={pipeline.status} />
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{pipeline.description || 'No description'}</p>
                <div className="mb-3">
                  <PipelineFlowDiagram steps={steps.slice(0, 4)} />
                  {steps.length > 4 && <p className="text-xs text-gray-400 mt-1">+{steps.length - 4} more steps</p>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {steps.length} steps</span>
                    <span className="flex items-center gap-1"><Play className="h-3 w-3" /> {pipeline.run_count || 0} runs</span>
                  </div>
                  {pipeline.last_run && (
                    <span className="text-xs text-gray-400">
                      Last: {new Date(pipeline.last_run).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-600" />
                AI Pipeline Generator
              </h2>
              <button onClick={() => setShowGenerator(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Describe your pipeline requirements *</label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g., Extract sales data from our PostgreSQL database every hour, clean and transform the data, validate for completeness, aggregate by region, and load into our data warehouse for reporting."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination Type</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="database">Database</option>
                  <option value="warehouse">Data Warehouse</option>
                  <option value="file">File (CSV/Parquet)</option>
                  <option value="api">External API</option>
                  <option value="dashboard">Dashboard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Constraints (optional)</label>
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="e.g., Must complete within 5 minutes, handle up to 1M records, retry on failure..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                />
              </div>

              <div className="bg-indigo-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-indigo-800 mb-2">AI will generate:</h4>
                <ul className="text-xs text-indigo-700 space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Optimized pipeline steps with configurations</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Source & destination configurations</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Error handling & retry strategies</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Schedule recommendations</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Performance & scalability suggestions</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowGenerator(false)} className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !requirements.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? 'Generating...' : 'Generate Pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Create Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-6 w-6 text-gray-600" />
                Create Pipeline
              </h2>
              <button onClick={() => setShowManual(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Name *</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g., Daily Sales ETL"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="Describe what this pipeline does..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Steps</label>
                  <button onClick={addManualStep} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add Step
                  </button>
                </div>
                <div className="space-y-3">
                  {manualSteps.map((step, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-6">{i + 1}.</span>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateManualStep(i, 'name', e.target.value)}
                          placeholder="Step name"
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                        />
                        <select
                          value={step.type}
                          onChange={(e) => updateManualStep(i, 'type', e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                        >
                          {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <button onClick={() => removeManualStep(i)} className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => updateManualStep(i, 'description', e.target.value)}
                        placeholder="Step description"
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm ml-8"
                        style={{ width: 'calc(100% - 2rem)' }}
                      />
                    </div>
                  ))}
                  {manualSteps.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">Click "Add Step" to define your pipeline steps</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowManual(false)} className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={handleManualCreate}
                disabled={!manualName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                <Save className="h-4 w-4" />
                Create Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View */}
      {selectedPipeline && (
        <PipelineDetail
          pipeline={selectedPipeline}
          onClose={() => setSelectedPipeline(null)}
          onRefresh={loadPipelines}
        />
      )}
    </div>
  );
}
