import { base44 } from "@/api/base44Client";

async function invoke(payload) {
  const result = await base44.functions.invoke("employmentOutcomes", payload);
  return result?.data || result || {};
}

export const employmentOutcomesApi = {
  list: () => invoke({ action: "list" }),
  staffRecord: (data) => invoke({ action: "staff_record", ...data }),
  verify: (outcomeId, source = "Staff Verified") =>
    invoke({ action: "verify", outcome_id: outcomeId, source }),
  void: (outcomeId, reason) =>
    invoke({ action: "void", outcome_id: outcomeId, reason }),
};