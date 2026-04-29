import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCouncilCache,
  getAddressSuggestions,
} from "@/lib/address-search";

const createJsonResponse = (response: {
  ok: boolean;
  status?: number;
  payload: unknown;
}) => ({
  ok: response.ok,
  status: response.status ?? (response.ok ? 200 : 500),
  async json() {
    return response.payload;
  },
});

describe("getAddressSuggestions", () => {
  beforeEach(() => {
    clearCouncilCache();
  });

  it("returns suggestions with cached geoscape fallback and clustering", async () => {
    const fetchCalls: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      const url = String(input);
      fetchCalls.push(url);

      if (url.includes("places:autocomplete")) {
        return createJsonResponse({
          ok: true,
          payload: {
            suggestions: [
              { placePrediction: { placeId: "p1" } },
              { placePrediction: { placeId: "p2" } },
            ],
          },
        }) as unknown as Response;
      }

      if (url.includes("/places/p1")) {
        return createJsonResponse({
          ok: true,
          payload: {
            formattedAddress: "1 Sample St, Sydney NSW 2000",
            location: { latitude: -33.8, longitude: 151.2 },
            addressComponents: [
              { shortText: "NSW", longText: "New South Wales", types: ["administrative_area_level_1"] },
              { shortText: "2000", longText: "2000", types: ["postal_code"] },
            ],
          },
        }) as unknown as Response;
      }

      if (url.includes("/places/p2")) {
        return createJsonResponse({
          ok: true,
          payload: {
            formattedAddress: "2 Sample St, Sydney NSW 2000",
            location: { latitude: -33.8002, longitude: 151.2001 },
            addressComponents: [
              { shortText: "NSW", longText: "NSW", types: ["administrative_area_level_1"] },
              { shortText: "2000", longText: "2000", types: ["postal_code"] },
            ],
          },
        }) as unknown as Response;
      }

      return createJsonResponse({
        ok: true,
        payload: {
          features: [{
            properties: {
              lgaName: "Sydney Council",
              state: "NSW",
            },
          }],
        },
      }) as unknown as Response;
    };

    const suggestions = await getAddressSuggestions({
      query: "sample",
      googleApiKey: "google-key",
      geoscapeApiKey: "geo-key",
      fetcher,
    });

    expect(suggestions).toHaveLength(2);
    expect(fetchCalls.filter((url) => url.includes("findByPoint"))).toHaveLength(1);

    const first = suggestions[0];
    const second = suggestions[1];
    expect(first).toMatchObject({ id: "p1", council: "Sydney Council", state: "NSW", postcode: "2000" });
    expect(second).toMatchObject({ id: "p2", council: "Sydney Council", state: "NSW", postcode: "2000" });
  });

  it("limits geoscape calls and marks unresolved council instead of reusing distant fallback", async () => {
    const fetchCalls: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      const url = String(input);
      fetchCalls.push(url);

      if (url.includes("places:autocomplete")) {
        return createJsonResponse({
          ok: true,
          payload: {
            suggestions: [
              { placePrediction: { placeId: "p1" } },
              { placePrediction: { placeId: "p2" } },
              { placePrediction: { placeId: "p3" } },
            ],
          },
        }) as unknown as Response;
      }

      if (url.includes("/places/p1")) {
        return createJsonResponse({
          ok: true,
          payload: {
            formattedAddress: "First Street",
            location: { latitude: -33.8, longitude: 151.2 },
            addressComponents: [{ shortText: "NSW", longText: "NSW", types: ["administrative_area_level_1"] }],
          },
        }) as unknown as Response;
      }
      if (url.includes("/places/p2")) {
        return createJsonResponse({
          ok: true,
          payload: {
            formattedAddress: "Second Street",
            location: { latitude: -34.0, longitude: 151.8 },
            addressComponents: [{ shortText: "VIC", longText: "VIC", types: ["administrative_area_level_1"] }],
          },
        }) as unknown as Response;
      }
      if (url.includes("/places/p3")) {
        return createJsonResponse({
          ok: true,
          payload: {
            formattedAddress: "Third Street",
            location: { latitude: -35.2, longitude: 153.1 },
            addressComponents: [{ shortText: "QLD", longText: "QLD", types: ["administrative_area_level_1"] }],
          },
        }) as unknown as Response;
      }

      const marker = /findByPoint/.test(url) ? url : "";
      if (!marker) {
        throw new Error(`unexpected request ${url}`);
      }

      const callIndex = fetchCalls.filter((item) => item.includes("findByPoint")).length;
      return createJsonResponse({
        ok: true,
        payload: {
          features: [
            {
              properties: {
                lgaName: `Council ${callIndex}`,
                state: `STATE_${callIndex}`,
              },
            },
          ],
        },
      }) as unknown as Response;
    };

    const suggestions = await getAddressSuggestions({
      query: "far",
      googleApiKey: "google-key",
      geoscapeApiKey: "geo-key",
      fetcher,
    });

    expect(fetchCalls.filter((url) => url.includes("findByPoint"))).toHaveLength(2);

    expect(suggestions).toHaveLength(3);
    expect(suggestions[2].council).toBe("Unknown council");
    expect(suggestions[2].state).toBe("QLD");
  });

  it("returns an empty list when autocomplete is unavailable", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(
      getAddressSuggestions({
        query: "15A Ross Street",
        googleApiKey: "google-key",
        geoscapeApiKey: "geoscape-key",
        fetcher: fetchImpl,
      }),
    ).resolves.toEqual([]);
  });
});
