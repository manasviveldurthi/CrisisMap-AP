import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { api } from '../api/client';
import {
  LifeBuoy,
  Users,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Building2,
  MapPin,
  Compass,
  AlertCircle,
  CheckCircle2,
  Info,
  KeyRound,
  FileText,
  BadgeCheck,
  Search,
  Clock,
  RotateCcw,
  X,
  HelpCircle
} from 'lucide-react';
import { AP_DISTRICTS } from '../data/districts';

export default function LoginPage() {
  const { currentUser, login, register, logout, showToast } = useCrisis();
  const navigate = useNavigate();
  const location = useLocation();

  // Read URL query parameter for portal role: 'citizen' | 'ngo' | 'government' | 'admin'
  const searchParams = new URLSearchParams(location.search);
  const portalParam = searchParams.get('portal');
  const modeParam = searchParams.get('mode') || searchParams.get('tab');

  const initialPortal = portalParam === 'admin'
    ? 'admin'
    : portalParam === 'government'
    ? 'government'
    : portalParam === 'ngo' || portalParam === 'responder'
    ? 'ngo'
    : 'citizen';

  const [activePortal, setActivePortal] = useState(initialPortal);
  // viewMode: 'login' | 'register'
  const [viewMode, setViewMode] = useState(() => {
    if (modeParam === 'register') return 'register';
    return location.pathname === '/register' ? 'register' : 'login';
  });

  // Government sub-tab: 'login' | 'request' | 'status'
  const [govSubTab, setGovSubTab] = useState('login');

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetForm, setResetForm] = useState({
    email: '',
    phone: '',
    new_password: '',
    confirm_password: ''
  });
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Government Status Tracking State
  const [statusQueryEmail, setStatusQueryEmail] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Sync state if URL search query changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('portal');
    const m = params.get('mode') || params.get('tab');
    if (p === 'admin') setActivePortal('admin');
    else if (p === 'government') setActivePortal('government');
    else if (p === 'ngo' || p === 'responder') setActivePortal('ngo');
    else if (p === 'citizen') setActivePortal('citizen');

    if (m === 'register') setViewMode('register');
    else if (m === 'login') setViewMode('login');
  }, [location.search]);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Citizen registration form
  const [citizenForm, setCitizenForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    district: 'NTR (Vijayawada)',
    registered_address: '',
    registered_latitude: null,
    registered_longitude: null
  });

  // NGO / Responder Access Request form
  const [ngoForm, setNgoForm] = useState({
    organization_name: '',
    org_type: 'NGO / Humanitarian Relief',
    full_name: '',
    title_or_designation: '',
    email: '',
    phone: '',
    password: '',
    district: 'NTR (Vijayawada)',
    description: ''
  });

  // Government Official Access Request form
  const [govRequestForm, setGovRequestForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: 'Revenue & Disaster Management',
    designation: 'Disaster Operations Officer',
    district: 'NTR (Vijayawada)',
    employee_id: '',
    verification_details: '',
    password: ''
  });

  // Browser Geolocation for citizen registration
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        setCitizenForm((prev) => ({
          ...prev,
          registered_latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          registered_longitude: parseFloat(pos.coords.longitude.toFixed(6))
        }));
        showToast('Location coordinates captured via browser GPS.', 'success');
      },
      (err) => {
        setGpsLoading(false);
        showToast(`GPS unavailable (${err.message}). You can still enter your address manually.`, 'warning');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Switch Portal Tab
  const handlePortalChange = (portalKey) => {
    setActivePortal(portalKey);
    setViewMode('login');
    setGovSubTab('login');
    setErrorMessage('');
    setSuccessNotice('');
    setShowPassword(false);
    navigate(`/login?portal=${portalKey}`, { replace: true });
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');
    setIsSubmitting(true);

    try {
      const verifiedUser = await login(loginForm.email.trim(), loginForm.password);

      // Inspect verified role returned from backend API
      if (verifiedUser.role === 'admin') {
        navigate('/admin');
      } else if (
        verifiedUser.role === 'government_official' ||
        verifiedUser.role === 'government' ||
        verifiedUser.role === 'official'
      ) {
        navigate('/government');
      } else if (verifiedUser.role === 'responder' || verifiedUser.role === 'ngo') {
        if (activePortal === 'government') {
          showToast('Authenticated as NGO / Responder. Redirecting to NGO Dashboard.', 'info');
        }
        navigate('/responder');
      } else {
        if (activePortal === 'government' || activePortal === 'ngo') {
          showToast(`Authenticated as Citizen. Redirecting to your Citizen Assistance Dashboard.`, 'info');
        }
        navigate('/citizen');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Citizen Direct Registration
  const handleCitizenSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');
    setIsSubmitting(true);

    try {
      await register({
        ...citizenForm,
        email: citizenForm.email.trim(),
        role: 'citizen'
      });
      navigate('/citizen');
    } catch (err) {
      setErrorMessage(err.message || 'Citizen registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle NGO Access Request Submission
  const handleNgoSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');
    setIsSubmitting(true);

    try {
      await register({
        full_name: ngoForm.full_name.trim(),
        email: ngoForm.email.trim(),
        phone: ngoForm.phone.trim(),
        password: ngoForm.password,
        role: 'responder',
        organization_name: ngoForm.organization_name.trim(),
        title_or_designation: ngoForm.title_or_designation.trim(),
        district: ngoForm.district
      });

      setSuccessNotice(
        `Organization application submitted! Your request for "${ngoForm.organization_name}" is pending administrator review and verification. Once approved by state administration, you will be able to log in.`
      );
      setViewMode('login');
      setLoginForm((prev) => ({ ...prev, email: ngoForm.email.trim() }));
    } catch (err) {
      setErrorMessage(err.message || 'Organization registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Government Official Access Request Submission
  const handleGovRequestSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');
    setIsSubmitting(true);

    try {
      const result = await api.requestGovernmentAccess({
        full_name: govRequestForm.full_name.trim(),
        email: govRequestForm.email.trim(),
        phone: govRequestForm.phone.trim(),
        department: govRequestForm.department.trim(),
        designation: govRequestForm.designation.trim(),
        district: govRequestForm.district,
        employee_id: govRequestForm.employee_id.trim(),
        verification_details: govRequestForm.verification_details.trim(),
        password: govRequestForm.password
      });

      setSuccessNotice(
        `Government Official access request submitted successfully! Your request (Tracking ID: GOV-REQ-${result.id}) is now PENDING manual verification by AP State Disaster Management State Administrators. Once approved and provisioned, you can sign in with your official password.`
      );
      // Switch to status tracking tab and auto-query status
      setGovSubTab('status');
      setStatusQueryEmail(govRequestForm.email.trim());
      handleCheckGovStatus(govRequestForm.email.trim());
    } catch (err) {
      setErrorMessage(err.message || 'Government access request submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Government Status Check
  const handleCheckGovStatus = async (targetEmail) => {
    const emailToQuery = targetEmail || statusQueryEmail;
    if (!emailToQuery || !emailToQuery.trim()) {
      setStatusError('Please enter your official email address.');
      return;
    }

    setStatusLoading(true);
    setStatusError('');
    setStatusResult(null);

    try {
      const res = await api.checkGovernmentRequestStatus(emailToQuery.trim());
      setStatusResult(res);
    } catch (err) {
      setStatusError(err.message || 'Failed to retrieve request status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle Password Reset Submission
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (resetForm.new_password !== resetForm.confirm_password) {
      setResetError('New passwords do not match. Please retype carefully.');
      return;
    }
    if (resetForm.new_password.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await api.resetPassword({
        email: resetForm.email.trim(),
        phone: resetForm.phone.trim(),
        new_password: resetForm.new_password
      });
      setResetSuccess(res.message || 'Password reset successfully.');
      setLoginForm((prev) => ({ ...prev, email: resetForm.email.trim(), password: '' }));
      showToast('Password reset successfully! Please sign in with your new credentials.', 'success');
      setTimeout(() => {
        setShowResetModal(false);
        setResetForm({ email: '', phone: '', new_password: '', confirm_password: '' });
        setResetSuccess('');
      }, 2500);
    } catch (err) {
      setResetError(err.message || 'Password reset failed. Please check your credentials.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Back to Portal Selection Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal Selection</span>
        </Link>

        <span className="text-[11px] text-slate-400 font-mono">
          CrisisMap AP &bull; Secure Authentication & Verification
        </span>
      </div>

      {/* Currently Logged In Banner */}
      {currentUser && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">
                Currently logged in: <span className="underline">{currentUser.full_name}</span> ({currentUser.email})
              </p>
              <p className="text-[11px] text-emerald-700">
                Verified Role: <strong className="uppercase">
                  {currentUser.role === 'admin'
                    ? 'State Administrator'
                    : currentUser.role === 'government_official' || currentUser.role === 'government'
                    ? 'Government Official'
                    : currentUser.role === 'responder' || currentUser.role === 'ngo'
                    ? 'NGO / Responder'
                    : 'Citizen'}
                </strong> &bull; Status: <strong className="uppercase">{currentUser.status}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentUser.role === 'admin') navigate('/admin');
                else if (
                  currentUser.role === 'government_official' ||
                  currentUser.role === 'government'
                ) navigate('/government');
                else if (
                  currentUser.role === 'responder' ||
                  currentUser.role === 'ngo'
                ) navigate('/responder');
                else navigate('/citizen');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow transition-all"
            >
              Go to Dashboard
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Portal Selection Tabs (Citizen | NGO | Government Official | State Administrator) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
        <button
          type="button"
          onClick={() => handlePortalChange('citizen')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activePortal === 'citizen'
              ? 'bg-red-50 text-red-700 border-2 border-red-500 shadow-sm'
              : 'text-slate-600 hover:text-navy-950 hover:bg-slate-50'
          }`}
        >
          <LifeBuoy className={`w-4 h-4 ${activePortal === 'citizen' ? 'text-red-600' : 'text-slate-400'}`} />
          <span className="truncate">Citizen</span>
        </button>

        <button
          type="button"
          onClick={() => handlePortalChange('ngo')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activePortal === 'ngo'
              ? 'bg-amber-50 text-amber-800 border-2 border-amber-500 shadow-sm'
              : 'text-slate-600 hover:text-navy-950 hover:bg-slate-50'
          }`}
        >
          <Users className={`w-4 h-4 ${activePortal === 'ngo' ? 'text-amber-600' : 'text-slate-400'}`} />
          <span className="truncate">NGO / Relief Org</span>
        </button>

        <button
          type="button"
          onClick={() => handlePortalChange('government')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activePortal === 'government'
              ? 'bg-navy-900 text-white border-2 border-navy-950 shadow-sm'
              : 'text-slate-600 hover:text-navy-950 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${activePortal === 'government' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className="truncate">Government</span>
        </button>

        <button
          type="button"
          onClick={() => handlePortalChange('admin')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activePortal === 'admin'
              ? 'bg-indigo-900 text-white border-2 border-indigo-950 shadow-sm'
              : 'text-slate-600 hover:text-navy-950 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${activePortal === 'admin' ? 'text-indigo-300' : 'text-slate-400'}`} />
          <span className="truncate">Admin Portal</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="font-semibold leading-relaxed">{successNotice}</p>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="font-semibold leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CITIZEN DEDICATED LOGIN / REGISTRATION */}
      {/* ========================================================================= */}
      {activePortal === 'citizen' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 uppercase">
                Citizen Portal Access
              </span>
              <h2 className="text-xl font-extrabold text-navy-950">
                {viewMode === 'login' ? 'Citizen Sign In' : 'New Citizen Registration'}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {viewMode === 'login'
                  ? 'Sign in to submit emergency SOS requests and track live rescue assistance.'
                  : 'Register directly to request emergency relief and track rescue timelines in AP.'}
              </p>
            </div>
          </div>

          {/* Citizen Login Form */}
          {viewMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Citizen Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. citizen@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetForm((prev) => ({ ...prev, email: loginForm.email }));
                      setShowResetModal(true);
                    }}
                    className="text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Verifying Credentials...' : 'Sign In as Citizen'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                <span>Don't have a citizen account?</span>
                <button
                  type="button"
                  onClick={() => { setViewMode('register'); setErrorMessage(''); setSuccessNotice(''); }}
                  className="font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                  Register Directly as Citizen →
                </button>
              </div>
            </form>
          )}

          {/* Citizen Direct Registration Form */}
          {viewMode === 'register' && (
            <form onSubmit={handleCitizenSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={citizenForm.full_name}
                      onChange={(e) => setCitizenForm({ ...citizenForm, full_name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@example.com"
                      value={citizenForm.email}
                      onChange={(e) => setCitizenForm({ ...citizenForm, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number (10 digits) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98490 55443"
                      value={citizenForm.phone}
                      onChange={(e) => setCitizenForm({ ...citizenForm, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password (min 6 chars) *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={citizenForm.password}
                      onChange={(e) => setCitizenForm({ ...citizenForm, password: e.target.value })}
                      className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 focus:outline-none"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Andhra Pradesh District *</label>
                  <select
                    value={citizenForm.district}
                    onChange={(e) => setCitizenForm({ ...citizenForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {AP_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Residence Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Door No. 12-4, Main Road, Vijayawada"
                    value={citizenForm.registered_address}
                    onChange={(e) => setCitizenForm({ ...citizenForm, registered_address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Registered GPS Coordinates */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">Pre-Disaster / Usual Coordinates (Optional)</p>
                    <p className="text-[11px] text-slate-500">
                      Helps responders identify your general location during communication blackouts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-100 hover:bg-navy-200 text-navy-900 font-semibold text-[11px] transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{gpsLoading ? 'Detecting...' : 'Detect GPS'}</span>
                  </button>
                </div>

                {(citizenForm.registered_latitude || citizenForm.registered_longitude) && (
                  <div className="text-[11px] text-emerald-700 font-mono flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      Lat: {citizenForm.registered_latitude}, Lon: {citizenForm.registered_longitude}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Citizen Registration'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => { setViewMode('login'); setErrorMessage(''); }}
                  className="font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                  Sign In Here
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. NGO / RELIEF ORGANIZATION DEDICATED LOGIN / ACCESS REQUEST */}
      {/* ========================================================================= */}
      {activePortal === 'ngo' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 uppercase">
                NGO & Relief Organization Portal
              </span>
              <h2 className="text-xl font-extrabold text-navy-950">
                {viewMode === 'login' ? 'NGO / Responder Sign In' : 'Organization Access Request'}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {viewMode === 'login'
                  ? 'Sign in to access available assistance requests, claim dispatches, and coordinate field relief.'
                  : 'Submit your organization credentials for AP state administrator verification.'}
              </p>
            </div>
          </div>

          {/* NGO Login Form */}
          {viewMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. coordinator@redcross-ap.org"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetForm((prev) => ({ ...prev, email: loginForm.email }));
                      setShowResetModal(true);
                    }}
                    className="text-[11px] font-semibold text-amber-700 hover:underline"
                  >
                    Forgot Password / Reset Credentials?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Authenticating Organization...' : 'Sign In as NGO / Responder'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                <span>New organization or rescue battalion?</span>
                <button
                  type="button"
                  onClick={() => { setViewMode('register'); setErrorMessage(''); setSuccessNotice(''); }}
                  className="font-bold text-amber-700 hover:text-amber-800 hover:underline"
                >
                  Submit Organization Access Request →
                </button>
              </div>
            </form>
          )}

          {/* NGO Access Request Form */}
          {viewMode === 'register' && (
            <form onSubmit={handleNgoSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Administrative Verification Required:</strong> In accordance with AP State Disaster Management protocols, all organization registrations are reviewed by state administrators before active response permissions are authorized.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organization / Rescue Unit Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Red Cross AP Relief Wing / SDRF Flood Unit"
                    value={ngoForm.organization_name}
                    onChange={(e) => setNgoForm({ ...ngoForm, organization_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organization Type *</label>
                  <select
                    value={ngoForm.org_type}
                    onChange={(e) => setNgoForm({ ...ngoForm, org_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="NGO / Humanitarian Relief">NGO / Humanitarian Relief</option>
                    <option value="Government (SDRF / NDRF)">Government (SDRF / NDRF)</option>
                    <option value="Civil Defense / Fire Services">Civil Defense / Fire Services</option>
                    <option value="Medical Relief Network">Medical Relief Network</option>
                    <option value="Volunteer Community Group">Volunteer Community Group</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. K. Radhakrishnan"
                    value={ngoForm.full_name}
                    onChange={(e) => setNgoForm({ ...ngoForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Relief Coordinator"
                    value={ngoForm.title_or_designation}
                    onChange={(e) => setNgoForm({ ...ngoForm, title_or_designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. radha.relief@redcross.org"
                    value={ngoForm.email}
                    onChange={(e) => setNgoForm({ ...ngoForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 94401 22334"
                    value={ngoForm.phone}
                    onChange={(e) => setNgoForm({ ...ngoForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password (min 6 chars) *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={ngoForm.password}
                      onChange={(e) => setNgoForm({ ...ngoForm, password: e.target.value })}
                      className="w-full px-3 pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 focus:outline-none"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operational District *</label>
                  <select
                    value={ngoForm.district}
                    onChange={(e) => setNgoForm({ ...ngoForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {AP_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Organization Access Request'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => { setViewMode('login'); setErrorMessage(''); }}
                  className="font-bold text-amber-700 hover:text-amber-800 hover:underline"
                >
                  Sign In to Organization Portal
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GOVERNMENT OFFICIAL DEDICATED PORTAL (LOGIN | REQUEST | STATUS) */}
      {/* ========================================================================= */}
      {activePortal === 'government' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-navy-900 text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-navy-950 bg-navy-100 px-2.5 py-0.5 rounded-full border border-navy-200 uppercase tracking-wider">
                Government Official Command Portal
              </span>
              <h2 className="text-xl font-extrabold text-navy-950">
                Government Operations Access
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Restricted operational command for APSDMA coordinators, district collectors, and emergency commanders.
              </p>
            </div>
          </div>

          {/* Subtabs for Government Portal */}
          <div className="flex border-b border-slate-200 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setGovSubTab('login'); setErrorMessage(''); setSuccessNotice(''); }}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                govSubTab === 'login'
                  ? 'border-navy-900 text-navy-950'
                  : 'border-transparent text-slate-500 hover:text-navy-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Official Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => { setGovSubTab('request'); setErrorMessage(''); setSuccessNotice(''); }}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                govSubTab === 'request'
                  ? 'border-navy-900 text-navy-950'
                  : 'border-transparent text-slate-500 hover:text-navy-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Request Official Access</span>
            </button>

            <button
              type="button"
              onClick={() => { setGovSubTab('status'); setErrorMessage(''); setSuccessNotice(''); }}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                govSubTab === 'status'
                  ? 'border-navy-900 text-navy-950'
                  : 'border-transparent text-slate-500 hover:text-navy-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Request Status</span>
            </button>
          </div>

          {/* 3.A GOVERNMENT OFFICIAL LOGIN */}
          {govSubTab === 'login' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-navy-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Administrative Verification & Authorization Required</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Government official accounts are strictly provisioned following manual administrator review. <strong>Public registration cannot directly acquire command authority.</strong> If you haven't received authorization, submit an access request or check your verification status.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Government Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. official@ap.gov.in"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Authorized Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetForm((prev) => ({ ...prev, email: loginForm.email }));
                        setShowResetModal(true);
                      }}
                      className="text-[11px] font-semibold text-navy-900 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Verifying Official Credentials...' : 'Sign In as Government Official'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                <span>Need command access?</span>
                <button
                  type="button"
                  onClick={() => setGovSubTab('request')}
                  className="font-bold text-navy-900 hover:underline"
                >
                  Request Official Command Access →
                </button>
              </div>
            </div>
          )}

          {/* 3.B GOVERNMENT OFFICIAL ACCESS REQUEST (PROVISIONING WORKFLOW) */}
          {govSubTab === 'request' && (
            <form onSubmit={handleGovRequestSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-navy-50 border border-navy-200 text-navy-950 text-[11px] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-navy-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-bold">Manual Administrative Verification Workflow:</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Submitted requests undergo manual review by State Administrators to verify claimed authority and departmental employment. <strong>Public submission does not grant immediate privileges.</strong> Your account will be provisioned only after approval.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. K. Srinivas Rao, IAS"
                    value={govRequestForm.full_name}
                    onChange={(e) => setGovRequestForm({ ...govRequestForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Government Email (.gov.in / nic.in) *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. srinivas.collector@ap.gov.in"
                    value={govRequestForm.email}
                    onChange={(e) => setGovRequestForm({ ...govRequestForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department / Agency *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Revenue & Disaster Management / APSDMA"
                    value={govRequestForm.department}
                    onChange={(e) => setGovRequestForm({ ...govRequestForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation / Official Post *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. District Collector & DDMA Commander"
                    value={govRequestForm.designation}
                    onChange={(e) => setGovRequestForm({ ...govRequestForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operational District *</label>
                  <select
                    value={govRequestForm.district}
                    onChange={(e) => setGovRequestForm({ ...govRequestForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  >
                    {AP_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Employee ID / Badge Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AP-REV-EMP-40892"
                    value={govRequestForm.employee_id}
                    onChange={(e) => setGovRequestForm({ ...govRequestForm, employee_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98480 11223"
                    value={govRequestForm.phone}
                    onChange={(e) => setGovRequestForm({ ...govRequestForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Set Password (min 6 chars) *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={govRequestForm.password}
                      onChange={(e) => setGovRequestForm({ ...govRequestForm, password: e.target.value })}
                      className="w-full px-3 pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 focus:outline-none"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verification Details & Claimed Authority Proof (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Official office room number, district nodal officer reference, or verification dispatch memo ID"
                  value={govRequestForm.verification_details}
                  onChange={(e) => setGovRequestForm({ ...govRequestForm, verification_details: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Submitting Verification Request...' : 'Submit Official Access Request'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Already submitted an access request?</span>
                <button
                  type="button"
                  onClick={() => setGovSubTab('status')}
                  className="font-bold text-navy-900 hover:underline"
                >
                  Track Verification Status →
                </button>
              </div>
            </form>
          )}

          {/* 3.C GOVERNMENT OFFICIAL TRACK REQUEST STATUS */}
          {govSubTab === 'status' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-navy-950">
                  <Search className="w-4 h-4 text-navy-900" />
                  <span>Check Government Access Request Status</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Enter the official email you used to submit your access request to view its real-time verification and provisioning status.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="e.g. official@ap.gov.in"
                    value={statusQueryEmail}
                    onChange={(e) => setStatusQueryEmail(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckGovStatus()}
                    disabled={statusLoading}
                    className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Search className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
                    <span>{statusLoading ? 'Checking...' : 'Check Status'}</span>
                  </button>
                </div>

                {statusError && (
                  <p className="text-red-700 text-xs font-semibold">{statusError}</p>
                )}
              </div>

              {/* Status Result Display */}
              {statusResult && (
                <div className={`p-5 rounded-2xl border-2 space-y-3 ${
                  statusResult.status === 'approved'
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : statusResult.status === 'rejected'
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-amber-300 bg-amber-50/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                      Official Access Request Status
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                      statusResult.status === 'approved'
                        ? 'bg-emerald-200 text-emerald-900'
                        : statusResult.status === 'rejected'
                        ? 'bg-red-200 text-red-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}>
                      {statusResult.status === 'approved'
                        ? 'APPROVED & PROVISIONED'
                        : statusResult.status === 'rejected'
                        ? 'REJECTED'
                        : 'PENDING VERIFICATION'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Applicant</span>
                      <strong className="text-slate-900">{statusResult.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Official Email</span>
                      <span className="text-slate-900">{statusResult.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Department & Post</span>
                      <span className="text-slate-900">{statusResult.designation} &bull; {statusResult.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">District</span>
                      <span className="text-slate-900">{statusResult.district}</span>
                    </div>
                  </div>

                  {statusResult.admin_notes && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] space-y-1">
                      <strong className="text-slate-800">State Administrator Verification Notes:</strong>
                      <p className="text-slate-600">{statusResult.admin_notes}</p>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <p className="font-semibold text-slate-800">{statusResult.message}</p>
                    {statusResult.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => {
                          setLoginForm((prev) => ({ ...prev, email: statusResult.email }));
                          setGovSubTab('login');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm whitespace-nowrap"
                      >
                        Proceed to Sign In →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STATE ADMINISTRATOR DEDICATED SIGN IN */}
      {/* ========================================================================= */}
      {activePortal === 'admin' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-indigo-900 text-indigo-300 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-950 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wider">
                State Administrator Portal
              </span>
              <h2 className="text-xl font-extrabold text-navy-950">
                State Administrator Sign In
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Restricted governance portal for AP state disaster coordinators, system overseers, and organization verifiers.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-950">
              <KeyRound className="w-4 h-4 text-indigo-700" />
              <span>Administrative Authorization & Governance</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Administrator privileges grant state-wide authority to review and approve NGO registrations, verify and provision government official accounts, and govern relief operations. <strong>Public self-registration is permanently disabled for administrator access.</strong>
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Administrator Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@crisismap.org"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Authorized Master Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Verifying Administrator Credentials...' : 'Sign In as State Administrator'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECURE PASSWORD RESET MODAL */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-extrabold text-slate-900">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <span>Secure Password Reset</span>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              To verify your identity without exposing secrets, please enter your registered account email and matching registered contact phone number.
            </p>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registered Account Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. coordinator@redcross-ap.org"
                  value={resetForm.email}
                  onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registered Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 98490 55443"
                  value={resetForm.phone}
                  onChange={(e) => setResetForm({ ...resetForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Secure Password (min 6 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={resetForm.new_password}
                  onChange={(e) => setResetForm({ ...resetForm, new_password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={resetForm.confirm_password}
                  onChange={(e) => setResetForm({ ...resetForm, confirm_password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition-colors"
                >
                  {isResetting ? 'Verifying & Updating...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disaster Response Security Guidelines */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 text-navy-950 font-bold">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Role Security & Access Verification Guidelines</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
          <li>
            <strong>Citizens:</strong> Direct registration creates an immediate verified profile to submit urgent SOS assistance requests and track rescue progress.
          </li>
          <li>
            <strong>NGOs / Relief Organizations:</strong> Applications remain restricted in "pending approval" state until approved by state administrators.
          </li>
          <li>
            <strong>Government Officials:</strong> Access requests undergo manual review by State Administrators. Public request submission does not grant immediate privileges.
          </li>
        </ul>
      </div>
    </div>
  );
}
