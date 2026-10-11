import React from "react";

/**
 * The printable, ATS-friendly resume document.
 *
 * Single column. Black text on white background. Standard section
 * headings. No icons, photos, graphics, rating bars, colors, or
 * decorative sidebars inside the printable area. Anything that should
 * NOT print is rendered outside this component (or marked .no-print).
 *
 * Sensitive data is never present here — the generator already excludes
 * it. This component only renders what generateResume() produced.
 */
export default function ResumeDocument({ resume }) {
  if (!resume) return null;

  const { contact, professionalSummary, skills, employment, education, certifications } = resume;

  const contactParts = [
    contact.email,
    contact.phone,
    [contact.city, contact.state].filter(Boolean).join(", "),
  ].filter(Boolean);

  return (
    <div
      id="resume-print-area"
      className="bg-white text-black mx-auto w-full max-w-[820px] px-10 py-12 sm:px-14 sm:py-16 resume-page"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* Name */}
      <h1 className="text-3xl font-bold tracking-tight text-center text-black">
        {contact.fullName || "Your Name"}
      </h1>

      {/* Contact line */}
      {contactParts.length > 0 && (
        <p className="mt-2 text-sm text-center text-black">
          {contactParts.join("  |  ")}
        </p>
      )}

      <hr className="my-4 border-black/40" />

      {/* Professional Summary */}
      {professionalSummary && (
        <Section title="Professional Summary">
          <p className="text-sm leading-relaxed text-black">{professionalSummary}</p>
        </Section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Section title="Skills">
          <p className="text-sm leading-relaxed text-black">{skills.join(", ")}</p>
        </Section>
      )}

      {/* Experience */}
      {employment.length > 0 && (
        <Section title="Experience">
          <div className="space-y-4">
            {employment.map((job, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-base font-bold text-black">{job.title}</p>
                  {job.dates && (
                    <p className="text-sm text-black whitespace-nowrap">{job.dates}</p>
                  )}
                </div>
                {(job.employer || job.location) && (
                  <p className="text-sm italic text-black mt-0.5">
                    {[job.employer, job.location].filter(Boolean).join(" — ")}
                  </p>
                )}
                {job.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {job.bullets.map((b, j) => (
                      <li key={j} className="text-sm leading-relaxed text-black pl-4 relative">
                        <span className="absolute left-0 top-0">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education and Training */}
      {education.length > 0 && (
        <Section title="Education and Training">
          <div className="space-y-3">
            {education.map((ed, i) => (
              <div key={i}>
                <p className="text-sm font-bold text-black">{ed.institution}</p>
                <p className="text-sm text-black mt-0.5">
                  {[
                    ed.degree && ed.field ? `${ed.degree}, ${ed.field}` : (ed.degree || ed.field),
                    ed.status,
                  ].filter(Boolean).join("  |  ")}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Licenses and Certifications */}
      {certifications.length > 0 && (
        <Section title="Licenses and Certifications">
          <div className="space-y-3">
            {certifications.map((c, i) => (
              <div key={i}>
                <p className="text-sm font-bold text-black">{c.name}</p>
                <p className="text-sm text-black mt-0.5">
                  {[
                    c.issuingOrganization,
                    c.expiration ? `Expires ${c.expiration}` : "",
                    c.active ? "Active" : "Inactive",
                  ].filter(Boolean).join("  |  ")}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b border-black/40 pb-1">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}