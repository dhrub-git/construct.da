import { NextResponse } from "next/server";
import { getAddressSuggestions } from "@/lib/address-search";

export async function GET(
  request: Request,
) {
  try {
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
