import type { AddressSuggestion } from "@models/data";

const GOOGLE_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";
const GOOGLE_PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";
const GEOSCAPE_BOUNDARY_URL =
  "https://api.psma.com.au/v1/administrativeBoundaries/findByPoint";

const AU_COUNTRY_CODE = "AU";
const MAX_GOOGLE_RESULTS = 8;
const MAX_GEOSCAPE_CALLS = 2;
const CLUSTER_RADIUS_KM = 12;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 mins

const councilCache = new Map<string, { expiresAt: number; value: CouncilLookup }>();

type GoogleAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      text?: {
        text: string;
      };
    };
  }>;
};

type GooglePlaceDetailsResponse = {
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
};

type GeoscapeBoundaryResponse = {
  features?: Array<{
    properties?: {
      lgaName?: string;
      state?: string;
    };
  }>;
};

type CouncilLookup = {
  lat: number;
  lng: number;
  council: string;
  state: string;
};

function getComponent(
  components: GooglePlaceDetailsResponse["addressComponents"] = [],
  type: string,
) {
  return components.find((item) => item.types.includes(type));
}

function roundCoord(value: number) {
  return value.toFixed(2);
}

function getCacheKey(lat: number, lng: number): string {
  return `${roundCoord(lat)}:${roundCoord(lng)}`;
}

function getCachedCouncil(lat: number, lng: number): CouncilLookup | null {
  const key = getCacheKey(lat, lng);
  const cached = councilCache.get(key);

  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    councilCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedCouncil(data: CouncilLookup): void {
  const key = getCacheKey(data.lat, data.lng);
  councilCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value: data,
  });
}

function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const dx = lat1 - lat2;
  const dy = lng1 - lng2;

  return Math.sqrt(dx * dx + dy * dy) * 111;
}

function isNearby(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusKm = CLUSTER_RADIUS_KM,
): boolean {
  return distanceKm(lat1, lng1, lat2, lng2) <= radiusKm;
}

async function fetchGeoscapeCouncil(
  lat: number,
  lng: number,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<CouncilLookup | null> {
  const cached = getCachedCouncil(lat, lng);
  if (cached) {
    return cached;
  }

  try {
    const url = new URL(GEOSCAPE_BOUNDARY_URL);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("layers", "localGovernmentAreas");
    url.searchParams.set("excludeGeometry", "true");

    const response = await fetcher(url.toString(), {
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GeoscapeBoundaryResponse;
    const feature = data.features?.[0];
    const result: CouncilLookup = {
      lat,
      lng,
      council: feature?.properties?.lgaName ?? "Unknown council",
      state: feature?.properties?.state ?? "",
    };

    setCachedCouncil(result);
    return result;
  } catch {
    return null;
  }
}

async function fetchPlaceDetails(
  placeId: string,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<{ placeId: string; details: GooglePlaceDetailsResponse; lat: number; lng: number } | null> {
  const response = await fetcher(`${GOOGLE_PLACE_DETAILS_URL}/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "formattedAddress,location,addressComponents",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const details = (await response.json()) as GooglePlaceDetailsResponse;
  const lat = details.location?.latitude;
  const lng = details.location?.longitude;

  if (lat == null || lng == null) {
    return null;
  }

  return { placeId, details, lat, lng };
}

async function fetchAutocompletePredictions(
  query: string,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<{ placeId: string }[]> {
  let autoResponse: Response;

  try {
    autoResponse = await fetcher(GOOGLE_AUTOCOMPLETE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
      },
      body: JSON.stringify({
        input: query,
        includedRegionCodes: ["AU"],
      }),
      cache: "no-store",
    });
  } catch {
    return [];
  }

  if (!autoResponse.ok) {
    return [];
  }

  const autoData = (await autoResponse.json()) as GoogleAutocompleteResponse;

  return (
    autoData.suggestions
      ?.map((item) => item.placePrediction)
      .filter(Boolean)
      .slice(0, MAX_GOOGLE_RESULTS) ?? []
  )
    .filter((prediction): prediction is { placeId: string } => !!prediction && !!prediction.placeId)
    .map((prediction) => ({ placeId: prediction.placeId }));
}

function pickCouncilForPlace(
  lat: number,
  lng: number,
  groups: CouncilLookup[],
  geoscapeApiKey: string,
  geoscapeCalls: { count: number },
  fetcher: typeof fetch = fetch,
): Promise<CouncilLookup | null> {
  const localMatch = groups.find((group) => isNearby(lat, lng, group.lat, group.lng));
  if (localMatch) {
    return Promise.resolve(localMatch);
  }

  if (geoscapeCalls.count >= MAX_GEOSCAPE_CALLS) {
    return Promise.resolve(null);
  }

  return fetchGeoscapeCouncil(lat, lng, geoscapeApiKey, fetcher).then((match) => {
    if (match) {
      groups.push(match);
    }
    geoscapeCalls.count += 1;
    return match;
  });
}

async function buildSuggestions(
  queryDetails: Awaited<ReturnType<typeof fetchPlaceDetails>>[],
  geoscapeApiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<AddressSuggestion[]> {
  const councilGroups: CouncilLookup[] = [];
  const geoscapeCalls = { count: 0 };
  const suggestions: AddressSuggestion[] = [];

  for (const place of queryDetails.filter(Boolean)) {
    const group = await pickCouncilForPlace(
      place!.lat,
      place!.lng,
      councilGroups,
      geoscapeApiKey,
      geoscapeCalls,
      fetcher,
    );

    const fallbackState =
      getComponent(place!.details.addressComponents, "administrative_area_level_1")?.shortText ?? "";

    const postcode =
      getComponent(place!.details.addressComponents, "postal_code")?.longText;

    suggestions.push({
      id: place!.placeId,
      label: place!.details.formattedAddress ?? "",
      address: place!.details.formattedAddress ?? "",
      council: group?.council ?? "Unknown council",
      state: group?.state ?? fallbackState,
      postcode,
      countryCode: AU_COUNTRY_CODE,
      lat: place!.lat,
      lng: place!.lng,
    });
  }

  return suggestions;
}

export type AddressSearchParams = {
  query: string;
  googleApiKey: string;
  geoscapeApiKey: string;
  fetcher?: typeof fetch;
};

export async function getAddressSuggestions({
  query,
  googleApiKey,
  geoscapeApiKey,
  fetcher = fetch,
}: AddressSearchParams): Promise<AddressSuggestion[]> {
  const predictions = await fetchAutocompletePredictions(
    query,
    googleApiKey,
    fetcher,
  );

  const detailResults = await Promise.all(
    predictions.map((prediction) => fetchPlaceDetails(prediction.placeId, googleApiKey, fetcher)),
  );

  const validPlaces = detailResults.filter(
    Boolean,
  ) as Awaited<ReturnType<typeof fetchPlaceDetails>>[];

  return buildSuggestions(validPlaces, geoscapeApiKey, fetcher);
}

export function clearCouncilCache() {
  councilCache.clear();
}
