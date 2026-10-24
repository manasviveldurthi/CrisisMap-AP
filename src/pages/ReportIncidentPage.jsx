import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { AP_DISTRICTS } from '../data/districts';
import { DISASTER_TYPES } from '../data/disasterTypes';
import {
  FilePlus,
  AlertTriangle,
  MapPin,
  Camera,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  UploadCloud,
  ArrowRight,
  Info,
  ShieldAlert,
  Compass
} from 'lucide-react';

export default function ReportIncidentPage() {
  const { addIncident } = useCrisis();
  const navigate = useNavigate();

  // Form inputs state
  const [formData, setFormData] = useState({
    title: '',
    type: 'flood',
    district: 'NTR (Vijayawada)',
    locality: '',
    reportedAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    priority: 'High',
    latitude: '16.5062',
    longitude: '80.6480',
    description: '',
    reporterName: '',
    contactInfo: '',
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When district changes, automatically set default district center coordinates
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

  // Handle Photo Upload preview via FileReader
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

  const removePhoto = () => {
    setImagePreview(null);
  };

  // Browser Geolocation Helper
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(4),
          longitude: pos.coords.longitude.toFixed(4),
        }));
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not retrieve GPS coordinates. Default district coordinates will be used.');
      }
    );
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Please provide a descriptive incident title.';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters.';
    }

    if (!formData.district) {
      newErrors.district = 'Please select an Andhra Pradesh district.';
    }

    if (!formData.locality.trim()) {
      newErrors.locality = 'Specific landmark or village/mandal name is required.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please describe what occurred and what assistance is needed.';
    } else if (formData.description.length < 15) {
      newErrors.description = 'Description should be at least 15 characters to provide useful context.';
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || lat < 12.0 || lat > 20.0) {
      newErrors.latitude = 'Latitude must be within Andhra Pradesh geographical range (approx 12.0° to 20.0° N).';
    }

    if (isNaN(lng) || lng < 76.0 || lng > 85.0) {
      newErrors.longitude = 'Longitude must be within Andhra Pradesh geographical range (approx 76.0° to 85.0° E).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const created = addIncident({
        title: formData.title,
        type: formData.type,
        district: formData.district,
        locality: formData.locality,
        coordinates: [parseFloat(formData.latitude), parseFloat(formData.longitude)],
        priority: formData.priority,
        reportedAt: new Date(formData.reportedAt).toISOString(),
        description: formData.description,
        reporterName: formData.reporterName ? `${formData.reporterName} (Demo Citizen)` : 'Citizen Reporter (Demo)',
        imageUrl: imagePreview,
      });

      setSubmittedIncident(created);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            Report a Disaster Incident
          </h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            Citizen Demo Submission
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Simulate reporting emergencies, localized flooding, road blockages, or relief needs across Andhra Pradesh.
        </p>
      </div>

      {/* Demonstration Storage Notice Callout */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Demonstration Mode & Local Browser Storage Notice:
          </p>
          <p className="text-amber-800 leading-relaxed">
            Incidents logged here are saved in your browser's <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900">localStorage</code>.
            They immediately update your demonstration dashboard and interactive map.
            <strong> This form does NOT dispatch real-world police, fire, or NDRF emergency services.</strong> In a life-threatening crisis, dial <strong>112</strong> or APSDMA <strong>1070</strong>.
          </p>
        </div>
      </div>

      {/* Success Modal / Card after Submission */}
      {submittedIncident ? (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/50 p-6 sm:p-8 shadow-xl text-center space-y-6 animate-scaleIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200">
              Demo Incident ID: {submittedIncident.id}
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Incident Logged in Local Demo Storage!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Your demonstration report for <strong>{submittedIncident.locality}, {submittedIncident.district}</strong> has been
              assigned initial status <span className="font-semibold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">Unverified</span> and
              is now live on your interactive map and dashboard telemetry.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left max-w-md mx-auto space-y-1 text-slate-600">
            <p><strong>Title:</strong> {submittedIncident.title}</p>
            <p><strong>Category:</strong> {submittedIncident.type}</p>
            <p><strong>Priority:</strong> {submittedIncident.priority}</p>
            <p><strong>Coordinates:</strong> {submittedIncident.coordinates[0]}, {submittedIncident.coordinates[1]}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={`/incident/${submittedIncident.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs shadow-md transition-all"
            >
              <span>View Incident Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/user-dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all"
            >
              <span>View in My Reports</span>
            </Link>

            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-all"
            >
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Locate on Map</span>
            </Link>

            <button
              onClick={() => {
                setSubmittedIncident(null);
                setFormData({
                  title: '',
                  type: 'flood',
                  district: 'NTR (Vijayawada)',
                  locality: '',
                  reportedAt: new Date().toISOString().slice(0, 16),
                  priority: 'High',
                  latitude: '16.5062',
                  longitude: '80.6480',
                  description: '',
                  reporterName: '',
                  contactInfo: '',
                });
                setImagePreview(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-all"
            >
              <FilePlus className="w-4 h-4" />
              <span>Submit Another Report</span>
            </button>
          </div>
        </div>
      ) : (
        /* The Report Form */
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-navy-950 pb-2 border-b border-slate-100 flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-red-600" />
              <span>1. Incident Classification & Overview</span>
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Title / Headline <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Flash Flood Waterlogging near Kanaka Durga Temple Ghat Road"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-600 ${
                  errors.title ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                }`}
              />
              {errors.title && <p className="text-[11px] text-red-600 mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disaster Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  {DISASTER_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Severity / Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  <option value="Critical">Critical (Immediate life hazard)</option>
                  <option value="High">High (Severe property/access cut off)</option>
                  <option value="Medium">Medium (Disruption, needs attention)</option>
                  <option value="Low">Low (Informational / Precautionary)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-navy-950 pb-2 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <span>2. Andhra Pradesh Location & Coordinates</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* District */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Andhra Pradesh District <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  {AP_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.zone})
                    </option>
                  ))}
                </select>
                {errors.district && <p className="text-[11px] text-red-600 mt-1">{errors.district}</p>}
              </div>

              {/* Locality */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Locality / Landmark / Mandal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Benz Circle, Municipal Ward 14"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-600 ${
                    errors.locality ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.locality && <p className="text-[11px] text-red-600 mt-1">{errors.locality}</p>}
              </div>
            </div>

            {/* Latitude & Longitude with GPS button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Geographic Coordinates (Lat, Long)
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Use Device GPS</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Latitude (e.g. 16.5062)"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  />
                  {errors.latitude && <p className="text-[11px] text-red-600 mt-1">{errors.latitude}</p>}
                </div>

                <div>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Longitude (e.g. 80.6480)"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  />
                  {errors.longitude && <p className="text-[11px] text-red-600 mt-1">{errors.longitude}</p>}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                *Coordinates automatically populate according to the chosen district headquarters centroid.
              </p>
            </div>
          </div>

          {/* Description & Date */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-navy-950 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Info className="w-5 h-5 text-red-600" />
              <span>3. Incident Description & Photo Preview</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date and Time of Occurrence
                </label>
                <input
                  type="datetime-local"
                  value={formData.reportedAt}
                  onChange={(e) => setFormData({ ...formData, reportedAt: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                </input>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reporter Name (Optional Demo Field)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar (Local Resident)"
                  value={formData.reporterName}
                  onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Incident Situation & Needs <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe current water levels, accessibility of roads, damaged infrastructure, stranded residents, or medical/ration requirements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-600 ${
                  errors.description ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                }`}
              />
              {errors.description && <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>}
            </div>

            {/* Photo Preview Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Photograph Preview (Optional Demo Upload)
              </label>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-w-sm">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-navy-950/80 text-white hover:bg-red-600 transition-colors"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="p-2 bg-slate-50 text-[11px] text-slate-500 font-medium text-center">
                    Demonstration image loaded into local browser storage
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-navy-600 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <Camera className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">
                    Click to select photo preview from device
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, WEBP (Max 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
              {errors.image && <p className="text-[11px] text-red-600 mt-1">{errors.image}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-500">
              *By clicking submit, this report will be assigned a demonstration ID and stored in your browser.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-700/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
            >
              <FilePlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Demo Report...' : 'Submit Incident Report'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
