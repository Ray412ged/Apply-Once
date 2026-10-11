import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  MapPin,
  DollarSign,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  X,
  Bookmark,
  Send,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "framer-motion";
import CompanyLogo from "@/components/jobs/CompanyLogo";
import MatchBadge from "@/components/MatchBadge";
import { stripHtml } from "@/lib/htmlUtils";

const SWIPE_THRESHOLD = 80;
const ROTATION_FACTOR = 0.05;
const EXIT_DISTANCE = 500;

function InfoChip({ icon: Icon, label }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
}

function formatPay(job) {
  if (job.salary_text) return job.salary_text;
  if (job.salary_min && job.salary_max)
    return `$${job.salary_min}\u2013$${job.salary_max}/${job.salary_period || "hr"}`;
  if (job.salary_min) return `From $${job.salary_min}`;
  return null;
}

function getShortDescription(job) {
  const raw = job.full_description || job.responsibilities || "";
  if (!raw) return null;
  const cleaned = stripHtml(raw);
  const firstSentence = cleaned.split(/\.|\n/)[0];
  return firstSentence && firstSentence.length > 0 ? firstSentence.trim() + "." : null;
}

function getTopQualifications(job) {
  const quals = [];
  if (job.minimum_qualifications) {
    const lines = stripHtml(job.minimum_qualifications)
      .split(/\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
    quals.push(...lines);
  }
  if (job.preferred_qualifications) {
    const lines = stripHtml(job.preferred_qualifications)
      .split(/\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
    quals.push(...lines);
  }
  if (job.required_credentials) {
    const lines = job.required_credentials
      .split(/\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
    quals.push(...lines);
  }
  return quals.slice(0, 3);
}

function getFirstMissingQualification(job) {
  if (!job.preferred_qualifications) return null;
  const lines = stripHtml(job.preferred_qualifications)
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines[0] || null;
}

function getDragDirection(dx, dy) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < 10 && absY < 10) return null;
  if (absX >= absY) {
    return dx < 0 ? "pass" : "interested";
  }
  return dy < 0 ? "save" : null;
}

const DRAG_LABELS = {
  pass: { text: "Dismiss", color: "text-destructive", icon: X },
  save: { text: "Save", color: "text-warning", icon: Bookmark },
  interested: { text: "Apply", color: "text-primary", icon: Send },
};

export default function JobSwipeCard({
  job,
  matchLevel,
  matchScore,
  matchReasons,
  missingQualification,
  onPass,
  onSave,
  onInterested,
}) {
  const [action, setAction] = useState(null);
  const [drag, setDrag] = useState({ dx: 0, dy: 0, dragging: false, direction: null });
  const [exiting, setExiting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const location = [job.city, job.state].filter(Boolean).join(", ") || job.location;
  const pay = formatPay(job);
  const description = getShortDescription(job);
  const topQuals = getTopQualifications(job);
  const missing = missingQualification || getFirstMissingQualification(job);

  const fireAction = useCallback(
    (type) => {
      if (action || exiting) return;
      // Subtle haptic feedback (gracefully ignored on unsupported browsers)
      try { navigator.vibrate?.(10); } catch {}
      setExiting(true);
      setAction(type);
      setTimeout(() => {
        if (type === "pass" && onPass) onPass(job);
        else if (type === "save" && onSave) onSave(job);
        else if (type === "interested" && onInterested) onInterested(job);
      }, 250);
    },
    [action, exiting, job, onPass, onSave, onInterested]
  );

  useEffect(() => {
    const handleKey = (e) => {
      if (action || exiting) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        fireAction("pass");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        fireAction("interested");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        fireAction("save");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [action, exiting, fireAction]);

  const handlePointerDown = (e) => {
    if (action || exiting) return;
    if (e.button !== undefined && e.button !== 0) return;
    startPos.current = { x: e.clientX, y: e.clientY };
    setDrag({ dx: 0, dy: 0, dragging: true, direction: null });
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e) => {
    if (!drag.dragging || action || exiting) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const direction = getDragDirection(dx, dy);
    setDrag({ dx, dy, dragging: true, direction });
  };

  const handlePointerUp = (e) => {
    if (!drag.dragging) return;
    const dx = drag.dx;
    const dy = drag.dy;
    const direction = getDragDirection(dx, dy);
    const distance = direction === "save" ? Math.abs(dy) : Math.abs(dx);

    if (direction && distance >= SWIPE_THRESHOLD) {
      fireAction(direction);
    } else {
      setDrag({ dx: 0, dy: 0, dragging: false, direction: null });
    }
  };

  let transform = "";
  let transition = "none";
  if (drag.dragging) {
    const rotation = prefersReducedMotion ? 0 : drag.dx * ROTATION_FACTOR;
    transform = `translate(${drag.dx}px, ${drag.dy}px) rotate(${rotation}deg)`;
    transition = "none";
  } else if (exiting && action) {
    if (prefersReducedMotion) {
      transform = "";
      transition = "opacity 0.15s ease-out";
    } else {
      if (action === "pass") transform = `translate(${-EXIT_DISTANCE}px, 0) rotate(-30deg)`;
      else if (action === "interested") transform = `translate(${EXIT_DISTANCE}px, 0) rotate(30deg)`;
      else if (action === "save") transform = `translate(0, ${-EXIT_DISTANCE}px) rotate(0deg)`;
      transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
    }
  } else {
    transition = prefersReducedMotion ? "none" : "transform 0.3s ease-out";
  }

  const activeLabel = drag.direction ? DRAG_LABELS[drag.direction] : null;
  const opacity = exiting ? 0 : 1;

  return (
    <div
      ref={cardRef}
      className={`bg-card rounded-3xl border border-border shadow-lg overflow-hidden select-none ${
        drag.dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ transform, transition, opacity, touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Drag hint label overlay */}
      {activeLabel && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full bg-card border-2 font-bold text-sm ${activeLabel.color}`}
            style={{
              borderColor: "currentColor",
              transform: `scale(${1 + Math.min(
                (drag.direction === "save" ? Math.abs(drag.dy) : Math.abs(drag.dx)) / 300,
                0.3
              )})`,
            }}
          >
            <activeLabel.icon className="w-5 h-5" />
            {activeLabel.text}
          </div>
        </div>
      )}

      {/* Header: employer + match badge */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo logoUrl={job.company_logo_url} companyName={job.employer_name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">
                {job.employer_name}
              </p>
              {matchLevel && (
                <div className="mt-1">
                  <MatchBadge level={matchLevel} score={matchScore} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job title */}
      <div className="px-5 pb-3">
        <h2 className="text-xl font-bold text-foreground leading-tight">{job.job_title}</h2>
      </div>

      {/* Info chips */}
      <div className="px-5 pb-3 flex flex-wrap gap-2">
        {location && <InfoChip icon={MapPin} label={location} />}
        {job.employment_type && <InfoChip icon={Briefcase} label={job.employment_type} />}
        {pay && <InfoChip icon={DollarSign} label={pay} />}
      </div>

      {/* Short description */}
      {description && (
        <div className="px-5 pb-3">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      )}

      {/* Details toggle */}
      {(topQuals.length > 0 || missing) && (
        <div className="px-5 pb-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            {showDetails ? "Hide details" : "View details"}
          </button>
        </div>
      )}

      {/* Expandable details: top qualifications + missing qualification */}
      {showDetails && (
        <>
          {/* Top matching qualifications */}
          {topQuals.length > 0 && (
            <div className="px-5 pb-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                Top Qualifications
              </p>
              <ul className="space-y-1.5">
                {topQuals.map((qual, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{qual}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* One missing qualification */}
          {missing && (
            <div className="px-5 pb-4">
              <div className="flex items-start gap-2 bg-warning/5 rounded-xl border border-warning/20 p-3">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">{missing}</p>
                  <p className="text-xs italic text-muted-foreground mt-0.5">
                    I couldn't verify this qualification from your profile.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Action buttons (also serve as keyboard-accessible fallbacks) */}
      <div className="px-5 pb-5 pt-1 grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="h-12 rounded-2xl flex-col gap-0.5"
          onClick={() => fireAction("pass")}
          disabled={!!action || exiting}
        >
          <X className="w-5 h-5" />
          <span className="text-xs">Dismiss</span>
        </Button>
        <Button
          variant="outline"
          className="h-12 rounded-2xl flex-col gap-0.5"
          onClick={() => fireAction("save")}
          disabled={!!action || exiting}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-xs">Save</span>
        </Button>
        <Button
          className="h-12 rounded-2xl flex-col gap-0.5"
          onClick={() => fireAction("interested")}
          disabled={!!action || exiting}
        >
          <Send className="w-5 h-5" />
          <span className="text-xs">Apply</span>
        </Button>
      </div>
    </div>
  );
}