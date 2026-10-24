import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Send,
  LifeBuoy,
  Droplets,
  Utensils,
  HeartPulse,
  Building2,
  Users,
  Compass
} from 'lucide-react';
import { REQUEST_STATUSES, URGENCY_LEVELS, ASSISTANCE_CATEGORIES } from '../../data/assistanceCategories';

export function RequestStatusBadge({ status, size = 'sm' }) {
  const config = REQUEST_STATUSES[status] || REQUEST_STATUSES.Submitted;
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.badgeClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} ${status === 'Submitted' ? 'animate-ping' : ''}`}></span>
      <span>{config.label}</span>
    </span>
  );
}

export function UrgencyBadge({ urgency, size = 'sm' }) {
  const config = URGENCY_LEVELS[urgency] || URGENCY_LEVELS.Medium;
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${config.badgeClass} ${sizeClasses}`}
    >
      {urgency === 'Critical' && <AlertOctagon className="w-3 h-3 text-red-600 animate-pulse" />}
      {urgency === 'High' && <AlertTriangle className="w-3 h-3 text-orange-600" />}
      {urgency === 'Medium' && <Info className="w-3 h-3 text-amber-600" />}
      {urgency === 'Low' && <CheckCircle className="w-3 h-3 text-blue-600" />}
      <span>{config.shortLabel} Urgency</span>
    </span>
  );
}

export function AssistanceCategoryBadge({ categoryId, size = 'sm' }) {
  const cat = ASSISTANCE_CATEGORIES.find(c => c.id === categoryId) || {
    label: categoryId,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-md border ${cat.badgeClass} ${sizeClasses}`}>
      {categoryId === 'rescue' && <LifeBuoy className="w-3 h-3 text-red-600" />}
      {categoryId === 'water' && <Droplets className="w-3 h-3 text-blue-600" />}
      {categoryId === 'food' && <Utensils className="w-3 h-3 text-amber-600" />}
      {categoryId === 'medical' && <HeartPulse className="w-3 h-3 text-purple-600" />}
      {categoryId === 'shelter' && <Building2 className="w-3 h-3 text-emerald-600" />}
      {categoryId === 'evacuation' && <Users className="w-3 h-3 text-orange-600" />}
      <span>{cat.label}</span>
    </span>
  );
}

// Preserve existing badges for backwards-compatibility
export function PriorityBadge({ priority, size = 'sm' }) {
  return <UrgencyBadge urgency={priority} size={size} />;
}

export function VerificationBadge({ status, size = 'sm' }) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 text-xs">
      <ShieldCheck className="w-3 h-3" />
      <span>{status}</span>
    </span>
  );
}

export function ResponseStatusBadge({ status, size = 'sm' }) {
  return <RequestStatusBadge status={status} size={size} />;
}

export function DisasterTypeBadge({ type, size = 'sm' }) {
  return (
    <span className="inline-flex items-center gap-1 font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-xs">
      <span>{type}</span>
    </span>
  );
}
