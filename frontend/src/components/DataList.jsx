import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trash2, Download, FileText, Edit2, Eye } from 'lucide-react';
import { TableSkeleton } from './LoadingSkeleton';
import ConfirmDialog from './ConfirmDialog';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function DataList({
  title,
  icon: Icon,
  iconColor = 'blue',
  items = [],
  columns = [],
  loading = false,
  entityType,
  detailType,
  pagination,
  onPageChange,
  onSearch,
  onSort,
  onDelete,
  onRefresh,
  sortField,
  sortOrder,
  searchValue = '',
  renderActions,
  onRowClick,
}) {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  const data = Array.isArray(items) ? items : [];
  const allSelected = data.length > 0 && selectedIds.length === data.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : data.map(item => item.id));
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      open: true,
      title: `Delete ${selectedIds.length} items?`,
      message: `Are you sure you want to delete ${selectedIds.length} selected items? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.bulkDelete(entityType, selectedIds);
          toast.success(`${selectedIds.length} items deleted`);
          setSelectedIds([]);
          onRefresh?.();
        } catch (err) {
          toast.error(err.message || 'Failed to delete');
        }
      },
    });
  };

  const handleExportCSV = async () => {
    try {
      const csvData = await api.exportCSV(entityType);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      const result = await api.exportPDF(entityType);
      toast.success(`PDF generated: ${result.fileName}`);
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  };

  const handleRowClick = (item) => {
    if (onRowClick) {
      onRowClick(item);
    } else if (detailType) {
      navigate(`/${detailType}/${item.id}`);
    }
  };

  const handleDelete = (item, e) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      title: `Delete this item?`,
      message: `Are you sure you want to delete "${item.name || item.title || item.metric_name || `#${item.id}`}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await onDelete?.(item.id);
          toast.success('Item deleted successfully');
          onRefresh?.();
        } catch (err) {
          toast.error(err.message || 'Failed to delete');
        }
      },
    });
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    if (detailType) {
      navigate(`/${detailType}/${item.id}`);
    }
  };

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    pink: 'bg-pink-50 text-pink-600',
  };

  if (loading) {
    return <TableSkeleton rows={8} cols={columns.length} />;
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              {Icon && (
                <div className={`p-2 rounded-lg ${colorClasses[iconColor] || colorClasses.blue}`}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <h2 className="font-semibold text-gray-900">{title}</h2>
              {pagination && (
                <span className="text-sm text-gray-500">({pagination.total} total)</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              {onSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchValue}
                    onChange={(e) => onSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-48"
                  />
                </div>
              )}
              {/* Export buttons */}
              <button onClick={handleExportCSV} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Export CSV">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={handleExportPDF} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Export PDF">
                <FileText className="h-4 w-4" />
              </button>
              {/* Bulk delete */}
              {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedIds.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => onSort?.(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortField === col.key && (
                        sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => toggleSelect(item.id, e)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {col.render ? col.render(item[col.key], item) : (
                          item[col.key] === null || item[col.key] === undefined ? '-' :
                          typeof item[col.key] === 'boolean' ? (item[col.key] ? 'Yes' : 'No') :
                          typeof item[col.key] === 'object' ? JSON.stringify(item[col.key]).substring(0, 50) :
                          String(item[col.key])
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => handleEdit(item, e)} className="p-1 text-gray-400 hover:text-primary-600 rounded" title="View/Edit">
                          <Eye className="h-4 w-4" />
                        </button>
                        {onDelete && (
                          <button onClick={(e) => handleDelete(item, e)} className="p-1 text-gray-400 hover:text-red-600 rounded" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {renderActions?.(item)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const startPage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
                const page = startPage + i;
                if (page > pagination.totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange?.(page)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      page === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
