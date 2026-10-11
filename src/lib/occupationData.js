// Work categories and occupation data for the Job Goals guided experience.

export const WORK_CATEGORIES = [
  "Construction & Skilled Trades",
  "Warehouse & Manufacturing",
  "Transportation & Driving",
  "Landscaping & Property Maintenance",
  "Customer Service & Retail",
  "Office & Administration",
  "Healthcare & Human Services",
  "Food Service & Hospitality",
  "Cleaning & Custodial",
  "Security",
  "Education & Childcare",
  "Technology",
  "Sales & Marketing",
  "Skilled Manufacturing",
  "Government & Public Service",
  "Other",
];

export const OCCUPATIONS_BY_CATEGORY = {
  "Construction & Skilled Trades": [
    "General Laborer", "Carpenter", "Carpenter Helper", "Painter", "Drywall Installer",
    "Electrician", "Electrician Helper", "HVAC Helper", "Plumber Helper", "Roofer",
    "Concrete Laborer", "Construction Laborer", "Maintenance Technician",
  ],
  "Warehouse & Manufacturing": [
    "Warehouse Associate", "Forklift Operator", "Shipping & Receiving", "Material Handler",
    "Picker/Packer", "Inventory Associate", "Production Worker", "Machine Operator",
  ],
  "Transportation & Driving": [
    "Delivery Driver", "CDL Driver", "Driver Helper", "Courier",
  ],
  "Landscaping & Property Maintenance": [
    "Landscaper", "Groundskeeper", "Lawn Care Technician", "Property Maintenance Technician",
    "Snow Removal Operator",
  ],
  "Customer Service & Retail": [
    "Cashier", "Retail Associate", "Customer Service Representative", "Store Associate",
    "Shift Supervisor",
  ],
  "Office & Administration": [
    "Administrative Assistant", "Receptionist", "Office Assistant", "Data Entry Clerk",
    "Records Clerk",
  ],
  "Healthcare & Human Services": [
    "Direct Support Professional", "Behavioral Health Technician", "Case Manager",
    "Peer Support Specialist", "Community Health Worker", "Medical Receptionist",
  ],
  "Food Service & Hospitality": [
    "Cook", "Prep Cook", "Dishwasher", "Food Service Worker", "Server", "Barista",
  ],
  "Cleaning & Custodial": [
    "Janitor", "Custodian", "Housekeeper", "Environmental Services Worker",
  ],
  "Security": [
    "Security Officer", "Security Guard", "Loss Prevention Specialist",
  ],
  "Education & Childcare": [
    "Teacher Assistant", "Childcare Worker", "Substitute Teacher", "Tutor",
  ],
  "Technology": [
    "IT Support Specialist", "Help Desk Technician", "Data Analyst", "Software Developer",
  ],
  "Sales & Marketing": [
    "Sales Associate", "Sales Representative", "Marketing Coordinator", "Account Executive",
  ],
  "Skilled Manufacturing": [
    "CNC Operator", "Welder", "Quality Inspector", "Assembly Technician",
  ],
  "Government & Public Service": [
    "Postal Worker", "Park Ranger", "Administrative Clerk", "Public Works Laborer",
  ],
  "Other": [],
};

// Keyword → occupation suggestion mappings based on employment history.
// Each entry defines keywords to search for in job titles, employer names, and duties,
// and the occupations to suggest when a match is found.
const EXPERIENCE_SUGGESTION_MAP = [
  {
    keywords: ["landscap", "lawn", "grounds", "property maintenance", "gardening", "yard work"],
    suggestions: ["Landscaper", "Groundskeeper", "Property Maintenance Technician", "Construction Laborer"],
  },
  {
    keywords: ["retail", "cashier", "store", "sales associate", "customer service", "shop"],
    suggestions: ["Customer Service Representative", "Retail Associate", "Shift Supervisor"],
  },
  {
    keywords: ["case manager", "social work", "case management", "community health", "peer support"],
    suggestions: ["Case Manager", "Community Health Worker", "Peer Support Specialist"],
  },
  {
    keywords: ["warehouse", "forklift", "inventory", "shipping", "receiving", "picker", "packer", "material handler"],
    suggestions: ["Warehouse Associate", "Forklift Operator", "Material Handler", "Inventory Associate"],
  },
  {
    keywords: ["cook", "kitchen", "food service", "dishwash", "prep cook", "server", "barista", "restaurant"],
    suggestions: ["Cook", "Prep Cook", "Food Service Worker", "Server", "Barista"],
  },
  {
    keywords: ["clean", "janitor", "custodian", "housekeep", "environmental services"],
    suggestions: ["Janitor", "Custodian", "Housekeeper", "Environmental Services Worker"],
  },
  {
    keywords: ["drive", "delivery", "courier", "cdl", "truck", "route driver"],
    suggestions: ["Delivery Driver", "CDL Driver", "Driver Helper", "Courier"],
  },
  {
    keywords: ["construct", "carpenter", "electrician", "plumber", "painter", "roof", "drywall", "concrete", "hvac"],
    suggestions: ["Construction Laborer", "General Laborer", "Maintenance Technician", "Carpenter Helper"],
  },
  {
    keywords: ["office", "admin", "reception", "data entry", "clerk", "secretary"],
    suggestions: ["Administrative Assistant", "Receptionist", "Data Entry Clerk", "Records Clerk"],
  },
  {
    keywords: ["security", "guard", "loss prevention", "patrol"],
    suggestions: ["Security Officer", "Security Guard", "Loss Prevention Specialist"],
  },
  {
    keywords: ["manufactur", "production", "machine operator", "assembly", "cnc", "weld"],
    suggestions: ["Production Worker", "Machine Operator", "Assembly Technician", "Quality Inspector"],
  },
  {
    keywords: ["childcare", "teacher", "tutor", "education", "daycare", "preschool"],
    suggestions: ["Teacher Assistant", "Childcare Worker", "Substitute Teacher", "Tutor"],
  },
  {
    keywords: ["healthcare", "nurse", "medical", "patient care", "caregiver", "direct support"],
    suggestions: ["Direct Support Professional", "Behavioral Health Technician", "Medical Receptionist"],
  },
];

// Generate suggested occupations based on employment history.
// Returns occupations not already selected by the user.
export function getSuggestedOccupations(employmentRecords = [], selectedOccupations = []) {
  if (!employmentRecords || employmentRecords.length === 0) return [];

  const suggestions = [];

  for (const record of employmentRecords) {
    const text = `${record.job_title || ""} ${record.employer_name || ""} ${record.duties || ""}`.toLowerCase();

    for (const mapping of EXPERIENCE_SUGGESTION_MAP) {
      const hasMatch = mapping.keywords.some((kw) => text.includes(kw));
      if (hasMatch) {
        for (const occ of mapping.suggestions) {
          if (!suggestions.includes(occ)) {
            suggestions.push(occ);
          }
        }
      }
    }
  }

  // Filter out occupations the user already selected
  return suggestions.filter((s) => !selectedOccupations.includes(s));
}