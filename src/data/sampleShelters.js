/**
 * Fictional Sample Shelters and Relief Centers for Andhra Pradesh
 * All records are simulated for academic/demonstration purposes.
 * Real shelter openings during actual disasters are officially announced by APSDMA and District Collectorates.
 */

export const INITIAL_SAMPLE_SHELTERS = [
  {
    id: "SHELTER-AP-01",
    name: "Cyclone Multipurpose Relief Center",
    district: "Dr. B.R. Ambedkar Konaseema",
    location: "Amalapuram Coastal Belt, Bypass Road",
    coordinates: [16.5742, 82.0018],
    capacity: 650,
    currentOccupants: 184,
    status: "Active",
    facilities: [
      "Potable RO Drinking Water",
      "Community Kitchen (Hot Meals)",
      "Dedicated Diesel Generator (24x7)",
      "First-Aid Medical Dispensary",
      "Sanitary Facilities & Child Care",
      "Wireless VHF Communications"
    ],
    contactRole: "Shelter In-Charge Officer (Demo Role)",
    officialHelpline: "Dial 112 (National Emergency) / 1070 (APSDMA)",
    isDemo: true
  },
  {
    id: "SHELTER-AP-02",
    name: "Indira Gandhi Municipal Stadium Relief Camp",
    district: "NTR (Vijayawada)",
    location: "MG Road, Vijayawada Central",
    coordinates: [16.5085, 80.6492],
    capacity: 1200,
    currentOccupants: 460,
    status: "Active",
    facilities: [
      "Large Indoor Hall with Clean Bedding",
      "Medical Post with 108 Ambulance On-Site",
      "Clean Drinking Water Tankers",
      "Food Packet Distribution Center",
      "Mobile Phone Charging Kiosk",
      "Separate Quarantine / Fever Enclosure"
    ],
    contactRole: "VMC Relief Coordinator (Demo Role)",
    officialHelpline: "Dial 112 (National Emergency) / 1070 (APSDMA)",
    isDemo: true
  },
  {
    id: "SHELTER-AP-03",
    name: "Port Trust Community Cyclone Shelter",
    district: "Visakhapatnam",
    location: "Salagramapuram, Visakhapatnam Port Zone",
    coordinates: [17.7010, 83.2750],
    capacity: 800,
    currentOccupants: 210,
    status: "Active",
    facilities: [
      "Reinforced Cyclone Resistant Concrete Structure",
      "Solar Backup & Generator Facility",
      "Child Nutrition & Milk Distribution",
      "Women & Senior Citizen Care Area",
      "Clean Sanitation Blocks"
    ],
    contactRole: "VPT Relief Desk (Demo Role)",
    officialHelpline: "Dial 112 (National Emergency) / 1070 (APSDMA)",
    isDemo: true
  },
  {
    id: "SHELTER-AP-04",
    name: "Government Polytechnic College Relief Complex",
    district: "East Godavari",
    location: "Bommur, Rajahmundry",
    coordinates: [16.9850, 81.7910],
    capacity: 750,
    currentOccupants: 125,
    status: "Active",
    facilities: [
      "Spacious Classrooms for Family Stays",
      "Community Dining Hall",
      "Primary Health Center Medical Team",
      "Safe Drinking Water Purifiers",
      "Ample Parking for Relief Trucks"
    ],
    contactRole: "Sub-Collectorate Camp Officer (Demo Role)",
    officialHelpline: "Dial 112 (National Emergency) / 1070 (APSDMA)",
    isDemo: true
  },
  {
    id: "SHELTER-AP-05",
    name: "Coastal Fisherfolk Cyclone Safehouse",
    district: "Kakinada",
    location: "Vakalapudi Beach Road, Kakinada Rural",
    coordinates: [17.0210, 82.2610],
    capacity: 500,
    currentOccupants: 340,
    status: "Active",
    facilities: [
      "Elevated Stilt Foundation against Storm Surge",
      "Emergency Food Rations Store",
      "First Aid Station with Paramedics",
      "Emergency Lighting Battery Bank"
    ],
    contactRole: "Fisheries Department Liaison (Demo Role)",
    officialHelpline: "Dial 112 (National Emergency) / 1070 (APSDMA)",
    isDemo: true
  },
  {
    id: "SHELTER-AP-06",
    name: "Municipal High School Emergency Center",
    district: "SPSR Nellore",
    location: "Dargamitta, Nellore City",
    coordinates: [14.4320, 79.9810],
    capacity: 600,
    currentOccupants: 90,
    status: "Active",
    facilities: [
      "Drinking Water Purification Units",
      "Community Meal Counters",
      "Bedding & Clean Blankets Supply",
      "Medical Inspection Room"
    ],
    contactRole: "Municipal Education Officer (Demo Role)",
    officialHelpline: "Dial 112 (National Emergency) / 1070 (APSDMA)",
    isDemo: true
  },
  {
    id: "SHELTER-AP-07",
    name: "Indoor Sports Complex Relief Camp",
    district: "Kurnool",
    location: "Near Outdoor Stadium, Kurnool Town",
    coordinates: [15.8210, 78.0320],
    capacity: 900,
    currentOccupants: 0,
    status: "Standby",
    facilities: [
      "Multi-purpose High-ceiling Indoor Arena",
      "Emergency Generator Grid",
      "Showers & Sanitation Facilities",
      "Large Storage for Relief Supplies"
    ],
    contactRole: "District Sports Officer (Demo Role)",
    officialHelpline: "Dial 112 (National Emergency) / 1070 (APSDMA)",
    isDemo: true
  },
  {
    id: "SHELTER-AP-08",
    name: "Tribal Welfare Residential School Shelter",
    district: "Alluri Sitharama Raju",
    location: "Paderu High Altitude Camp",
    coordinates: [18.0810, 82.6620],
    capacity: 450,
    currentOccupants: 75,
    status: "Active",
    facilities: [
      "Thermal Blankets & Winter Clothing Store",
      "Wood Fire Heaters for Mountain Weather",
      "Emergency Dry Rations",
      "Auxiliary Health Worker on Duty"
    ],
    contactRole: "ITDA Welfare Officer (Demo Role)",
    officialHelpline: "Dial 112 (National Emergency) / 1070 (APSDMA)",
    isDemo: true
  }
];
