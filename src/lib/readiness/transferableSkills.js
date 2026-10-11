/**
 * Transferable Skills Taxonomy & Inference.
 *
 * Rather than relying solely on manually-entered skills, the engine
 * scans the user's employment history (job titles, duties,
 * responsibilities, accomplishments) and infers transferable skills
 * that they may not have explicitly listed.
 *
 * Each transferable skill maps to a set of trigger keywords. When any
 * trigger appears in a job title or duty description, the skill is
 * inferred for that user.
 *
 * To extend the taxonomy, add entries to TRANSFERABLE_SKILL_TAXONOMY.
 */

const TRANSFERABLE_SKILL_TAXONOMY = {
  "Conflict Resolution": {
    category: "Working with people",
    triggers: ["conflict", "dispute", "mediate", "de-escalat", "escalat", "crisis", "intervene", "defuse"],
  },
  "Documentation": {
    category: "Office and technology",
    triggers: ["document", "report", "record", "log", "chart", "note", "file", "paperwork", "data entry"],
  },
  "Communication": {
    category: "Working with people",
    triggers: ["communicate", "presentation", "present", "speak", "write", "correspond", "brief", "answer", "respond"],
  },
  "Leadership": {
    category: "Leadership and thinking",
    triggers: ["lead", "supervise", "manage", "direct", "oversee", "train", "mentor", "coach", "delegate"],
  },
  "De-escalation": {
    category: "Working with people",
    triggers: ["de-escalat", "calm", "defuse", "crisis intervention", "restraint", "verbal"],
  },
  "Case Management": {
    category: "Leadership and thinking",
    triggers: ["case management", "case manager", "casework", "client", "patient care", "care plan", "discharge", "treatment plan"],
  },
  "Problem Solving": {
    category: "Leadership and thinking",
    triggers: ["problem", "solve", "troubleshoot", "resolve", "analyze", "investigate", "assess"],
  },
  "Professional Ethics": {
    category: "Dependability",
    triggers: ["confidential", "ethic", "compliance", "integrity", "professional conduct", "hipaa", "privacy"],
  },
  "Teamwork": {
    category: "Working with people",
    triggers: ["team", "collaborate", "coordinate", "cooperate", "group", "partner"],
  },
  "Customer Service": {
    category: "Working with people",
    triggers: ["customer", "client", "service", "support", "assist", "help", "guest", "patron"],
  },
  "Time Management": {
    category: "Dependability",
    triggers: ["deadline", "schedule", "prioritize", "time management", "organize", "multitask"],
  },
  "Attention to Detail": {
    category: "Dependability",
    triggers: ["detail", "accurate", "precise", "inspect", "quality", "audit", "verify"],
  },
  "Safety Compliance": {
    category: "Hands-on work",
    triggers: ["safety", "osha", "compliance", "hazard", "inspection", "protocol", "ppe", "safe work"],
  },
  "Technical Skills": {
    category: "Office and technology",
    triggers: ["software", "system", "computer", "data entry", "excel", "database", "technical", "erp", "crm"],
  },
  "Adaptability": {
    category: "Dependability",
    triggers: ["adapt", "flexible", "cross-train", "learn", "new", "change", "transition"],
  },
};

/**
 * Scans employment records and infers transferable skills.
 *
 * @param {Array} employmentRecords - EmploymentRecord entities
 * @returns {Array<{ skill_name: string, skill_category: string, source: string }>}
 */
export function identifyTransferableSkills(employmentRecords = []) {
  if (!employmentRecords || employmentRecords.length === 0) return [];

  const found = new Map();

  for (const emp of employmentRecords) {
    const searchText = [
      emp.job_title || "",
      emp.employer_name || "",
      emp.duties || "",
      emp.responsibilities_custom?.join(" ") || "",
      emp.responsibilities_selected?.join(" ") || "",
      emp.accomplishments || "",
      emp.additional_notes || "",
    ].join(" ").toLowerCase();

    for (const [skillName, def] of Object.entries(TRANSFERABLE_SKILL_TAXONOMY)) {
      const hasTrigger = def.triggers.some((t) => searchText.includes(t));
      if (hasTrigger && !found.has(skillName)) {
        found.set(skillName, {
          skill_name: skillName,
          skill_category: def.category,
          source: `Inferred from ${emp.job_title || "previous role"} at ${emp.employer_name || "employer"}`,
        });
      }
    }
  }

  return Array.from(found.values());
}

/**
 * Merges manually-entered skills with inferred transferable skills,
 * deduplicating by skill name (manual entry wins).
 */
export function mergeSkills(manualSkills = [], transferableSkills = []) {
  const byName = new Map();
  for (const s of transferableSkills) {
    byName.set(s.skill_name.toLowerCase(), { ...s, suggested_from_employment: true });
  }
  for (const s of manualSkills) {
    byName.set((s.skill_name || "").toLowerCase(), { ...s, suggested_from_employment: false });
  }
  return Array.from(byName.values());
}