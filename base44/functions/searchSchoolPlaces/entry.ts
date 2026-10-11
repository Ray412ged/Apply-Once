import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// School search is available only to authenticated Apply Once users.
// Guest/public participant access was removed, so Google Places requests
// should not be exposed through an unauthenticated application endpoint.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {
      // Treat an invalid or missing session as unauthenticated.
    }
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return Response.json({
        error: 'School search is not configured.'
      }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim();

    if (query.length < 3) {
      return Response.json({ results: [] });
    }

    const searchBody: Record<string, any> = {
      input: query,
      languageCode: 'en',
      regionCode: 'us',
      // Restrict to institution-level results only — filters out parking
      // lots, buildings, departments, campuses, and other sub-locations.
      includedPrimaryTypes: ['school', 'university'],
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
      console.error('[searchSchoolPlaces] Autocomplete error:', response.status, errText);
      return Response.json({
        error: 'School search is unavailable right now.',
        results: [],
      }, { status: 502 });
    }

    const data = await response.json();

    // Keywords that indicate a sub-location rather than an institution.
    // Matches case-insensitive as a whole word (not inside another word).
    const SUB_LOCATION_RE = /\b(building|hall|center|centre|library|parking|garage|stadium|arena|gym|gymnasium|dormitory|dorm|residence|complex|annex|wing|lab|laboratory|auditorium|theatre|theater|pool|field|court|plaza|tower|mall|bookstore|cafeteria|dining|health center|medical center|student center|visitor center|welcome center)\b/i;

    const suggestions = (data.suggestions || []).map((s: any) => {
      const pred = s.placePrediction || {};
      return {
        placeId: pred.placeId || '',
        name: pred.structuredFormat?.mainText?.text || pred.text?.text || '',
        address: pred.structuredFormat?.secondaryText?.text || '',
      };
    })
      .filter((s: any) => s.placeId && s.name)
      .filter((s: any) => !SUB_LOCATION_RE.test(s.name));

    return Response.json({ results: suggestions });
  } catch (error) {
    console.error('[searchSchoolPlaces] error:', error.message);
    return Response.json({
      error: 'Something went wrong during school search.',
    }, { status: 500 });
  }
});