import { base44 } from "@/api/base44Client";

async function invoke(name, payload) {
  const result = await base44.functions.invoke(name, payload);
  return result?.data || result || {};
}

export const orgEmployersApi = {
  list: () => invoke("orgEmployers", { action: "list" }),
  get: (employerId) => invoke("orgEmployers", { action: "get", employer_id: employerId }),
  create: (data) => invoke("orgEmployers", { action: "create", ...data }),
  update: (employerId, data) => invoke("orgEmployers", { action: "update", employer_id: employerId, ...data }),
  archive: (employerId) => invoke("orgEmployers", { action: "archive", employer_id: employerId }),
  contacts: (employerId) => invoke("orgContacts", { action: "list", employer_id: employerId }),
  createContact: (employerId, data) => invoke("orgContacts", { action: "create", employer_id: employerId, ...data }),
  updateContact: (contactId, data) => invoke("orgContacts", { action: "update", contact_id: contactId, ...data }),
  activities: (employerId) => invoke("orgActivity", { action: "list", employer_id: employerId }),
  logActivity: (employerId, data) => invoke("orgActivity", { action: "create", employer_id: employerId, ...data }),
  completeNextStep: (activityId) => invoke("orgActivity", { action: "complete_next_step", activity_id: activityId }),
};