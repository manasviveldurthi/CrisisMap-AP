import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import MetricCard from '../components/common/MetricCard';
import DisasterMap from '../components/map/DisasterMap';
import { PriorityBadge, VerificationBadge, ResponseStatusBadge, DisasterTypeBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { AP_DISTRICTS } from '../data/districts';
import { DISASTER_TYPES } from '../data/disasterTypes';
import {
  Search,
  Filter,
  FilePlus,
  Table,
  Grid,
  ExternalLink,
  MapPin,
  Clock,
  RefreshCw,
  AlertOctagon,
  ShieldCheck,
  HelpCircle,
  Building2,
  Calendar,
  Layers,
  UserCheck,
  Send,
  Camera,
  CheckCircle2,
  PhoneCall,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';

export default function UserDashboardPage() {
  const { incidents, shelters, myReports, stats, addIncident } = useCrisis();

  // Active Tab: 'overview' | 'my-reports' | 'map' | 'shelters' | 'report'
  const [activeTab, setActiveTab] = useState('overview');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedVerification, setSelectedVerification] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  // Quick Report Form State
  const [quickReportOpen, setQuickReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    type: 'flood',
    district: 'NTR (Vijayawada)',
    locality: '',
    priority: 'High',
    description: '',
    latitude: '16.5062',
    longitude: '80.6480',
  });
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState(null);

  // Shelters search inside User Dashboard
  const [shelterSearch, setShelterSearch] = useState('');
  const [shelterDistrict, setShelterDistrict] = useState('');

  // Handle District selection for Quick Report
  const handleDistrictChange = (districtName) => {
    const found = AP_DISTRICTS.find(d => d.name === districtName);
    if (found && found.coordinates) {
      setReportForm(prev => ({
        ...prev,
        district: districtName,
        latitude: found.coordinates[0].toFixed(4),
        longitude: found.coordinates[1].toFixed(4),
      }));
    } else {
      setReportForm(prev => ({ ...prev, district: districtName }));
    }
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!reportForm.title.trim() || !reportForm.locality.trim() || !reportForm.description.trim()) {
      setReportError('Please fill in title, locality, and description.');
      return;
    }
    setReportError('');

    const newInc = addIncident({
      title: reportForm.title,
      type: reportForm.type,
      district: reportForm.district,
      locality: reportForm.locality,
      priority: reportForm.priority,
      coordinates: [parseFloat(reportForm.latitude), parseFloat(reportForm.longitude)],
      description: reportForm.description,
      reporterName: 'Public Citizen (User Dashboard)',
    });

    setReportSuccess(newInc);
    setReportForm({
      title: '',
      type: 'flood',
      district: 'NTR (Vijayawada)',
      locality: '',
      priority: 'High',
      description: '',
      latitude: '16.5062',
      longitude: '80.6480',
    });
  };

  // Filtered public incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = incident.title?.toLowerCase().includes(q);
        const matchesDesc = incident.description?.toLowerCase().includes(q);
        const matchesLoc = incident.locality?.toLowerCase().includes(q);
        const matchesId = incident.id?.toLowerCase().includes(q);
        const matchesDistrict = incident.district?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesId && !matchesDistrict) {
          return false;
        }
      }

      if (selectedDistrict && incident.district !== selectedDistrict) {
        return false;
      }
      if (selectedType && incident.type !== selectedType) {
        return false;
      }
      if (selectedVerification && incident.verificationStatus !== selectedVerification) {
        return false;
      }

      return true;
    });
  }, [incidents, searchQuery, selectedDistrict, selectedType, selectedVerification]);

  // Filtered shelters
  const filteredShelters = useMemo(() => {
    return shelters.filter((s) => {
      if (shelterDistrict && s.district !== shelterDistrict) return false;
      if (shelterSearch.trim()) {
        const q = shelterSearch.toLowerCase();
        return (
          s.name?.toLowerCase().includes(q) ||
          s.location?.toLowerCase().includes(q) ||
          s.facilities?.some((f) => f.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [shelters, shelterSearch, shelterDistrict]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('');
    setSelectedType('');
    setSelectedVerification('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* User Dashboard Header & Role Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Citizen Disaster Dashboard
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Public Citizen Portal</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time Andhra Pradesh community incident telemetry, live hazard map, shelter locator, and personal submission tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setQuickReportOpen(!quickReportOpen);
              setReportSuccess(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-700/20 hover:-translate-y-0.5 transition-all"
          >
            <FilePlus className="w-4 h-4" />
            <span>{quickReportOpen ? 'Close Report Form' : 'Report an Incident'}</span>
          </button>

          <Link
            to="/admin-dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs border border-navy-700 transition-all"
            title="Switch to Admin Dashboard"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Admin Operations View</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Reports"
          value={stats.totalIncidents}
          subtitle="Community Stream"
          icon={AlertOctagon}
          variant="default"
        />

        <MetricCard
          title="Verified Alerts"
          value={stats.verifiedCount}
          subtitle="Admin Confirmed"
          icon={ShieldCheck}
          variant="emerald"
        />

        <MetricCard
          title="Unverified"
          value={stats.unverifiedCount}
          subtitle="Awaiting Review"
          icon={HelpCircle}
          variant="amber"
        />

        <MetricCard
          title="My Reports"
          value={myReports.length}
          subtitle="In this browser"
          badgeText={myReports.length > 0 ? `${myReports.length} logged` : 'None yet'}
          icon={UserCheck}
          variant="blue"
          onClick={() => setActiveTab('my-reports')}
        />

        <MetricCard
          title="Active Shelters"
          value={stats.activeShelters}
          subtitle={`Capacity: ${stats.totalCapacity.toLocaleString()}`}
          icon={Building2}
          variant="default"
          onClick={() => setActiveTab('shelters')}
        />
      </div>

      {/* Collapsible Quick Report Form */}
      {quickReportOpen && (
        <div className="bg-white rounded-2xl border-2 border-red-200 p-6 sm:p-8 shadow-lg space-y-5 animate-slideDown">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <FilePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Rapid Citizen Incident Report
                </h3>
                <p className="text-[11px] text-slate-500">
                  Submissions appear immediately in <strong>My Reports</strong>, the public incident list, and the map.
                </p>
              </div>
            </div>
            <button
              onClick={() => setQuickReportOpen(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          {reportSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Incident Logged in Local Demo Storage! (ID: {reportSuccess.id})</span>
              </div>
              <p className="text-xs text-emerald-800">
                Your report has been marked as <strong>Unverified</strong> and is now live on your user dashboard and interactive map.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    setReportSuccess(null);
                    setActiveTab('my-reports');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold text-xs"
                >
                  View in My Reports
                </button>
                <button
                  onClick={() => setReportSuccess(null)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold text-xs"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleQuickSubmit} className="space-y-4 text-xs">
              {reportError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
                  {reportError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Incident Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flash Flood Waterlogging near Kanaka Durga Ghat"
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Disaster Category
                  </label>
                  <select
                    value={reportForm.type}
                    onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  >
                    {DISASTER_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Andhra Pradesh District
                  </label>
                  <select
                    value={reportForm.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  >
                    {AP_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Locality / Landmark <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Benz Circle Service Road"
                    value={reportForm.locality}
                    onChange={(e) => setReportForm({ ...reportForm, locality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Incident Description & Situation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe flood depth, damaged causeway, stranded families, or needed relief supplies..."
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-600"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-400">
                  *New reports are assigned status "Unverified" and stored in your browser's localStorage.
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-md"
                >
                  Submit Incident to Dashboard
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Navigation Sub-Tabs on User Dashboard */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-t-xl font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-navy-900 text-navy-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-navy-700" />
          <span>Incident Reports & Map</span>
        </button>

        <button
          onClick={() => setActiveTab('my-reports')}
          className={`px-4 py-2.5 rounded-t-xl font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'my-reports'
              ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span>My Reports</span>
          <span className="px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 font-mono text-[11px]">
            {myReports.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('shelters')}
          className={`px-4 py-2.5 rounded-t-xl font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'shelters'
              ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Relief Shelters</span>
          <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[11px]">
            {shelters.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`px-4 py-2.5 rounded-t-xl font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'safety'
              ? 'border-amber-600 text-amber-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Emergency Guidelines</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. OVERVIEW & MAP */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Integrated Interactive Disaster Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>Geospatial Awareness Map (Andhra Pradesh)</span>
              </h2>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Click any marker for report details & status
              </span>
            </div>
            <DisasterMap
              incidents={filteredIncidents}
              shelters={shelters}
              selectedDistrict={selectedDistrict}
              selectedType={selectedType}
              height="440px"
            />
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search incidents by keyword or locality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto text-xs">
                {/* District */}
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  <option value="">All 26 Districts</option>
                  {AP_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>

                {/* Type */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  <option value="">All Categories</option>
                  {DISASTER_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>

                {/* Verification */}
                <select
                  value={selectedVerification}
                  onChange={(e) => setSelectedVerification(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  <option value="">All Statuses</option>
                  <option value="Verified">Verified</option>
                  <option value="Unverified">Unverified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                  className="p-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                  title="Toggle View Mode"
                >
                  {viewMode === 'table' ? <Grid className="w-4 h-4" /> : <Table className="w-4 h-4" />}
                </button>

                {(searchQuery || selectedDistrict || selectedType || selectedVerification) && (
                  <button
                    onClick={clearFilters}
                    className="p-2 rounded-xl bg-red-50 text-red-600 text-xs hover:bg-red-100"
                    title="Reset Filters"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Incidents List (Table or Card View) */}
          {filteredIncidents.length === 0 ? (
            <EmptyState
              title="No Incidents Found"
              description="No reports match your selected criteria. Try resetting filters."
              onReset={clearFilters}
            />
          ) : viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Incident ID & Date</th>
                      <th className="px-4 py-3.5">Category & Title</th>
                      <th className="px-4 py-3.5">District / Locality</th>
                      <th className="px-4 py-3.5">Priority</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIncidents.map((incident) => {
                      const dateFormatted = new Date(incident.reportedAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <tr key={incident.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-navy-900 block">
                              {incident.id}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {dateFormatted}
                            </span>
                            {incident.isUserCreated && (
                              <span className="inline-block mt-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-semibold border border-blue-200">
                                My Submission
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 max-w-xs">
                            <div className="mb-1">
                              <DisasterTypeBadge type={incident.type} size="xs" />
                            </div>
                            <p className="font-bold text-slate-900 truncate">{incident.title}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{incident.description}</p>
                          </td>

                          <td className="px-4 py-3.5 max-w-[180px]">
                            <p className="font-semibold text-slate-800 truncate">{incident.district}</p>
                            <p className="text-[11px] text-slate-500 truncate">{incident.locality}</p>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <PriorityBadge priority={incident.priority} size="xs" />
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <VerificationBadge status={incident.verificationStatus} size="xs" />
                          </td>

                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <Link
                              to={`/incident/${incident.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-50 hover:bg-navy-900 text-navy-800 hover:text-white font-semibold text-[11px] transition-colors"
                            >
                              <span>Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-navy-800 bg-navy-50 px-2 py-0.5 rounded">
                        {incident.id}
                      </span>
                      <PriorityBadge priority={incident.priority} size="xs" />
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        <DisasterTypeBadge type={incident.type} size="xs" />
                        <VerificationBadge status={incident.verificationStatus} size="xs" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {incident.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {incident.description}
                    </p>

                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{incident.locality}, {incident.district}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <ResponseStatusBadge status={incident.responseStatus} size="xs" />
                    <Link
                      to={`/incident/${incident.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. MY REPORTS SECTION */}
      {activeTab === 'my-reports' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <UserCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Personal Submission Tracking (This Browser)</h3>
                <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                  These records were submitted from your device. When an administrator verifies, rejects, or dispatches
                  units to your report, the status updates live below and in your browser's <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">localStorage</code>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setQuickReportOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 flex-shrink-0"
            >
              <FilePlus className="w-4 h-4" />
              <span>Report New Incident</span>
            </button>
          </div>

          {myReports.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FilePlus className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Reports Submitted Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You haven't logged any demonstration incidents in this browser yet. Use the "Report an Incident" form to test
                how reports are tracked, mapped, and audited!
              </p>
              <button
                onClick={() => setQuickReportOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <FilePlus className="w-4 h-4" />
                <span>Submit Your First Demonstration Report</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myReports.map((report) => {
                const dateFormatted = new Date(report.reportedAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });

                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-navy-950 bg-navy-50 px-2.5 py-1 rounded border border-navy-100">
                          {report.id}
                        </span>
                        <span className="text-slate-400">• My Submission</span>
                      </div>
                      <PriorityBadge priority={report.priority} size="xs" />
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <DisasterTypeBadge type={report.type} size="xs" />
                        <VerificationBadge status={report.verificationStatus} size="xs" />
                        <ResponseStatusBadge status={report.responseStatus} size="xs" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {report.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {report.description}
                    </p>

                    <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Location:</span>
                        <strong className="text-slate-700">{report.locality}, {report.district}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Submitted at:</span>
                        <span>{dateFormatted}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Coordinates:</span>
                        <span className="font-mono">{report.coordinates?.[0]}, {report.coordinates?.[1]}</span>
                      </div>
                    </div>

                    {/* Moderation status note */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                      <span>Status: <strong>{report.verificationStatus}</strong> ({report.responseStatus || 'Reported'})</span>
                      <Link
                        to={`/incident/${report.id}`}
                        className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Full Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. SHELTERS DIRECTORY */}
      {activeTab === 'shelters' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search shelter name or facility (e.g. RO water, generator)..."
                value={shelterSearch}
                onChange={(e) => setShelterSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
            </div>

            <select
              value={shelterDistrict}
              onChange={(e) => setShelterDistrict(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="">All Districts ({shelters.length} Shelters)</option>
              {AP_DISTRICTS.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredShelters.map((shelter) => {
              const occupancyPct = Math.min(
                100,
                Math.round((shelter.currentOccupants / shelter.capacity) * 100)
              );
              return (
                <div
                  key={shelter.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {shelter.id}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {shelter.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {shelter.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{shelter.location}, {shelter.district}</span>
                    </p>

                    {/* Progress bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Capacity:</span>
                        <strong className="text-slate-800">
                          {shelter.currentOccupants} / {shelter.capacity} ({occupancyPct}%)
                        </strong>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${occupancyPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {shelter.facilities?.map((f, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">Helpline: <strong>112 / 1070</strong></span>
                    <Link
                      to="/map"
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Locate on Map →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. SAFETY GUIDELINES */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-red-600 uppercase">Emergency Dispatches</span>
              <p className="text-2xl font-mono font-extrabold text-navy-950">112</p>
              <p className="text-xs text-slate-500">Police, Fire & Disaster Rescue</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-amber-600 uppercase">APSDMA State Cell</span>
              <p className="text-2xl font-mono font-extrabold text-amber-600">1070</p>
              <p className="text-xs text-slate-500">State Disaster Operations Center</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-emerald-600 uppercase">Medical Ambulance</span>
              <p className="text-2xl font-mono font-extrabold text-emerald-600">108</p>
              <p className="text-xs text-slate-500">24x7 Ambulance Dispatch</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase">Health Advice Line</span>
              <p className="text-2xl font-mono font-extrabold text-blue-600">104</p>
              <p className="text-xs text-slate-500">Tele-Health & First Aid Advice</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-navy-950 text-base">
              Key Citizen Survival Protocols for Andhra Pradesh
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <h4 className="font-bold text-navy-900">During River / Canal Floods (Godavari & Krishna)</h4>
                <p>Never walk or drive across flooded low-level causeways. Disconnect main electrical breakers before floodwater touches floor level. Boil all drinking water for minimum 1 minute.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <h4 className="font-bold text-navy-900">During Bay of Bengal Cyclones</h4>
                <p>Board up vulnerable windows; stay indoors away from glass panes. Keep cell phones and power banks fully charged in advance. Heed evacuation orders from village revenue officers immediately.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
