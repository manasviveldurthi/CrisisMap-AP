import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  UserCheck,
  ShieldAlert,
  LifeBuoy,
  LogOut,
  Building2
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';

export default function EmergencyBanner() {
  const { currentUser, logout, backendConnected } = useCrisis();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-navy-950 text-white text-xs border-b border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Operational Notice & Authentication Indicator */}
        <div className="flex items-center flex-wrap gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-bold text-red-400 uppercase tracking-wider text-[11px]">
            STATE CRISIS OPERATIONS
          </span>
          <span className="text-slate-400 hidden lg:inline">
            • Andhra Pradesh Disaster Management Coordination
          </span>

          {!backendConnected && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Backend Offline (Local Fallback Active)
            </span>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2 bg-navy-900 border border-navy-700/80 rounded-lg px-2.5 py-1 text-[11px] ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">
                Authenticated: <strong className="text-white">{currentUser.full_name}</strong>
              </span>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                currentUser.role === 'admin'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : currentUser.role === 'government_official'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : currentUser.role === 'responder'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {currentUser.role === 'admin'
                  ? 'State Admin'
                  : currentUser.role === 'government_official'
                  ? 'Govt Official'
                  : currentUser.role === 'responder'
                  ? 'NGO / Responder'
                  : 'Citizen'}
              </span>
              {currentUser.role === 'responder' && currentUser.status === 'pending_approval' && (
                <span className="text-[10px] bg-amber-950 text-amber-300 px-1 rounded font-bold">
                  Pending Verification
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              • Public Portal View
            </span>
          )}
        </div>

        {/* Right: Real Emergency Numbers & Auth action */}
        <div className="flex items-center gap-3 text-slate-300">
          {currentUser ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white font-medium bg-navy-900 hover:bg-navy-800 px-2.5 py-1 rounded-lg border border-navy-700 transition-colors"
            >
              <LogOut className="w-3 h-3 text-red-400" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white font-medium bg-navy-900/90 hover:bg-navy-800 px-2.5 py-1 rounded-lg border border-navy-700 transition-colors"
            >
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Select Portal / Sign In</span>
            </Link>
          )}

          <div className="flex items-center gap-1.5 font-mono font-bold text-white bg-red-600/20 px-2.5 py-0.5 rounded border border-red-500/30">
            <PhoneCall className="w-3 h-3 text-red-400" />
            <span>APSDMA: 1070</span>
          </div>
          <div className="flex items-center gap-1 font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
            <span>India: 112</span>
          </div>
        </div>
      </div>
    </div>
  );
}

