import React, { useState, useRef, useEffect, useId } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, School, Edit3 } from "lucide-react";

function generateSessionToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function SchoolSearch({ value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const sessionTokenRef = useRef(generateSessionToken());
  const listId = useId();

  // Sync from parent when value changes externally (e.g., form reset after save)
  useEffect(() => {
    if (!manualMode) setQuery(value || "");
  }, [value, manualMode]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 3 || manualMode) {
      setResults([]);
      setShowResults(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setShowResults(true);
      setError("");
      try {
        const response = await base44.functions.invoke("searchSchoolPlaces", {
          query: query.trim(),
          sessionToken: sessionTokenRef.current,
        });
        setResults(response.data?.results || []);
      } catch (err) {
        setResults([]);
        setError("Search unavailable. You can enter the school name manually.");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, manualMode]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (result) => {
    onChange(result.name);
    setQuery(result.name);
    setShowResults(false);
    setActiveIndex(-1);
    setManualMode(false);
  };

  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelectResult(results[activeIndex]);
    } else if (e.key === "Escape") {
      setShowResults(false);
      setActiveIndex(-1);
    }
  };

  const switchToManual = () => {
    setManualMode(true);
    setShowResults(false);
    setResults([]);
    onChange(query);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (manualMode) {
    return (
      <div className="space-y-2" ref={containerRef}>
        <Label htmlFor="school-name">School or program name</Label>
        <Input
          id="school-name"
          ref={inputRef}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: Lincoln High School"
          className="h-12 text-base"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => {
            setManualMode(false);
            setQuery(value || "");
            sessionTokenRef.current = generateSessionToken();
          }}
          className="text-sm text-primary font-medium hover:underline"
        >
          ← Search again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label htmlFor="school-search">School or program name</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
        <Input
          id="school-search"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder="Example: Carlow University"
          className="h-12 pl-10 text-base"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" aria-hidden="true" />
        )}
      </div>

      {!manualMode && query.trim().length < 3 && !error && (
        <p className="text-sm text-muted-foreground">
          Start typing to search for a school or program.
        </p>
      )}

      {error && (
        <p className="text-sm text-muted-foreground" role="status">{error}</p>
      )}

      {showResults && !loading && results.length > 0 && (
        <div
          id={listId}
          role="listbox"
          className="bg-card border border-border rounded-xl shadow-lg max-h-80 overflow-y-auto"
        >
          {results.map((result, idx) => (
            <button
              key={result.placeId}
              id={`${listId}-${idx}`}
              role="option"
              aria-selected={activeIndex === idx}
              type="button"
              onClick={() => handleSelectResult(result)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                activeIndex === idx ? "bg-accent" : "hover:bg-accent"
              } ${idx > 0 ? "border-t border-border" : ""}`}
            >
              <School className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{result.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && !loading && results.length === 0 && query.trim().length >= 3 && !error && (
        <div className="bg-accent rounded-xl p-4 text-center">
          <School className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-foreground mb-1">No results found for "{query}"</p>
          <button
            type="button"
            onClick={switchToManual}
            className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Enter school name manually
          </button>
        </div>
      )}

      {!showResults && !loading && query.trim().length < 3 && (
        <button
          type="button"
          onClick={switchToManual}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-1"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Can't find it? Enter manually
        </button>
      )}
    </div>
  );
}