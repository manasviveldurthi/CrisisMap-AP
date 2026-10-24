import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  MapPin,
  Home,
  Building2,
  Menu,
  X,
  UserCheck,
  ShieldAlert,
  KeyRound,
  AlertOctagon,
  LogOut,
  Info,
  Clock,
  CheckCircle2,
  Users,
  ShieldCheck,
  User
} from 'lucide-react';
import { useCrisis } from '../../context/CrisisContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { stats, currentUser, logout } = useCrisis();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  // Build role-appropriate navigation links dynamically
  let navLinks = [];

  if (!currentUser) {
    // PUBLIC / UNCOMMITTED VISITOR NAVIGATION
    navLinks = [
      { name: 'Home', path: '/', icon: Home },
      { name: 'Live Disaster Map', path: '/map', icon: MapPin },
      { name: 'Shelters & Relief', path: '/shelters', icon: Building2 },
      { name: 'About & Safety', path: '/about', icon: Info },
    ];
  } else if (currentUser.role === 'citizen') {
    // CITIZEN AUTHENTICATED NAVIGATION (Never shows NGO or Government portals)
    navLinks = [
      { name: 'Citizen Dashboard', path: '/citizen', icon: LifeBuoy },
      {
        name: 'My SOS Requests',
        path: '/citizen?tab=my-requests',
        icon: Clock,
        badge: stats.myRequestsCount > 0 ? `${stats.myRequestsCount}` : null,
        badgeColor: 'bg-blue-500/20 text-blue-300'
      },
      { name: 'Live Disaster Map', path: '/map', icon: MapPin },
      { name: 'Shelters & Relief', path: '/shelters', icon: Building2 },
    ];
  } else if (currentUser.role === 'responder') {
    // NGO & RESPONDER AUTHENTICATED NAVIGATION (Never shows Citizen or Admin portals)
    navLinks = [
      { name: 'NGO Dashboard', path: '/responder', icon: UserCheck },
      {
        name: 'Emergency Queue',
        path: '/responder?tab=all',
        icon: Clock,
        badge: stats.awaitingAssistance > 0 ? `${stats.awaitingAssistance}` : null,
        badgeColor: 'bg-amber-500/20 text-amber-300'
      },
      { name: 'My Assignments', path: '/responder?tab=my-assignments', icon: CheckCircle2 },
      { name: 'Operational Map', path: '/map', icon: MapPin },
      { name: 'Relief Shelters', path: '/shelters', icon: Building2 },
    ];
  } else if (currentUser.role === 'admin') {
    // STATE ADMINISTRATOR AUTHENTICATED NAVIGATION
    navLinks = [
      { name: 'Admin Dashboard', path: '/admin', icon: ShieldAlert },
      { name: 'Operations Command', path: '/government', icon: Clock },
      { name: 'Live Disaster Map', path: '/map', icon: MapPin },
      { name: 'Shelters & Relief', path: '/shelters', icon: Building2 },
    ];
  } else if (currentUser.role === 'government_official') {
    // GOVERNMENT OFFICIAL AUTHENTICATED NAVIGATION
    navLinks = [
      { name: 'Operations Command', path: '/government', icon: ShieldAlert },
      {
        name: 'Emergency Queue',
        path: '/government?tab=queue',
        icon: Clock,
        badge: stats.criticalCount > 0 ? `${stats.criticalCount} Critical` : null,
        badgeColor: 'bg-red-600/30 text-red-300'
      },
      { name: 'Incident Map', path: '/map', icon: MapPin },
      { name: 'Shelters & Relief', path: '/shelters', icon: Building2 },
    ];
  }

  return (
    <header className="sticky top-0 z-50 bg-navy-900 border-b border-navy-800 text-white shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Branding */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 shadow-md shadow-red-900/30 group-hover:scale-105 transition-transform">
              <LifeBuoy className="w-6 h-6 text-white animate-spin-slow" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-navy-900"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  CrisisMap <span className="text-red-500">AP</span>
                </span>
                <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-navy-800 text-slate-300 border border-navy-700">
                  ANDHRA PRADESH
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide hidden sm:block">
                Emergency Help & Disaster Response Coordination
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links - Tailored strictly to verified role */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-navy-800 text-white font-semibold shadow-inner border border-navy-700'
                        : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${link.badgeColor}`}>
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action: Role-specific User indicator & Logout or Sign In */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-navy-700 flex items-center justify-center text-slate-200">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white text-[12px] leading-tight truncate max-w-[120px] lg:max-w-[160px]">
                      {currentUser.full_name}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      {currentUser.role === 'admin' ? 'State Admin' : currentUser.role === 'government_official' ? 'Govt Official' : currentUser.role === 'responder' ? (currentUser.organization_name || 'NGO') : 'Citizen'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out securely"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Portal</span>
                </Link>

                <Link
                  to="/login?portal=admin"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 hover:text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm"
                  title="Restricted Administrator Access"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Admin Portal</span>
                </Link>
              </div>
            )}

            {/* Request Help SOS (Available for citizens and public) */}
            {(!currentUser || currentUser.role === 'citizen') && (
              <Link
                to="/citizen?action=sos"
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-700/30 hover:shadow-red-700/50 hover:-translate-y-0.5 active:translate-y-0 transition-all focus:ring-2 focus:ring-red-400 focus:outline-none beacon-active"
              >
                <AlertOctagon className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Request Help (SOS)</span>
                <span className="sm:hidden">SOS</span>
              </Link>
            )}

            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-navy-800 text-slate-300 hover:text-white hover:bg-navy-700 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-950 border-b border-navy-800 px-4 pt-3 pb-5 space-y-2 animate-fadeIn">
          {currentUser && (
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 text-xs mb-2 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">{currentUser.full_name}</p>
                <p className="text-[11px] text-slate-400">
                  Role: <strong className="uppercase text-amber-400">{currentUser.role}</strong>
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-bold"
              >
                Logout
              </button>
            </div>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-navy-800 text-red-400 font-semibold border-l-4 border-red-500'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-slate-400" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${link.badgeColor}`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {!currentUser && (
            <div className="pt-2 border-t border-navy-800 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-amber-300 bg-navy-900 border border-navy-800"
              >
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Select Portal / Sign In</span>
              </Link>
              <Link
                to="/login?portal=admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-800"
              >
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>State Admin Portal</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
