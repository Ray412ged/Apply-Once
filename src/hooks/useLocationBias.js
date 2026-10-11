import { useState, useEffect } from "react";

/**
 * Resolves the user's current device coordinates via the browser
 * Geolocation API. Returns { coords, loading }:
 *   - loading: true while the browser is fetching position
 *   - coords:  { latitude, longitude } or null if unavailable/denied
 *
 * The caller is responsible for providing fallbacks (e.g. onboarding
 * location text or a default service area) when coords is null.
 */
export function useLocationBias() {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLoading(false);
      return;
    }

    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        setLoading(false);
      },
      { timeout: 5000, maximumAge: 300000 }
    );

    return () => clearTimeout(timeoutId);
  }, []);

  return { coords, loading };
}