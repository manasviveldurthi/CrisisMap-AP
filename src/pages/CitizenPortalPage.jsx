import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { AP_DISTRICTS } from '../data/districts';
import { ASSISTANCE_CATEGORIES, URGENCY_LEVELS, REQUEST_STATUSES } from '../data/assistanceCategories';
import { RequestStatusBadge, UrgencyBadge, AssistanceCategoryBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import DisasterMap from '../components/map/DisasterMap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  LifeBuoy,
  AlertOctagon,
  MapPin,
  Compass,
  Phone,
  PhoneCall,
  Users,
  Camera,
  X,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
  Calendar,
  AlertTriangle,
  Building2,
  Trash2,
  MessageSquare,
  Droplets,
  HeartPulse,
  Utensils,
  RefreshCw,
  FileText,
  User,
  LogOut,
  Save,
  Map as MapIcon
} from 'lucide-react';

// Pin for mini map preview
const sosPin = L.divIcon({
  className: 'sos-pin',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute -inset-1 rounded-full bg-red-500 opacity-75 animate-ping"></div>
      <div class="relative z-10 w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold">
        SOS
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function CitizenPortalPage() {
  const {
    assistanceRequests,
    myRequests,
    currentUser,
    createAssistanceRequest,
    cancelRequest,
    shelters,
    logout,
    updateUserProfile,
    showToast
  } = useCrisis();

  const location = useLocation();
  const navigate = useNavigate();

  // Active view: 'dashboard' | 'sos-form' | 'my-requests' | 'map' | 'shelters' | 'profile'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) return tabParam;
    return params.get('action') === 'sos' ? 'sos-form' : 'dashboard';
  });

  // Emergency Assistance SOS Form State
  const [formData, setFormData] = useState({
    emergencyType: 'Flood',
    contactName: currentUser?.full_name || '',
    phone: currentUser?.phone || '',
    peopleCount: 4,
    vulnerableGroups: ['Children (1)', 'Elderly Person (1)'],
    district: currentUser?.district || 'NTR (Vijayawada)',
    locality: 'Near Singh Nagar Flyover',
    address: currentUser?.registered_address || 'Door No. 12-45/A, 2nd Cross, Vivekananda Nagar, Vijayawada',
    latitude: currentUser?.registered_latitude ? String(currentUser.registered_latitude) : '16.5342',
    longitude: currentUser?.registered_longitude ? String(currentUser.registered_longitude) : '80.6415',
    urgency: 'Critical',
    assistanceCategories: ['rescue', 'water', 'food'],
    description: 'Ground floor submerged in 4 feet water. 4 family members trapped on terrace including 1 elderly person and an infant. Need immediate rescue boat, drinking water cans, and food packets.',
  });

  // Citizen Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: currentUser?.full_name || '',
    phone: currentUser?.phone || '',
    district: currentUser?.district || 'NTR (Vijayawada)',
    registered_address: currentUser?.registered_address || '',
    registered_latitude: currentUser?.registered_latitude || null,
    registered_longitude: currentUser?.registered_longitude || null
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Sync state whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        contactName: currentUser.full_name || prev.contactName,
        phone: currentUser.phone || prev.phone,
        district: currentUser.district || prev.district,
        address: currentUser.registered_address || prev.address,
        latitude: currentUser.registered_latitude ? String(currentUser.registered_latitude) : prev.latitude,
        longitude: currentUser.registered_longitude ? String(currentUser.registered_longitude) : prev.longitude,
      }));
      setProfileForm({
        full_name: currentUser.full_name || '',
        phone: currentUser.phone || '',
        district: currentUser.district || 'NTR (Vijayawada)',
        registered_address: currentUser.registered_address || '',
        registered_latitude: currentUser.registered_latitude || null,
        registered_longitude: currentUser.registered_longitude || null
      });
    }
  }, [currentUser]);

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Check URL query param change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'sos') {
      setActiveTab('sos-form');
    } else if (params.get('tab')) {
      setActiveTab(params.get('tab'));
    }
  }, [location.search]);


  // When district changes, update default coordinates
  const handleDistrictChange = (districtName) => {
    const found = AP_DISTRICTS.find(d => d.name === districtName);
    if (found && found.coordinates) {
      setFormData(prev => ({
        ...prev,
        district: districtName,
        latitude: found.coordinates[0].toFixed(4),
        longitude: found.coordinates[1].toFixed(4),
      }));
    } else {
      setFormData(prev => ({ ...prev, district: districtName }));
    }
  };

  // Toggle assistance category
  const toggleCategory = (catId) => {
    setFormData(prev => {
      const exists = prev.assistanceCategories.includes(catId);
      const updated = exists
        ? prev.assistanceCategories.filter(c => c !== catId)
        : [...prev.assistanceCategories, catId];
      return { ...prev, assistanceCategories: updated };
    });
  };

  // Toggle vulnerable groups
  const toggleVulnerableGroup = (group) => {
    setFormData(prev => {
      const exists = prev.vulnerableGroups.includes(group);
      const updated = exists
        ? prev.vulnerableGroups.filter(g => g !== group)
        : [...prev.vulnerableGroups, group];
      return { ...prev, vulnerableGroups: updated };
    });
  };

  // HTML5 Browser Geolocation with User Permission & Manual Fallback
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      if (showToast) showToast('Geolocation is not supported by your browser. Please enter location manually.', 'warning');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(4),
          longitude: pos.coords.longitude.toFixed(4),
        }));
        setGpsLoading(false);
        if (showToast) showToast('Location detected via device GPS.', 'success');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        if (showToast) showToast('GPS permission denied or unavailable. Manual address fallback is enabled.', 'info');
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size exceeds 5MB limit.' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setErrors(prev => ({ ...prev, image: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.contactName.trim()) errs.contactName = 'Please provide contact name.';
    if (!formData.phone.trim() || formData.phone.length < 10) {
      errs.phone = 'Valid 10-digit Indian phone number is required.';
    }
    if (!formData.district) errs.district = 'Please select Andhra Pradesh district.';
    if (!formData.locality.trim() && !formData.address.trim()) errs.locality = 'Locality or street address is required for rescue teams.';
    if (!formData.description.trim() || formData.description.length < 15) {
      errs.description = 'Please explain your situation (minimum 15 characters).';
    }
    if (formData.assistanceCategories.length === 0) {
      errs.assistanceCategories = 'Select at least one emergency assistance category.';
    }

    // Latitude & longitude are optional if manual district/address is provided
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (isNaN(lat) || lat < 12.0 || lat > 20.0) errs.latitude = 'Latitude must be within Andhra Pradesh (12° to 20° N).';
      if (isNaN(lng) || lng < 76.0 || lng > 85.0) errs.longitude = 'Longitude must be within Andhra Pradesh (76° to 85° E).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Default coordinates to district center if lat/lng are empty
    let finalLat = formData.latitude;
    let finalLng = formData.longitude;
    if (!finalLat || !finalLng) {
      const dist = AP_DISTRICTS.find(d => d.name === formData.district);
      if (dist && dist.coordinates) {
        finalLat = dist.coordinates[0].toFixed(4);
        finalLng = dist.coordinates[1].toFixed(4);
      } else {
        finalLat = '16.5062';
        finalLng = '80.6480';
      }
    }

    setIsSubmitting(true);
    try {
      const created = await createAssistanceRequest({
        ...formData,
        latitude: finalLat,
        longitude: finalLng,
        imageUrl: imagePreview,
      });
      setSubmittedRequest(created);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = (reqId) => {
    const reason = window.prompt('Please enter a cancellation reason (e.g., "Family safely reached shelter independently"):');
    if (reason !== null) {
      cancelRequest(reqId, reason || 'Cancelled by requester');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Citizen Header with Prominent SOS Callout */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <LifeBuoy className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Citizen Emergency Assistance Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Need Immediate Help in Andhra Pradesh?
          </h1>
          <p className="text-xs sm:text-sm text-red-100 leading-relaxed">
            Trapped in floodwaters, cut off by landslides, or without drinking water? Submit an urgent SOS request
            and track responder dispatches in real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setActiveTab('sos-form');
              setSubmittedRequest(null);
            }}
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-red-700 font-extrabold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-transform hover:scale-105 beacon-active"
          >
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <span>REQUEST EMERGENCY HELP (SOS)</span>
          </button>
        </div>
      </div>

      {/* Citizen Welcome / Profile Overview Card */}
      {currentUser && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-navy-950">{currentUser.full_name}</h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  Verified Citizen
                </span>
              </div>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <span>Email: <strong className="text-slate-700">{currentUser.email}</strong></span>
                <span>Phone: <strong className="text-slate-700">{currentUser.phone || 'Not recorded'}</strong></span>
                <span>District: <strong className="text-slate-700">{currentUser.district || 'Andhra Pradesh'}</strong></span>
              </p>
              {currentUser.registered_address && (
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Usual Residence: {currentUser.registered_address}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={() => setActiveTab('profile')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-red-600 text-red-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-red-600" />
          <span>Assistance Center</span>
        </button>

        <button
          onClick={() => setActiveTab('sos-form')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sos-form'
              ? 'border-red-600 text-red-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-red-600" />
          <span>Submit Emergency SOS</span>
        </button>

        <button
          onClick={() => setActiveTab('my-requests')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'my-requests'
              ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-600" />
          <span>My SOS Requests</span>
          <span className="px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 font-mono font-bold">
            {myRequests.length}
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
          <MapPin className="w-4 h-4 text-red-600" />
          <span>Disaster Map</span>
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
          <span>Safe Shelters & Camps</span>
          <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
            {shelters.length}
          </span>
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
          <span>Profile & Logout</span>
        </button>
      </div>

      {/* TAB 1: CITIZEN DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Quick Status Action Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Step 1: Submit Emergency SOS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Specify what help is needed (rescue boat, drinking water, meals, medicine) and provide your current location in Andhra Pradesh.
              </p>
              <button
                onClick={() => setActiveTab('sos-form')}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 pt-1"
              >
                <span>Open SOS form →</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Step 2: Track Responder Updates</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Watch your request reference ID transition through Acknowledged, Responder Assigned, Dispatched, and Delivered in real-time.
              </p>
              <button
                onClick={() => setActiveTab('my-requests')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-1"
              >
                <span>View my requests ({myRequests.length}) →</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Step 3: Locate Safe Relief Shelters</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Find nearby municipal indoor stadiums, cyclone relief safehouses, and schools equipped with drinking water and hot food.
              </p>
              <button
                onClick={() => setActiveTab('shelters')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 pt-1"
              >
                <span>Browse shelters directory →</span>
              </button>
            </div>
          </div>

          {/* Active Citizen Requests Spotlight (if any exist) */}
          {myRequests.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>My Active Assistance Requests ({myRequests.length})</span>
                </h3>
                <button
                  onClick={() => setActiveTab('my-requests')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View All Details
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRequests.slice(0, 2).map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-navy-950 bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
                        {req.id}
                      </span>
                      <RequestStatusBadge status={req.status} size="xs" />
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {req.emergencyType} Emergency: {req.locality}, {req.district}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {req.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {req.assistanceCategories?.map(c => (
                        <AssistanceCategoryBadge key={c} categoryId={c} size="xs" />
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>People: <strong>{req.peopleCount}</strong></span>
                      <Link
                        to={`/request/${req.id}`}
                        className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Track Live Progress</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Telephone Quick-Dial Bar */}
          <div className="bg-navy-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl border border-navy-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-red-500" />
                <span>Statutory Andhra Pradesh Emergency Helplines</span>
              </h3>
              <span className="text-xs text-slate-400">Toll-free 24x7 government response</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <a href="tel:112" className="bg-navy-950 p-3.5 rounded-xl border border-navy-800 hover:border-red-500 transition-colors block">
                <span className="text-slate-400 text-[11px] block">National Emergency</span>
                <span className="text-2xl font-bold text-white mt-1 block">112</span>
                <span className="text-[10px] text-slate-400">Police / Fire / Rescue</span>
              </a>

              <a href="tel:1070" className="bg-navy-950 p-3.5 rounded-xl border border-navy-800 hover:border-amber-500 transition-colors block">
                <span className="text-slate-400 text-[11px] block">APSDMA State Cell</span>
                <span className="text-2xl font-bold text-amber-400 mt-1 block">1070</span>
                <span className="text-[10px] text-slate-400">Disaster Ops Room</span>
              </a>

              <a href="tel:108" className="bg-navy-950 p-3.5 rounded-xl border border-navy-800 hover:border-emerald-500 transition-colors block">
                <span className="text-slate-400 text-[11px] block">Medical Ambulance</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">108</span>
                <span className="text-[10px] text-slate-400">Emergency Healthcare</span>
              </a>

              <a href="tel:104" className="bg-navy-950 p-3.5 rounded-xl border border-navy-800 hover:border-blue-500 transition-colors block">
                <span className="text-slate-400 text-[11px] block">Tele-Health Support</span>
                <span className="text-2xl font-bold text-blue-400 mt-1 block">104</span>
                <span className="text-[10px] text-slate-400">Medical Advice Desk</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMERGENCY SOS FORM */}
      {activeTab === 'sos-form' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {submittedRequest ? (
            /* Confirmation Screen */
            <div className="bg-white rounded-2xl border-2 border-emerald-500/50 p-6 sm:p-8 shadow-xl text-center space-y-6 animate-scaleIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200">
                  SOS Reference ID: {submittedRequest.id}
                </span>
                <h2 className="text-2xl font-bold text-slate-900">
                  Emergency Assistance Request Logged!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Your SOS call for <strong>{submittedRequest.locality}, {submittedRequest.district}</strong> has been
                  assigned initial status: <span className="font-semibold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">Submitted (Awaiting Acknowledgment)</span>.
                </p>
              </div>

              {/* Needs & Location Summary */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left max-w-lg mx-auto space-y-2.5 text-slate-700">
                <p><strong>Affected People:</strong> {submittedRequest.peopleCount} individuals</p>
                <p><strong>Urgency:</strong> <UrgencyBadge urgency={submittedRequest.urgency} size="xs" /></p>
                <p><strong>Required Assistance:</strong></p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {submittedRequest.assistanceCategories?.map(c => (
                    <AssistanceCategoryBadge key={c} categoryId={c} size="xs" />
                  ))}
                </div>
                <p className="pt-1"><strong>Location:</strong> {submittedRequest.address || submittedRequest.locality}, {submittedRequest.district}</p>
                <p className="font-mono text-[11px] text-slate-500">Coordinates: {submittedRequest.coordinates?.[0]}, {submittedRequest.coordinates?.[1]}</p>
              </div>

              {/* Academic Disclaimer Callout */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs text-left max-w-lg mx-auto">
                <strong>Demonstration Note:</strong> This is an educational prototype. This request has <em>not</em> been transmitted to real-world emergency dispatchers. In actual emergencies, dial <strong>112</strong> or <strong>1070</strong> immediately.
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to={`/request/${submittedRequest.id}`}
                  className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Track Request Timeline</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => setActiveTab('my-requests')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  View in My Requests
                </button>

                <button
                  onClick={() => {
                    setSubmittedRequest(null);
                    setFormData({
                      emergencyType: 'Flood',
                      contactName: currentUser?.full_name || '',
                      phone: currentUser?.phone || '',
                      peopleCount: 1,
                      vulnerableGroups: [],
                      district: 'NTR (Vijayawada)',
                      locality: '',
                      address: '',
                      latitude: '16.5062',
                      longitude: '80.6480',
                      urgency: 'High',
                      assistanceCategories: ['rescue'],
                      description: '',
                    });
                    setImagePreview(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            /* The SOS Form */
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-red-200 p-6 sm:p-8 shadow-lg space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-navy-950 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-600" />
                    <span>Emergency Assistance Request (SOS)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Provide accurate location and needs so demonstration responders can coordinate assistance.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                  PRIORITY DISPATCH
                </span>
              </div>

              {/* Section 1: Emergency Type & Contact Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  1. Emergency Type & Contact Person
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Emergency Hazard Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.emergencyType}
                      onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Flood">Flood / Inundation</option>
                      <option value="Cyclone">Cyclone / Severe Gale</option>
                      <option value="Landslide">Landslide / Rockfall</option>
                      <option value="Medical Emergency">Urgent Medical Emergency</option>
                      <option value="Fire">Fire Outbreak</option>
                      <option value="Building Collapse">Building / Structural Collapse</option>
                      <option value="Other">Other Distress</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact / Requester Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. M. Satyanarayana"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl border ${
                        errors.contactName ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                    {errors.contactName && <p className="text-[11px] text-red-600 mt-1">{errors.contactName}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl border ${
                        errors.phone ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                    {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Number of People Requiring Assistance <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={formData.peopleCount}
                      onChange={(e) => setFormData({ ...formData, peopleCount: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Urgency Level Assessment <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Critical">Critical (Immediate Life-Safety Threat)</option>
                      <option value="High">High (Urgent Food, Water, or Medicine Needed)</option>
                      <option value="Medium">Medium (Disrupted, Need Support in 12 Hours)</option>
                      <option value="Low">Low (Informational / Precautionary)</option>
                    </select>
                  </div>
                </div>

                {/* Additional Circumstances / Vulnerable Persons */}
                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                    Are any vulnerable individuals present? (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {['Infants / Children', 'Elderly Persons (60+)', 'Pregnant Women', 'Persons with Disabilities / Injured'].map((grp) => {
                      const isChecked = formData.vulnerableGroups.includes(grp);
                      return (
                        <label
                          key={grp}
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-colors ${
                            isChecked
                              ? 'bg-red-50 border-red-300 text-red-900 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleVulnerableGroup(grp)}
                            className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                          />
                          <span>{grp}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 2: Assistance Categories (Multiple Select) */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    2. Immediate Assistance Required <span className="text-red-500">*</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Select all applicable categories</span>
                </div>

                {errors.assistanceCategories && (
                  <p className="text-[11px] text-red-600 font-semibold">{errors.assistanceCategories}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ASSISTANCE_CATEGORIES.map((cat) => {
                    const isSelected = formData.assistanceCategories.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-red-50/80 border-red-400 text-red-950 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{cat.label}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div onClick
                            className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {cat.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Andhra Pradesh Location & Coordinates */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    3. Exact Andhra Pradesh Location
                  </h3>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors"
                  >
                    <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                    <span>{gpsLoading ? 'Fetching GPS...' : 'Use My Current Location'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Andhra Pradesh District <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {AP_DISTRICTS.map((d) => (
                        <option key={d.id} value={d.name}>{d.name} ({d.zone})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Locality / Colony / Landmark <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Singh Nagar Flyover, Ward 28"
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl border ${
                        errors.locality ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                    {errors.locality && <p className="text-[11px] text-red-600 mt-1">{errors.locality}</p>}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1">
                    Complete Street Address / Door Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Door No. 12-45/A, 2nd Cross, Singh Nagar, Vijayawada"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Coordinates & Visual Leaflet Map Confirmation */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  {/* Leaflet Confirmation Map */}
                  <div className="h-44 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                    <MapContainer
                      center={[parseFloat(formData.latitude) || 16.5062, parseFloat(formData.longitude) || 80.6480]}
                      zoom={13}
                      scrollWheelZoom={false}
                      className="w-full h-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[parseFloat(formData.latitude) || 16.5062, parseFloat(formData.longitude) || 80.6480]}
                        icon={sosPin}
                      >
                        <Popup>
                          <span className="text-xs font-bold">SOS Location Preview</span>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    *Visual confirmation of the location where emergency teams should proceed.
                  </p>
                </div>
              </div>

              {/* Section 4: Situation Description & Photo */}
              <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  4. Situation Description & Optional Photo
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Describe your immediate emergency situation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Explain current water depth, whether trapped on roof, any medical needs, missing persons, or special access instructions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full p-3 rounded-xl border ${
                      errors.description ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                  {errors.description && <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>}
                </div>

                {/* Photo attachment preview */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Optional Photo Attachment (Surrounding water level, damage, etc.)
                  </label>
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 max-w-xs">
                      <img src={imagePreview} alt="Attached SOS Preview" className="w-full h-44 object-cover" />
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-navy-950/80 text-white hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-red-500 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <Camera className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="font-semibold text-slate-700">Attach photo preview</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WEBP (Max 5MB)</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[11px] text-slate-400 text-center sm:text-left">
                  *By clicking submit, your request will be generated and logged to the responder queue.
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-xl shadow-red-700/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <AlertOctagon className="w-5 h-5 text-white" />
                  <span>{isSubmitting ? 'Submitting SOS Call...' : 'TRANSMIT EMERGENCY SOS REQUEST'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: MY REQUESTS & TRACKING TIMELINE */}
      {activeTab === 'my-requests' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>My Submitted Emergency SOS Requests ({myRequests.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track your requests as responders acknowledge, dispatch rescue teams, and post real-time updates.
              </p>
            </div>

            <button
              onClick={() => {
                setActiveTab('sos-form');
                setSubmittedRequest(null);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Submit Another SOS</span>
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <LifeBuoy className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Requests Submitted Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You have not logged any emergency assistance requests from this device yet. Click the button below to submit a demonstration SOS request.
              </p>
              <button
                onClick={() => setActiveTab('sos-form')}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                Submit Emergency SOS
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-5"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-navy-950 bg-navy-50 px-2.5 py-1 rounded border border-navy-100">
                        {req.id}
                      </span>
                      <span className="text-slate-400">• Submitted: {new Date(req.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <UrgencyBadge urgency={req.urgency} size="xs" />
                      <RequestStatusBadge status={req.status} size="xs" />
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {req.emergencyType} Distress — {req.locality}, {req.district}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{req.address || req.locality}</span>
                        </p>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                        {req.description}
                      </p>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Requested Assistance:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {req.assistanceCategories?.map(c => (
                            <AssistanceCategoryBadge key={c} categoryId={c} size="xs" />
                          ))}
                        </div>
                      </div>

                      {req.assignedResponder && (
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span>Assigned Response Unit: <strong>{req.assignedResponder}</strong></span>
                        </div>
                      )}

                      {/* Responder Notes Stream */}
                      {req.notes && req.notes.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Field Responder Live Updates ({req.notes.length})
                          </span>
                          <div className="space-y-2">
                            {req.notes.map((n) => (
                              <div key={n.id} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                                <div className="flex justify-between text-[10px] text-amber-800 font-semibold">
                                  <span>{n.author} ({n.role})</span>
                                  <span>{new Date(n.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-slate-800">{n.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side: Chronological Status Timeline */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <span className="text-[11px] font-bold text-navy-950 uppercase tracking-wider block">
                        Lifecycle Timeline
                      </span>

                      <div className="space-y-3 relative pl-3 border-l-2 border-slate-200 text-xs">
                        {req.timeline?.map((event, idx) => (
                          <div key={idx} className="relative space-y-0.5">
                            <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shadow-sm"></span>
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span className="font-semibold text-slate-700">{event.status}</span>
                              <span>{new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-[11px] text-slate-600">{event.note}</p>
                          </div>
                        ))}
                      </div>

                      {/* Cancellation Action */}
                      {req.status !== 'Resolved' && req.status !== 'Cancelled' && (
                        <div className="pt-3 border-t border-slate-200 text-center">
                          <button
                            onClick={() => handleCancelClick(req.id)}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold underline"
                          >
                            Cancel Request
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SHELTERS DIRECTORY */}
      {activeTab === 'shelters' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-navy-950">
                Registered Andhra Pradesh Relief Camps & Shelters ({shelters.length})
              </h2>
              <p className="text-xs text-slate-500">
                Safe cyclone centers, school campuses, and municipal relief halls with clean drinking water and food.
              </p>
            </div>
            <Link to="/map" className="text-xs font-bold text-blue-600 hover:underline">
              View on Map →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shelters.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {s.id}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {s.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{s.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{s.location}, {s.district}</span>
                  </p>

                  <div className="text-xs text-slate-600 pt-1">
                    <span>Capacity: <strong>{s.currentOccupants} / {s.capacity}</strong> citizens</span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {s.facilities?.map((f, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                  <span>Helpline: 112 / 1070</span>
                  <Link to="/map" className="text-blue-600 font-semibold hover:underline">
                    Locate →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DISASTER MAP */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-navy-950">Live Disaster Map & Relief Shelters</h2>
              <p className="text-xs text-slate-500">
                Visualizing active emergency SOS requests and safe relief shelters across Andhra Pradesh.
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
            >
              <span>Full Screen GIS Map →</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm overflow-hidden">
            <DisasterMap sosRequests={assistanceRequests} shelters={shelters} height="520px" />
          </div>
        </div>
      )}

      {/* TAB 6: CITIZEN PROFILE & LOGOUT */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy-950">Citizen Profile & Details</h2>
                <p className="text-xs text-slate-500">Manage your contact details and registered usual location in AP.</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsUpdatingProfile(true);
              try {
                await updateUserProfile(profileForm);
              } finally {
                setIsUpdatingProfile(false);
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">District</label>
              <select
                value={profileForm.district}
                onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {AP_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Usual / Last-Known Residence Address</label>
              <input
                type="text"
                value={profileForm.registered_address}
                onChange={(e) => setProfileForm({ ...profileForm, registered_address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Sign out of account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
