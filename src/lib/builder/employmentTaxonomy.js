// Reusable employment taxonomy.
// Hierarchy: Employer → Industry / Employer Type → Common Job Titles → (future: Responsibilities, Skills)
//
// employer_type is determined from Google Places types by the searchEmployerPlaces
// backend function. To add a new industry, just add an entry here — no other
// code changes needed.

export const EMPLOYMENT_TAXONOMY = {
  restaurant: {
    label: "Food Service",
    job_titles: [
      "Server", "Waiter", "Waitress", "Cook", "Line Cook", "Prep Cook",
      "Dishwasher", "Cashier", "Host", "Bartender", "Barista",
      "Shift Manager", "Assistant Manager", "General Manager",
    ],
  },
  retail: {
    label: "Retail",
    job_titles: [
      "Cashier", "Sales Associate", "Stock Clerk", "Customer Service Representative",
      "Retail Associate", "Department Supervisor", "Shift Lead",
      "Assistant Store Manager", "Store Manager",
    ],
  },
  healthcare: {
    label: "Healthcare",
    job_titles: [
      "Certified Nursing Assistant", "Home Health Aide", "Medical Assistant",
      "Patient Care Technician", "Receptionist", "Medical Records Clerk",
      "Housekeeper", "Food Service Worker", "Orderly",
    ],
  },
  hospitality: {
    label: "Hospitality",
    job_titles: [
      "Front Desk Agent", "Housekeeper", "Maintenance Worker", "Bellhop",
      "Night Auditor", "Breakfast Attendant", "Laundry Attendant",
      "Supervisor", "Assistant Manager", "General Manager",
    ],
  },
  warehouse: {
    label: "Warehousing & Logistics",
    job_titles: [
      "Warehouse Worker", "Forklift Operator", "Picker", "Packer",
      "Material Handler", "Shipping and Receiving Clerk", "Inventory Clerk",
      "Loader", "Warehouse Supervisor",
    ],
  },
  manufacturing: {
    label: "Manufacturing",
    job_titles: [
      "Production Worker", "Machine Operator", "Assembler", "Quality Inspector",
      "Packaging Associate", "Material Handler", "Maintenance Technician",
      "Line Lead", "Shift Supervisor",
    ],
  },
  construction: {
    label: "Construction",
    job_titles: [
      "Laborer", "Construction Worker", "Carpenter Helper", "Electrician Helper",
      "Roofing Laborer", "Equipment Operator", "Site Cleanup Worker", "Foreman",
    ],
  },
  education: {
    label: "Education",
    job_titles: [
      "Teacher's Aide", "Paraprofessional", "Substitute Teacher", "Cafeteria Worker",
      "Custodian", "Bus Driver", "Receptionist", "Administrative Assistant",
    ],
  },
  government: {
    label: "Government",
    job_titles: [
      "Clerk", "Administrative Assistant", "Customer Service Representative",
      "Maintenance Worker", "Custodian", "Mailroom Clerk", "Data Entry Clerk",
    ],
  },
  automotive: {
    label: "Automotive",
    job_titles: [
      "Service Technician", "Lube Technician", "Tire Technician", "Parts Associate",
      "Sales Associate", "Detailer", "Cashier", "Service Advisor",
      "Assistant Manager", "Manager",
    ],
  },
  personal_services: {
    label: "Personal Services",
    job_titles: [
      "Cosmetologist", "Hair Stylist", "Barber", "Nail Technician", "Esthetician",
      "Receptionist", "Salon Manager",
    ],
  },
  finance: {
    label: "Finance & Banking",
    job_titles: [
      "Bank Teller", "Customer Service Representative", "Personal Banker",
      "Loan Officer", "Receptionist", "Branch Manager",
    ],
  },
  fitness: {
    label: "Fitness & Recreation",
    job_titles: [
      "Front Desk Associate", "Personal Trainer", "Group Fitness Instructor",
      "Fitness Attendant", "Maintenance Worker", "Assistant Manager", "Manager",
    ],
  },
};

/**
 * Returns the taxonomy entry for a given employer type, or null if not found.
 */
export function getTaxonomyEntry(employerType) {
  if (!employerType) return null;
  return EMPLOYMENT_TAXONOMY[employerType] || null;
}

/**
 * Returns context-aware job title suggestions for a given employer type.
 * Returns null when no match is found, so the caller can fall back to
 * the general COMMON_JOB_TITLES list.
 *
 * Priority order (handled by callers):
 *   1. Employer's own custom job titles (future: EmployerCache.common_job_titles)
 *   2. Taxonomy job titles for the employer's type (this function)
 *   3. Generic COMMON_JOB_TITLES fallback
 */
export function getJobTitlesForEmployerType(employerType) {
  const entry = getTaxonomyEntry(employerType);
  return entry?.job_titles || null;
}