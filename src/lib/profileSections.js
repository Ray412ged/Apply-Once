// Profile section definitions for the guided profile builder.
// Each section defines: id, title, subtitle, icon, entity, type, component, and steps.
// component types: "guided" (uses GuidedForm), "strengths", "growth", "employment",
//   "skills", "questions", "documents", "review"
// Field types for guided: text, textarea, email, tel, number, select, multiselect, boolean, date, tags

export const PROFILE_SECTIONS = [
  {
    id: "about",
    title: "About Me",
    subtitle: "How employers can reach you",
    icon: "User",
    entity: "UserProfile",
    type: "single",
    component: "guided",
    estimatedMinutes: 2,
    steps: [
      {
        title: "What should we call you?",
        subtitle: "Your name helps personalize your applications.",
        fields: [
          { name: "first_name", label: "First name", type: "text", required: true },
          { name: "last_name", label: "Last name", type: "text", required: true },
          { name: "preferred_name", label: "Preferred name (optional)", type: "text" },
        ],
      },
      {
        title: "How can employers reach you?",
        subtitle: "Your contact information stays private until you choose to share it.",
        fields: [
          { name: "email", label: "Contact email", type: "email", placeholder: "For employers to reach you" },
          { name: "phone", label: "Phone", type: "tel" },
          { name: "preferred_contact_method", label: "Preferred contact method", type: "select", options: ["Email", "Phone", "Text"] },
        ],
      },
      {
        title: "Where do you live?",
        subtitle: "This helps us find jobs near you.",
        fields: [
          { name: "city", label: "City", type: "text" },
          { name: "state", label: "State", type: "text" },
          { name: "postal_code", label: "ZIP code", type: "text" },
        ],
      },
    ],
  },
  {
    id: "goals",
    title: "Job Goals",
    subtitle: "What kind of work are you looking for?",
    icon: "Target",
    entity: "JobPreference",
    type: "single",
    component: "jobgoals",
    estimatedMinutes: 3,
    steps: [],
  },
  {
    id: "employment",
    title: "Employment History",
    subtitle: "Tell us about your work experience",
    icon: "Briefcase",
    entity: "EmploymentRecord",
    type: "list",
    component: "employment",
    estimatedMinutes: 5,
    steps: [
      {
        title: "Tell us about your experience",
        subtitle: "Let's start with the basics.",
        fields: [
          { name: "employer_name", label: "Employer or organization name", type: "text", required: true, placeholder: "Example: Walmart" },
          { name: "job_title", label: "Your role or title", type: "text", required: true, placeholder: "Example: Cashier, Volunteer, Caregiver" },
          { name: "experience_type", label: "What type of experience is this?", type: "select", options: [
            "Regular paid job", "Temporary or day labor", "Self-employment", "Side jobs",
            "Volunteer work", "Caregiving", "Work while incarcerated", "School or training projects",
            "Community service", "No experience yet",
          ] },
        ],
      },
      {
        title: "Where was this?",
        subtitle: "The city and state where you worked.",
        fields: [
          { name: "city", label: "City", type: "text" },
          { name: "state", label: "State", type: "text" },
        ],
      },
      {
        title: "When did you do this?",
        subtitle: "Tell us the dates.",
        fields: [
          { name: "start_month", label: "Start month", type: "text", placeholder: "Example: January" },
          { name: "start_year", label: "Start year", type: "text", placeholder: "Example: 2022" },
          { name: "currently_employed", label: "I still do this", type: "boolean" },
          { name: "end_month", label: "End month", type: "text", placeholder: "Leave blank if current" },
          { name: "end_year", label: "End year", type: "text", placeholder: "Leave blank if current" },
        ],
      },
      {
        title: "What did you do?",
        subtitle: "Describe your main duties and any accomplishments you're proud of.",
        fields: [
          { name: "duties", label: "Main duties", type: "textarea", placeholder: "Example: Operated cash register, helped customers, managed inventory..." },
          { name: "accomplishments", label: "Accomplishments you're proud of", type: "textarea", placeholder: "Example: Employee of the month, increased sales by 15%..." },
        ],
      },
      {
        title: "Any other details?",
        subtitle: "These details are optional. You can skip them if you prefer.",
        fields: [
          { name: "hours_per_week", label: "Hours per week", type: "number" },
          { name: "starting_pay", label: "Starting pay", type: "text", placeholder: "Example: $15/hr" },
          { name: "ending_pay", label: "Ending pay", type: "text", placeholder: "Example: $18/hr" },
          { name: "reason_for_leaving", label: "Reason for leaving", type: "text" },
        ],
      },
    ],
  },
  {
    id: "skills",
    title: "Suggested Skills",
    subtitle: "What are you good at?",
    icon: "Wrench",
    entity: "Skill",
    type: "skills",
    component: "skills",
    estimatedMinutes: 3,
    steps: [],
  },
  {
    id: "education",
    title: "Education and Training",
    subtitle: "What is your highest level of education or training?",
    icon: "GraduationCap",
    entity: "EducationRecord",
    type: "list",
    component: "education",
    estimatedMinutes: 3,
    steps: [
      {
        title: "Did you attend a school or training program?",
        subtitle: "This includes high school, college, trade school, or any training program.",
        fields: [
          { name: "institution_name", label: "School or program name", type: "text", required: true, placeholder: "Example: Lincoln High School" },
          { name: "education_type", label: "Type of school", type: "select", options: ["High School", "GED", "Trade School", "Community College", "College", "University", "Training Program", "Other"] },
          { name: "degree_or_credential", label: "Degree or credential", type: "text", placeholder: "Example: Diploma, Certificate, Associate's" },
          { name: "field_of_study", label: "Field of study", type: "text", placeholder: "Example: Nursing, IT, Business" },
        ],
      },
      {
        title: "When did you attend?",
        subtitle: "Tell us the years you were enrolled.",
        fields: [
          { name: "start_year", label: "Start year", type: "text", placeholder: "Example: 2018" },
          { name: "graduation_year", label: "Graduation year", type: "text", placeholder: "Example: 2022" },
          { name: "completed", label: "I completed this program", type: "boolean" },
          { name: "graduation_date", label: "Graduation date", type: "date" },
        ],
      },
      {
        title: "Any other details?",
        subtitle: "These details are optional but can help your applications.",
        fields: [
          { name: "city", label: "City", type: "text" },
          { name: "state", label: "State", type: "text" },
          { name: "GPA", label: "GPA (optional)", type: "text" },
          { name: "honors", label: "Honors or awards", type: "text" },
        ],
      },
    ],
  },
  {
    id: "credentials",
    title: "Licenses and Certifications",
    subtitle: "Do you have any licenses or certifications?",
    icon: "Award",
    entity: "Credential",
    type: "list",
    component: "credentials",
    estimatedMinutes: 2,
    steps: [
      {
        title: "Tell us about a license or certification",
        subtitle: "This includes driver's licenses, professional licenses, or certifications.",
        fields: [
          { name: "credential_name", label: "Name of license or certification", type: "text", required: true, placeholder: "Example: CPR Certification" },
          { name: "credential_type", label: "Type", type: "select", options: ["License", "Certification", "Permit", "Other"] },
          { name: "issuing_organization", label: "Issued by", type: "text", placeholder: "Example: Red Cross" },
          { name: "state", label: "State", type: "text" },
        ],
      },
      {
        title: "When was it issued?",
        subtitle: "Tell us the dates for this credential.",
        fields: [
          { name: "issue_date", label: "Issue date", type: "date" },
          { name: "expiration_date", label: "Expiration date (if any)", type: "date" },
          { name: "active_status", label: "This credential is currently active", type: "boolean" },
          { name: "credential_number_optional", label: "Credential number (optional)", type: "text" },
        ],
      },
    ],
  },
  {
    id: "references",
    title: "References",
    subtitle: "Would you like to add professional references?",
    icon: "Users",
    entity: "Reference",
    type: "list",
    component: "references",
    estimatedMinutes: 2,
    steps: [
      {
        title: "Who can speak about your work?",
        subtitle: "A reference can be a former supervisor, coworker, or teacher.",
        fields: [
          { name: "full_name", label: "Full name", type: "text", required: true },
          { name: "relationship", label: "How do you know them?", type: "text", placeholder: "Example: Former supervisor" },
          { name: "organization", label: "Company or organization", type: "text" },
          { name: "job_title", label: "Their job title", type: "text" },
          { name: "years_known", label: "Years known", type: "number" },
        ],
      },
      {
        title: "How can they be contacted?",
        subtitle: "Always ask permission before listing someone as a reference.",
        fields: [
          { name: "phone", label: "Phone", type: "tel" },
          { name: "email", label: "Email", type: "email" },
          { name: "permission_confirmed", label: "I have asked this person for permission", type: "boolean" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "introduction",
    title: "Your Professional Introduction",
    subtitle: "Let's use what you shared to create a short introduction for employers.",
    icon: "FileText",
    entity: "UserProfile",
    type: "single",
    component: "introduction",
    estimatedMinutes: 3,
    steps: [],
  },
  {
    id: "review",
    title: "Review My Profile",
    subtitle: "Make sure everything looks right",
    icon: "CheckCircle",
    entity: null,
    type: "review",
    component: "review",
    estimatedMinutes: 2,
    steps: [],
  },
];

export const SECTION_MAP = PROFILE_SECTIONS.reduce((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {});

export const TOTAL_SECTIONS = PROFILE_SECTIONS.length;
export const CONTENT_SECTIONS = PROFILE_SECTIONS.filter((s) => s.type !== "review");