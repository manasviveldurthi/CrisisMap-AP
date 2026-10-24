import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { AP_DISTRICTS } from '../data/districts';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Users,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  PhoneCall,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import EmptyState from '../components/common/EmptyState';

export default function SheltersPage() {
  const { shelters, stats } = useCrisis();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Filter shelters
  const filteredShelters = useMemo(() => {
    return shelters.filter((shelter) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = shelter.name?.toLowerCase().includes(q);
        const matchesLoc = shelter.location?.toLowerCase().includes(q);
        const matchesDist = shelter.district?.toLowerCase().includes(q);
        const matchesFacility = shelter.facilities?.some((f) => f.toLowerCase().includes(q));
        if (!matchesName && !matchesLoc && !matchesDist && !matchesFacility) {
          return false;
        }
      }

      if (selectedDistrict && shelter.district !== selectedDistrict) {
        return false;
      }

      return true;
    });
  }, [shelters, searchQuery, selectedDistrict]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Relief Centers & Shelters Directory
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Andhra Pradesh
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulated cyclone shelters, school relief campuses, and civic stadiums across Andhra Pradesh.
          </p>
        </div>

        <Link
          to="/map"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs shadow-md transition-all"
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>View All Shelters on Map</span>
        </Link>
      </div>

      {/* Operational Shelters Directory Notice */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex items-start gap-3">
        <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Official Relief Centers & Shelters Directory:
          </p>
          <p className="text-blue-900 leading-relaxed">
            Relief shelters and resource facilities shown below are real records stored in the MySQL database and verified by authorized district coordinators.
            During active disasters, evacuation sites are managed in coordination with the <strong>District Collectorate</strong> and <strong>APSDMA</strong> (Helpline: <strong>1070</strong>).
          </p>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <p className="text-xs text-slate-500 uppercase font-medium">Total Shelters</p>
          <p className="text-2xl font-extrabold text-navy-950 mt-1 font-mono">{stats.totalShelters}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <p className="text-xs text-emerald-600 uppercase font-medium">Active Status</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">{stats.activeShelters}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <p className="text-xs text-slate-500 uppercase font-medium">Combined Capacity</p>
          <p className="text-2xl font-extrabold text-navy-900 mt-1 font-mono">{stats.totalCapacity.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <p className="text-xs text-blue-600 uppercase font-medium">Demo Occupancy</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1 font-mono">{stats.totalOccupants.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Search box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search shelter name, facility (e.g. RO water, generator), or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          {/* District filter */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="">All AP Districts ({shelters.length} shelters)</option>
              {AP_DISTRICTS.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Shelters Grid */}
      {filteredShelters.length === 0 ? (
        <EmptyState
          title="No Registered Relief Shelters Yet"
          description="No official relief shelters or camps have been registered in the database yet. Authorized coordinators can add and verify active relief sites."
          onReset={clearFilters}
          icon={Building2}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShelters.map((shelter) => {
            const occupancyPct = Math.min(
              100,
              Math.round((shelter.currentOccupants / shelter.capacity) * 100)
            );

            return (
              <div
                key={shelter.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {shelter.id}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        shelter.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {shelter.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {shelter.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-700">{shelter.location}, {shelter.district}</span>
                    </p>
                  </div>

                  {/* Occupancy meter */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Occupancy:</span>
                      <span className="font-semibold text-slate-800">
                        {shelter.currentOccupants} / {shelter.capacity} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          occupancyPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Facilities list */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Available Shelter Facilities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {shelter.facilities?.map((f, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{f}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-500">
                    <span>Helpline: </span>
                    <strong className="text-navy-900 font-mono">112 / 1070</strong>
                  </div>

                  <Link
                    to="/map"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>Locate on Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
