import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { RequestStatusBadge, UrgencyBadge, AssistanceCategoryBadge } from '../components/common/Badge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Users,
  ShieldCheck,
  AlertTriangle,
  History,
  MessageSquare,
  CheckCircle2,
  LifeBuoy,
  Send,
  Building2,
  AlertOctagon,
  X
} from 'lucide-react';

const pinIcon = L.divIcon({
  className: 'request-detail-pin',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs">
        SOS
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    assistanceRequests,
    currentUser,
    currentRole,
    acknowledgeRequest,
    assignRequest,
    updateRequestStatus,
    addRequestNote,
    cancelRequest
  } = useCrisis();

  const [noteText, setNoteText] = useState('');
  const [directFetched, setDirectFetched] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search in existing loaded requests
  const contextRequest = useMemo(() => {
    return assistanceRequests.find(r => r.id === id || r.referenceCode === id || String(r.rawId) === id);
  }, [assistanceRequests, id]);

  // Fetch directly from API if not in local context
  useEffect(() => {
    if (!contextRequest && id) {
      setIsLoading(true);
      import('../api/client').then(({ api }) => {
        api.getRequestById(id)
          .then(data => {
            const coords = (data.latitude != null && data.longitude != null)
              ? [Number(data.latitude), Number(data.longitude)]
              : [16.5062, 80.6480];

            setDirectFetched({
              ...data,
              id: data.reference_code,
              rawId: data.id,
              referenceCode: data.reference_code,
              status: data.response_status,
              emergencyType: data.category,
              contactName: data.contact_name,
              phone: data.phone,
              peopleCount: data.people_affected,
              vulnerableGroups: data.vulnerable_groups || [],
              district: data.district,
              locality: data.locality,
              address: data.address,
              coordinates: coords,
              urgency: data.urgency,
              aiUrgencySuggestion: data.ai_urgency_suggestion,
              aiSuggestionReason: data.ai_suggestion_reason,
              description: data.description,
              assistanceCategories: data.assistance_needs || [],
              assignedResponder: data.assigned_responder_name,
              potentialDuplicateOfId: data.potential_duplicate_of_id,
              verificationStatus: data.verification_status,
              submittedAt: data.created_at,
              timeline: (data.timeline_updates || []).map(u => ({
                id: u.id,
                timestamp: u.created_at,
                status: u.new_status,
                actor: `${u.author_name} (${u.author_role})`,
                note: u.note || `Status updated to ${u.new_status}`
              })),
              notes: (data.timeline_updates || []).filter(u => u.note).map(u => ({
                id: `NOTE-${u.id}`,
                timestamp: u.created_at,
                author: u.author_name,
                role: u.author_role,
                text: u.note
              }))
            });
          })
          .catch(err => console.warn('Request fetch error:', err.message))
          .finally(() => setIsLoading(false));
      });
    }
  }, [contextRequest, id]);

  const request = contextRequest || directFetched;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-semibold">Loading emergency request telemetry from operational database...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Request Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          No emergency assistance request with reference ID <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-navy-900 font-bold">{id}</code> was found in the database.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addRequestNote(request.id, noteText);
    setNoteText('');
  };

  const handleCancelClick = () => {
    const reason = window.prompt('Please enter cancellation reason:');
    if (reason !== null) {
      cancelRequest(request.id, reason || 'Cancelled by requester');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back button and context info */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Viewing as:</span>
          <span className="text-xs font-bold text-navy-950 bg-slate-100 px-2 py-0.5 rounded capitalize">
            {currentRole} ({currentUser?.name})
          </span>
        </div>
      </div>

      {/* Main Request Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-navy-950 text-white p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-navy-800 text-red-400 font-bold border border-navy-700">
                {request.id}
              </span>
              <span className="text-slate-400">• Andhra Pradesh Emergency Dispatch</span>
            </div>

            <div className="flex items-center gap-2">
              <UrgencyBadge urgency={request.urgency} />
              <RequestStatusBadge status={request.status} />
            </div>
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {request.emergencyType} Distress — {request.locality}, {request.district}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Contact: <strong className="text-white">{request.contactName}</strong> ({request.phone})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Affected: <strong className="text-white">{request.peopleCount} People</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Logged: {new Date(request.submittedAt).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Details & Situation */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Emergency Situation & Immediate Needs
                </h3>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {request.description}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Required Assistance Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {request.assistanceCategories?.map(c => (
                    <AssistanceCategoryBadge key={c} categoryId={c} />
                  ))}
                </div>
              </div>

              {request.vulnerableGroups && request.vulnerableGroups.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Vulnerable Persons Present
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {request.vulnerableGroups.map((g, i) => (
                      <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo if provided */}
              {request.imageUrl && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Attached Incident Photograph
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-80">
                    <img src={request.imageUrl} alt="Attached Emergency" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Responder / Field Updates Feed */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Responder & Dispatch Updates ({request.notes?.length || 0})</span>
                </h3>

                {request.notes && request.notes.length > 0 ? (
                  <div className="space-y-2">
                    {request.notes.map(n => (
                      <div key={n.id} className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                        <div className="flex justify-between items-center text-[11px] text-amber-900 font-bold">
                          <span>{n.author} ({n.role})</span>
                          <span>{new Date(n.timestamp).toLocaleTimeString('en-IN')}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed">{n.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    No field notes added yet.
                  </p>
                )}

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2 pt-2">
                  <textarea
                    rows={2}
                    placeholder={`Post an operational note as ${currentUser?.name}...`}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-navy-600"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs"
                    >
                      Post Update
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right 1 Col: Location, Map, and Chronological Timeline */}
            <div className="space-y-6">
              {/* Location Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>Location Coordinates</span>
                </h3>

                <div className="text-xs space-y-1 text-slate-700 font-medium">
                  <p><span className="text-slate-400">District:</span> {request.district}</p>
                  <p><span className="text-slate-400">Locality:</span> {request.locality}</p>
                  <p><span className="text-slate-400">Address:</span> {request.address || 'Not specified'}</p>
                  <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-600">
                    Lat: {request.coordinates?.[0]}<br />Long: {request.coordinates?.[1]}
                  </p>
                </div>

                {/* Mini Leaflet Map */}
                {request.coordinates && (
                  <div className="h-44 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                    <MapContainer
                      center={request.coordinates}
                      zoom={13}
                      scrollWheelZoom={false}
                      className="w-full h-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={request.coordinates} icon={pinIcon}>
                        <Popup>
                          <span className="text-xs font-bold">{request.id}: {request.locality}</span>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}
              </div>

              {/* Status and Chronological Timeline */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
                <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Chronological Lifecycle</span>
                </h3>

                <div className="space-y-3 relative pl-3 border-l-2 border-slate-200 text-xs">
                  {request.timeline?.map((ev, i) => (
                    <div key={i} className="relative space-y-0.5">
                      <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shadow-sm"></span>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-800">{ev.status}</span>
                        <span>{new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{ev.note}</p>
                    </div>
                  ))}
                </div>

                {/* Cancel option */}
                {request.status !== 'Resolved' && request.status !== 'Cancelled' && (
                  <div className="pt-3 border-t border-slate-200 text-center">
                    <button
                      onClick={handleCancelClick}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
                    >
                      Cancel Assistance Request
                    </button>
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
