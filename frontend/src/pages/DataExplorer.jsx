import { useState, useEffect } from 'react';
import api from '../services/api';
import BarChartWidget from '../components/charts/BarChartWidget';
import LineChartWidget from '../components/charts/LineChartWidget';
import { Database, Table, BarChart3, ChevronRight } from 'lucide-react';

export default function DataExplorer() {
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

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
    return data.slice(0, 20).map((row, idx) => ({
      name: `Row ${idx + 1}`,
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
                    title={`${numericColumns[0].column_name} Distribution`}
                    xKey="name"
                    bars={[numericColumns[0].column_name]}
                    height={250}
                  />
                  {numericColumns.length > 1 && (
                    <LineChartWidget
                      data={data.slice(0, 20).map((row, idx) => ({
                        name: `${idx + 1}`,
                        [numericColumns[1].column_name]: Number(row[numericColumns[1].column_name]) || 0
                      }))}
                      title={`${numericColumns[1].column_name} Trend`}
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
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.map(col => (
                          <th key={col.column_name} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">
                            {col.column_name}
                            <span className="ml-1 text-xs text-gray-400">({col.data_type})</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {columns.map(col => (
                            <td key={col.column_name} className="px-4 py-2 text-gray-700 whitespace-nowrap max-w-xs truncate">
                              {row[col.column_name] !== null ? String(row[col.column_name]) : '-'}
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
    </div>
  );
}
