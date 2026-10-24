import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Calendar
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import MetricCard from '../components/common/MetricCard';
import { PriorityBadge, VerificationBadge, ResponseStatusBadge, DisasterTypeBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { AP_DISTRICTS } from '../data/districts';
import { DISASTER_TYPES } from '../data/disasterTypes';

export default function DashboardPage() {
  const { incidents, stats } = useCrisis();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedVerification, setSelectedVerification] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  // Apply filters
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // Search filter
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

      // District filter
      if (selectedDistrict && incident.district !== selectedDistrict) {
        return false;
      }

      // Type filter
      if (selectedType && incident.type !== selectedType) {
        return false;
      }

      // Priority filter
      if (selectedPriority && incident.priority !== selectedPriority) {
        return false;
      }

      // Verification filter
      if (selectedVerification && incident.verificationStatus !== selectedVerification) {
        return false;
      }

      return true;
    });
  }, [incidents, searchQuery, selectedDistrict, selectedType, selectedPriority, selectedVerification]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('');
    setSelectedType('');
    setSelectedPriority('');
    setSelectedVerification('');
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedDistrict || selectedType || selectedPriority || selectedVerification
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Disaster Incident Dashboard
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-800 border border-navy-200">
              Andhra Pradesh
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time aggregate telemetry calculated from simulated records and citizen browser submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-700/20 transition-all"
          >
            <FilePlus className="w-4 h-4" />
            <span>Report Incident</span>
          </Link>

          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs transition-all"
          >
            <MapPin className="w-4 h-4 text-red-400" />
            <span>Open Map</span>
          </Link>
        </div>
      </div>

      {/* KPI Dynamic Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Incidents"
          value={stats.totalIncidents}
          subtitle="Dynamic Frontend Store"
          badgeText={`${stats.userCreatedCount} User Demo`}
          icon={AlertOctagon}
          variant="default"
        />

        <MetricCard
          title="Verified Incidents"
          value={stats.verifiedCount}
          subtitle="Admin Confirmed"
          icon={ShieldCheck}
          variant="emerald"
        />

        <MetricCard
          title="Unverified Reports"
          value={stats.unverifiedCount}
          subtitle="Pending Review"
          icon={HelpCircle}
          variant="amber"
        />

        <MetricCard
          title="Critical Priority"
          value={stats.criticalCount}
          subtitle="Life Safety Alert"
          icon={AlertOctagon}
          variant="red"
        />

        <MetricCard
          title="Registered Shelters"
          value={stats.totalShelters}
          subtitle={`Capacity: ${stats.totalCapacity.toLocaleString()}`}
          icon={Building2}
          variant="blue"
        />
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, keyword, locality, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent transition-all"
            />
          </div>

          {/* View Mode Toggle and Clear Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-navy-950 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <Table className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-navy-950 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card View"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* District Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter by AP District
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="">All 26 AP Districts ({stats.totalIncidents})</option>
              {AP_DISTRICTS.map((dist) => (
                <option key={dist.id} value={dist.name}>
                  {dist.name}
                </option>
              ))}
            </select>
          </div>

          {/* Incident Type Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Disaster Category
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="">All Categories</option>
              {DISASTER_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Severity / Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical Priority</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low / Minor</option>
            </select>
          </div>

          {/* Verification Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Verification Status
            </label>
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="">All Statuses</option>
              <option value="Verified">Verified by Admin</option>
              <option value="Unverified">Unverified (Citizen Demo)</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>
          Showing <strong className="text-slate-800">{filteredIncidents.length}</strong> of{' '}
          <strong className="text-slate-800">{incidents.length}</strong> total incident records
        </p>
        {hasActiveFilters && (
          <span className="text-amber-600 font-medium">Filtered Results Active</span>
        )}
      </div>

      {/* Empty State */}
      {filteredIncidents.length === 0 ? (
        <EmptyState
          title="No Matching Incidents Found"
          description="There are currently no disaster reports matching the specified district, category, or search keywords."
          onReset={clearFilters}
        />
      ) : viewMode === 'table' ? (
        /* Responsive Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Incident ID & Date</th>
                  <th className="px-4 py-3.5">Category & Title</th>
                  <th className="px-4 py-3.5">Location (AP)</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Verification</th>
                  <th className="px-4 py-3.5">Response</th>
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
                    <tr
                      key={incident.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-navy-900">
                          {incident.id}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{dateFormatted}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="mb-1">
                          <DisasterTypeBadge type={incident.type} size="xs" />
                        </div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors max-w-xs truncate">
                          {incident.title}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="font-semibold text-slate-800 truncate">
                          {incident.district}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {incident.locality}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PriorityBadge priority={incident.priority} size="xs" />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <VerificationBadge status={incident.verificationStatus} size="xs" />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <ResponseStatusBadge status={incident.responseStatus} size="xs" />
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
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIncidents.map((incident) => {
            const dateFormatted = new Date(incident.reportedAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
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
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <DisasterTypeBadge type={incident.type} size="xs" />
                      <VerificationBadge status={incident.verificationStatus} size="xs" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {incident.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {incident.description}
                  </p>

                  <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-700">
                        {incident.locality}, {incident.district}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{dateFormatted}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <ResponseStatusBadge status={incident.responseStatus} size="xs" />
                  <Link
                    to={`/incident/${incident.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>View Report</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
