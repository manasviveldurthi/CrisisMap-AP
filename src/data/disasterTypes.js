/**
 * Disaster Categories, Priorities, and Lifecycle Status Constants
 */

export const DISASTER_TYPES = [
  {
    id: "flood",
    label: "Flood / Inundation",
    color: "#2563eb",
    bgColor: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Rising river levels, canal breaches, or low-lying water stagnation.",
    icon: "Waves",
    safetyTips: [
      "Move to higher ground immediately; do not attempt to walk or drive through flowing water.",
      "Disconnect all electrical switches and main circuit breakers.",
      "Keep clean drinking water and non-perishable food stored safely.",
      "Stay tuned to APSDMA weather alerts on local radio or authorized portals."
    ]
  },
  {
    id: "cyclone",
    label: "Cyclone / Severe Storm",
    color: "#dc2626",
    bgColor: "bg-red-50 text-red-700 border-red-200",
    description: "High-velocity coastal winds, torrential downpours, and squall conditions.",
    icon: "CloudLightning",
    safetyTips: [
      "Board up glass windows or stay inside an interior room away from windows.",
      "Evacuate coastal vulnerable thatch-roof settlements to designated cyclone shelters.",
      "Keep mobile phones and emergency power banks fully charged in advance.",
      "Beware of the storm eye: calm winds do not mean the cyclone is over."
    ]
  },
  {
    id: "landslide",
    label: "Landslide / Rockfall",
    color: "#d97706",
    bgColor: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Slope failures, mudslides, or boulder displacement in ghat roads.",
    icon: "Mountain",
    safetyTips: [
      "Evacuate slopes immediately if unusual sounds like trees cracking or rumbling occur.",
      "Avoid travel on Eastern Ghat mountain passes (e.g., Araku, Tirumala ghat roads) during heavy rain.",
      "Report cracked soil retaining walls to local revenue or highway authorities."
    ]
  },
  {
    id: "coastal_surge",
    label: "Coastal Erosion / High Tides",
    color: "#0891b2",
    bgColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "Tidal surges, seawall overtopping, and beach erosion affecting fishing hamlets.",
    icon: "ShieldAlert",
    safetyTips: [
      "Fishermen must strictly heed the APSDMA red flag warnings and avoid venturing out.",
      "Move fishing boats, nets, and livestock at least 500 meters inland.",
      "Avoid gathering on sea walls or promenades to take photos or watch high waves."
    ]
  },
  {
    id: "heatwave",
    label: "Heatwave / Drought",
    color: "#ea580c",
    bgColor: "bg-orange-50 text-orange-700 border-orange-200",
    description: "Extreme daytime ambient temperatures (>44°C) or severe rural water distress.",
    icon: "Sun",
    safetyTips: [
      "Avoid direct outdoor exposure between 11:00 AM and 4:00 PM.",
      "Consume plenty of water, ORS (oral rehydration salts), buttermilk, or coconut water.",
      "Provide shade and drinking water for cattle and domestic animals.",
      "Seek medical help immediately if feeling dizzy, confused, or experiencing high fever."
    ]
  },
  {
    id: "fire",
    label: "Fire Outbreak",
    color: "#b91c1c",
    bgColor: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Urban commercial fires, dry crop residue blazes, or forest fringe fires.",
    icon: "Flame",
    safetyTips: [
      "Immediately alert fire response (Dial 101) and evacuate the premises.",
      "Crawl low under smoke towards the nearest emergency fire exit.",
      "Never use elevators during a building fire incident."
    ]
  },
  {
    id: "infrastructure",
    label: "Infrastructure / Bridge Damage",
    color: "#475569",
    bgColor: "bg-slate-100 text-slate-700 border-slate-300",
    description: "Culvert washout, bridge structural distress, road cut-offs, or power grid failure.",
    icon: "Hammer",
    safetyTips: [
      "Do not cross submerged causeways or barricaded bridges under any circumstance.",
      "Stay away from snapped overhead electric cables lying on the ground.",
      "Report road washouts to the local R&B (Roads and Buildings) emergency cell."
    ]
  },
  {
    id: "medical_relief",
    label: "Medical Emergency / Relief Need",
    color: "#7c3aed",
    bgColor: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Essential supply shortages, baby food requirements, or isolated medical crises.",
    icon: "HeartPulse",
    safetyTips: [
      "Dial 108 for ambulance dispatch and 104 for official health advice.",
      "Prioritize evacuation of infants, pregnant women, and elderly citizens.",
      "Boil drinking water vigorously for at least 1 minute before consuming in flood zones."
    ]
  }
];

export const PRIORITY_LEVELS = {
  Critical: {
    label: "Critical",
    color: "#dc2626",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
    icon: "AlertOctagon",
    description: "Immediate life-safety hazard or trapped citizens requiring urgent rescue."
  },
  High: {
    label: "High",
    color: "#ea580c",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
    icon: "AlertTriangle",
    description: "Severe damage, structural failure, or rapid inundation approaching homes."
  },
  Medium: {
    label: "Medium",
    color: "#d97706",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    icon: "Info",
    description: "Localized disruption, access cut-off, or utility outage without direct life risk."
  },
  Low: {
    label: "Low",
    color: "#2563eb",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "CheckCircle",
    description: "Minor waterlogging or precautionary alert for informational awareness."
  }
};

export const VERIFICATION_STATUSES = {
  Verified: {
    label: "Verified",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    dotClass: "bg-emerald-500",
    description: "Confirmed by district disaster coordination or verified ground volunteers."
  },
  Unverified: {
    label: "Unverified",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-300",
    dotClass: "bg-yellow-500",
    description: "Public citizen report awaiting administrative review and field validation."
  },
  Rejected: {
    label: "Rejected",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-300",
    dotClass: "bg-gray-400",
    description: "Report assessed as false, duplicate, or resolved before formal action."
  }
};

export const RESPONSE_STATUSES = {
  Reported: {
    label: "Reported",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300"
  },
  "Under Review": {
    label: "Under Review",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300"
  },
  Dispatched: {
    label: "Dispatched",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300"
  },
  Resolved: {
    label: "Resolved",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300"
  }
};
