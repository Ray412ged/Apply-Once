import React, { useState, useRef, useEffect, useId } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, MapPin, Building2, Edit3 } from "lucide-react";
import { useLocationBias } from "@/hooks/useLocationBias";

function generateSessionToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function EmployerSearch({ value, onChange, locationBias = null }) {
  const [query, setQuery] = useState(value?.employer_name || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [error, setError] = useState("");

  const { coords: deviceCoords } = useLocationBias();
  const deviceCoordsRef = useRef(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const sessionTokenRef = useRef(generateSessionToken());
  const listId = useId();

  // Cache device GPS coordinates as they resolve so the next search
  // picks them up without re-triggering the current search.
  useEffect(() => {
    if (deviceCoords) deviceCoordsRef.current = deviceCoords;
  }, [deviceCoords]);

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
        const response = await base44.functions.invoke("searchEmployerPlaces", {
          query: query.trim(),
          sessionToken: sessionTokenRef.current,
          location: locationBias,
          latitude: deviceCoordsRef.current?.latitude,
          longitude: deviceCoordsRef.current?.longitude,
        });
        setResults(response.data?.results || []);
      } catch (err) {
        setResults([]);
        setError("We couldn't load employer search right now. You can still type your employer's name manually and continue.");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, manualMode, locationBias]);

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

  const handleSelectResult = async (result, idx) => {
    setFetchingDetails(true);
    setShowResults(false);
    setActiveIndex(idx);
    try {
      const response = await base44.functions.invoke("searchEmployerPlaces", {
        placeId: result.placeId,
        sessionToken: sessionTokenRef.current,
      });
      const employer = response.data?.employer;
      if (employer) {
        onChange({
          employer_name: employer.employer_name || result.employerName,
          google_place_id: employer.google_place_id || result.placeId,
          street_address: employer.street_address || "",
          city: employer.city || "",
          state: employer.state || "",
          postal_code: employer.postal_code || "",
          employer_type: employer.employer_type || "",
        });
        setQuery(employer.employer_name || result.employerName);
        setManualMode(false);
      }
    } catch (err) {
      // Fall back to using the suggestion data
      onChange({
        employer_name: result.employerName,
        google_place_id: result.placeId,
        street_address: "",
        city: "",
        state: "",
        postal_code: "",
        employer_type: "",
      });
      setQuery(result.employerName);
    } finally {
      setFetchingDetails(false);
      setActiveIndex(-1);
    }
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
      handleSelectResult(results[activeIndex], activeIndex);
    } else if (e.key === "Escape") {
      setShowResults(false);
      setActiveIndex(-1);
    }
  };

  const switchToManual = () => {
    setManualMode(true);
    setShowResults(false);
    setResults([]);
    // Preserve any typed query as the employer name
    onChange({
      employer_name: query,
      google_place_id: "",
      street_address: "",
      city: value?.city || "",
      state: value?.state || "",
      postal_code: "",
      employer_type: "",
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (manualMode) {
    return (
      <div className="space-y-4" ref={containerRef}>
        <div className="space-y-2">
          <Label htmlFor="employer-name">Employer or organization name</Label>
          <Input
            id="employer-name"
            ref={inputRef}
            value={value?.employer_name || ""}
            onChange={(e) => onChange({ ...value, employer_name: e.target.value, google_place_id: "" })}
            placeholder="Example: Walmart"
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employer-street">Street address</Label>
          <Input
            id="employer-street"
            value={value?.street_address || ""}
            onChange={(e) => onChange({ ...value, street_address: e.target.value })}
            placeholder="123 Main St"
            className="h-12 text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="employer-city">City</Label>
            <Input
              id="employer-city"
              value={value?.city || ""}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder="Pittsburgh"
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employer-state">State</Label>
            <Input
              id="employer-state"
              value={value?.state || ""}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              placeholder="PA"
              className="h-12 text-base"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employer-postal">ZIP code</Label>
          <Input
            id="employer-postal"
            value={value?.postal_code || ""}
            onChange={(e) => onChange({ ...value, postal_code: e.target.value })}
            placeholder="15201"
            className="h-12 text-base"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setManualMode(false);
            setQuery(value?.employer_name || "");
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
      <Label htmlFor="employer-search">Search for your employer</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
        <Input
          id="employer-search"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Clear previous selection when user types
            if (value?.google_place_id) {
              onChange({ employer_name: e.target.value, google_place_id: "", street_address: "", city: "", state: "", postal_code: "", employer_type: "" });
            }
          }}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder="Example: Trade Institute of Pittsburgh"
          className="h-12 pl-10 text-base"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        />
        {(loading || fetchingDetails) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" aria-hidden="true" />
        )}
      </div>

      {/* Helper text before search begins */}
      {!manualMode && query.trim().length < 3 && !value?.google_place_id && !error && (
        <p className="text-sm text-muted-foreground">
          Start typing at least 3 characters to search for an employer.
        </p>
      )}

      {error && (
        <p className="text-sm text-muted-foreground" role="status">{error}</p>
      )}

      {/* Search results */}
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
              onClick={() => handleSelectResult(result, idx)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                activeIndex === idx ? "bg-accent" : "hover:bg-accent"
              } ${idx > 0 ? "border-t border-border" : ""}`}
            >
              <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{result.employerName}</p>
                <p className="text-xs text-muted-foreground truncate">{result.address}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showResults && !loading && results.length === 0 && query.trim().length >= 3 && !error && (
        <div className="bg-accent rounded-xl p-4 text-center">
          <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-foreground mb-1">No results found for "{query}"</p>
          <button
            type="button"
            onClick={switchToManual}
            className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Enter employer manually
          </button>
        </div>
      )}

      {/* Manual entry link (always visible) */}
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

      {/* Selected employer location (read-only) */}
      {value?.google_place_id && !showResults && !manualMode && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Location</p>
              {value.street_address && (
                <p className="text-sm font-medium text-foreground">{value.street_address}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {[value.city, value.state, value.postal_code].filter(Boolean).join(", ")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange({ employer_name: "", google_place_id: "", street_address: "", city: "", state: "", postal_code: "", employer_type: "" });
                setQuery("");
                sessionTokenRef.current = generateSessionToken();
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-sm text-primary font-medium hover:underline flex-shrink-0"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}