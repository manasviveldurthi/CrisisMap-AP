import React from 'react';
import {
  ShieldAlert,
  Info,
  ExternalLink,
  PhoneCall,
  CheckCircle2,
  Waves,
  CloudLightning,
  Sun,
  Flame,
  Hammer,
  HeartPulse,
  Mountain,
  MapPin,
  Building2,
  Compass,
  AlertTriangle
} from 'lucide-react';
import { DISASTER_TYPES } from '../data/disasterTypes';
import { AP_DISTRICTS } from '../data/districts';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            About CrisisMap AP & Safety Protocols
          </h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-800 border border-navy-200">
            Andhra Pradesh
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Platform mission, disaster vulnerability profile, and standard operating procedures for citizen safety.
        </p>
      </div>

      {/* Mandatory Academic & Disclaimer Callout */}
      <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-6 text-amber-950 space-y-3 shadow-sm">
        <div className="flex items-center gap-2.5 text-amber-900 font-extrabold text-sm sm:text-base">
          <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <span>Statutory Safety Disclaimer & Academic Purpose Notice</span>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-amber-900">
          <strong>CrisisMap AP is an academic research and engineering prototype</strong> designed to demonstrate modern
          geospatial web engineering, crowd-sourced incident triage, and community shelter indexing.
          <strong> It does NOT replace or supersede official government disaster advisories, warnings, or emergency dispatches.</strong>
        </p>
        <p className="text-xs leading-relaxed text-amber-800">
          Do not rely on this website for live lifesaving decisions. In any actual emergency situation across Andhra Pradesh,
          always contact the <strong>State Emergency Operations Center (APSDMA) at 1070</strong>, or dial <strong>112</strong>.
        </p>
      </div>

      {/* Mission & Purpose */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
          <Info className="w-5 h-5 text-red-600" />
          <span>Platform Mission</span>
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Andhra Pradesh possesses the second-longest mainland coastline in India (~974 km), rendering its coastal
            districts heavily susceptible to Bay of Bengal cyclonic storms, storm surges, and river delta flooding across the
            mighty Godavari, Krishna, and Pennar basins. Simultaneously, the Rayalaseema districts face recurring arid droughts
            and severe heatwaves, while the Eastern Ghats terrain experiences periodic monsoon landslides and flash floods.
          </p>
          <p>
            <strong>CrisisMap AP</strong> bridges the crucial communication gap during disasters by demonstrating how real-time
            interactive maps, crowd-sourced local reporting, and centralized shelter registries can operate seamlessly
            on modern web standards with zero backend overhead.
          </p>
        </div>
      </section>

      {/* Supported Disaster Types and Citizen Safety Advice */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Supported Hazards & Official Citizen Safety Protocols</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DISASTER_TYPES.map((type) => (
            <div
              key={type.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-3">
                <span
                  style={{ backgroundColor: `${type.color}15`, color: type.color }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                >
                  ●
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{type.label}</h3>
                  <p className="text-[11px] text-slate-500">{type.description}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Citizen Safety Guidelines
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  {type.safetyTips.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Official Government Portals & External References */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-blue-600" />
          <span>Official Andhra Pradesh Disaster Management Resources</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://apsdmagis.ap.gov.in/weather-watch/portal-home.html"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  OFFICIAL PORTAL
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                APSDMA GIS Portal
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                State Disaster Management Authority live Doppler radar, river water levels, and automated weather stations.
              </p>
            </div>
            <span className="mt-3 text-xs font-semibold text-blue-600 group-hover:underline">
              Visit apsdmagis.ap.gov.in →
            </span>
          </a>

          <a
            href="https://ap.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-navy-500 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-navy-800 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                  GOVERNMENT AP
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-navy-800" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Government of Andhra Pradesh
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Official state administration portal providing government orders, relief fund allocations, and civil guidelines.
              </p>
            </div>
            <span className="mt-3 text-xs font-semibold text-navy-800 group-hover:underline">
              Visit ap.gov.in →
            </span>
          </a>

          <a
            href="https://www.openstreetmap.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  OPEN GEODATA
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                OpenStreetMap Foundation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Global collaborative open geospatial database powering CrisisMap AP’s map cartography under open license.
              </p>
            </div>
            <span className="mt-3 text-xs font-semibold text-emerald-600 group-hover:underline">
              Visit openstreetmap.org →
            </span>
          </a>
        </div>
      </section>

      {/* Emergency Helplines Card */}
      <section className="bg-navy-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl border border-navy-800">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-red-500" />
          <span>Statutory Emergency Helpline Directory (India & AP)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
            <span className="text-slate-400 text-[11px] block">National Emergency</span>
            <span className="text-xl font-bold text-white mt-1 block">112</span>
            <span className="text-[10px] text-slate-400">Police / Fire / Health</span>
          </div>

          <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
            <span className="text-slate-400 text-[11px] block">APSDMA Control</span>
            <span className="text-xl font-bold text-amber-400 mt-1 block">1070</span>
            <span className="text-[10px] text-slate-400">State Disaster Cell</span>
          </div>

          <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
            <span className="text-slate-400 text-[11px] block">Ambulance Service</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">108</span>
            <span className="text-[10px] text-slate-400">Emergency Medical</span>
          </div>

          <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
            <span className="text-slate-400 text-[11px] block">Health Advice Line</span>
            <span className="text-xl font-bold text-blue-400 mt-1 block">104</span>
            <span className="text-[10px] text-slate-400">Medical Consultation</span>
          </div>
        </div>
      </section>
    </div>
  );
}
