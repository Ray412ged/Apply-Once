/**
 * Resume PDF generator.
 *
 * Produces a text-based PDF (selectable text — NOT a screenshot) that
 * matches the on-screen resume preview using jsPDF's standard fonts.
 * Page margins are preserved and headings/entries are kept together
 * with simple page-break guards.
 */

import { jsPDF } from "jspdf";

const MARGIN = 48; // 0.67in
const LINE_GAP = 4;

function contentWidth(doc) {
  return doc.internal.pageSize.getWidth() - MARGIN * 2;
}

function professionalFilename(fullName) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0] || "Resume";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const base = last ? `${first}_${last}` : first;
  return `${base}_Resume.pdf`;
}

function locationString(city, state) {
  const c = (city || "").trim();
  const s = (state || "").trim();
  if (c && s) return `${c}, ${s}`;
  return c || s || "";
}

/**
 * Generates and triggers download of the resume PDF.
 * @param {ResumeModel} resume
 */
export function downloadResumePdf(resume) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = MARGIN;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const writeWrapped = (text, { size = 10, style = "normal", indent = 0, gapAfter = LINE_GAP } = {}) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text || "", contentWidth(doc) - indent);
    for (const line of lines) {
      ensureSpace(size + LINE_GAP);
      doc.text(line, MARGIN + indent, y + size);
      y += size + LINE_GAP;
    }
    y += gapAfter - LINE_GAP;
  };

  // Draws a bullet point with the "•" glyph aligned to the first line and
  // wrapped continuation indented under the text (no marker on later lines).
  const writeBullet = (text, { size = 10, gapAfter = LINE_GAP } = {}) => {
    const indent = 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text || "", contentWidth(doc) - indent);
    lines.forEach((line, i) => {
      ensureSpace(size + LINE_GAP);
      if (i === 0) doc.text("•", MARGIN + 2, y + size);
      doc.text(line, MARGIN + indent, y + size);
      y += size + LINE_GAP;
    });
    y += gapAfter - LINE_GAP;
  };

  const sectionHeading = (title) => {
    ensureSpace(26);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.text(title.toUpperCase(), MARGIN, y + 11);
    y += 15;
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y, MARGIN + contentWidth(doc), y);
    y += 10;
  };

  // ── Name ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(resume.contact.fullName || "Resume", MARGIN, y + 18);
  y += 24;

  // ── Contact line ──────────────────────────────────────────────────────
  const contactParts = [
    resume.contact.email,
    resume.contact.phone,
    locationString(resume.contact.city, resume.contact.state),
    resume.contact.linkedIn,
  ].filter(Boolean);
  if (contactParts.length) {
    writeWrapped(contactParts.join("  |  "), { size: 9.5, gapAfter: 10 });
  }

  // ── Professional Summary ──────────────────────────────────────────────
  if (resume.professionalSummary) {
    sectionHeading("Professional Summary");
    writeWrapped(resume.professionalSummary, { size: 10, gapAfter: 8 });
  }

  // ── Skills ────────────────────────────────────────────────────────────
  if (resume.skills.length > 0) {
    sectionHeading("Skills");
    writeWrapped(resume.skills.join(", "), { size: 10, gapAfter: 8 });
  }

  // ── Experience ───────────────────────────────────────────────────────
  if (resume.employment.length > 0) {
    sectionHeading("Experience");
    for (const job of resume.employment) {
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(job.title || "", MARGIN, y + 11);
      if (job.dates) {
        doc.text(job.dates, MARGIN + contentWidth(doc), y + 11, { align: "right" });
      }
      y += 15;

      const sub = [job.employer, job.location].filter(Boolean).join(" — ");
      if (sub) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        const subLines = doc.splitTextToSize(sub, contentWidth(doc));
        for (const line of subLines) {
          ensureSpace(14);
          doc.text(line, MARGIN, y + 10);
          y += 14;
        }
      }

      for (const bullet of job.bullets) {
        writeBullet(bullet, { size: 10, gapAfter: 2 });
      }
      y += 6;
    }
  }

  // ── Education and Training ───────────────────────────────────────────
  if (resume.education.length > 0) {
    sectionHeading("Education and Training");
    for (const ed of resume.education) {
      ensureSpace(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(ed.institution || "", MARGIN, y + 10);
      y += 13;
      const sub = [ed.degree && ed.field ? `${ed.degree}, ${ed.field}` : (ed.degree || ed.field), ed.status].filter(Boolean).join("  |  ");
      if (sub) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(sub, contentWidth(doc));
        for (const line of lines) {
          ensureSpace(14);
          doc.text(line, MARGIN, y + 10);
          y += 14;
        }
      }
      y += 4;
    }
  }

  // ── Licenses and Certifications ──────────────────────────────────────
  if (resume.certifications.length > 0) {
    sectionHeading("Licenses and Certifications");
    for (const c of resume.certifications) {
      ensureSpace(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(c.name || "", MARGIN, y + 10);
      y += 13;
      const sub = [
        c.issuingOrganization,
        c.expiration ? `Expires ${c.expiration}` : "",
        c.active ? "Active" : "Inactive",
      ].filter(Boolean).join("  |  ");
      if (sub) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(sub, contentWidth(doc));
        for (const line of lines) {
          ensureSpace(14);
          doc.text(line, MARGIN, y + 10);
          y += 14;
        }
      }
      y += 4;
    }
  }

  doc.save(professionalFilename(resume.contact.fullName));
}