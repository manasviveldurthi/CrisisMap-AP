import React from 'react';
import { ExternalLink, ShieldAlert, Heart, Info, ArrowUpRight, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800 mt-auto">
      {/* Disclaimer Strip */}
      <div className="bg-navy-900/80 border-b border-navy-800 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300">Public Safety Notice:</strong> CrisisMap AP is an academic
              demonstration and research prototype. This system does <em>not</em> issue statutory disaster
              alerts, live meteorological warnings, or command emergency dispatches. In life-threatening emergencies,
              immediately contact official government emergency numbers.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="tel:112"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/30 text-red-200 border border-red-500/40 text-xs font-semibold hover:bg-red-600/50 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Dial 112
            </a>
            <a
              href="tel:1070"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              APSDMA 1070
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Platform Overview */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-sm">
                AP
              </div>
              <span className="font-bold text-lg text-white">CrisisMap AP</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Geospatial disaster awareness and community reporting frontend platform dedicated to the 26 districts
              of Andhra Pradesh, India.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              <span className="inline-block px-2.5 py-1 rounded bg-navy-800 text-blue-300 font-semibold border border-navy-700">
                FastAPI • MySQL • Role-Based Security
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Public Access</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Portal Selection (Home)</Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-white transition-colors">Interactive Disaster Map</Link>
              </li>
              <li>
                <Link to="/shelters" className="hover:text-white transition-colors">Relief Shelters Directory</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Disaster Safety Protocols</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white text-red-400 font-semibold transition-colors">Select Portal / Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Official State Resources (External) */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Official AP Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://ap.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors group"
                >
                  <span>Andhra Pradesh Government</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                </a>
              </li>
              <li>
                <a
                  href="https://apsdmagis.ap.gov.in/weather-watch/portal-home.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors group"
                >
                  <span>APSDMA GIS Weather Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.openstreetmap.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors group"
                >
                  <span>OpenStreetMap Cartography</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                </a>
              </li>
              <li>
                <a
                  href="https://mausam.imd.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors group"
                >
                  <span>IMD Cyclone Warning Cell</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Storage Notice */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Architecture & Security</h4>
            <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 text-xs text-slate-400 space-y-1.5">
              <p>
                <strong>Secure Backend:</strong> Powered by a FastAPI REST engine connected to a live MySQL disaster database.
              </p>
              <p>
                Role permissions are verified server-side with JWT authentication. Public self-registration is strictly restricted to citizens, with NGO verification oversight.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 pt-6 border-t border-navy-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} CrisisMap AP — Andhra Pradesh Disaster Awareness Prototype.</p>
          <p className="flex items-center gap-1">
            Built for Academic Evaluation & Project Demonstration.
          </p>
        </div>
      </div>
    </footer>
  );
}
