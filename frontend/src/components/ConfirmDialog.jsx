import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) {
  if (!isOpen) return null;

  const variants = {
    danger: { button: 'bg-red-600 hover:bg-red-700', icon: 'bg-red-50 text-red-600' },
    warning: { button: 'bg-yellow-600 hover:bg-yellow-700', icon: 'bg-yellow-50 text-yellow-600' },
    info: { button: 'bg-primary-600 hover:bg-primary-700', icon: 'bg-primary-50 text-primary-600' },
  };

  const v = variants[variant] || variants.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${v.icon}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${v.button}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
