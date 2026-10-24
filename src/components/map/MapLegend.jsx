import React from 'react';
import { AlertCircle, Building2, Layers, LifeBuoy } from 'lucide-react';

export default function MapLegend({
  showIncidents,
  setShowIncidents,
  showShelters,
  setShowShelters,
  showSosRequests = true,
  setShowSosRequests = () => {},
}) {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200 shadow-md text-xs text-slate-700 w-64 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="font-bold text-navy-900 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
          <Layers className="w-3.5 h-3.5 text-navy-700" />
          Map Legend & Layers
        </span>
      </div>

      {/* Layer Toggles */}
      <div className="space-y-1.5 pb-2 border-b border-slate-100">
        <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
            <span className="font-semibold text-red-700">Citizen SOS Requests</span>
          </span>
          <input
            type="checkbox"
            checked={showSosRequests}
            onChange={(e) => setShowSosRequests(e.target.checked)}
            className="rounded border-slate-300 text-red-600 focus:ring-red-500"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="font-medium text-slate-800">Disaster Incidents</span>
          </span>
          <input
            type="checkbox"
            checked={showIncidents}
            onChange={(e) => setShowIncidents(e.target.checked)}
            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <span className="font-medium text-slate-800">Relief Shelters</span>
          </span>
          <input
            type="checkbox"
            checked={showShelters}
            onChange={(e) => setShowShelters(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </label>
      </div>

      {/* Priority Colors */}
      <div className="space-y-1 text-[11px]">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Marker Identifiers
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0 animate-ping"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0 -ml-4.5"></span>
          <span className="font-semibold text-slate-800">SOS Distress (Pulsing Pin)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0"></span>
          <span>High Urgency</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
          <span>Medium Urgency</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
          <span>Low Urgency / Info</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <span className="w-3 h-3 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
            ⌂
          </span>
          <span>Registered Relief Shelter</span>
        </div>
      </div>
    </div>
  );
}

