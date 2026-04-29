import { NextResponse } from "next/server";
import { getAddressSuggestions } from "@/lib/address-search";

const ADDRESS_LOOKUP_WINDOW_MS = 60_000;
const ADDRESS_LOOKUP_LIMIT = 30;
const addressLookupHits = new Map<string, number[]>();

export async function GET(request: Request) {
  try {
    const rateLimitKey = getRateLimitKey(request);
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { message: "Too many address lookup requests." },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() ?? "";

    if (query.length < 3) {
      return NextResponse.json({
        suggestions: [],
      });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    const geoscapeApiKey = process.env.GEOSCAPE_API_KEY;

    if (!googleApiKey || !geoscapeApiKey) {
      return NextResponse.json(
        {
          message: "Missing API keys.",
        },
        {
          status: 500,
        },
      );
    }

    const suggestions = await getAddressSuggestions({
      query,
      googleApiKey,
      geoscapeApiKey,
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Lookup failed.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}

function getRateLimitKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "anonymous";
}

function isRateLimited(key: string, now = Date.now()): boolean {
  const cutoff = now - ADDRESS_LOOKUP_WINDOW_MS;
  for (const [entryKey, timestamps] of addressLookupHits) {
    const active = timestamps.filter((timestamp) => timestamp > cutoff);
    if (active.length === 0) {
      addressLookupHits.delete(entryKey);
    } else if (active.length !== timestamps.length) {
      addressLookupHits.set(entryKey, active);
    }
  }

  const timestamps = addressLookupHits.get(key)?.filter((timestamp) => timestamp > cutoff) ?? [];
  if (timestamps.length >= ADDRESS_LOOKUP_LIMIT) {
    addressLookupHits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  addressLookupHits.set(key, timestamps);
  return false;
}
