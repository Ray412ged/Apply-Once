// Skill groups for the selectable skills experience

export const SKILL_GROUPS = [
  {
    name: "Dependability",
    skills: [
      "Attendance",
      "Punctuality",
      "Reliability",
      "Following instructions",
      "Completing tasks",
      "Time management",
    ],
  },
  {
    name: "Working with people",
    skills: [
      "Customer service",
      "Communication",
      "Teamwork",
      "Conflict resolution",
      "Listening",
      "Mentoring",
      "De-escalation",
    ],
  },
  {
    name: "Hands-on work",
    skills: [
      "Cleaning",
      "Landscaping",
      "Construction",
      "Painting",
      "Maintenance",
      "Hand tools",
      "Power tools",
      "Equipment operation",
      "Warehouse work",
      "Inventory",
      "Loading and unloading",
      "Safety procedures",
    ],
  },
  {
    name: "Office and technology",
    skills: [
      "Data entry",
      "Email",
      "Microsoft Word",
      "Excel",
      "Scheduling",
      "Filing",
      "Phone communication",
      "Computer use",
      "Point-of-sale systems",
    ],
  },
  {
    name: "Leadership and thinking",
    skills: [
      "Problem-solving",
      "Leadership",
      "Training others",
      "Decision-making",
      "Organization",
      "Attention to detail",
      "Working independently",
      "Adapting to change",
    ],
  },
];

export const ALL_SKILLS = SKILL_GROUPS.flatMap((g) => g.skills);

// Map skill names to their group
export const SKILL_TO_GROUP = {};
SKILL_GROUPS.forEach((g) => {
  g.skills.forEach((s) => {
    SKILL_TO_GROUP[s] = g.name;
  });
});

// Suggest skills based on employment duties and job titles
// Uses keyword matching against confirmed employment records
export function suggestSkillsFromEmployment(employmentRecords) {
  if (!employmentRecords || employmentRecords.length === 0) return [];

  const suggestions = new Set();

  employmentRecords.forEach((job) => {
    const text = `${job.job_title || ""} ${job.duties || ""} ${job.employer_name || ""}`.toLowerCase();

    // Keyword → skill mappings
    const mappings = [
      { keywords: ["cashier", "cash register", "customer", "retail", "sales"], skill: "Customer service" },
      { keywords: ["cashier", "cash register", "pos", "point of sale"], skill: "Point-of-sale systems" },
      { keywords: ["team", "coworker", "crew"], skill: "Teamwork" },
      { keywords: ["clean", "janitor", "custodian", "sanitation"], skill: "Cleaning" },
      { keywords: ["warehouse", "forklift", "loading", "unloading", "inventory", "picker", "packer"], skill: "Warehouse work" },
      { keywords: ["loading", "unloading", "forklift"], skill: "Loading and unloading" },
      { keywords: ["inventory", "stock", "shelv"], skill: "Inventory" },
      { keywords: ["forklift", "equipment", "machine", "operate"], skill: "Equipment operation" },
      { keywords: ["safety", "osha", "protective"], skill: "Safety procedures" },
      { keywords: ["computer", "data entry", "typing", "email", "spreadsheet"], skill: "Computer use" },
      { keywords: ["data entry", "typing", "keyboard"], skill: "Data entry" },
      { keywords: ["excel", "spreadsheet"], skill: "Excel" },
      { keywords: ["word", "document", "typing"], skill: "Microsoft Word" },
      { keywords: ["schedule", "appointment", "calendar"], skill: "Scheduling" },
      { keywords: ["file", "records", "organize"], skill: "Filing" },
      { keywords: ["phone", "call", "receptionist", "front desk"], skill: "Phone communication" },
      { keywords: ["phone", "call", "receptionist", "front desk", "customer"], skill: "Communication" },
      { keywords: ["manage", "supervisor", "lead", "direct"], skill: "Leadership" },
      { keywords: ["train", "teach", "mentor"], skill: "Training others" },
      { keywords: ["decide", "decision", "responsible for"], skill: "Decision-making" },
      { keywords: ["organize", "plan", "coordinate"], skill: "Organization" },
      { keywords: ["detail", "accurate", "precise", "inspect", "quality"], skill: "Attention to detail" },
      { keywords: ["independent", "alone", "self-directed"], skill: "Working independently" },
      { keywords: ["landscape", "lawn", "garden"], skill: "Landscaping" },
      { keywords: ["construct", "build", "carpentry", "framing"], skill: "Construction" },
      { keywords: ["paint", "painting"], skill: "Painting" },
      { keywords: ["maintain", "repair", "fix", "mechanic"], skill: "Maintenance" },
      { keywords: ["tool", "wrench", "drill", "hammer"], skill: "Hand tools" },
      { keywords: ["power tool", "saw", "drill"], skill: "Power tools" },
      { keywords: ["conflict", "difficult", "complaint", "resolve"], skill: "Conflict resolution" },
      { keywords: ["listen", "understand", "patient"], skill: "Listening" },
      { keywords: ["time", "punctual", "attend", "schedule", "deadline"], skill: "Time management" },
      { keywords: ["reliab", "depend", "consistent", "show up"], skill: "Reliability" },
      { keywords: ["instruction", "direction", "follow", "guideline"], skill: "Following instructions" },
      { keywords: ["task", "complete", "finish", "accomplish"], skill: "Completing tasks" },
      { keywords: ["adapt", "change", "flexible", "adjust"], skill: "Adapting to change" },
      { keywords: ["problem", "solve", "troubleshoot", "fix"], skill: "Problem-solving" },
    ];

    mappings.forEach(({ keywords, skill }) => {
      if (keywords.some((kw) => text.includes(kw))) {
        suggestions.add(skill);
      }
    });
  });

  // Filter to only skills that exist in our defined groups
  return Array.from(suggestions).filter((s) => SKILL_TO_GROUP[s]);
}