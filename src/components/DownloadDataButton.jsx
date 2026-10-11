import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Loader2, Check } from "lucide-react";

export default function DownloadDataButton() {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const [
        profiles, preferences, employment, education, skills,
        credentials, references,
      ] = await Promise.all([
        base44.entities.UserProfile.list("-updated_date", 1),
        base44.entities.JobPreference.list("-updated_date", 1),
        base44.entities.EmploymentRecord.list("-created_date", 50),
        base44.entities.EducationRecord.list("-created_date", 50),
        base44.entities.Skill.list("-created_date", 50),
        base44.entities.Credential.list("-created_date", 50),
        base44.entities.Reference.list("-created_date", 50),
      ]);

      const profile = profiles[0] || null;
      const jobGoals = preferences[0] || null;

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profile
          ? {
              first_name: profile.first_name,
              middle_name: profile.middle_name,
              last_name: profile.last_name,
              preferred_name: profile.preferred_name,
              email: profile.email,
              phone: profile.phone,
              city: profile.city,
              state: profile.state,
              postal_code: profile.postal_code,
              preferred_contact_method: profile.preferred_contact_method,
            }
          : null,
        professional_introduction: profile
          ? {
              professional_summary: profile.professional_summary,
              interview_introduction: profile.interview_introduction,
            }
          : null,
        job_goals: jobGoals
          ? {
              work_categories: jobGoals.work_categories,
              desired_job_titles: jobGoals.desired_job_titles,
              desired_industries: jobGoals.desired_industries,
              desired_keywords: jobGoals.desired_keywords,
              experience_level: jobGoals.experience_level,
              available_days: jobGoals.available_days,
              available_times: jobGoals.available_times,
              earliest_start_date: jobGoals.earliest_start_date,
              pay_preference: jobGoals.pay_preference,
              remote_preference: jobGoals.remote_preference,
              employment_types: jobGoals.employment_types,
              preferred_schedule: jobGoals.preferred_schedule,
              travel_radius_miles: jobGoals.travel_radius_miles,
              transportation_available: jobGoals.transportation_available,
              workplace_accommodation: jobGoals.workplace_accommodation,
            }
          : null,
        employment: employment.map((e) => ({
          employer_name: e.employer_name,
          job_title: e.job_title,
          experience_type: e.experience_type,
          city: e.city,
          state: e.state,
          start_month: e.start_month,
          start_year: e.start_year,
          end_month: e.end_month,
          end_year: e.end_year,
          currently_employed: e.currently_employed,
          duties: e.duties,
          accomplishments: e.accomplishments,
          reason_for_leaving: e.reason_for_leaving,
          starting_pay: e.starting_pay,
          ending_pay: e.ending_pay,
          hours_per_week: e.hours_per_week,
          employment_type: e.employment_type,
        })),
        education: education.map((e) => ({
          institution_name: e.institution_name,
          city: e.city,
          state: e.state,
          education_type: e.education_type,
          degree_or_credential: e.degree_or_credential,
          field_of_study: e.field_of_study,
          start_year: e.start_year,
          graduation_year: e.graduation_year,
          completed: e.completed,
          graduation_date: e.graduation_date,
          gpa: e.GPA,
          honors: e.honors,
        })),
        skills: skills.map((s) => ({
          skill_name: s.skill_name,
          skill_category: s.skill_category,
          proficiency_level: s.proficiency_level,
          years_experience: s.years_experience,
        })),
        credentials: credentials.map((c) => ({
          credential_name: c.credential_name,
          issuing_organization: c.issuing_organization,
          credential_type: c.credential_type,
          issue_date: c.issue_date,
          expiration_date: c.expiration_date,
          state: c.state,
          active_status: c.active_status,
        })),
        references: references.map((r) => ({
          full_name: r.full_name,
          relationship: r.relationship,
          organization: r.organization,
          job_title: r.job_title,
          phone: r.phone,
          email: r.email,
          years_known: r.years_known,
        })),
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `apply-once-my-data-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("Failed to download data:", err);
      alert("We couldn't download your data right now. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
    >
      {downloading ? (
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      ) : done ? (
        <Check className="w-5 h-5 text-success" />
      ) : (
        <Download className="w-5 h-5 text-muted-foreground" />
      )}
      <div className="flex-1">
        <p className="font-medium text-foreground">Download My Data</p>
        <p className="text-sm text-muted-foreground">
          Save a copy of your profile, experience, and goals
        </p>
      </div>
    </button>
  );
}