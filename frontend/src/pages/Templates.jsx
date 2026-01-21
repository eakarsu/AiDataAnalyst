import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import { Palette, BarChart3, FileText, Star, Users } from 'lucide-react';

export default function Templates() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setData(await api.getTemplates()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const categories = ['all', ...new Set(data.map(t => t.category))];
  const filteredData = filter === 'all' ? data : data.filter(t => t.category === filter);

  const getCategoryIcon = (category) => {
    const icons = { dashboard: BarChart3, report: FileText };
    return icons[category] || Palette;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-pink-50 rounded-lg"><Palette className="h-6 w-6 text-pink-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Templates</h1><p className="text-gray-500">Pre-built templates to get started quickly</p></div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map(template => {
          const Icon = getCategoryIcon(template.category);
          return (
            <div key={template.id} onClick={() => navigate(`/templates/${template.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-primary-200 cursor-pointer transition-all">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-primary-50 rounded-lg"><Icon className="h-5 w-5 text-primary-600" /></div>
                {template.is_premium && <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1"><Star className="h-3 w-3" />Premium</span>}
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span className="capitalize">{template.category}</span>
                <div className="flex items-center gap-1"><Users className="h-4 w-4" />{template.usage_count?.toLocaleString() || 0} uses</div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12 text-gray-500">No templates found in this category</div>
      )}
    </div>
  );
}
