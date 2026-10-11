import React, { createContext, useContext, useState, useCallback } from "react";
import { isGuest } from "@/lib/guestStorage";
import GuestAccountPrompt from "@/components/jobs/GuestAccountPrompt";

/**
 * Provides a `requireAccount(path)` helper that job-browsing components call
 * before performing an account-dependent action (opening a job, saving,
 * applying, launching an external link).
 *
 * - For authenticated users: returns `false` → the caller proceeds normally.
 * - For guests: shows the account-conversion modal (remembering the intended
 *   destination) and returns `true` → the caller must NOT navigate/persist.
 *
 * The provider renders the modal itself, so callers only need to check the
 * boolean and bail out when it's true.
 */
const GuestJobGateContext = createContext(null);

export function GuestJobGateProvider({ children }) {
  const [pendingPath, setPendingPath] = useState(null);

  const requireAccount = useCallback((path) => {
    if (!isGuest()) return false;
    setPendingPath(path || "/jobs");
    return true;
  }, []);

  const close = useCallback(() => setPendingPath(null), []);

  return (
    <GuestJobGateContext.Provider value={{ requireAccount, close, pendingPath }}>
      {children}
      {pendingPath && (
        <GuestAccountPrompt redirectPath={pendingPath} onReturn={close} variant="modal" />
      )}
    </GuestJobGateContext.Provider>
  );
}

export const useGuestJobGate = () => {
  const ctx = useContext(GuestJobGateContext);
  if (!ctx) {
    // Outside a provider — behave as "no gate" (authenticated-style).
    return { requireAccount: () => false, close: () => {}, pendingPath: null };
  }
  return ctx;
};