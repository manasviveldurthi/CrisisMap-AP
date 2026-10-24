import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  UserCheck,
  ShieldAlert,
  MapPin,
  Building2,
  AlertOctagon,
  PhoneCall,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Waves,
  CloudLightning,
  Mountain,
  Sun,
  Flame,
  Hammer,
  HeartPulse,
  Users,
  Compass,
  CheckCircle2,
  Lock,
  LogOut,
  User,
  KeyRound
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import { DISASTER_TYPES } from '../data/disasterTypes';

export default function HomePage() {
  const { stats, currentUser, logout } = useCrisis();
  const navigate = useNavigate();

  const handlePortalSelect = (portalRole, mode = 'login') => {
    if (currentUser) {
      // If user is already logged in, navigate to their authorized dashboard
      if (currentUser.role === 'admin') {
        navigate('/admin');
      } else if (currentUser.role === 'government_official') {
        navigate('/government');
      } else if (currentUser.role === 'responder') {
        navigate('/responder');
      } else {
        navigate('/citizen');
      }
      return;
    }

    // Direct unauthenticated users to the dedicated login or registration page for that portal
    const query = mode === 'register' ? `?portal=${portalRole}&mode=register` : `?portal=${portalRole}`;
    navigate(`/login${query}`);
  };

  const disasterIcons = {
    Waves: Waves,
    CloudLightning: CloudLightning,
    Mountain: Mountain,
    ShieldAlert: Waves,
    Sun: Sun,
    Flame: Flame,
    Hammer: Hammer,
    HeartPulse: HeartPulse,
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-navy-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-800/90 border border-navy-700 text-xs font-semibold text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Andhra Pradesh State Emergency Response Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] max-w-4xl mx-auto">
            CrisisMap <span className="text-red-500">AP</span> Emergency Response
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
            A unified, multi-role disaster response platform connecting affected citizens, accredited relief organizations, and state command authorities across Andhra Pradesh.
          </p>

          {/* Currently Logged In Banner (if session active) */}
          {currentUser && (
            <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-navy-800/90 border border-emerald-500/40 text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    Signed in as: <span className="text-emerald-300">{currentUser.full_name}</span> ({currentUser.email})
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Role: <strong className="uppercase text-amber-300">{currentUser.role === 'admin' ? 'State Administrator' : currentUser.role === 'government_official' ? 'Government Official' : currentUser.role === 'responder' ? 'NGO / Responder' : 'Citizen'}</strong> &bull; Status: <strong className="uppercase text-emerald-300">{currentUser.status}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (currentUser.role === 'admin') navigate('/admin');
                    else if (currentUser.role === 'government_official') navigate('/government');
                    else if (currentUser.role === 'responder') navigate('/responder');
                    else navigate('/citizen');
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 hover:bg-navy-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Core Call to Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/citizen?action=sos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-red-900/50 hover:-translate-y-0.5 active:translate-y-0 transition-all beacon-active"
            >
              <AlertOctagon className="w-5 h-5 text-white" />
              <span>REQUEST EMERGENCY HELP (SOS)</span>
            </Link>

            <Link
              to="/map"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-600 text-white font-semibold text-sm hover:-translate-y-0.5 transition-all shadow-md"
            >
              <MapPin className="w-4 h-4 text-red-400" />
              <span>Live Disaster Map</span>
            </Link>

            <Link
              to="/shelters"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-navy-900/80 hover:bg-navy-800 border border-navy-700 text-slate-300 hover:text-white font-semibold text-sm transition-all"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Find Shelters & Relief</span>
            </Link>
          </div>

          {/* Genuine Telemetry Bar from Live MySQL Database */}
          <div className="mt-12 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-4 text-center backdrop-blur-sm shadow-md">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total SOS Requests</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">
                {stats.totalRequests}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Logged in Operational DB</p>
            </div>

            <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-4 text-center backdrop-blur-sm shadow-md">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Awaiting Dispatch</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-orange-400 mt-1 font-mono">
                {stats.awaitingAssistance}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Active Queue</p>
            </div>

            <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-4 text-center backdrop-blur-sm shadow-md">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Critical Life Threats</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-red-400 mt-1 font-mono">
                {stats.criticalCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">High Urgency Distress</p>
            </div>

            <div className="bg-navy-900/90 border border-navy-800 rounded-xl p-4 text-center backdrop-blur-sm shadow-md">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Relief Shelters</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 font-mono">
                {stats.totalShelters}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Capacity: {stats.totalCapacity.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. FIRST PAGE — SELECT YOUR PORTAL (PRIMARY ROLE SELECTION) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-100 text-navy-900 text-xs font-bold">
            <Compass className="w-3.5 h-3.5 text-navy-700" />
            <span>Select Your Access Role</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Select Your Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Please choose the portal corresponding to your role in the Andhra Pradesh disaster management workflow.
          </p>
        </div>

        {/* Three Prominent Portal Cards: Citizen | NGO | Government Official */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Citizen Portal */}
          <div className="rounded-2xl bg-white border-2 border-slate-200 hover:border-red-500 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-6 hover:-translate-y-1 relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-red-500/20">
                  <LifeBuoy className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-extrabold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 uppercase tracking-wider">
                  Citizen Portal
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-navy-950">
                  Citizen Portal
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Individuals, Families & Community Members
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                For citizens and families affected by floods, cyclonic storms, or emergencies in Andhra Pradesh. Submit urgent SOS requests for boat rescue, clean water, meals, or medical aid, track resolution in real-time, and locate safe relief camps.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePortalSelect('citizen', 'login')}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalSelect('citizen', 'register')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold text-xs border border-slate-300 flex items-center justify-center gap-1 transition-all"
                >
                  <span>Register</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Instant Direct Registration
                </span>
                <button
                  type="button"
                  onClick={() => handlePortalSelect('citizen', 'register')}
                  className="hover:underline text-red-600 font-semibold"
                >
                  Create Account →
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: NGO / Relief Organization Portal */}
          <div className="rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-500 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-6 hover:-translate-y-1 relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Users className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
                  Relief Organization
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-navy-950">
                  NGO / Relief Organization
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Humanitarian Units, NGOs & Field Rescue Teams
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                For registered relief organizations, volunteer emergency networks, and humanitarian teams coordinating relief operations. Review verified distress reports across AP districts, claim response assignments, dispatch resources, and log operational milestones.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePortalSelect('ngo', 'login')}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>NGO Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalSelect('ngo', 'register')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold text-xs border border-slate-300 flex items-center justify-center gap-1 transition-all"
                >
                  <span>Request Access</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin Verification Required
                </span>
                <button
                  type="button"
                  onClick={() => handlePortalSelect('ngo', 'register')}
                  className="hover:underline text-amber-700 font-semibold"
                >
                  Apply to Join →
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Government Official Portal */}
          <div className="rounded-2xl bg-white border-2 border-slate-200 hover:border-navy-900 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-6 hover:-translate-y-1 relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 text-white flex items-center justify-center shadow-md shadow-navy-900/30">
                  <ShieldAlert className="w-7 h-7 text-amber-400" />
                </div>
                <span className="text-[10px] font-extrabold text-navy-900 bg-navy-100 px-2.5 py-1 rounded-full border border-navy-200 uppercase tracking-wider">
                  Government Official
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-navy-950">
                  Government Official
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  APSDMA, District Collectors & SDRF Command
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Restricted operational command portal for state disaster coordinators, district emergency officers, and battalion commanders. Monitor real database telemetry, verify incoming incidents, prioritize life threats, assign response battalions, and oversee shelters.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handlePortalSelect('government', 'login')}
                className="w-full py-2.5 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-md shadow-navy-900/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Official Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="text-navy-800 font-semibold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-navy-700" /> Authorized Accounts Only
                </span>
                <button
                  type="button"
                  onClick={() => handlePortalSelect('government', 'login')}
                  className="hover:underline text-navy-700 font-semibold"
                >
                  Access Guidance →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated State Administrator Access Entry */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center flex-shrink-0 shadow-inner">
              <KeyRound className="w-7 h-7" />
            </div>
            <div className="space-y-1 text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-500/30">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                <span>Restricted Administrative Governance</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                State Administrator Portal
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Dedicated management portal for authorized AP state disaster overseers. Review and verify pending NGO organization applications, securely provision government official accounts, and govern state response permissions.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => handlePortalSelect('admin', 'login')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <KeyRound className="w-4 h-4 text-indigo-200" />
              <span>Administrator Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Supported Disaster Categories in Andhra Pradesh */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Supported Disaster Categories in Andhra Pradesh
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Targeted to coastal cyclonic storms along the 974 km Bay of Bengal coastline, river delta floods (Godavari & Krishna), Eastern Ghats landslides, and Rayalaseema heatwaves.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DISASTER_TYPES.map((disaster) => {
              const IconComp = disasterIcons[disaster.icon] || AlertOctagon;
              return (
                <div
                  key={disaster.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${disaster.color}15`, color: disaster.color }}
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                      {disaster.label}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {disaster.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Official Emergency Contact Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-navy-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-red-600/30 text-red-300 text-xs font-semibold">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Official Andhra Pradesh Emergency Contacts</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">
              In Real Emergencies, Contact Official Helplines Immediately
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              In case of actual natural disasters, medical crises, or flood evacuation, dial <strong>112 (National Emergency)</strong> or <strong>1070 (APSDMA State Disaster Operations Center)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <a
              href="https://apsdmagis.ap.gov.in/weather-watch/portal-home.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-navy-950 font-bold text-xs hover:bg-slate-100 transition-colors shadow-md"
            >
              <span>APSDMA GIS Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-700 text-white font-semibold text-xs hover:bg-navy-600 transition-colors border border-navy-600"
            >
              <span>Safety & Survival Guidelines</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
