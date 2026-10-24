import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { DISASTER_TYPES } from '../data/disasterTypes';
import { PriorityBadge, VerificationBadge, ResponseStatusBadge, DisasterTypeBadge } from '../components/common/Badge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  FileText,
  Share2,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';

// Pin for mini map
const detailPin = L.divIcon({
  className: 'detail-pin',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold">
        !
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { incidents } = useCrisis();

  const incident = useMemo(() => {
    return incidents.find((i) => i.id === id);
  }, [incidents, id]);

  if (!incident) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Incident Record Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          No incident with ID <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-navy-800">{id}</code> was
          found in the demonstration store.
        </p>
        <div className="pt-2">
          <Link
            to="/user-dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-semibold hover:bg-navy-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to User Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const disasterTypeInfo = DISASTER_TYPES.find((d) => d.id === incident.type);

  const dateFormatted = new Date(incident.reportedAt).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Action ribbon */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/admin-dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-800 text-xs font-semibold border border-navy-200 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Manage in Admin Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Incident Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="bg-navy-950 text-white p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-navy-800 text-red-400 font-bold border border-navy-700">
                {incident.id}
              </span>
              <span className="text-slate-400">• Demonstration Record</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={incident.priority} />
              <VerificationBadge status={incident.verificationStatus} />
              <ResponseStatusBadge status={incident.responseStatus} />
            </div>
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {incident.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-400" />
              <span className="font-medium text-white">{incident.locality}, {incident.district}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{dateFormatted}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              <span>Reporter: {incident.reporterName || 'Citizen Report (Demo)'}</span>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Grid: Description & Photo / Mini Map */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Description and details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Incident Description & Situation
                </h3>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                  {incident.description}
                </p>
              </div>

              {incident.casualties && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Reported Impact / Casualties
                  </h3>
                  <p className="text-xs font-semibold text-slate-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    {incident.casualties}
                  </p>
                </div>
              )}

              {/* Photo if provided */}
              {incident.imageUrl && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Attached Incident Photograph
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-96">
                    <img
                      src={incident.imageUrl}
                      alt={incident.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Category-Specific Safety Advice */}
              {disasterTypeInfo && disasterTypeInfo.safetyTips && (
                <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2.5">
                  <h4 className="font-bold text-blue-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                    <span>Official Recommended Safety Precautions for {disasterTypeInfo.label}</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-blue-800 leading-relaxed">
                    {disasterTypeInfo.safetyTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right 1 Col: Mini Map and Geospatial Details */}
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>Geographic Location</span>
                </h3>

                <div className="text-xs space-y-1 text-slate-600 font-medium">
                  <p><span className="text-slate-400">District:</span> {incident.district}</p>
                  <p><span className="text-slate-400">Locality:</span> {incident.locality}</p>
                  <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                    Lat: {incident.coordinates?.[0]}<br />
                    Long: {incident.coordinates?.[1]}
                  </p>
                </div>

                {/* Mini Leaflet Map */}
                {incident.coordinates && incident.coordinates.length === 2 && (
                  <div className="h-48 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                    <MapContainer
                      center={incident.coordinates}
                      zoom={12}
                      scrollWheelZoom={false}
                      className="w-full h-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={incident.coordinates} icon={detailPin}>
                        <Popup>
                          <div className="text-xs p-1">
                            <strong>{incident.id}</strong><br />
                            {incident.locality}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}

                <Link
                  to="/map"
                  className="block text-center py-2 px-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-navy-800 font-semibold text-xs transition-colors"
                >
                  View on Full Andhra Pradesh Map
                </Link>
              </div>

              {/* Status details card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <h3 className="font-bold text-navy-950 uppercase tracking-wider text-[11px]">
                  Verification Lifecycle
                </h3>
                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Status:</span>
                    <VerificationBadge status={incident.verificationStatus} size="xs" />
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Response Team:</span>
                    <ResponseStatusBadge status={incident.responseStatus} size="xs" />
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Persistence:</span>
                    <span className="font-mono text-[10px] text-slate-500">localStorage</span>
                  </div>
                </div>

                {/* Audit Moderation Trail */}
                {incident.history && incident.history.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 mt-2 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Moderation Trail ({incident.history.length})
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {incident.history.map((h, i) => (
                        <div key={i} className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] space-y-0.5">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>{new Date(h.timestamp).toLocaleDateString('en-IN')}</span>
                            <span className="font-semibold text-slate-600">{h.moderator}</span>
                          </div>
                          <p className="font-semibold text-slate-800">{h.action}</p>
                          {h.note && <p className="text-slate-500 text-[10px] italic">"{h.note}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
