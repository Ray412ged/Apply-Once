// Diagnostic logger for credential import workflow.
// In-memory capture is gated behind isDiagnosticDebugEnabled() so that
// production/preview/beta users never accumulate entries or see the panel.
// console.log output is always emitted (browser console only, not user-visible UI).
import { isDiagnosticDebugEnabled } from "@/lib/debugMode";

const MAX_ENTRIES = 500;

const entries = [];
const listeners = new Set();

let _seq = 0;
let _origin = "";
let _sourceComponent = "";
let _sourceFunction = "";

// ---- Context setters (threaded across function boundaries) ----

export function setCredentialOrigin(origin) {
  _origin = origin;
}

export function setCredentialSource(component, fn) {
  _sourceComponent = component;
  _sourceFunction = fn;
}

export function getCredentialOrigin() {
  return _origin || "Manual Profile Edit";
}

// ---- Store ----

export function getCredentialDebugLog() {
  return [...entries];
}

export function clearCredentialDebugLog() {
  entries.length = 0;
  _seq = 0;
  notify();
}

export function subscribeToCredentialDebugLog(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) {
    try {
      listener([...entries]);
    } catch {
      // listener may have been removed
    }
  }
}

// ACTION values: CREATE, UPDATE, DUPLICATE_FOUND, SKIP, INFO
// sourceComponent / sourceFunction / origin default to the current context
//   set via setCredentialSource() / setCredentialOrigin().
// seq auto-increments for every event.
export function logCredentialEvent({
  eventName,
  credentialName = "",
  recordId = "",
  action = "INFO",
  details = "",
  sourceComponent = "",
  sourceFunction = "",
  origin = "",
}) {
  _seq += 1;
  const entry = {
    seq: _seq,
    timestamp: new Date(),
    eventName,
    credentialName,
    recordId,
    action,
    details,
    sourceComponent: sourceComponent || _sourceComponent,
    sourceFunction: sourceFunction || _sourceFunction,
    origin: origin || _origin || "Manual Profile Edit",
  };
  if (isDiagnosticDebugEnabled()) {
    entries.push(entry);
    if (entries.length > MAX_ENTRIES) {
      entries.splice(0, entries.length - MAX_ENTRIES);
    }
    notify();
  }
  // Always emit to browser console (not visible in app UI)
  console.log(
    `[CRED-DEBUG] #${entry.seq} ${entry.timestamp.toISOString()} — ${eventName} | name="${credentialName}" | id="${recordId}" | action=${action} | src=${entry.sourceComponent}:${entry.sourceFunction} | origin=${entry.origin}${details ? ` | ${details}` : ""}`
  );
}