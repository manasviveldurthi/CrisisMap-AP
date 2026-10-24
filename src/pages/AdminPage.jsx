import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { PriorityBadge, VerificationBadge, ResponseStatusBadge, DisasterTypeBadge } from '../components/common/Badge';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Trash2,
  ExternalLink,
  Edit3,
  Clock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export default function AdminPage() {
  const { incidents, updateIncident, deleteIncident, resetDemoData, stats } = useCrisis();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unverified', 'verified', 'rejected'
  const [editingId, setEditingId] = useState(null);

  const filteredList = incidents.filter((incident) => {
    if (activeTab === 'unverified') return incident.verificationStatus === 'Unverified';
    if (activeTab === 'verified') return incident.verificationStatus === 'Verified';
    if (activeTab === 'rejected') return incident.verificationStatus === 'Rejected';
    return true;
  });

  const handleQuickVerify = (id) => {
    updateIncident(id, { verificationStatus: 'Verified', responseStatus: 'Under Review' });
  };

  const handleQuickReject = (id) => {
    updateIncident(id, { verificationStatus: 'Rejected' });
  };

  const handlePriorityChange = (id, newPriority) => {
    updateIncident(id, { priority: newPriority });
  };

  const handleResponseChange = (id, newResponse) => {
    updateIncident(id, { responseStatus: newResponse });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Admin Verification Portal
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 font-mono">
              Demo Simulation Mode
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulate administrative verification, triage priority assignment, and dispatch telemetry.
          </p>
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={() => {
            if (window.confirm('Reset all demonstration incidents and shelters back to initial clean state?')) {
              resetDemoData();
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300 text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demonstration Database</span>
        </button>
      </div>

      {/* Persistent Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-navy-900 to-navy-950 text-white shadow-md border border-navy-800 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-amber-300 text-sm">
            Unsecured Frontend Demonstration Environment
          </h3>
          <p className="text-slate-300 leading-relaxed">
            This administration screen does <strong>not enforce authentication, user passwords, or backend cryptographic tokens</strong>.
            It is intentionally designed for classroom presentation and functional UX verification. All status modifications are
            immediately reflected across the public Dashboard, Live Map, and persisted in your browser's <code className="text-amber-300 font-mono">localStorage</code>.
          </p>
        </div>
      </div>

      {/* Verification KPI counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'all'
              ? 'bg-navy-900 text-white border-navy-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-xs uppercase font-medium text-slate-400">All Reports</p>
          <p className="text-2xl font-extrabold mt-1 font-mono">{stats.totalIncidents}</p>
        </div>

        <div
          onClick={() => setActiveTab('unverified')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'unverified'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <p className="text-xs uppercase font-medium text-slate-500">Pending Review</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">{stats.unverifiedCount}</p>
        </div>

        <div
          onClick={() => setActiveTab('verified')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'verified'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <p className="text-xs uppercase font-medium text-slate-500">Verified</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">{stats.verifiedCount}</p>
        </div>

        <div
          onClick={() => setActiveTab('rejected')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'rejected'
              ? 'bg-slate-700 text-white border-slate-700 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-xs uppercase font-medium text-slate-500">Rejected / Spam</p>
          <p className="text-2xl font-extrabold text-slate-500 mt-1 font-mono">{stats.rejectedCount}</p>
        </div>
      </div>

      {/* Main Admin Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              Demonstration Records Queue ({filteredList.length})
            </h2>
            <p className="text-xs text-slate-500">
              Click buttons to instantly change report verification status, triage priority, or dispatch teams.
            </p>
          </div>

          <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            Real-time localStorage Sync
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">ID & District</th>
                <th className="px-4 py-3.5">Category & Title</th>
                <th className="px-4 py-3.5">Verification Status</th>
                <th className="px-4 py-3.5">Severity Priority</th>
                <th className="px-4 py-3.5">Response Stage</th>
                <th className="px-4 py-3.5 text-right">Quick Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((incident) => {
                return (
                  <tr key={incident.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* ID & District */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-navy-900 block">
                        {incident.id}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {incident.district}
                      </span>
                      {incident.isUserCreated && (
                        <span className="block mt-1 text-[10px] text-red-600 font-bold bg-red-50 px-1 rounded w-max border border-red-200">
                          User Submitted
                        </span>
                      )}
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="mb-1">
                        <DisasterTypeBadge type={incident.type} size="xs" />
                      </div>
                      <p className="font-bold text-slate-900 truncate">{incident.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{incident.locality}</p>
                    </td>

                    {/* Verification Selector */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <select
                        value={incident.verificationStatus}
                        onChange={(e) => updateIncident(incident.id, { verificationStatus: e.target.value })}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-1 focus:ring-navy-600 ${
                          incident.verificationStatus === 'Verified'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : incident.verificationStatus === 'Rejected'
                            ? 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Unverified">Unverified</option>
                        <option value="Verified">Verified</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>

                    {/* Priority Selector */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <select
                        value={incident.priority}
                        onChange={(e) => handlePriorityChange(incident.id, e.target.value)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-600"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </td>

                    {/* Response Stage */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <select
                        value={incident.responseStatus || 'Reported'}
                        onChange={(e) => handleResponseChange(incident.id, e.target.value)}
                        className="text-xs font-medium px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-600"
                      >
                        <option value="Reported">Reported</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>

                    {/* Quick Admin Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {incident.verificationStatus !== 'Verified' && (
                          <button
                            onClick={() => handleQuickVerify(incident.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                            title="Quick Verify"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {incident.verificationStatus !== 'Rejected' && (
                          <button
                            onClick={() => handleQuickReject(incident.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Quick Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        <Link
                          to={`/incident/${incident.id}`}
                          className="p-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-800 transition-colors"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete demonstration incident #${incident.id}?`)) {
                              deleteIncident(incident.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          title="Delete Incident"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
