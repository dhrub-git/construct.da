"use server";

export type GeocodeResult = {
  lat: number;
  lng: number;
  placeId?: string;
  bbounds?: {
    northeast: { lat: number; lng: number },
    southwest: { lat: number; lng: number }
  };
};

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error("Google Maps API key is not set in environment variables.");
}

export const addressToCoordinatesGoogle = async (
  address: string
): Promise<GeocodeResult | null> => {
  try {
    const q = address.trim();
    if (!q) return null;

    const url =
      "https://maps.googleapis.com/maps/api/geocode/json?" +
      new URLSearchParams({ address: q, key: GOOGLE_MAPS_API_KEY });

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google geocoding failed (${res.status})`);

    const data: {
      status: string;
      results: Array<{
        place_id: string;
        geometry: {
          location: { lat: number; lng: number },
          bounds: {
            northeast: { lat: number; lng: number },
            southwest: { lat: number; lng: number }
          },
          viewport: {
            northeast: { lat: number; lng: number },
            southwest: { lat: number; lng: number }
          }
        };
      }>;
      error_message?: string;
    } = await res.json();

    if (data.status !== "OK" || !data.results.length) return null;

    const loc = data.results[0].geometry.location;
    const bounds = data.results[0].geometry.bounds || data.results[0].geometry.viewport;
    const place_id = data.results[0].place_id;
    return {
      lat: loc.lat,
      lng: loc.lng,
      placeId: place_id,
      bbounds: bounds
    };
  } catch (error) {
    console.error("addressToCoordinatesGoogle error:", error);
    return null;
  }
};
