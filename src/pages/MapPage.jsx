import React, { useState, useMemo } from 'react';
import { useCrisis } from '../context/CrisisContext';
import DisasterMap from '../components/map/DisasterMap';
import MapLegend from '../components/map/MapLegend';
import { AP_DISTRICTS } from '../data/districts';
import { DISASTER_TYPES } from '../data/disasterTypes';
import { MapPin, Filter, RefreshCw, AlertCircle, Building2, Layers, Compass } from 'lucide-react';

export default function MapPage() {
  const { assistanceRequests = [], shelters = [] } = useCrisis();
  const sosRequests = assistanceRequests;
  const incidents = [];

  // Map Filter states
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showSosRequests, setShowSosRequests] = useState(true);
  const [showIncidents, setShowIncidents] = useState(false);
  const [showShelters, setShowShelters] = useState(true);

  // Filter SOS requests for map
  const filteredSosRequests = useMemo(() => {
    return sosRequests.filter((req) => {
      if (selectedDistrict && req.district !== selectedDistrict) return false;
      if (selectedType && req.emergencyType?.toLowerCase() !== selectedType.toLowerCase()) return false;
      if (selectedPriority && req.urgency !== selectedPriority) return false;
      return true;
    });
  }, [sosRequests, selectedDistrict, selectedType, selectedPriority]);

  const filteredIncidents = [];


  // Filter shelters for map
  const filteredShelters = useMemo(() => {
    return shelters.filter((shelter) => {
      if (selectedDistrict && shelter.district !== selectedDistrict) return false;
      return true;
    });
  }, [shelters, selectedDistrict]);

  const clearMapFilters = () => {
    setSelectedDistrict('');
    setSelectedType('');
    setSelectedPriority('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Interactive Disaster Map
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
              Live GIS View
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Geospatial visualization of active disaster incidents and emergency relief shelters across Andhra Pradesh.
          </p>
        </div>

        {/* Quick Tally Chips */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 shadow-sm text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="font-semibold text-red-900">SOS Calls:</span>
            <span className="font-mono font-bold text-red-700">{filteredSosRequests.length}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="font-semibold text-slate-700">Incidents:</span>
            <span className="font-mono font-bold text-navy-900">{filteredIncidents.length}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span className="font-semibold text-slate-700">Shelters:</span>
            <span className="font-mono font-bold text-navy-900">{filteredShelters.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Control Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* District selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Select District (Pans Map)
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="">Entire Andhra Pradesh</option>
              {AP_DISTRICTS.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Incident Category */}
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
              {DISASTER_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Incident Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="">All Priority Levels</option>
              <option value="Critical">Critical Priority</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low / Minor</option>
            </select>
          </div>

          {/* Reset Action */}
          <div className="flex items-end">
            <button
              onClick={clearMapFilters}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Map View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative">
        <DisasterMap
          incidents={filteredIncidents}
          shelters={filteredShelters}
          sosRequests={filteredSosRequests}
          selectedDistrict={selectedDistrict}
          selectedType={selectedType}
          showIncidents={showIncidents}
          showShelters={showShelters}
          showSosRequests={showSosRequests}
          height="660px"
        />

        {/* Floating Legend on Desktop */}
        <div className="absolute bottom-6 right-6 z-[1000] hidden sm:block">
          <MapLegend
            showIncidents={showIncidents}
            setShowIncidents={setShowIncidents}
            showShelters={showShelters}
            setShowShelters={setShowShelters}
            showSosRequests={showSosRequests}
            setShowSosRequests={setShowSosRequests}
          />
        </div>
      </div>

      {/* Mobile Map Legend Below Map */}
      <div className="sm:hidden">
        <MapLegend
          showIncidents={showIncidents}
          setShowIncidents={setShowIncidents}
          showShelters={showShelters}
          setShowShelters={setShowShelters}
          showSosRequests={showSosRequests}
          setShowSosRequests={setShowSosRequests}
        />
      </div>


      {/* Cartographic & Attribution Banner */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-navy-800 flex-shrink-0" />
          <span>
            Map tiles provided by{' '}
            <a
              href="https://www.openstreetmap.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:underline"
            >
              OpenStreetMap
            </a>{' '}
            under ODbL licence. Geocoded coordinates represent Andhra Pradesh regional benchmarks.
          </span>
        </div>
        <span className="font-mono text-[11px] bg-slate-200/70 px-2 py-0.5 rounded text-slate-600">
          AP Center: 15.9129° N, 79.7400° E
        </span>
      </div>
    </div>
  );
}
