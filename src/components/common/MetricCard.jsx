import React from 'react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  badgeText,
  onClick,
}) {
  const variantStyles = {
    default: {
      border: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-navy-50 text-navy-800',
      valueColor: 'text-slate-900',
    },
    red: {
      border: 'border-red-100 hover:border-red-200 bg-gradient-to-br from-white to-red-50/40',
      iconBg: 'bg-red-100 text-red-600',
      valueColor: 'text-red-600',
    },
    emerald: {
      border: 'border-emerald-100 hover:border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40',
      iconBg: 'bg-emerald-100 text-emerald-600',
      valueColor: 'text-emerald-700',
    },
    amber: {
      border: 'border-amber-100 hover:border-amber-200 bg-gradient-to-br from-white to-amber-50/40',
      iconBg: 'bg-amber-100 text-amber-600',
      valueColor: 'text-amber-700',
    },
    blue: {
      border: 'border-blue-100 hover:border-blue-200 bg-gradient-to-br from-white to-blue-50/40',
      iconBg: 'bg-blue-100 text-blue-600',
      valueColor: 'text-blue-700',
    },
    navy: {
      border: 'border-navy-700 bg-navy-900 text-white',
      iconBg: 'bg-navy-800 text-white',
      valueColor: 'text-white',
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.default;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 ${currentVariant.border} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className={`text-3xl font-extrabold mt-1 tracking-tight ${currentVariant.valueColor}`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${currentVariant.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || badgeText) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>{subtitle}</span>
          {badgeText && (
            <span className="font-semibold px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
