import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { AP_DISTRICTS } from '../data/districts';
import { ASSISTANCE_CATEGORIES, REQUEST_STATUSES, URGENCY_LEVELS } from '../data/assistanceCategories';
import { RequestStatusBadge, UrgencyBadge, AssistanceCategoryBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import DisasterMap from '../components/map/DisasterMap';
import {
  UserCheck,
  LifeBuoy,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Send,
  MessageSquare,
  Search,
  Filter,
  MapPin,
  Users,
  Compass,
  AlertTriangle,
  RotateCcw,
  Building2,
  ExternalLink,
  ChevronDown,
  X,
  LogOut,
  User,
  ShieldAlert
} from 'lucide-react';

export default function ResponderPortalPage() {
  const {
    assistanceRequests,
    shelters,
    currentUser,
    acknowledgeRequest,
    assignRequest,
    updateRequestStatus,
    addRequestNote,
    stats,
    logout
  } = useCrisis();

  const navigate = useNavigate();

  // Active view tab: 'all' | 'awaiting' | 'my-assignments' | 'map' | 'profile'
  const [activeTab, setActiveTab] = useState('all');

  // Filters
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected note modal
  const [noteModal, setNoteModal] = useState(null); // { requestId, noteText: '' }
  const [newNoteText, setNewNoteText] = useState('');

  const responderOrg = currentUser?.organization_name || currentUser?.full_name || 'Operational Response Unit';
  const isApproved = currentUser?.status === 'active';

  // Filter queue
  const filteredRequests = useMemo(() => {
    return assistanceRequests.filter((req) => {
      // Tab filter
      if (activeTab === 'awaiting' && req.status !== 'Submitted') return false;
      if (activeTab === 'my-assignments' && req.assignedResponder !== responderOrg) return false;

      // Status filter
      if (filterStatus !== 'all' && req.status !== filterStatus) return false;

      // Urgency filter
      if (filterUrgency && req.urgency !== filterUrgency) return false;

      // District filter
      if (filterDistrict && req.district !== filterDistrict) return false;

      // Category filter
      if (filterCategory && !req.assistanceCategories?.includes(filterCategory)) return false;

      // Search query
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
  }, [assistanceRequests, activeTab, filterStatus, filterUrgency, filterDistrict, filterCategory, searchQuery, responderOrg]);

  const handleClaimAssignment = (requestId, currentAssigned) => {
    if (!isApproved) {
      alert('Your organization account is awaiting administrator review and approval before field dispatches can be claimed.');
      return;
    }
    if (currentAssigned && currentAssigned !== responderOrg) {
      if (!window.confirm(`This request is already claimed by ${currentAssigned}. Re-assign to your unit (${responderOrg})?`)) {
        return;
      }
    }
    assignRequest(requestId, responderOrg, `Assignment claimed by ${currentUser?.full_name || 'Unit Member'} (${responderOrg})`);
  };

  const handleSaveNote = () => {
    if (!noteModal || !newNoteText.trim()) return;
    addRequestNote(noteModal.requestId, newNoteText);
    setNoteModal(null);
    setNewNoteText('');
  };

  const clearFilters = () => {
    setFilterDistrict('');
    setFilterUrgency('');
    setFilterCategory('');
    setFilterStatus('all');
    setSearchQuery('');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Organization Profile Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Users className="w-3.5 h-3.5" />
            <span>NGO & Relief Organization Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentUser?.organization_name || 'Field Assistance & Dispatch Portal'}
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 max-w-2xl leading-relaxed">
            Representative: <strong>{currentUser?.full_name}</strong> {currentUser?.title_or_designation ? `(${currentUser.title_or_designation})` : ''} &bull; Operational Base: <strong>{currentUser?.district || 'Andhra Pradesh'}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm ${
            isApproved
              ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/40'
              : 'bg-amber-950/40 text-amber-200 border border-amber-400/40'
          }`}>
            <ShieldCheck className="w-4 h-4" />
            <span>{isApproved ? 'Status: Approved & Active' : 'Status: Pending Verification'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-navy-950/60 hover:bg-navy-950 text-white text-xs font-semibold border border-navy-800 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Pending / Restricted Organization Guard */}
      {!isApproved ? (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {currentUser?.status === 'rejected'
                ? 'Organization Registration Application Rejected'
                : currentUser?.status === 'suspended'
                ? 'Responder Account Suspended'
                : 'Organization Application Pending State Administrator Approval'}
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              {currentUser?.status === 'rejected'
                ? 'Your relief organization registration application was reviewed and rejected by the AP State Disaster Management Authority.'
                : currentUser?.status === 'suspended'
                ? 'Your responder access has been suspended by an administrator. Please contact state disaster coordination.'
                : `Thank you for registering "${responderOrg}". In accordance with AP State Disaster Management security protocols, NGO accounts start in pending status. Field assistance queues, dispatch assignments, and emergency management operations remain restricted until an authorized state administrator verifies and activates your organization profile.`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Representative:</span>
              <span className="font-semibold text-slate-800">{currentUser?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Organization:</span>
              <span className="font-semibold text-slate-800">{responderOrg}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">District:</span>
              <span className="font-semibold text-slate-800">{currentUser?.district || 'Andhra Pradesh'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Application Status:</span>
              <span className="font-bold text-amber-700 uppercase">{currentUser?.status || 'PENDING_APPROVAL'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Check Approval Status</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => { setActiveTab('awaiting'); setFilterStatus('all'); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'awaiting'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-slate-400">Awaiting Acknowledgment</span>
          <p className="text-2xl font-extrabold font-mono mt-1 text-amber-600">{stats.awaitingAcknowledgment}</p>
          <span className="text-[10px] text-slate-400">Needs initial triage</span>
        </div>

        <div
          onClick={() => { setActiveTab('my-assignments'); setFilterStatus('all'); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'my-assignments'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase text-slate-400">My Unit Assignments</span>
          <p className="text-2xl font-extrabold font-mono mt-1 text-blue-600">
            {assistanceRequests.filter(r => r.assignedResponder === responderOrg).length}
          </p>
          <span className="text-[10px] text-slate-400">Claimed by {currentUser?.name}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800">
          <span className="text-[11px] font-bold uppercase text-red-600">Critical Life Threats</span>
          <p className="text-2xl font-extrabold font-mono mt-1 text-red-600">{stats.criticalCount}</p>
          <span className="text-[10px] text-slate-400">Trapped / Immediate rescue</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800">
          <span className="text-[11px] font-bold uppercase text-emerald-600">Resolved Requests</span>
          <p className="text-2xl font-extrabold font-mono mt-1 text-emerald-600">{stats.resolvedCount}</p>
          <span className="text-[10px] text-slate-400">Assistance completed</span>
        </div>
      </div>

      {/* Tab Navigation & Map View Toggle */}
      <div className="flex items-center justify-between border-b border-slate-200 text-xs overflow-x-auto pb-1 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-amber-600 text-amber-800 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All Requests</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
              {assistanceRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('awaiting')}
            className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'awaiting'
                ? 'border-amber-600 text-amber-800 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Awaiting Acknowledgment</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono font-bold">
              {stats.awaitingAcknowledgment}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('my-assignments')}
            className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'my-assignments'
                ? 'border-blue-600 text-blue-800 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Claimed by My Unit</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-mono font-bold">
              {assistanceRequests.filter(r => r.assignedResponder === responderOrg).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'map'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>GIS Map View</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-slate-800 text-navy-950 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-slate-600" />
            <span>Organization Profile</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Shared Session Storage: Active
        </span>
      </div>

      {/* MAP VIEW TAB */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy-950 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Assistance Request Geospatial Distribution (Andhra Pradesh)</span>
            </h3>
            <span className="text-xs text-slate-500">
              Red markers represent Critical SOS requests requiring boats/paramedics
            </span>
          </div>

          <DisasterMap
            incidents={filteredRequests.map(r => ({
              id: r.id,
              title: `${r.emergencyType}: ${r.locality}`,
              type: r.emergencyType?.toLowerCase() || 'flood',
              district: r.district,
              locality: r.address || r.locality,
              coordinates: r.coordinates,
              priority: r.urgency,
              verificationStatus: r.status === 'Submitted' ? 'Unverified' : 'Verified',
              responseStatus: r.status,
              description: r.description
            }))}
            shelters={shelters}
            height="560px"
          />
        </div>
      )}

      {/* LIST VIEW (ALL / AWAITING / MY ASSIGNMENTS) */}
      {activeTab !== 'map' && activeTab !== 'profile' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Search */}
              <div className="relative lg:col-span-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID, name, locality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* District */}
              <div>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">All 26 Districts</option>
                  {AP_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Urgency */}
              <div>
                <select
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">All Urgencies</option>
                  <option value="Critical">Critical Priority</option>
                  <option value="High">High Urgency</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Assistance Category */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">All Needs</option>
                  {ASSISTANCE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Statuses</option>
                  {Object.keys(REQUEST_STATUSES).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results queue */}
          {filteredRequests.length === 0 ? (
            <EmptyState
              title="No Requests Match Filter"
              description="No emergency requests found for the selected district or criteria."
              onReset={clearFilters}
            />
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => {
                const isClaimedByMe = req.assignedResponder === responderOrg;
                const dateFormatted = new Date(req.submittedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short'
                });

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all space-y-4 ${
                      req.urgency === 'Critical' ? 'border-red-300' : 'border-slate-200'
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-navy-950 bg-navy-50 px-2.5 py-1 rounded border border-navy-100">
                          {req.id}
                        </span>
                        <span className="text-slate-400">• Logged: {dateFormatted}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <UrgencyBadge urgency={req.urgency} size="xs" />
                        <RequestStatusBadge status={req.status} size="xs" />
                      </div>
                    </div>

                    {/* Middle details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">
                            {req.emergencyType} Emergency: {req.locality}, {req.district}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>Contact: <strong className="text-slate-800">{req.contactName}</strong> ({req.phone})</span>
                            <span>• People in Need: <strong className="text-slate-800">{req.peopleCount}</strong></span>
                            {req.vulnerableGroups && req.vulnerableGroups.length > 0 && (
                              <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded font-semibold">
                                Includes: {req.vulnerableGroups.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                          {req.description}
                        </p>

                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Requested Assistance Categories:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {req.assistanceCategories?.map(c => (
                              <AssistanceCategoryBadge key={c} categoryId={c} size="xs" />
                            ))}
                          </div>
                        </div>

                        {/* Responder notes list */}
                        {req.notes && req.notes.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Operational Field Notes ({req.notes.length})
                            </span>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                              {req.notes.map(n => (
                                <div key={n.id} className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-xs">
                                  <div className="flex justify-between text-[10px] text-amber-800">
                                    <span className="font-bold">{n.author}</span>
                                    <span>{new Date(n.timestamp).toLocaleTimeString('en-IN')}</span>
                                  </div>
                                  <p className="text-slate-800 mt-0.5">{n.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right column: Location & Action Center */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4">
                        <div className="space-y-2 text-xs">
                          <span className="font-bold text-navy-950 uppercase tracking-wider text-[11px] block">
                            Field Location & GPS
                          </span>
                          <p className="text-slate-600 font-medium">{req.address || req.locality}</p>
                          <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-600">
                            Lat: {req.coordinates?.[0]}<br />Long: {req.coordinates?.[1]}
                          </p>

                          <div className="pt-1">
                            <span className="text-slate-500 block text-[11px]">Assigned Unit:</span>
                            <strong className="text-navy-950 font-semibold block text-xs">
                              {req.assignedResponder || 'Unassigned (Available)'}
                            </strong>
                          </div>
                        </div>

                        {/* Working Demonstration Responder Actions */}
                        <div className="space-y-2 pt-3 border-t border-slate-200">
                          {/* Action 1: Acknowledge */}
                          {req.status === 'Submitted' && (
                            <button
                              onClick={() => acknowledgeRequest(req.id)}
                              className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Acknowledge Request</span>
                            </button>
                          )}

                          {/* Action 2: Claim Assignment */}
                          {(!req.assignedResponder || req.status === 'Acknowledged') && (
                            <button
                              onClick={() => handleClaimAssignment(req.id, req.assignedResponder)}
                              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Accept Assignment ({responderOrg})</span>
                            </button>
                          )}

                          {/* Action 3: Mark Dispatched */}
                          {req.status === 'Assigned to Responder' && (
                            <button
                              onClick={() => updateRequestStatus(req.id, 'Assistance Dispatched', `Rescue team and provisions dispatched from ${responderOrg} base.`)}
                              className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Mark Assistance Dispatched</span>
                            </button>
                          )}

                          {/* Action 4: Mark Delivered */}
                          {req.status === 'Assistance Dispatched' && (
                            <button
                              onClick={() => updateRequestStatus(req.id, 'Assistance Delivered / In Progress', `Team arrived at location. Aid packets delivered and rescue in progress.`)}
                              className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <LifeBuoy className="w-3.5 h-3.5" />
                              <span>Mark Assistance Delivered</span>
                            </button>
                          )}

                          {/* Action 5: Mark Resolved */}
                          {(req.status === 'Assistance Delivered / In Progress' || req.status === 'Assistance Dispatched') && (
                            <button
                              onClick={() => updateRequestStatus(req.id, 'Resolved', `All ${req.peopleCount} individuals safely rescued / provided with requested supplies.`)}
                              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Request Resolved</span>
                            </button>
                          )}

                          {/* Action 6: Add Note modal trigger */}
                          <button
                            onClick={() => {
                              setNoteModal({ requestId: req.id });
                              setNewNoteText('');
                            }}
                            className="w-full py-1.5 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                            <span>Add Field Note</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ORGANIZATION PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy-950">Organization Profile & Authorization Status</h2>
                <p className="text-xs text-slate-500">AP State Disaster Response Unit Registration</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Organization Name</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{currentUser?.organization_name || 'N/A'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Authorization Status</p>
                <p className={`font-bold text-sm mt-0.5 uppercase ${isApproved ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isApproved ? 'Approved & Active' : 'Pending Verification'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Representative</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{currentUser?.full_name}</p>
                <p className="text-slate-500 text-[11px]">{currentUser?.title_or_designation || 'Field Representative'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Operational Base District</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{currentUser?.district || 'Andhra Pradesh'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Official Email</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{currentUser?.email}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Contact Phone</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{currentUser?.phone || 'Not recorded'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Field Dispatch Permissions</span>
              </p>
              <p className="text-amber-900 leading-relaxed">
                {isApproved
                  ? 'Your unit is active and authorized to accept emergency assistance calls, dispatch rescue boats, deliver food/water, and update tracking statuses across Andhra Pradesh.'
                  : 'Your organization credentials are currently under administrative review by the AP State Disaster Management Authority (APSDMA). Response dispatch features are restricted until an administrator activates your account.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FIELD NOTE MODAL */}
      {noteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>Add Responder Field Note (#{noteModal.requestId})</span>
              </h3>
              <button onClick={() => setNoteModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Post an operational update for this request. Citizen and administration dashboards will update in real-time.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Inflatable motorized boat arrived at 2nd cross street. Evacuating elderly citizen and infant first..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setNoteModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
              >
                Save Field Note
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
