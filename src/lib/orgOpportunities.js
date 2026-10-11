import { base44 } from "@/api/base44Client";

async function invoke(payload) {
  const result = await base44.functions.invoke("orgOpportunities", payload);
  return result?.data || result || {};
}

export const orgOpportunitiesApi = {
  list: () => invoke({ action: "list" }),
  get: (opportunityId) => invoke({ action: "get", opportunity_id: opportunityId }),
  create: (data) => invoke({ action: "create", ...data }),
  update: (opportunityId, data) => invoke({ action: "update", opportunity_id: opportunityId, ...data }),
  submit: (opportunityId) => invoke({ action: "submit", opportunity_id: opportunityId }),
  review: (opportunityId, decision, reviewNote = "") =>
    invoke({ action: "review", opportunity_id: opportunityId, decision, review_note: reviewNote }),
  close: (opportunityId, status) => invoke({ action: "close", opportunity_id: opportunityId, status }),
  reopen: (opportunityId) => invoke({ action: "reopen", opportunity_id: opportunityId }),
};