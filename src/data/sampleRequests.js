/**
 * Demonstration Sample Assistance Requests (SOS Calls) for Andhra Pradesh
 * Simulates real-world citizens requesting emergency rescue, drinking water, food, and evacuation.
 */

export const INITIAL_SAMPLE_REQUESTS = [
  {
    id: "SOS-AP-2026-1001",
    emergencyType: "Flood",
    contactName: "M. Satyanarayana",
    phone: "98490 12345",
    peopleCount: 5,
    vulnerableGroups: ["Elderly (74 yrs grandmother)", "Infant (10 months old)"],
    district: "NTR (Vijayawada)",
    locality: "Ajit Singh Nagar, Near Flyover Bridge",
    address: "Door No. 12-45/A, 2nd Cross, Vivekananda Road, Singh Nagar, Vijayawada",
    coordinates: [16.5342, 80.6415],
    urgency: "Critical",
    description: "Our ground floor is inundated under 4.5 feet of Budameru floodwater. We have taken refuge on the terrace with my family of 5, including my 74-year-old mother who is a diabetic patient and a 10-month-old infant. Drinking water cans and dry food have completely run out. Mobile battery is critically low. Urgent rescue boat and baby formula needed.",
    assistanceCategories: ["rescue", "water", "food", "medical"],
    status: "Submitted",
    assignedResponder: null,
    submittedAt: "2026-10-21T09:15:00+05:30",
    lastUpdated: "2026-10-21T09:15:00+05:30",
    imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80",
    isUserCreated: false,
    timeline: [
      {
        timestamp: "2026-10-21T09:15:00+05:30",
        status: "Submitted",
        actor: "Citizen (M. Satyanarayana)",
        note: "Emergency SOS submitted via Citizen Portal. Awaiting emergency dispatcher acknowledgment."
      }
    ],
    notes: []
  },
  {
    id: "SOS-AP-2026-1002",
    emergencyType: "Flood",
    contactName: "Smt. K. Bhavani",
    phone: "94402 67890",
    peopleCount: 4,
    vulnerableGroups: ["Pregnant Woman (8 months pregnant)", "Elderly Person"],
    district: "Dr. B.R. Ambedkar Konaseema",
    locality: "Lanka Island Village near Amalapuram",
    address: "Godavari Bund Edge, Pedapatnam Lanka, Konaseema",
    coordinates: [16.5787, 82.0061],
    urgency: "Critical",
    description: "Island access wooden bridge swept away by Godavari flood discharge. Smt. Bhavani is in her 8th month of pregnancy and experiencing abdominal pain. Need immediate medical boat evacuation to Amalapuram Area Hospital.",
    assistanceCategories: ["rescue", "medical", "evacuation"],
    status: "Assigned to Responder",
    assignedResponder: "SDRF Unit 4 (Krishna Basin)",
    submittedAt: "2026-10-21T08:00:00+05:30",
    lastUpdated: "2026-10-21T08:45:00+05:30",
    imageUrl: null,
    isUserCreated: false,
    timeline: [
      {
        timestamp: "2026-10-21T08:00:00+05:30",
        status: "Submitted",
        actor: "Citizen (K. Bhavani)",
        note: "Emergency SOS lodged from river island hamlet."
      },
      {
        timestamp: "2026-10-21T08:20:00+05:30",
        status: "Acknowledged",
        actor: "Admin Officer (SEOC Dispatch)",
        note: "Request reviewed and triaged as Critical due to advanced pregnancy."
      },
      {
        timestamp: "2026-10-21T08:45:00+05:30",
        status: "Assigned to Responder",
        actor: "SEOC Coordinator",
        note: "Assigned to SDRF Unit 4 motorized rescue boat with auxiliary midwife."
      }
    ],
    notes: [
      {
        id: "NOTE-01",
        timestamp: "2026-10-21T08:50:00+05:30",
        author: "Inspector K. Prasad",
        role: "Responder",
        text: "Inflatable motorboat departing Dowleswaram ramp with paramedical kit. Estimated time of arrival 35 minutes."
      }
    ]
  },
  {
    id: "SOS-AP-2026-1003",
    emergencyType: "Landslide",
    contactName: "B. Somulu (Tribal Elder)",
    phone: "91775 54321",
    peopleCount: 18,
    vulnerableGroups: ["6 Children", "4 Senior Citizens"],
    district: "Alluri Sitharama Raju",
    locality: "Ananthagiri - Araku Valley Hill Tract",
    address: "Ghat Road KM 38, Borra Caves Link, Paderu Division",
    coordinates: [18.2140, 83.0230],
    urgency: "High",
    description: "Massive mudslide blocked the only jeep trail. Electricity poles down for 36 hours. 4 tribal families stranded without cooking gas or safe drinking water. High altitude rain continues.",
    assistanceCategories: ["water", "food", "medical"],
    status: "Assistance Dispatched",
    assignedResponder: "Indian Red Cross Society (AP Disaster Cell)",
    submittedAt: "2026-10-21T07:30:00+05:30",
    lastUpdated: "2026-10-21T09:30:00+05:30",
    imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    isUserCreated: false,
    timeline: [
      {
        timestamp: "2026-10-21T07:30:00+05:30",
        status: "Submitted",
        actor: "Citizen (B. Somulu)",
        note: "Group SOS logged for 18 isolated residents."
      },
      {
        timestamp: "2026-10-21T08:10:00+05:30",
        status: "Acknowledged",
        actor: "District Collectorate Control",
        note: "Confirmed with local revenue inspector."
      },
      {
        timestamp: "2026-10-21T08:40:00+05:30",
        status: "Assigned to Responder",
        actor: "SEOC Coordinator",
        note: "Red Cross Emergency Team designated."
      },
      {
        timestamp: "2026-10-21T09:30:00+05:30",
        status: "Assistance Dispatched",
        actor: "Red Cross Disaster Cell",
        note: "4WD relief vehicle dispatched from Visakhapatnam with water purification packets and rations."
      }
    ],
    notes: [
      {
        id: "NOTE-02",
        timestamp: "2026-10-21T09:35:00+05:30",
        author: "Dr. Sunitha Reddy",
        role: "Responder",
        text: "Carrying 100 emergency food hampers, water cans, and thermal blankets."
      }
    ]
  },
  {
    id: "SOS-AP-2026-1004",
    emergencyType: "Cyclone",
    contactName: "P. Appa Rao",
    phone: "98661 22334",
    peopleCount: 8,
    vulnerableGroups: ["3 Children"],
    district: "Kakinada",
    locality: "Uppada Fishermen Colony",
    address: "Near Old Light House, Coastal Road, Uppada",
    coordinates: [17.0750, 82.3250],
    urgency: "High",
    description: "Squall gale winds blew off the asbestos roof of our dwelling. Heavy rain soaking all belongings and children have no shelter. High waves overtopping the seawall 50 meters away.",
    assistanceCategories: ["shelter", "evacuation", "food"],
    status: "Acknowledged",
    assignedResponder: null,
    submittedAt: "2026-10-21T10:00:00+05:30",
    lastUpdated: "2026-10-21T10:15:00+05:30",
    imageUrl: null,
    isUserCreated: false,
    timeline: [
      {
        timestamp: "2026-10-21T10:00:00+05:30",
        status: "Submitted",
        actor: "Citizen (P. Appa Rao)",
        note: "SOS reported for roof collapse and high sea surge."
      },
      {
        timestamp: "2026-10-21T10:15:00+05:30",
        status: "Acknowledged",
        actor: "Kakinada Emergency Desk",
        note: "Alert acknowledged. Coordinating with Uppada Cyclone Shelter for capacity."
      }
    ],
    notes: []
  },
  {
    id: "SOS-AP-2026-1005",
    emergencyType: "Flood",
    contactName: "Ch. Venkat",
    phone: "94901 99887",
    peopleCount: 3,
    vulnerableGroups: ["Elderly (68 yrs father)"],
    district: "NTR (Vijayawada)",
    locality: "Near Benz Circle, Service Road",
    address: "Ground Floor, Sai Towers, Beside Ring Road, Vijayawada",
    coordinates: [16.5062, 80.6480],
    urgency: "Medium",
    description: "Basement parking submerged, 2 feet water in ground floor flat. Drinking water pipeline burst. Need 2 water cans and basic meal packets until water drains.",
    assistanceCategories: ["water", "food"],
    status: "Assistance Delivered / In Progress",
    assignedResponder: "SDRF Unit 4 (Krishna Basin)",
    submittedAt: "2026-10-20T16:00:00+05:30",
    lastUpdated: "2026-10-21T06:30:00+05:30",
    imageUrl: null,
    isUserCreated: false,
    timeline: [
      {
        timestamp: "2026-10-20T16:00:00+05:30",
        status: "Submitted",
        actor: "Citizen (Ch. Venkat)",
        note: "Request logged."
      },
      {
        timestamp: "2026-10-20T17:00:00+05:30",
        status: "Acknowledged",
        actor: "VMC Relief Desk",
        note: "Water supply request prioritized."
      },
      {
        timestamp: "2026-10-20T19:00:00+05:30",
        status: "Assigned to Responder",
        actor: "VMC Relief Desk",
        note: "Assigned to mobile volunteer team."
      },
      {
        timestamp: "2026-10-21T06:30:00+05:30",
        status: "Assistance Delivered / In Progress",
        actor: "Volunteer Team",
        note: "Delivered 4 water cans and dry meal packets. Assisting with drainage pump."
      }
    ],
    notes: [
      {
        id: "NOTE-03",
        timestamp: "2026-10-21T06:35:00+05:30",
        author: "Volunteer Coordinator",
        role: "Responder",
        text: "Resident provided with clean water and dry provisions. Situation stable."
      }
    ]
  },
  {
    id: "SOS-AP-2026-1006",
    emergencyType: "Cyclone",
    contactName: "G. Lakshmi",
    phone: "98481 33445",
    peopleCount: 6,
    vulnerableGroups: ["2 Children"],
    district: "Bapatla",
    locality: "Bapatla Coastal Hamlet",
    address: "Near Suryalanka Beach Link Road",
    coordinates: [15.9042, 80.4673],
    urgency: "Medium",
    description: "Thatch roof damaged during night storm. Family evacuated to Government High School Relief Camp.",
    assistanceCategories: ["shelter", "food"],
    status: "Resolved",
    assignedResponder: "AP Fire & Emergency Services (Vizag North)",
    submittedAt: "2026-10-20T12:00:00+05:30",
    lastUpdated: "2026-10-20T20:00:00+05:30",
    imageUrl: null,
    isUserCreated: false,
    timeline: [
      {
        timestamp: "2026-10-20T12:00:00+05:30",
        status: "Submitted",
        actor: "Citizen (G. Lakshmi)",
        note: "Emergency logged."
      },
      {
        timestamp: "2026-10-20T13:30:00+05:30",
        status: "Acknowledged",
        actor: "District Cell",
        note: "Acknowledged."
      },
      {
        timestamp: "2026-10-20T15:00:00+05:30",
        status: "Assistance Dispatched",
        actor: "Revenue Officer",
        note: "Transport arranged."
      },
      {
        timestamp: "2026-10-20T20:00:00+05:30",
        status: "Resolved",
        actor: "Shelter In-Charge",
        note: "All 6 family members safely accommodated in High School Cyclone Shelter with food & blankets."
      }
    ],
    notes: []
  }
];
