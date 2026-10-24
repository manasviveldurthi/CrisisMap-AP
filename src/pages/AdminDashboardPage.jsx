import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { PriorityBadge, VerificationBadge, ResponseStatusBadge, DisasterTypeBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { AP_DISTRICTS } from '../data/districts';
import { DISASTER_TYPES } from '../data/disasterTypes';
import {
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
  BarChart3,
  Building2,
  Plus,
  X,
  History,
  AlertTriangle,
  Search,
  Filter,
  Save,
  Users
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    incidents,
    shelters,
    updateIncident,
    deleteIncident,
    updateShelter,
    addShelter,
    deleteShelter,
    resetDemoData,
    stats
  } = useCrisis();

  // Active Section Tab: 'incidents' | 'analytics' | 'shelters'
  const [adminTab, setAdminTab] = useState('incidents');

  // Incident Filtering & Search
  const [filterVerification, setFilterVerification] = useState('all'); // 'all', 'unverified', 'verified', 'rejected'
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Audit History Modal State
  const [auditIncident, setAuditIncident] = useState(null);

  // Moderation Note Modal State for Verify/Reject
  const [actionModal, setActionModal] = useState(null); // { id, action: 'Verified' | 'Rejected', note: '' }

  // New Shelter Form State
  const [showNewShelterModal, setShowNewShelterModal] = useState(false);
  const [newShelterData, setNewShelterData] = useState({
    name: '',
    district: 'NTR (Vijayawada)',
    location: '',
    capacity: 600,
    currentOccupants: 0,
    status: 'Active',
  });

  // Filtered Incidents Queue
  const filteredQueue = useMemo(() => {
    return incidents.filter((incident) => {
      if (filterVerification !== 'all' && incident.verificationStatus !== filterVerification) {
        return false;
      }
      if (filterPriority && incident.priority !== filterPriority) {
        return false;
      }
      if (filterDistrict && incident.district !== filterDistrict) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = incident.title?.toLowerCase().includes(q);
        const mLoc = incident.locality?.toLowerCase().includes(q);
        const mId = incident.id?.toLowerCase().includes(q);
        const mDist = incident.district?.toLowerCase().includes(q);
        if (!mTitle && !mLoc && !mId && !mDist) return false;
      }
      return true;
    });
  }, [incidents, filterVerification, filterPriority, filterDistrict, searchQuery]);

  // Analytics derived from current data
  const categoryStats = useMemo(() => {
    const counts = {};
    DISASTER_TYPES.forEach(t => counts[t.id] = 0);
    incidents.forEach(inc => {
      counts[inc.type] = (counts[inc.type] || 0) + 1;
    });
    return DISASTER_TYPES.map(t => ({
      ...t,
      count: counts[t.id] || 0,
      percentage: incidents.length ? Math.round(((counts[t.id] || 0) / incidents.length) * 100) : 0,
    }));
  }, [incidents]);

  const handleOpenActionModal = (id, action) => {
    setActionModal({
      id,
      action,
      note: action === 'Verified' ? 'Field validation confirmed by district emergency patrol.' : 'Marked as duplicate or unconfirmed report.'
    });
  };

  const handleConfirmAction = () => {
    if (!actionModal) return;
    updateIncident(
      actionModal.id,
      {
        verificationStatus: actionModal.action,
        responseStatus: actionModal.action === 'Verified' ? 'Dispatched' : 'Resolved'
      },
      actionModal.note
    );
    setActionModal(null);
  };

  const handlePriorityChange = (id, priority) => {
    updateIncident(id, { priority }, `Priority triage adjusted to ${priority}`);
  };

  const handleResponseChange = (id, responseStatus) => {
    updateIncident(id, { responseStatus }, `Response stage moved to ${responseStatus}`);
  };

  const handleAddShelterSubmit = (e) => {
    e.preventDefault();
    if (!newShelterData.name.trim() || !newShelterData.location.trim()) {
      alert('Please provide shelter name and location.');
      return;
    }
    addShelter(newShelterData);
    setShowNewShelterModal(false);
    setNewShelterData({
      name: '',
      district: 'NTR (Vijayawada)',
      location: '',
      capacity: 600,
      currentOccupants: 0,
      status: 'Active',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Operations Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Emergency Operations Center — Admin Dashboard
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Demonstration</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulate administrative triage, verification approvals, response team dispatch, shelter capacity oversight, and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/user-dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <span>← Switch to User View</span>
          </Link>

          <button
            onClick={() => {
              if (window.confirm('Reset all demonstration incidents, shelters, and audit history to clean initial sample state?')) {
                resetDemoData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors"
            title="Reset All Demo Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Persistent Security Disclaimer */}
      <div className="p-4 rounded-xl bg-navy-950 text-white shadow-md border border-navy-800 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-amber-300 text-sm">
            Statutory Frontend Demonstration Mode (No Authentication Implemented)
          </h3>
          <p className="text-slate-300 leading-relaxed">
            This administration interface is an <strong>unsecured frontend simulation</strong> built for project evaluation.
            It does not enforce backend server credentials, cryptographic tokens, or real administrative authorizations.
            All status updates immediately propagate to the public <strong>User Dashboard</strong>, <strong>Live Map</strong>, and
            persist via local browser <code className="font-mono text-amber-300">localStorage</code>.
          </p>
        </div>
      </div>

      {/* Admin KPI Telemetry Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => { setAdminTab('incidents'); setFilterVerification('all'); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            adminTab === 'incidents' && filterVerification === 'all'
              ? 'bg-navy-900 text-white border-navy-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Queue</span>
          <p className="text-2xl font-extrabold mt-1 font-mono">{stats.totalIncidents}</p>
        </div>

        <div
          onClick={() => { setAdminTab('incidents'); setFilterVerification('Unverified'); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            adminTab === 'incidents' && filterVerification === 'Unverified'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-600 uppercase">Pending Review</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">{stats.unverifiedCount}</p>
        </div>

        <div
          onClick={() => { setAdminTab('incidents'); setFilterVerification('Verified'); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            adminTab === 'incidents' && filterVerification === 'Verified'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-600 uppercase">Verified</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">{stats.verifiedCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800">
          <span className="text-[11px] font-semibold text-red-600 uppercase">Critical Priority</span>
          <p className="text-2xl font-extrabold text-red-600 mt-1 font-mono">{stats.criticalCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase">Dispatched Units</span>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1 font-mono">{stats.dispatchedCount}</p>
        </div>

        <div
          onClick={() => setAdminTab('shelters')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            adminTab === 'shelters'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Relief Shelters</span>
          <p className="text-2xl font-extrabold mt-1 font-mono">{stats.totalShelters}</p>
        </div>
      </div>

      {/* Admin Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setAdminTab('incidents')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 ${
            adminTab === 'incidents'
              ? 'border-navy-900 text-navy-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-navy-800" />
          <span>Incident Moderation Queue</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
            {filteredQueue.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('analytics')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 ${
            adminTab === 'analytics'
              ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span>Disaster Telemetry & Charts</span>
        </button>

        <button
          onClick={() => setAdminTab('shelters')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 ${
            adminTab === 'shelters'
              ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Shelter & Relief Resource Management</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
            {shelters.length}
          </span>
        </button>
      </div>

      {/* SECTION 1: INCIDENT MODERATION QUEUE */}
      {adminTab === 'incidents' && (
        <div className="space-y-4">
          {/* Queue Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID, title, or locality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-navy-600"
                />
              </div>

              {/* Verification Filter */}
              <div>
                <select
                  value={filterVerification}
                  onChange={(e) => setFilterVerification(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  <option value="all">All Verification Statuses</option>
                  <option value="Unverified">Pending Review (Unverified)</option>
                  <option value="Verified">Verified Reports</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  <option value="">All Priorities</option>
                  <option value="Critical">Critical Priority</option>
                  <option value="High">High Severity</option>
                  <option value="Medium">Medium Severity</option>
                  <option value="Low">Low Severity</option>
                </select>
              </div>

              {/* District Filter */}
              <div>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  <option value="">All 26 AP Districts</option>
                  {AP_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          {filteredQueue.length === 0 ? (
            <EmptyState
              title="No Incidents in Queue"
              description="No reports match your administrative filter parameters."
              onReset={() => {
                setFilterVerification('all');
                setFilterPriority('');
                setFilterDistrict('');
                setSearchQuery('');
              }}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">ID & Source</th>
                      <th className="px-4 py-3.5">Category & Title</th>
                      <th className="px-4 py-3.5">Verification</th>
                      <th className="px-4 py-3.5">Triage Priority</th>
                      <th className="px-4 py-3.5">Response Stage</th>
                      <th className="px-4 py-3.5 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueue.map((incident) => {
                      return (
                        <tr key={incident.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* ID & Source */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-navy-950 block">
                              {incident.id}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {incident.district}
                            </span>
                            {incident.isUserCreated && (
                              <span className="inline-block mt-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-semibold border border-blue-200">
                                Citizen Report
                              </span>
                            )}
                          </td>

                          {/* Category & Title */}
                          <td className="px-4 py-3.5 max-w-xs">
                            <div className="mb-1">
                              <DisasterTypeBadge type={incident.type} size="xs" />
                            </div>
                            <p className="font-bold text-slate-900 truncate">{incident.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">{incident.locality}</p>
                          </td>

                          {/* Verification Dropdown */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <select
                              value={incident.verificationStatus}
                              onChange={(e) => updateIncident(incident.id, { verificationStatus: e.target.value })}
                              className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none ${
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

                          {/* Priority Dropdown */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <select
                              value={incident.priority}
                              onChange={(e) => handlePriorityChange(incident.id, e.target.value)}
                              className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none"
                            >
                              <option value="Critical">Critical</option>
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </td>

                          {/* Response Stage Dropdown */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <select
                              value={incident.responseStatus || 'Reported'}
                              onChange={(e) => handleResponseChange(incident.id, e.target.value)}
                              className="text-xs font-medium px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none"
                            >
                              <option value="Reported">Reported</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Dispatched">Dispatched</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </td>

                          {/* Moderation Actions */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Verify with Note */}
                              {incident.verificationStatus !== 'Verified' && (
                                <button
                                  onClick={() => handleOpenActionModal(incident.id, 'Verified')}
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                  title="Verify with Note"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Quick Reject */}
                              {incident.verificationStatus !== 'Rejected' && (
                                <button
                                  onClick={() => handleOpenActionModal(incident.id, 'Rejected')}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                  title="Reject with Note"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}

                              {/* View Audit History */}
                              <button
                                onClick={() => setAuditIncident(incident)}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                                title="View Moderation Audit History"
                              >
                                <History className="w-4 h-4" />
                              </button>

                              {/* Details link */}
                              <Link
                                to={`/incident/${incident.id}`}
                                className="p-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-800 transition-colors"
                                title="Open Full Details"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete demonstration report #${incident.id}?`)) {
                                    deleteIncident(incident.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                title="Delete Report"
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
          )}
        </div>
      )}

      {/* SECTION 2: ANALYTICS & VISUAL TELEMETRY CHARTS */}
      {adminTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Disaster Category Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Disaster Category Distribution</span>
                </h3>
                <span className="text-xs text-slate-400">Total: {incidents.length} incidents</span>
              </div>

              <div className="space-y-3">
                {categoryStats.map((item) => (
                  <div key={item.id} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">{item.label}</span>
                      <span className="font-mono text-slate-500">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color || '#2563eb'
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Priority Severity & Response Triage */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="space-y-3">
                <h3 className="font-bold text-navy-950 text-sm pb-2 border-b border-slate-100">
                  Priority Severity Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                    <span className="text-[11px] font-bold text-red-700 uppercase">Critical</span>
                    <p className="text-xl font-bold font-mono text-red-700 mt-1">{stats.criticalCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                    <span className="text-[11px] font-bold text-orange-700 uppercase">High</span>
                    <p className="text-xl font-bold font-mono text-orange-700 mt-1">{stats.highCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="text-[11px] font-bold text-amber-700 uppercase">Medium</span>
                    <p className="text-xl font-bold font-mono text-amber-700 mt-1">{stats.mediumCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <span className="text-[11px] font-bold text-blue-700 uppercase">Low</span>
                    <p className="text-xl font-bold font-mono text-blue-700 mt-1">{stats.lowCount}</p>
                  </div>
                </div>
              </div>

              {/* Response Stage Pipeline */}
              <div className="space-y-3">
                <h3 className="font-bold text-navy-950 text-sm pb-2 border-b border-slate-100">
                  Response Stage Lifecycle
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Dispatched Response Teams</span>
                    <strong className="text-indigo-600 font-mono">{stats.dispatchedCount}</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-indigo-600"
                      style={{
                        width: `${incidents.length ? (stats.dispatchedCount / incidents.length) * 100 : 0}%`
                      }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-slate-700 pt-2">
                    <span>Resolved / Closed Emergencies</span>
                    <strong className="text-emerald-600 font-mono">{stats.resolvedCount}</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-emerald-600"
                      style={{
                        width: `${incidents.length ? (stats.resolvedCount / incidents.length) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: SHELTER & RELIEF RESOURCE MANAGEMENT */}
      {adminTab === 'shelters' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Demonstration Shelter Registry & Occupancy Management
              </h3>
              <p className="text-xs text-slate-500">
                Update shelter capacities, adjust real-time headcounts, and simulate relief center activations.
              </p>
            </div>

            <button
              onClick={() => setShowNewShelterModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Shelter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shelters.map((shelter) => {
              const occupancyPct = Math.min(
                100,
                Math.round((shelter.currentOccupants / shelter.capacity) * 100)
              );

              return (
                <div
                  key={shelter.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {shelter.id}
                      </span>
                      <select
                        value={shelter.status}
                        onChange={(e) => updateShelter(shelter.id, { status: e.target.value })}
                        className="text-xs font-semibold px-2 py-0.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Standby">Standby</option>
                        <option value="Near Capacity">Near Capacity</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {shelter.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{shelter.location}, {shelter.district}</p>
                    </div>

                    {/* Quick Occupancy Adjuster */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Live Occupants:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={shelter.capacity * 2}
                            value={shelter.currentOccupants}
                            onChange={(e) => updateShelter(shelter.id, { currentOccupants: Number(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-center font-mono font-bold text-navy-950 focus:outline-none"
                          />
                          <span className="text-slate-400">/ {shelter.capacity}</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${occupancyPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${occupancyPct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Persisted locally</span>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete demonstration shelter #${shelter.id}?`)) {
                          deleteShelter(shelter.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AUDIT HISTORY MODAL */}
      {auditIncident && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Moderation History & Audit Trail
                </h3>
              </div>
              <button
                onClick={() => setAuditIncident(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-navy-950 font-mono">{auditIncident.id}: {auditIncident.title}</p>
              <p className="text-slate-500">{auditIncident.locality}, {auditIncident.district}</p>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {auditIncident.history && auditIncident.history.length > 0 ? (
                auditIncident.history.map((entry, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>{new Date(entry.timestamp).toLocaleString('en-IN')}</span>
                      <span className="font-semibold text-slate-700">{entry.moderator}</span>
                    </div>
                    <p className="font-bold text-navy-900">{entry.action}</p>
                    {entry.note && (
                      <p className="text-slate-600 bg-slate-50 p-2 rounded-lg text-[11px] border border-slate-100">
                        "{entry.note}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No audit modifications recorded yet.</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setAuditIncident(null)}
                className="px-4 py-2 rounded-xl bg-navy-900 text-white font-semibold text-xs"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY / REJECT ACTION MODAL WITH NOTE */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              {actionModal.action === 'Verified' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span>Set Incident to {actionModal.action}</span>
            </h3>

            <p className="text-xs text-slate-600">
              Provide an administrative reason or field verification log note to attach to the audit trail:
            </p>

            <textarea
              rows={3}
              value={actionModal.note}
              onChange={(e) => setActionModal({ ...actionModal, note: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-navy-600"
              placeholder="Enter validation comment..."
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md ${
                  actionModal.action === 'Verified'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-700 hover:bg-slate-800'
                }`}
              >
                Confirm {actionModal.action} Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SHELTER MODAL */}
      {showNewShelterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>Register Demonstration Relief Shelter</span>
              </h3>
              <button onClick={() => setShowNewShelterModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddShelterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shelter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Municipal Indoor Stadium Relief Camp"
                  value={newShelterData.name}
                  onChange={(e) => setNewShelterData({ ...newShelterData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Andhra Pradesh District</label>
                <select
                  value={newShelterData.district}
                  onChange={(e) => setNewShelterData({ ...newShelterData, district: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  {AP_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near Collectorate Office Road"
                  value={newShelterData.location}
                  onChange={(e) => setNewShelterData({ ...newShelterData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={newShelterData.capacity}
                    onChange={(e) => setNewShelterData({ ...newShelterData, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Occupants</label>
                  <input
                    type="number"
                    value={newShelterData.currentOccupants}
                    onChange={(e) => setNewShelterData({ ...newShelterData, currentOccupants: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewShelterModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  Add Shelter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
