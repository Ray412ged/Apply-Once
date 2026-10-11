/**
 * Duplicate-detection utilities for resume-imported profile records.
 * Uses normalized string comparison so minor formatting differences
 * (punctuation, case, extra whitespace) don't prevent a match.
 */

/**
 * Normalize a string for comparison: lowercase, trim, collapse whitespace,
 * strip common punctuation.
 */
export function normalizeStr(value) {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[.,/()&'"""-]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Find an existing employment record that matches the given data.
 * Compares normalized employer_name + job_title.
 * Distinct jobs at the same employer (different titles) are NOT duplicates.
 */
export function findDuplicateEmployment(newData, existingRecords = []) {
  const emp = normalizeStr(newData.employer_name);
  const title = normalizeStr(newData.job_title);
  if (!emp && !title) return null;
  return (
    existingRecords.find((r) => {
      return normalizeStr(r.employer_name) === emp && normalizeStr(r.job_title) === title;
    }) || null
  );
}

/**
 * Find an existing education record that matches.
 * Compares normalized institution_name + degree_or_credential + graduation_year.
 */
export function findDuplicateEducation(newData, existingRecords = []) {
  const inst = normalizeStr(newData.institution_name);
  if (!inst) return null;
  const degree = normalizeStr(newData.degree_or_credential);
  const year = normalizeStr(newData.graduation_year);
  return (
    existingRecords.find((r) => {
      return (
        normalizeStr(r.institution_name) === inst &&
        normalizeStr(r.degree_or_credential) === degree &&
        normalizeStr(r.graduation_year) === year
      );
    }) || null
  );
}

/**
 * Find an existing credential that matches.
 * Compares normalized credential_name + issuing_organization.
 */
export function findDuplicateCredential(newData, existingRecords = []) {
  const name = normalizeStr(newData.credential_name);
  if (!name) return null;
  const issuer = normalizeStr(newData.issuing_organization);
  return (
    existingRecords.find((r) => {
      return (
        normalizeStr(r.credential_name) === name &&
        normalizeStr(r.issuing_organization) === issuer
      );
    }) || null
  );
}

/**
 * Find an existing skill that matches.
 * Compares normalized skill_name only.
 */
export function findDuplicateSkill(newData, existingRecords = []) {
  const name = normalizeStr(newData.skill_name);
  if (!name) return null;
  return (
    existingRecords.find((r) => {
      return normalizeStr(r.skill_name) === name;
    }) || null
  );
}

/**
 * Find an existing reference that matches.
 * Conservative: requires normalized full_name PLUS a matching contact
 * method (email or phone). References sharing only a first name or a
 * generic relationship label are NOT considered duplicates — this
 * preserves legitimate distinct references who happen to share a name.
 */
export function findDuplicateReference(newData, existingRecords = []) {
  const name = normalizeStr(newData.full_name);
  if (!name) return null;
  const email = normalizeStr(newData.email);
  const phone = normalizeStr(newData.phone);
  // Without a contact method we cannot safely distinguish two distinct
  // references who share a name — preserve both rather than risk data loss.
  if (!email && !phone) return null;
  return (
    existingRecords.find((r) => {
      if (normalizeStr(r.full_name) !== name) return false;
      const rEmail = normalizeStr(r.email);
      const rPhone = normalizeStr(r.phone);
      if (email && rEmail && rEmail === email) return true;
      if (phone && rPhone && rPhone === phone) return true;
      return false;
    }) || null
  );
}

/**
 * Find an existing user document that matches.
 * Compares normalized document_name + document_type.
 */
export function findDuplicateUserDocument(newData, existingRecords = []) {
  const name = normalizeStr(newData.document_name);
  const type = normalizeStr(newData.document_type);
  if (!name && !type) return null;
  return (
    existingRecords.find((r) => {
      return (
        normalizeStr(r.document_name) === name &&
        normalizeStr(r.document_type) === type
      );
    }) || null
  );
}

/**
 * Find an existing reusable answer that matches.
 * Compares normalized question + answer so the same Q&A saved twice
 * (e.g. imported more than once) is deduped.
 */
export function findDuplicateReusableAnswer(newData, existingRecords = []) {
  const q = normalizeStr(newData.question);
  const a = normalizeStr(newData.answer);
  if (!q && !a) return null;
  return (
    existingRecords.find((r) => {
      return normalizeStr(r.question) === q && normalizeStr(r.answer) === a;
    }) || null
  );
}

/**
 * Dispatch to the correct comparator based on entity name.
 * Returns the matching existing record, or null if no duplicate.
 */
export function findDuplicate(entityName, newData, existingRecords = []) {
  switch (entityName) {
    case "EmploymentRecord":
      return findDuplicateEmployment(newData, existingRecords);
    case "EducationRecord":
      return findDuplicateEducation(newData, existingRecords);
    case "Credential":
      return findDuplicateCredential(newData, existingRecords);
    case "Skill":
      return findDuplicateSkill(newData, existingRecords);
    case "Reference":
      return findDuplicateReference(newData, existingRecords);
    case "UserDocument":
      return findDuplicateUserDocument(newData, existingRecords);
    case "ReusableAnswer":
      return findDuplicateReusableAnswer(newData, existingRecords);
    default:
      return null;
  }
}