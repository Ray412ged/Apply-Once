import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Upload, Download, Check, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { downloadCSVTemplate, parseCSV, validateRow, mapRowToJobPosting, generateDedupKey } from "@/lib/localJobCsv";

export default function ImportLocalJobs() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setResults(null);
    try {
      const text = await file.text();
      const { headers, rows: parsedRows } = parseCSV(text);
      const rowErrors = parsedRows.map((row, i) => ({ row: i + 2, errors: validateRow(row) }));
      setRows(parsedRows);
      setErrors(rowErrors);
    } catch (err) {
      alert("Failed to parse CSV: " + err.message);
    } finally {
      setParsing(false);
    }
  };

  const validRows = rows.filter((_, i) => errors[i]?.errors.length === 0);
  const invalidRows = rows.filter((_, i) => errors[i]?.errors.length > 0);

  const handleImport = async () => {
    setImporting(true);
    setResults(null);
    let added = 0, updated = 0, skipped = 0, failed = 0;

    try {
      const existingJobs = await base44.entities.JobPosting.filter({ local_job: true }, "-created_date", 500);
      const existingKeys = new Set(existingJobs.map((j) => generateDedupKey(j)));

      for (let i = 0; i < validRows.length; i++) {
        const jobData = mapRowToJobPosting(validRows[i]);
        const dedupKey = generateDedupKey(jobData);

        try {
          if (existingKeys.has(dedupKey)) {
            const existing = existingJobs.find((j) => generateDedupKey(j) === dedupKey);
            if (existing) {
              await base44.entities.JobPosting.update(existing.id, { ...jobData, id: undefined });
              updated++;
              continue;
            }
          }
          await base44.entities.JobPosting.create(jobData);
          added++;
          existingKeys.add(dedupKey);
        } catch (err) {
          failed++;
        }
      }
      skipped = invalidRows.length;
      setResults({ added, updated, skipped, failed });
    } catch (err) {
      alert("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  if (results) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="bg-success/10 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Import Complete</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-success">{results.added}</p>
            <p className="text-sm text-muted-foreground">Added</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{results.updated}</p>
            <p className="text-sm text-muted-foreground">Updated</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-warning">{results.skipped}</p>
            <p className="text-sm text-muted-foreground">Skipped (invalid)</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{results.failed}</p>
            <p className="text-sm text-muted-foreground">Failed</p>
          </div>
        </div>
        <div className="space-y-2">
          <Button className="w-full h-12" onClick={() => { setResults(null); setRows([]); setErrors([]); }}>
            Import Another File
          </Button>
          <Button variant="outline" className="w-full h-11" onClick={() => navigate("/admin/employer-sources")}>
            View Employer Sources
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => navigate("/admin/employer-sources")} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-5 h-5" /> Back
      </button>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Local Jobs</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Bulk import jobs from a CSV file.</p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 h-11" onClick={downloadCSVTemplate}>
          <Download className="w-4 h-4 mr-2" /> Download Template
        </Button>
        <Button variant="outline" className="flex-1 h-11" onClick={() => fileRef.current?.click()} disabled={importing}>
          <Upload className="w-4 h-4 mr-2" /> Upload CSV
        </Button>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </div>

      {parsing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {rows.length > 0 && !parsing && (
        <>
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-4 text-sm">
            <span className="text-success font-medium">{validRows.length} valid</span>
            <span className="text-destructive font-medium">{invalidRows.length} invalid</span>
            <span className="text-muted-foreground">{rows.length} total rows</span>
          </div>

          {invalidRows.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">Rows with errors (will be skipped)</p>
              </div>
              {invalidRows.map((_, idx) => {
                const realIdx = rows.indexOf(_);
                return (
                  <div key={realIdx} className="text-xs text-muted-foreground pl-6">
                    Row {realIdx + 2}: {errors[realIdx]?.errors.join("; ")}
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-accent text-xs">
                  <tr>
                    <th className="text-left p-2 font-medium">Row</th>
                    <th className="text-left p-2 font-medium">Employer</th>
                    <th className="text-left p-2 font-medium">Job Title</th>
                    <th className="text-left p-2 font-medium">Location</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 text-muted-foreground">{i + 2}</td>
                      <td className="p-2 truncate max-w-[120px]">{row.employer_name}</td>
                      <td className="p-2 truncate max-w-[120px]">{row.job_title}</td>
                      <td className="p-2 truncate max-w-[100px]">{[row.city, row.state].filter(Boolean).join(", ") || row.remote_type}</td>
                      <td className="p-2 truncate max-w-[80px]">{row.employment_type}</td>
                      <td className="p-2">
                        {errors[i]?.errors.length === 0 ? (
                          <span className="text-success text-xs">Valid</span>
                        ) : (
                          <span className="text-destructive text-xs">Invalid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && (
              <p className="text-xs text-muted-foreground p-2 text-center">
                Showing first 50 of {rows.length} rows
              </p>
            )}
          </div>

          <Button className="w-full h-12" onClick={handleImport} disabled={importing || validRows.length === 0}>
            {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5 mr-2" />}
            Import {validRows.length} Valid Job{validRows.length !== 1 ? "s" : ""}
          </Button>
        </>
      )}

      {rows.length === 0 && !parsing && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Upload a CSV file to get started.</p>
          <p className="text-muted-foreground text-xs mt-1">Download the template for the correct column format.</p>
        </div>
      )}
    </div>
  );
}