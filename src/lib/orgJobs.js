import { base44 } from "@/api/base44Client";

export async function getMyOpportunities() {
  const result = await base44.functions.invoke("getMyOpportunities", {});
  const data = result?.data || result || {};
  return Array.isArray(data.jobs) ? data.jobs : [];
}

export async function getJobForMe(id) {
  const result = await base44.functions.invoke("getJobForMe", { id });
  const data = result?.data || result || {};
  return data.job || null;
}

export async function getJobsForMe(ids = []) {
  const unique = [...new Set(ids.filter(Boolean))];
  const pairs = await Promise.all(
    unique.map(async (id) => {
      try {
        return [id, await getJobForMe(id)];
      } catch {
        return [id, null];
      }
    })
  );
  return Object.fromEntries(pairs.filter(([, job]) => job));
}