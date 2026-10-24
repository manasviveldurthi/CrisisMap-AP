import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { PriorityBadge, VerificationBadge, DisasterTypeBadge, UrgencyBadge, RequestStatusBadge } from '../common/Badge';
import { ExternalLink, Users, PhoneCall, AlertTriangle, Building2, MapPin, LifeBuoy } from 'lucide-react';
import { AP_BOUNDS, AP_DISTRICTS } from '../../data/districts';

// Helper to create custom icon for Citizen SOS Distress Requests
const createSosIcon = (urgency = 'Critical') => {
  let color = '#dc2626'; // red
  if (urgency === 'High') color = '#ea580c';
  else if (urgency === 'Medium') color = '#d97706';
  else if (urgency === 'Low') color = '#2563eb';

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
      <div class="absolute -inset-1 rounded-full bg-red-500 opacity-75 animate-ping"></div>
      <div style="background-color: ${color};" class="relative z-10 w-7 h-7 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="m4.93 4.93 4.24 4.24"/>
          <path d="m14.83 9.17 4.24-4.24"/>
          <path d="m14.83 14.83 4.24 4.24"/>
          <path d="m9.17 14.83-4.24 4.24"/>
          <circle cx="12" cy="12" r="4"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-sos-pin',
    html: html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Helper to create colored custom HTML markers for incidents
const createIncidentIcon = (priority = 'Medium') => {
  let color = '#d97706'; // default amber
  let pulse = '';

  if (priority === 'Critical') {
    color = '#dc2626';
    pulse = '<div class="absolute -inset-1 rounded-full bg-red-500 opacity-75 animate-ping"></div>';
  } else if (priority === 'High') {
    color = '#ea580c';
  } else if (priority === 'Low') {
    color = '#2563eb';
  }

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
      ${pulse}
      <div style="background-color: ${color};" class="relative z-10 w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-incident-pin',
    html: html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Custom icon for Shelters
const shelterIcon = L.divIcon({
  className: 'custom-shelter-pin',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
      <div class="w-7 h-7 rounded-lg bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

// Component to handle map re-centering when district changes or map is resized
function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 10, { duration: 1.2 });
    }
  }, [center, zoom, map]);

  return null;
}

export default function DisasterMap({
  incidents = [],
  shelters = [],
  sosRequests = [],
  selectedDistrict = '',
  selectedType = '',
  showIncidents = true,
  showShelters = true,
  showSosRequests = true,
  height = '620px',
  initialCenter,
  initialZoom,
}) {
  // Find district center if a specific district is selected
  const activeDistrictObj = useMemo(() => {
    if (!selectedDistrict) return null;
    return AP_DISTRICTS.find(d => d.name === selectedDistrict || d.id === selectedDistrict);
  }, [selectedDistrict]);

  const mapCenter = activeDistrictObj?.coordinates || initialCenter || AP_BOUNDS.center;
  const mapZoom = activeDistrictObj ? 10 : (initialZoom || AP_BOUNDS.defaultZoom);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        minZoom={AP_BOUNDS.minZoom}
        maxZoom={AP_BOUNDS.maxZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={activeDistrictObj?.coordinates} zoom={activeDistrictObj ? 10 : null} />

        {/* Citizen SOS Request Markers */}
        {showSosRequests &&
          sosRequests.map((sos) => {
            if (!sos.coordinates || sos.coordinates.length !== 2) return null;
            return (
              <Marker
                key={sos.id}
                position={sos.coordinates}
                icon={createSosIcon(sos.urgency)}
              >
                <Popup className="sos-popup">
                  <div className="p-3 max-w-[280px]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        {sos.id}
                      </span>
                      <UrgencyBadge urgency={sos.urgency} size="xs" />
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-red-600 text-white rounded">
                        CITIZEN SOS
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {sos.contactName} ({sos.peopleCount} {sos.peopleCount === 1 ? 'person' : 'people'})
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 line-clamp-2 mb-2 leading-relaxed">
                      {sos.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-2">
                      <RequestStatusBadge status={sos.status} size="xs" />
                    </div>

                    <div className="text-[10px] text-slate-500 mb-2.5 pb-2 border-b border-slate-100 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{sos.locality}, {sos.district}</span>
                    </div>

                    <Link
                      to={`/request/${sos.id}`}
                      className="inline-flex items-center justify-center gap-1 w-full py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors shadow-sm"
                    >
                      <span>Track SOS Lifecycle</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}


        {/* Incident Markers */}
        {showIncidents &&
          incidents.map((incident) => {
            if (!incident.coordinates || incident.coordinates.length !== 2) return null;
            return (
              <Marker
                key={incident.id}
                position={incident.coordinates}
                icon={createIncidentIcon(incident.priority)}
              >
                <Popup className="disaster-popup">
                  <div className="p-3 max-w-[280px]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-mono font-bold text-navy-800 bg-navy-50 px-1.5 py-0.5 rounded">
                        {incident.id}
                      </span>
                      <PriorityBadge priority={incident.priority} size="xs" />
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs leading-snug mb-1">
                      {incident.title}
                    </h4>

                    <div className="flex flex-wrap gap-1 mb-2">
                      <DisasterTypeBadge type={incident.type} size="xs" />
                      <VerificationBadge status={incident.verificationStatus} size="xs" />
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                      {incident.description}
                    </p>

                    <div className="text-[10px] text-slate-500 mb-2.5 pb-2 border-b border-slate-100 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{incident.locality}, {incident.district}</span>
                    </div>

                    <Link
                      to={`/incident/${incident.id}`}
                      className="inline-flex items-center justify-center gap-1 w-full py-1.5 px-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-[11px] font-semibold transition-colors"
                    >
                      <span>Full Incident Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Shelter Markers */}
        {showShelters &&
          shelters.map((shelter) => {
            if (!shelter.coordinates || shelter.coordinates.length !== 2) return null;
            return (
              <Marker
                key={shelter.id}
                position={shelter.coordinates}
                icon={shelterIcon}
              >
                <Popup className="shelter-popup">
                  <div className="p-3 max-w-[280px]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        RELIEF SHELTER
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {shelter.district}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs leading-snug mb-1">
                      {shelter.name}
                    </h4>

                    <div className="text-[11px] text-slate-600 mb-2">
                      <span className="font-semibold text-slate-700">Capacity:</span> {shelter.currentOccupants} / {shelter.capacity} citizens
                    </div>

                    <div className="mb-2">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((shelter.currentOccupants / shelter.capacity) * 100))}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 pb-2 border-b border-slate-100">
                      {shelter.location}
                    </div>

                    <p className="text-[10px] text-amber-700 mt-2 bg-amber-50 p-1.5 rounded border border-amber-200">
                      *Demonstration shelter simulation. In real emergency dial 112 / 1070.
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
