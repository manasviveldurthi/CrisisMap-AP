import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function EmptyState({
  title = 'No incidents found',
  description = 'No disaster reports matched your current filter or search criteria.',
  onReset,
  resetText = 'Clear all filters',
  icon: Icon = AlertCircle
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 shadow-sm my-4">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{resetText}</span>
        </button>
      )}
    </div>
  );
}
