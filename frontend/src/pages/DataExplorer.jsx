import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import BarChartWidget from '../components/charts/BarChartWidget';
import LineChartWidget from '../components/charts/LineChartWidget';
import {
  Database, Table, BarChart3, ChevronRight, Hash, Type, Calendar,
  DollarSign, X, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';

function getFieldIcon(colName, dataType) {
  const name = colName.toLowerCase();
  if (dataType === 'integer' || dataType === 'numeric') return <Hash className="h-3.5 w-3.5 text-blue-500" />;
  if (name.includes('date') || name.includes('time')) return <Calendar className="h-3.5 w-3.5 text-purple-500" />;
  if (name.includes('price') || name.includes('spend') || name.includes('salary') || name.includes('total') || name.includes('value') || name.includes('cost') || name.includes('revenue')) return <DollarSign className="h-3.5 w-3.5 text-green-500" />;
  return <Type className="h-3.5 w-3.5 text-gray-400" />;
}

function formatValue(value, colName) {
  if (value === null || value === undefined) return '-';
  const name = colName.toLowerCase();
  const num = Number(value);
  if (!isNaN(num) && (name.includes('price') || name.includes('spend') || name.includes('salary') || name.includes('total') || name.includes('value') || name.includes('cost') || name.includes('revenue'))) {
    return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (!isNaN(num) && (name.includes('score') || name.includes('rating'))) {
    return num.toFixed(1);
  }
  if (!isNaN(num) && Number.isInteger(num) && (name.includes('count') || name.includes('quantity') || name.includes('tickets') || name.includes('hours') || name.includes('projects') || name.includes('completed') || name.includes('logged') || name.includes('training'))) {
    return num.toLocaleString();
  }
  return String(value);
}

function getScoreBadge(value, colName) {
  const name = colName.toLowerCase();
  const num = Number(value);
  if (isNaN(num)) return null;
  if (name.includes('satisfaction') || name.includes('rating')) {
    const color = num >= 4.5 ? 'bg-green-100 text-green-700' : num >= 3.5 ? 'bg-blue-100 text-blue-700' : num >= 2.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
    return <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${color}`}>{num >= 4.5 ? 'Excellent' : num >= 3.5 ? 'Good' : num >= 2.5 ? 'Average' : 'Low'}</span>;
  }
  if (name.includes('performance_score')) {
    const color = num >= 9 ? 'bg-green-100 text-green-700' : num >= 8 ? 'bg-blue-100 text-blue-700' : num >= 7 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
    return <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${color}`}>{num >= 9 ? 'Top Performer' : num >= 8 ? 'Strong' : num >= 7 ? 'Meets Expectations' : 'Needs Improvement'}</span>;
  }
  return null;
}

function RowDetail({ row, columns, rowIndex, totalRows, onPrev, onNext }) {
  // Find a "name" or "title" or first text column for the header
  const nameCol = columns.find(c => ['name', 'customer', 'employee_name', 'company', 'product'].includes(c.column_name));
  const headerValue = nameCol ? row[nameCol.column_name] : `Record #${rowIndex + 1}`;

  // Separate numeric and text fields
  const numericFields = columns.filter(c => (c.data_type === 'integer' || c.data_type === 'numeric') && row[c.column_name] !== null);
  const textFields = columns.filter(c => c.data_type !== 'integer' && c.data_type !== 'numeric');

  return (
    <div className="space-y-5">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Row {rowIndex + 1} of {totalRows}</span>
        <div className="flex gap-1">
          <button onClick={onPrev} disabled={rowIndex <= 0} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <button onClick={onNext} disabled={rowIndex >= totalRows - 1} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">{nameCol?.column_name?.replace(/_/g, ' ') || 'Record'}</p>
        <h2 className="text-xl font-bold text-cyan-800 mt-1">{headerValue}</h2>
      </div>

      {/* Numeric Metrics Grid */}
      {numericFields.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Metrics</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {numericFields.map(col => (
              <div key={col.column_name} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  {getFieldIcon(col.column_name, col.data_type)}
                  <span className="text-xs text-gray-500 capitalize">{col.column_name.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {formatValue(row[col.column_name], col.column_name)}
                </p>
                {getScoreBadge(row[col.column_name], col.column_name)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text Fields */}
      {textFields.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Details</h4>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {textFields.map(col => (
              <div key={col.column_name} className="flex items-start gap-3 px-4 py-3">
                <div className="flex items-center gap-1.5 min-w-[140px]">
                  {getFieldIcon(col.column_name, col.data_type)}
                  <span className="text-sm text-gray-500 capitalize">{col.column_name.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{formatValue(row[col.column_name], col.column_name)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DataExplorer() {
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const result = await api.getDataSources();
      setSources(result.filter(s => s.type === 'CSV/Excel'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectSource = async (source) => {
    setSelectedSource(source);
    setLoadingData(true);
    setSelectedRowIndex(null);
    try {
      const [colsData, rowsData] = await Promise.all([
        api.getUploadedColumns(source.id),
        api.getUploadedData(source.id, 1, 50)
      ]);
      setColumns(colsData);
      setData(rowsData.data);
      setPagination(rowsData.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  const loadPage = async (page) => {
    if (!selectedSource) return;
    setLoadingData(true);
    try {
      const result = await api.getUploadedData(selectedSource.id, page, 50);
      setData(result.data);
      setPagination(result.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  const numericColumns = columns.filter(c => c.data_type === 'integer' || c.data_type === 'numeric');

  const generateChartData = () => {
    if (!data.length || numericColumns.length === 0) return [];
    const col = numericColumns[0];
    // Try to find a label column (name, customer, employee_name, product, etc.)
    const labelCol = columns.find(c => ['name', 'customer', 'employee_name', 'company', 'product'].includes(c.column_name));
    return data.slice(0, 20).map((row, idx) => ({
      name: labelCol ? String(row[labelCol.column_name] || '').substring(0, 12) : `Row ${idx + 1}`,
      [col.column_name]: Number(row[col.column_name]) || 0
    }));
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
        <div className="p-2 bg-cyan-50 rounded-lg">
          <Database className="h-6 w-6 text-cyan-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Explorer</h1>
          <p className="text-gray-500">Browse and visualize uploaded data</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Source List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-medium text-gray-900 text-sm">Uploaded Sources</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {sources.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No uploaded data sources. Upload a CSV or Excel file on the Data Sources page.
              </div>
            ) : (
              sources.map(source => (
                <button
                  key={source.id}
                  onClick={() => selectSource(source)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    selectedSource?.id === source.id ? 'bg-primary-50 border-l-2 border-primary-600' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{source.name}</p>
                    <p className="text-xs text-gray-500">{source.record_count?.toLocaleString()} rows</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Data View */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedSource ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Table className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="mt-4 text-gray-500">Select a data source to explore</p>
            </div>
          ) : loadingData ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading data...</p>
            </div>
          ) : (
            <>
              {/* Chart from numeric columns */}
              {numericColumns.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <BarChartWidget
                    data={generateChartData()}
                    title={`${numericColumns[0].column_name.replace(/_/g, ' ')} Distribution`}
                    xKey="name"
                    bars={[numericColumns[0].column_name]}
                    height={250}
                  />
                  {numericColumns.length > 1 && (
                    <LineChartWidget
                      data={data.slice(0, 20).map((row, idx) => {
                        const labelCol = columns.find(c => ['name', 'customer', 'employee_name', 'company', 'product'].includes(c.column_name));
                        return {
                          name: labelCol ? String(row[labelCol.column_name] || '').substring(0, 12) : `${idx + 1}`,
                          [numericColumns[1].column_name]: Number(row[numericColumns[1].column_name]) || 0
                        };
                      })}
                      title={`${numericColumns[1].column_name.replace(/_/g, ' ')} Trend`}
                      xKey="name"
                      lines={[numericColumns[1].column_name]}
                      height={250}
                    />
                  )}
                </div>
              )}

              {/* Data Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-gray-600" />
                    <h2 className="font-semibold text-gray-900">{selectedSource.name}</h2>
                    <span className="text-sm text-gray-500">({pagination?.total?.toLocaleString()} rows)</span>
                  </div>
                  <span className="text-xs text-gray-400">Click a row to view details</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.map(col => (
                          <th key={col.column_name} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                            {col.column_name.replace(/_/g, ' ')}
                            <span className="ml-1 text-xs text-gray-400">({col.data_type})</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.map((row, idx) => (
                        <tr
                          key={idx}
                          onClick={() => setSelectedRowIndex(idx)}
                          className="hover:bg-primary-50 cursor-pointer transition-colors"
                        >
                          {columns.map(col => (
                            <td key={col.column_name} className="px-4 py-2.5 text-gray-700 whitespace-nowrap max-w-xs truncate">
                              {formatValue(row[col.column_name], col.column_name)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pagination && pagination.totalPages > 1 && (
                  <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadPage(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => loadPage(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row Detail Modal */}
      <Modal
        isOpen={selectedRowIndex !== null}
        onClose={() => setSelectedRowIndex(null)}
        title="Record Details"
        size="lg"
      >
        {selectedRowIndex !== null && data[selectedRowIndex] && (
          <RowDetail
            row={data[selectedRowIndex]}
            columns={columns}
            rowIndex={selectedRowIndex}
            totalRows={data.length}
            onPrev={() => setSelectedRowIndex(Math.max(0, selectedRowIndex - 1))}
            onNext={() => setSelectedRowIndex(Math.min(data.length - 1, selectedRowIndex + 1))}
          />
        )}
      </Modal>
    </div>
  );
}
