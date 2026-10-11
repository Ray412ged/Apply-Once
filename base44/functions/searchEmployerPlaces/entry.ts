// Employer search uses only the Google Places API key — no user data is
// accessed — so the function does not require authentication. This allows
// guest users (who have no authenticated session) to search for employers.

// Map Google Places types to a normalized employer_type for the taxonomy.
// Priority order ensures specific types (restaurant, hospital) are matched
// before generic ones (store, establishment).
const EMPLOYER_TYPE_MAP: Array<{ types: string[]; employer_type: string }> = [
  { types: ['restaurant', 'cafe', 'bar', 'night_club', 'bakery', 'meal_takeaway', 'meal_delivery'], employer_type: 'restaurant' },
  { types: ['hospital', 'doctor', 'dentist', 'pharmacy', 'veterinary_care', 'physiotherapist'], employer_type: 'healthcare' },
  { types: ['school', 'university', 'secondary_school', 'primary_school', 'library'], employer_type: 'education' },
  { types: ['lodging', 'hotel', 'motel'], employer_type: 'hospitality' },
  { types: ['gas_station', 'car_dealer', 'car_rental', 'car_repair', 'car_wash'], employer_type: 'automotive' },
  { types: ['beauty_salon', 'hair_care', 'spa'], employer_type: 'personal_services' },
  { types: ['gym'], employer_type: 'fitness' },
  { types: ['bank', 'insurance_agency', 'accounting'], employer_type: 'finance' },
  { types: ['city_hall', 'courthouse', 'local_government_office', 'police', 'fire_station', 'post_office'], employer_type: 'government' },
  { types: ['general_contractor', 'roofing_contractor', 'electrician', 'plumber', 'painter'], employer_type: 'construction' },
  { types: ['storage'], employer_type: 'warehouse' },
  { types: ['department_store', 'supermarket', 'grocery_or_supermarket', 'convenience_store', 'clothing_store', 'electronics_store', 'hardware_store', 'home_goods_store', 'furniture_store', 'book_store', 'shoe_store', 'pet_store', 'shopping_mall', 'liquor_store', 'florist', 'jewelry_store', 'store'], employer_type: 'retail' },
];

function mapEmployerType(types: string[]): string {
  for (const entry of EMPLOYER_TYPE_MAP) {
    if (entry.types.some((t) => types.includes(t))) {
      return entry.employer_type;
    }
  }
  return '';
}

// Default service area: Pittsburgh metropolitan area.
// Used when neither device GPS nor an onboarding location is available.
const PITTSBURGH_LAT = 40.4406;
const PITTSBURGH_LNG = -79.9959;
const DEFAULT_RADIUS_METERS = 50000; // ~31 miles (Google API maximum)

async function geocodeLocation(apiKey: string, locationText: string): Promise<{ latitude: number; longitude: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationText)}&region=us&key=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) return null;
    const loc = data.results[0].geometry.location;
    return { latitude: loc.lat, longitude: loc.lng };
  } catch {
    return null;
  }
}

// Resolve coordinates for proximity-based search ranking:
// 1. Device GPS coordinates (most precise)
// 2. Geocoded onboarding location (city/ZIP from user profile)
// 3. Default service area (Pittsburgh metropolitan area)
async function resolveLocationCoordinates(
  apiKey: string,
  lat?: number,
  lng?: number,
  locationText?: string
): Promise<{ latitude: number; longitude: number }> {
  if (typeof lat === 'number' && typeof lng === 'number') {
    return { latitude: lat, longitude: lng };
  }
  if (locationText) {
    const geocoded = await geocodeLocation(apiKey, locationText);
    if (geocoded) return geocoded;
  }
  return { latitude: PITTSBURGH_LAT, longitude: PITTSBURGH_LNG };
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return Response.json({
        error: 'Google Places API key not configured.'
      }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));

    // Mode 1: Autocomplete search
    if (body.query !== undefined) {
      const query = String(body.query).trim();
      if (query.length < 3) {
        return Response.json({ results: [] });
      }

      // Resolve coordinates for proximity-based ranking:
      // device GPS → geocoded onboarding location → Pittsburgh default.
      const location = typeof body.location === 'string' ? body.location.trim() : '';
      const coords = await resolveLocationCoordinates(apiKey, body.latitude, body.longitude, location);
      const searchBody = {
        input: query,
        languageCode: 'en',
        regionCode: 'us',
        locationBias: {
          circle: {
            center: { latitude: coords.latitude, longitude: coords.longitude },
            radius: DEFAULT_RADIUS_METERS,
          },
        },
      };
      if (body.sessionToken) {
        searchBody.sessionToken = body.sessionToken;
      }

      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(searchBody),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('[searchEmployerPlaces] Autocomplete error:', response.status, errText);
        return Response.json({
          error: 'Employer search is unavailable right now. You can enter the employer name manually.',
          results: [],
        }, { status: 502 });
      }

      const data = await response.json();
      const suggestions = (data.suggestions || []).map((s) => {
        const pred = s.placePrediction || {};
        return {
          placeId: pred.placeId || '',
          employerName: pred.structuredFormat?.mainText?.text || pred.text?.text || '',
          address: pred.structuredFormat?.secondaryText?.text || '',
        };
      }).filter((s) => s.placeId && s.employerName);

      return Response.json({ results: suggestions });
    }

    // Mode 2: Place Details (when user selects a suggestion)
    if (body.placeId) {
      const placeId = String(body.placeId);

      const detailsUrl = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
      detailsUrl.searchParams.set('fields', 'displayName,addressComponents,types');
      detailsUrl.searchParams.set('languageCode', 'en');
      if (body.sessionToken) {
        detailsUrl.searchParams.set('sessionToken', body.sessionToken);
      }

      const response = await fetch(detailsUrl, {
        headers: { 'X-Goog-Api-Key': apiKey },
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('[searchEmployerPlaces] Place Details error:', response.status, errText);
        return Response.json({
          error: 'Could not retrieve employer details. Please enter the information manually.',
        }, { status: 502 });
      }

      const place = await response.json();

      const components = place.addressComponents || [];
      const getComponent = (type) => {
        const c = components.find((c) => c.types && c.types.includes(type));
        return c || null;
      };

      const city = getComponent('locality')?.longText ||
        getComponent('sublocality')?.longText ||
        getComponent('postal_town')?.longText || '';
      const state = getComponent('administrative_area_level_1')?.shortText || '';

      const streetNumber = getComponent('street_number')?.longText || '';
      const route = getComponent('route')?.longText || '';
      const streetAddress = [streetNumber, route].filter(Boolean).join(' ');
      const postalCode = getComponent('postal_code')?.longText || '';
      const employerType = mapEmployerType(place.types || []);

      return Response.json({
        employer: {
          employer_name: place.displayName?.text || '',
          google_place_id: placeId,
          street_address: streetAddress,
          city,
          state,
          postal_code: postalCode,
          employer_type: employerType,
        }
      });
    }

    return Response.json({ error: 'Missing query or placeId parameter' }, { status: 400 });
  } catch (error) {
    console.error('[searchEmployerPlaces] error:', error.message);
    return Response.json({
      error: 'Something went wrong during employer search.',
    }, { status: 500 });
  }
});