import React, { useState, useEffect, useRef } from "react";
import {
  getCredentialDebugLog,
  clearCredentialDebugLog,
  subscribeToCredentialDebugLog,
} from "@/lib/credentialDebugLog";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, ChevronDown, ChevronUp, Bug } from "lucide-react";

const ACTION_COLORS = {
  CREATE: "text-success",
  UPDATE: "text-primary",
  DUPLICATE_FOUND: "text-warning",
  SKIP: "text-muted-foreground",
  INFO: "text-foreground",
};

const ORIGIN_COLORS = {
  "Resume Upload": "text-primary",
  "Accept All": "text-success",
  "Individual Accept": "text-success",
  "Manual Profile Edit": "text-muted-foreground",
  "Profile Refresh": "text-warning",
};

function formatTimestamp(date) {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function buildLogText(entries) {
  return entries
    .map((e) => {
      const ts = formatTimestamp(e.timestamp);
      let line = `#${e.seq}  ${ts}  ${e.eventName}`;
      if (e.sourceComponent) line += `  |  ${e.sourceComponent}`;
      if (e.sourceFunction) line += ` / ${e.sourceFunction}`;
      if (e.origin) line += `  |  origin: ${e.origin}`;
      if (e.credentialName) line += `  |  ${e.credentialName}`;
      if (e.recordId) line += `  |  ID: ${e.recordId}`;
      if (e.action && e.action !== "INFO") line += `  |  ${e.action}`;
      if (e.details) line += `  |  ${e.details}`;
      return line;
    })
    .join("\n\n");
}

export default function CredentialDebugPanel() {
  const [entries, setEntries] = useState(getCredentialDebugLog());
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToCredentialDebugLog((next) => setEntries(next));
    return unsub;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const handleCopy = async () => {
    const text = buildLogText(entries);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable
    }
  };

  const handleClear = () => {
    clearCredentialDebugLog();
  };

  return (
    <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-warning/10 hover:bg-warning/15 transition-colors"
      >
        <Bug className="w-4 h-4 text-warning" />
        <span className="font-semibold text-sm text-foreground flex-1 text-left">
          Credential Import Debug Log
        </span>
        <span className="text-xs text-muted-foreground">{entries.length} entries</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <>
          {/* Log content */}
          <div
            ref={scrollRef}
            className="max-h-80 overflow-y-auto p-3 font-mono text-xs space-y-2 bg-card"
          >
            {entries.length === 0 ? (
              <p className="text-muted-foreground italic">
                No events yet. Upload a resume to begin capturing.
              </p>
            ) : (
              entries.map((e, i) => (
                <div key={i} className="border-b border-border pb-2 last:border-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-muted-foreground">#{e.seq}</span>
                    <span className="text-muted-foreground">{formatTimestamp(e.timestamp)}</span>
                    <span className="font-semibold text-foreground">{e.eventName}</span>
                    {e.action && e.action !== "INFO" && (
                      <span className={`font-bold ${ACTION_COLORS[e.action] || "text-foreground"}`}>
                        [{e.action}]
                      </span>
                    )}
                  </div>
                  {(e.sourceComponent || e.sourceFunction || e.origin) && (
                    <div className="pl-4 mt-0.5 space-y-0.5">
                      {e.sourceComponent && (
                        <div className="text-muted-foreground">
                          Source: <span className="text-foreground">{e.sourceComponent}</span>
                          {e.sourceFunction && (
                            <span className="text-muted-foreground"> / {e.sourceFunction}</span>
                          )}
                        </div>
                      )}
                      {e.origin && (
                        <div className="text-muted-foreground">
                          Origin:{" "}
                          <span className={`font-medium ${ORIGIN_COLORS[e.origin] || "text-foreground"}`}>
                            {e.origin}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {(e.credentialName || e.recordId || e.details) && (
                    <div className="pl-4 mt-0.5 space-y-0.5">
                      {e.credentialName && (
                        <div className="text-muted-foreground">
                          Name: <span className="text-foreground">{e.credentialName}</span>
                        </div>
                      )}
                      {e.recordId && (
                        <div className="text-muted-foreground">
                          ID: <span className="text-foreground">{e.recordId}</span>
                        </div>
                      )}
                      {e.details && (
                        <div className="text-muted-foreground">{e.details}</div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 p-3 bg-warning/5 border-t border-warning/15">
            <Button size="sm" variant="outline" onClick={handleCopy} className="h-8">
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy Debug Log"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleClear} className="h-8">
              <Trash2 className="w-3.5 h-3.5" />
              Clear Log
            </Button>
          </div>
        </>
      )}
    </div>
  );
}