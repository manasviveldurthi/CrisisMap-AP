/**
 * Assistance Categories and Urgency Constants for Citizen SOS Requests
 */

export const ASSISTANCE_CATEGORIES = [
  {
    id: "rescue",
    label: "Rescue from Flooded / Unsafe Location",
    icon: "LifeBuoy",
    description: "Stranded on roof, terrace, tree, or surrounded by rising waters.",
    color: "#dc2626",
    badgeClass: "bg-red-50 text-red-700 border-red-200"
  },
  {
    id: "water",
    label: "Drinking Water Supply",
    icon: "Droplets",
    description: "Drinking water exhausted or local groundwater contaminated.",
    color: "#2563eb",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "food",
    label: "Food and Essential Supplies",
    icon: "Utensils",
    description: "Dry rations, baby formula milk, cooked meals, or provisions.",
    color: "#d97706",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "medical",
    label: "Medical Assistance / First Aid",
    icon: "HeartPulse",
    description: "Injured persons, chronic medication shortage, or urgent paramedic care.",
    color: "#7c3aed",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "shelter",
    label: "Temporary Shelter Accommodation",
    icon: "Building2",
    description: "House collapsed, uninhabitable, or submerged; need relief camp space.",
    color: "#059669",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "evacuation",
    label: "Evacuation Support for Vulnerable Persons",
    icon: "Users",
    description: "Bedridden patients, pregnant women, elderly, or infants requiring transport.",
    color: "#ea580c",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200"
  },
  {
    id: "other",
    label: "Other Emergency Assistance",
    icon: "HelpCircle",
    description: "Snapped power line hazard, animal rescue, or communication distress.",
    color: "#475569",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300"
  }
];

export const REQUEST_STATUSES = {
  "Submitted": {
    label: "Submitted",
    sublabel: "Awaiting Acknowledgment",
    color: "#ea580c",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-300",
    dotClass: "bg-orange-500",
    step: 1
  },
  "Acknowledged": {
    label: "Acknowledged",
    sublabel: "Under Evaluation",
    color: "#d97706",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
    dotClass: "bg-amber-500",
    step: 2
  },
  "Assigned to Responder": {
    label: "Assigned",
    sublabel: "Responder Assigned",
    color: "#2563eb",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-300",
    dotClass: "bg-blue-500",
    step: 3
  },
  "Assistance Dispatched": {
    label: "Dispatched",
    sublabel: "Team En Route",
    color: "#7c3aed",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-300",
    dotClass: "bg-purple-500",
    step: 4
  },
  "Assistance Delivered / In Progress": {
    label: "In Progress",
    sublabel: "Assistance Delivered on Site",
    color: "#0891b2",
    badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-300",
    dotClass: "bg-cyan-500",
    step: 5
  },
  "Resolved": {
    label: "Resolved",
    sublabel: "Assistance Completed",
    color: "#059669",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dotClass: "bg-emerald-500",
    step: 6
  },
  "Cancelled": {
    label: "Cancelled",
    sublabel: "Withdrawn by Citizen",
    color: "#64748b",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    dotClass: "bg-slate-400",
    step: -1
  },
  "Unable to Assist": {
    label: "Unable to Assist",
    sublabel: "Escalated / Inaccessible",
    color: "#dc2626",
    badgeClass: "bg-red-50 text-red-800 border-red-300",
    dotClass: "bg-red-500",
    step: -2
  }
};

export const URGENCY_LEVELS = {
  "Critical": {
    label: "Critical (Immediate Life Safety Threat)",
    shortLabel: "Critical",
    color: "#dc2626",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
    description: "Rising floodwater, life-threatening injury, or citizens trapped with zero exit."
  },
  "High": {
    label: "High (Urgent Food, Water, or Medical Care)",
    shortLabel: "High",
    color: "#ea580c",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
    description: "Vulnerable individuals, exhausted drinking water, or cut-off electricity for >24h."
  },
  "Medium": {
    label: "Medium (Cut Off / Structural Disruption)",
    shortLabel: "Medium",
    color: "#d97706",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    description: "Stagnant water, road cut off, need supplies within next 12 hours."
  },
  "Low": {
    label: "Low (Precautionary / Minor Relief Need)",
    shortLabel: "Low",
    color: "#2563eb",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    description: "General relief supplies inquiry or non-urgent accommodation request."
  }
};
