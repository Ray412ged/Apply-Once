import { base44 } from "@/api/base44Client";

const KEY = "ao_auberle_invite";

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function rememberAuberleInvite({ token, email }) {
  if (!token) return;
  storage()?.setItem(
    KEY,
    JSON.stringify({
      token,
      email: String(email || "").trim().toLowerCase(),
    })
  );
}

export function getPendingAuberleInvite() {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    return {
      token: parsed.token,
      email: String(parsed.email || "").trim().toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function clearPendingAuberleInvite() {
  storage()?.removeItem(KEY);
}

export async function completePendingAuberleInvite() {
  const pending = getPendingAuberleInvite();
  if (!pending?.token) return { completed: false, data: null };

  const result = await base44.functions.invoke("claimOrgReferral", {
    action: "claim",
    token: pending.token,
  });
  const data = result?.data || result;
  if (data?.error) throw new Error(data.error);

  clearPendingAuberleInvite();
  return { completed: true, data };
}