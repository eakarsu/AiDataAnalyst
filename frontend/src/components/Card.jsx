import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Card({
  title,
  subtitle,
  icon: Icon,
  value,
  trend,
  trendUp,
  onClick,
  href,
  children,
  className = '',
  badge,
  badgeColor = 'primary'
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  const isClickable = onClick || href;

  const badgeColors = {
    primary: 'bg-primary-100 text-primary-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:shadow-lg hover:border-primary-200 hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 bg-primary-50 rounded-lg">
              <Icon className="h-5 w-5 text-primary-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
        {isClickable && !badge && (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </div>

      {(value !== undefined || trend) && (
        <div className="mt-4 flex items-end justify-between">
          {value !== undefined && (
            <span className="text-2xl font-bold text-gray-900">{value}</span>
          )}
          {trend && (
            <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? '+' : ''}{trend}
            </span>
          )}
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
