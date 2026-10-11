// Curated common job titles for the Employment History Builder.
// Used as suggestions in Step 2 when the user enters a job title.
// The user can always type their own title manually.

export const COMMON_JOB_TITLES = [
  "Cashier",
  "Sales Associate",
  "Stock Clerk",
  "Customer Service Representative",
  "Retail Associate",
  "Team Member",
  "Crew Member",
  "Shift Lead",
  "Supervisor",
  "Cook",
  "Line Cook",
  "Food Prep Worker",
  "Server",
  "Waiter",
  "Dishwasher",
  "Barista",
  "Bartender",
  "Laborer",
  "Construction Worker",
  "Landscape Laborer",
  "Warehouse Worker",
  "Forklift Operator",
  "Driver",
  "Delivery Driver",
  "Production Worker",
  "Machine Operator",
  "Assembler",
  "Janitor",
  "Custodian",
  "Housekeeper",
  "Maintenance Worker",
  "Facilities Technician",
  "Certified Nursing Assistant",
  "Home Health Aide",
  "Medical Assistant",
  "Caregiver",
  "Receptionist",
  "Office Assistant",
  "Data Entry Clerk",
  "Administrative Assistant",
  "Security Guard",
  "Instructor",
  "Teacher",
  "Program Coordinator",
];

// Job-title-specific responsibility suggestions.
// Matched by keyword so variations like "Head Cashier" or "Prep Cook" work.
// Falls back to the category-based list in responsibilityData.js when no match.

export const JOB_TITLE_RESPONSIBILITY_MAP = [
  {
    keywords: ["cashier"],
    label: "Common cashier tasks",
    responsibilities: [
      "Processed customer transactions at the register",
      "Handled cash, credit, and debit payments",
      "Provided receipts and change to customers",
      "Maintained a clean and organized checkout area",
      "Answered customer questions about products and prices",
      "Assisted with bagging purchases",
    ],
  },
  {
    keywords: ["sales associate", "sales", "retail associate", "retail", "stock clerk", "stock"],
    label: "Common retail tasks",
    responsibilities: [
      "Assisted customers with finding and selecting products",
      "Maintained sales floor appearance and organization",
      "Restocked shelves and merchandise displays",
      "Processed returns and exchanges",
      "Operated point-of-sale (POS) system",
      "Met or exceeded sales goals",
    ],
  },
  {
    keywords: ["customer service"],
    label: "Common customer service tasks",
    responsibilities: [
      "Answered customer questions and resolved concerns",
      "Handled phone, email, and in-person inquiries",
      "Processed orders and account changes",
      "Maintained customer records and documentation",
      "Escalated complex issues to supervisors",
      "Followed up with customers to ensure satisfaction",
    ],
  },
  {
    keywords: ["cook", "food prep", "prep", "kitchen"],
    label: "Common kitchen tasks",
    responsibilities: [
      "Prepared food items following recipes and standards",
      "Cooked meals to order",
      "Maintained food safety and hygiene standards",
      "Cleaned and sanitized kitchen equipment and surfaces",
      "Managed prep stations and food storage",
      "Followed health department guidelines",
    ],
  },
  {
    keywords: ["server", "waiter", "waitress"],
    label: "Common server tasks",
    responsibilities: [
      "Took customer food and drink orders",
      "Served food and beverages promptly",
      "Provided menu recommendations",
      "Processed customer payments",
      "Ensured customer satisfaction throughout the meal",
      "Maintained clean and stocked service areas",
    ],
  },
  {
    keywords: ["dishwasher"],
    label: "Common dishwasher tasks",
    responsibilities: [
      "Cleaned and sanitized dishes, utensils, and cookware",
      "Operated dishwashing equipment safely",
      "Maintained kitchen cleanliness",
      "Organized and stored clean dishes",
      "Disposed of waste and recycling properly",
    ],
  },
  {
    keywords: ["barista"],
    label: "Common barista tasks",
    responsibilities: [
      "Prepared coffee and espresso drinks to order",
      "Operated espresso machines and blenders",
      "Maintained a clean and organized workspace",
      "Handled cash and card transactions",
      "Provided friendly customer service",
      "Managed inventory and restocked supplies",
    ],
  },
  {
    keywords: ["bartender"],
    label: "Common bartender tasks",
    responsibilities: [
      "Mixed and served alcoholic and non-alcoholic drinks",
      "Checked customer IDs and verified legal drinking age",
      "Maintained bar inventory and supplies",
      "Cleaned and organized the bar area",
      "Collected payment and managed tabs",
      "Provided friendly customer service",
    ],
  },
  {
    keywords: ["laborer", "construction", "landscape"],
    label: "Common labor tasks",
    responsibilities: [
      "Operated hand and power tools safely",
      "Lifted and moved heavy materials",
      "Followed safety protocols and procedures",
      "Assisted skilled tradespeople on site",
      "Cleaned and prepared work sites",
      "Performed physically demanding tasks in various conditions",
    ],
  },
  {
    keywords: ["warehouse", "forklift", "material handler"],
    label: "Common warehouse tasks",
    responsibilities: [
      "Loaded and unloaded trucks and containers",
      "Operated forklifts and pallet jacks safely",
      "Picked, packed, and labeled orders",
      "Managed inventory and organized stock",
      "Maintained warehouse cleanliness and safety",
      "Used scanners and warehouse management systems",
    ],
  },
  {
    keywords: ["driver", "delivery"],
    label: "Common driver tasks",
    responsibilities: [
      "Operated vehicles safely and followed traffic laws",
      "Followed assigned delivery routes and schedules",
      "Loaded and unloaded packages",
      "Maintained vehicle cleanliness and performed basic maintenance",
      "Interacted professionally with customers at delivery",
      "Used navigation apps and delivery software",
    ],
  },
  {
    keywords: ["janitor", "custodian", "housekeeper", "housekeeping", "cleaning"],
    label: "Common cleaning tasks",
    responsibilities: [
      "Cleaned and sanitized restrooms, offices, and common areas",
      "Swept, mopped, vacuumed, and polished floors",
      "Emptied trash and recycling containers",
      "Restocked supplies (paper towels, soap, etc.)",
      "Reported maintenance issues and safety hazards",
      "Followed cleaning schedules and checklists",
    ],
  },
  {
    keywords: ["maintenance", "facilities", "custodial"],
    label: "Common maintenance tasks",
    responsibilities: [
      "Performed routine maintenance and minor repairs",
      "Inspected equipment and facilities for issues",
      "Operated hand and power tools",
      "Maintained maintenance logs and records",
      "Responded to work orders and service requests",
      "Followed safety procedures and lockout/tagout protocols",
    ],
  },
  {
    keywords: ["nursing assistant", "cna", "home health", "caregiver", "medical assistant"],
    label: "Common caregiving tasks",
    responsibilities: [
      "Assisted patients with daily living activities (bathing, dressing, eating)",
      "Took and recorded vital signs",
      "Maintained accurate patient care records",
      "Followed individualized care plans",
      "Communicated with nurses and healthcare team",
      "Maintained a clean and safe patient environment",
    ],
  },
  {
    keywords: ["receptionist", "office assistant", "administrative", "admin", "data entry"],
    label: "Common office tasks",
    responsibilities: [
      "Answered and directed phone calls",
      "Scheduled appointments and managed calendars",
      "Greeted and directed visitors",
      "Managed files, records, and documentation",
      "Processed paperwork and data entry",
      "Used office software and computer systems",
    ],
  },
  {
    keywords: ["security", "guard"],
    label: "Common security tasks",
    responsibilities: [
      "Monitored premises and surveillance equipment",
      "Controlled access to buildings and facilities",
      "Patrolled assigned areas on foot or by vehicle",
      "Wrote incident reports and maintained logs",
      "Responded to alarms and emergencies",
      "Enforced property rules and regulations",
    ],
  },
  {
    keywords: ["production", "machine operator", "assembler", "assembly", "manufacturing"],
    label: "Common production tasks",
    responsibilities: [
      "Operated machinery and production equipment",
      "Assembled products following specifications",
      "Inspected products for defects and quality",
      "Followed safety procedures and guidelines",
      "Met production quotas and deadlines",
      "Performed basic equipment maintenance",
    ],
  },
  {
    keywords: ["shift lead", "supervisor", "lead", "manager"],
    label: "Common leadership tasks",
    responsibilities: [
      "Managed team schedules and assignments",
      "Trained and mentored new employees",
      "Handled customer escalations and complaints",
      "Ensured compliance with policies and procedures",
      "Monitored team performance and productivity",
      "Opened or closed the facility",
    ],
  },
  {
    keywords: ["team member", "crew member", "crew", "associate"],
    label: "Common tasks",
    responsibilities: [
      "Assisted customers with their needs",
      "Maintained a clean and organized work area",
      "Worked as part of a team",
      "Followed standard operating procedures",
      "Handled multiple tasks efficiently",
      "Communicated effectively with coworkers",
    ],
  },
];

export function getResponsibilitiesForJobTitle(jobTitle) {
  if (!jobTitle) return null;
  const lower = jobTitle.toLowerCase().trim();
  if (!lower) return null;
  for (const entry of JOB_TITLE_RESPONSIBILITY_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry;
    }
  }
  return null;
}