import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { api } from '../api/client';
import { AP_DISTRICTS } from '../data/districts';
import { ASSISTANCE_CATEGORIES, REQUEST_STATUSES, URGENCY_LEVELS } from '../data/assistanceCategories';
import { RequestStatusBadge, UrgencyBadge, AssistanceCategoryBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import DisasterMap from '../components/map/DisasterMap';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Compass,
  MapPin,
  Building2,
  Plus,
  X,
  History,
  MessageSquare,
  BarChart3,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Send,
  LogOut,
  User,
  Users
} from 'lucide-react';

export default function GovernmentPortalPage() {
  const {
    assistanceRequests,
    shelters,
    currentUser,
    acknowledgeRequest,
    assignRequest,
    updateRequestStatus,
    verifyRequest,
    addRequestNote,
    updateShelter,
    addShelter,
    refreshData,
    showToast,
    stats,
    logout
  } = useCrisis();

  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab: 'queue' | 'map' | 'analytics' | 'shelters' | 'profile'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'queue';
  });

  // Filters
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Request Modals
  const [assignModal, setAssignModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [newShelterModal, setNewShelterModal] = useState(false);

  // New shelter form
  const [newShelter, setNewShelter] = useState({
    name: '',
    district: 'NTR (Vijayawada)',
    locality: '',
    address: '',
    latitude: 16.5062,
    longitude: 80.6480,
    capacity: 750,
    current_occupants: 0,
    status: 'Active',
    facilities: ['Clean Drinking Water', 'Emergency Power Supply', 'First Aid Station'],
    helpline_phone: '1070',
    coordinator_name: currentUser?.full_name || 'District Disaster Management Officer'
  });

  // Filtered emergency requests queue
  const filteredQueue = useMemo(() => {
    return assistanceRequests.filter((req) => {
      if (filterStatus !== 'all' && req.status !== filterStatus) return false;
      if (filterUrgency && req.urgency !== filterUrgency) return false;
      if (filterDistrict && req.district !== filterDistrict) return false;
      if (filterCategory && req.category !== filterCategory && !req.assistanceCategories?.includes(filterCategory.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mId = req.id?.toLowerCase().includes(q);
        const mName = req.contactName?.toLowerCase().includes(q);
        const mLoc = req.locality?.toLowerCase().includes(q);
        const mDesc = req.description?.toLowerCase().includes(q);
        if (!mId && !mName && !mLoc && !mDesc) return false;
      }
      return true;
    });
  }, [assistanceRequests, filterStatus, filterUrgency, filterDistrict, filterCategory, searchQuery]);

  const handleVerifyRequest = async (reqId, verStatus) => {
    try {
      await verifyRequest(reqId, verStatus, null, `Incident report verified as ${verStatus} by ${currentUser?.full_name}.`);
      showToast(`Request ${reqId} verified successfully.`, 'success');
    } catch (err) {
      showToast(err.message || 'Verification update failed', 'error');
    }
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!assignModal || !assignModal.selectedResponder) return;
    assignRequest(assignModal.requestId, assignModal.selectedResponder, assignModal.note);
    setAssignModal(null);
    showToast('Responder assigned successfully.', 'success');
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (!statusModal || !statusModal.newStatus) return;
    updateRequestStatus(statusModal.requestId, statusModal.newStatus, statusModal.note);
    setStatusModal(null);
    showToast(`Request status updated to ${statusModal.newStatus}.`, 'success');
  };

  const handleCreateShelter = (e) => {
    e.preventDefault();
    if (!newShelter.name.trim()) return;
    addShelter({
      ...newShelter,
      location: `${newShelter.locality}, ${newShelter.district}`,
      currentOccupants: Number(newShelter.current_occupants) || 0,
      capacity: Number(newShelter.capacity) || 500
    });
    setNewShelterModal(false);
    showToast(`Shelter "${newShelter.name}" registered.`, 'success');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-navy-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Government Emergency Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Andhra Pradesh Disaster Operations & Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Officer: <strong>{currentUser?.full_name}</strong> &bull; Title: <strong>{currentUser?.title_or_designation || 'District Disaster Management Officer'}</strong> &bull; Jurisdiction: <strong>{currentUser?.district || 'Andhra Pradesh'}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentUser?.role === 'admin' && (
            <Link
              to="/admin"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Admin Governance Dashboard</span>
            </Link>
          )}

          <button
            onClick={() => { refreshData(); showToast('Telemetry synchronized with MySQL database.', 'info'); }}
            className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold border border-navy-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Sync DB</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 text-xs font-semibold border border-red-800/60 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Telemetry KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Requests</span>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{stats.totalRequests}</p>
          <span className="text-[10px] text-slate-400">Recorded in MySQL</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-orange-600">Awaiting Acknowledge</span>
          <p className="text-2xl font-extrabold font-mono text-orange-600 mt-1">{stats.awaitingAcknowledgment}</p>
          <span className="text-[10px] text-slate-400">Unacknowledged</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-red-600">Critical Life Threats</span>
          <p className="text-2xl font-extrabold font-mono text-red-600 mt-1">{stats.criticalCount}</p>
          <span className="text-[10px] text-slate-400">Trapped / Immediate</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-indigo-600">Active Dispatches</span>
          <p className="text-2xl font-extrabold font-mono text-indigo-600 mt-1">{stats.activeAssignments}</p>
          <span className="text-[10px] text-slate-400">Assigned / In field</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-emerald-600">Resolved Requests</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-600 mt-1">{stats.resolvedCount}</p>
          <span className="text-[10px] text-slate-400">Rescue completed</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'queue'
              ? 'border-navy-900 text-navy-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-navy-800" />
          <span>Assistance Request Queue</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
            {filteredQueue.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'map'
              ? 'border-red-600 text-red-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4 text-red-600" />
          <span>Incident Map</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span>Analytics & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('shelters')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'shelters'
              ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Shelter Management</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
            {shelters.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-slate-800 text-slate-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4 text-slate-700" />
          <span>Officer Profile</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCY REQUESTS QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search locality, contact, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-navy-600 w-52 sm:w-64"
                />
              </div>

              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
              >
                <option value="">All AP Districts</option>
                {AP_DISTRICTS.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="Flood">Flood</option>
                <option value="Fire">Fire</option>
                <option value="Medical">Medical Emergency</option>
                <option value="Building Collapse">Building Collapse</option>
                <option value="Cyclone">Cyclone / Storm</option>
                <option value="Landslide">Landslide</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
              >
                <option value="">All Urgency Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
              >
                <option value="all">All Lifecycles</option>
                <option value="Submitted">Submitted (New)</option>
                <option value="Under Review">Under Review</option>
                <option value="Verified">Verified</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="text-slate-500 text-[11px] font-medium">
              Showing <strong>{filteredQueue.length}</strong> of {assistanceRequests.length} distress records
            </div>
          </div>

          {/* Queue List */}
          {filteredQueue.length === 0 ? (
            <EmptyState
              title="No Emergency Requests Found"
              description="No distress calls match your selected filters. Adjust your search parameters or check back as updates arrive."
            />
          ) : (
            <div className="space-y-3">
              {filteredQueue.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-navy-950 bg-slate-100 px-2 py-0.5 rounded">
                        {req.id}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-600 font-semibold">{req.district}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-500">{new Date(req.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <UrgencyBadge urgency={req.urgency} />
                      <RequestStatusBadge status={req.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="md:col-span-2 space-y-2">
                      <h4 className="font-bold text-sm text-slate-900">
                        {req.emergencyType} Distress &bull; {req.locality}
                      </h4>
                      <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {req.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-slate-500 pt-1 text-[11px]">
                        <span>Contact: <strong className="text-slate-800">{req.contactName}</strong> ({req.phone})</span>
                        <span>&bull;</span>
                        <span>People: <strong className="text-slate-800">{req.peopleCount}</strong></span>
                        {req.assignedResponder && (
                          <>
                            <span>&bull;</span>
                            <span className="text-blue-700 font-semibold">Assigned: {req.assignedResponder}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-start md:items-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                      {/* AI Urgency Suggestion Badge */}
                      {req.aiUrgencySuggestion && (
                        <div className="text-[10px] bg-slate-50 p-2 rounded border border-slate-200 text-left w-full">
                          <span className="font-bold text-slate-500 uppercase">AI Recommendation:</span>
                          <p className="font-bold text-navy-900">{req.aiUrgencySuggestion}</p>
                          <p className="text-slate-500 text-[9px] line-clamp-1">{req.aiSuggestionReason}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-auto">
                        {req.verificationStatus !== 'Verified' && (
                          <button
                            onClick={() => handleVerifyRequest(req.rawId || req.id, 'Verified')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200"
                          >
                            Verify Incident
                          </button>
                        )}

                        <button
                          onClick={() => setAssignModal({ requestId: req.rawId || req.id, selectedResponder: '', note: '' })}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-xs border border-indigo-200"
                        >
                          Assign Unit
                        </button>

                        <button
                          onClick={() => setStatusModal({ requestId: req.rawId || req.id, newStatus: req.status, note: '' })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                        >
                          Status
                        </button>

                        <Link
                          to={`/request/${req.rawId || req.id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs flex items-center gap-1"
                        >
                          <span>Full View</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCIDENT MAP */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Live Andhra Pradesh Incident Coordinates</h3>
              <p className="text-xs text-slate-500">Spatial distribution of real-time citizen rescue calls across Andhra Pradesh.</p>
            </div>
            <span className="text-xs font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold border border-red-200">
              {assistanceRequests.length} Logged Incidents
            </span>
          </div>
          <div className="h-[550px] rounded-xl overflow-hidden border border-slate-200">
            <DisasterMap />
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & TELEMETRY */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-400">Response Lifecycle Breakdown</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Submitted (Awaiting Triage):</span>
                  <span className="font-mono font-bold text-orange-600">{stats.awaitingAcknowledgment}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Active Field Dispatches:</span>
                  <span className="font-mono font-bold text-blue-600">{stats.activeAssignments}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Resolved & Safe:</span>
                  <span className="font-mono font-bold text-emerald-600">{stats.resolvedCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Total Recorded Requests:</span>
                  <span className="font-mono font-bold text-slate-800">{stats.totalRequests}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-400">Urgency Distribution</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-red-700 font-semibold">Critical Threat:</span>
                  <span className="font-mono font-bold text-red-600">{stats.criticalCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-amber-700 font-semibold">High Priority:</span>
                  <span className="font-mono font-bold text-amber-600">{stats.highPriorityCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-blue-700">Moderate / Low:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {Math.max(0, stats.totalRequests - stats.highPriorityCount - stats.criticalCount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-400">Shelter Network Capacity</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Active Shelters:</span>
                  <span className="font-mono font-bold text-slate-800">{shelters.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Total Bed Capacity:</span>
                  <span className="font-mono font-bold text-slate-800">{stats.totalCapacity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Current Occupants:</span>
                  <span className="font-mono font-bold text-blue-700">{stats.totalOccupants.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SHELTER MANAGEMENT */}
      {activeTab === 'shelters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Oversee active relief camps, cyclone shelters, and evacuation hubs in Andhra Pradesh.</p>
            <button
              onClick={() => setNewShelterModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Relief Shelter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shelters.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>{s.location || `${s.locality}, ${s.district}`}</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {s.status}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <strong className="text-slate-800">{s.capacity} persons</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Occupants:</span>
                    <strong className="text-slate-800">{s.currentOccupants}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Helpline:</span>
                    <strong className="text-slate-800">{s.helpline || '1070'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: OFFICER PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-navy-900 text-amber-400 flex items-center justify-center font-bold text-2xl shadow-md">
              {currentUser?.full_name?.charAt(0) || 'G'}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Pre-Provisioned Government Official</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{currentUser?.full_name}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {currentUser?.title_or_designation || 'District Disaster Management Officer'} &bull; {currentUser?.district || 'Andhra Pradesh'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Official Email</span>
              <p className="font-semibold text-slate-800">{currentUser?.email}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Contact Helpline</span>
              <p className="font-semibold text-slate-800">{currentUser?.phone || '1070'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Assigned Role</span>
              <p className="font-semibold text-navy-900 uppercase">{currentUser?.role}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Account Status</span>
              <p className="font-bold text-emerald-700 uppercase">{currentUser?.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Assign Responder Unit</h3>
              <button onClick={() => setAssignModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Response Battalion / NGO</label>
                <select
                  required
                  value={assignModal.selectedResponder}
                  onChange={(e) => setAssignModal({ ...assignModal, selectedResponder: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  <option value="">Choose Unit...</option>
                  <option value="SDRF 3rd Battalion (Vijayawada)">SDRF 3rd Battalion (Vijayawada)</option>
                  <option value="NDRF 10th Battalion (Guntur / Krishna)">NDRF 10th Battalion (Guntur / Krishna)</option>
                  <option value="AP Fire & Emergency Services">AP Fire & Emergency Services</option>
                  <option value="Coastal Humanitarian Relief Unit">Coastal Humanitarian Relief Unit</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operational Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Deploy inflatable motorized raft; priority evacuation for infant."
                  value={assignModal.note}
                  onChange={(e) => setAssignModal({ ...assignModal, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-navy-900 text-white font-semibold"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Update Incident Lifecycle Status</h3>
              <button onClick={() => setStatusModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Response Status</label>
                <select
                  value={statusModal.newStatus}
                  onChange={(e) => setStatusModal({ ...statusModal, newStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Verified">Verified</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Log Note</label>
                <textarea
                  rows={2}
                  placeholder="Reason or operational milestone for status update..."
                  value={statusModal.note}
                  onChange={(e) => setStatusModal({ ...statusModal, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-navy-900 text-white font-semibold"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Shelter Modal */}
      {newShelterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Register Relief Shelter</h3>
              <button onClick={() => setNewShelterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShelter} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shelter / Camp Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APSDMA Multi-purpose Cyclone Shelter"
                  value={newShelter.name}
                  onChange={(e) => setNewShelter({ ...newShelter, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District</label>
                  <select
                    value={newShelter.district}
                    onChange={(e) => setNewShelter({ ...newShelter, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  >
                    {AP_DISTRICTS.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Locality</label>
                  <input
                    type="text"
                    placeholder="e.g. Bhavani Island Road"
                    value={newShelter.locality}
                    onChange={(e) => setNewShelter({ ...newShelter, locality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={newShelter.capacity}
                    onChange={(e) => setNewShelter({ ...newShelter, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Helpline Phone</label>
                  <input
                    type="text"
                    value={newShelter.helpline_phone}
                    onChange={(e) => setNewShelter({ ...newShelter, helpline_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewShelterModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Register Shelter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
