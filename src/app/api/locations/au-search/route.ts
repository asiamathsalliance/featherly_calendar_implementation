import type { AuLocationHit } from "@/lib/au-location-types";
import { NextResponse } from "next/server";

type NominatimItem = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

function parseHit(item: NominatimItem): AuLocationHit | null {
  const a = item.address ?? {};
  const state = (a.state ?? "").trim();
  const suburb = (
    a.suburb ??
    a.neighbourhood ??
    a.hamlet ??
    a.village ??
    a.quarter ??
    ""
  ).trim();
  const city = (
    a.city ??
    a.town ??
    a.municipality ??
    ""
  ).trim();

  if (!state && !suburb && !city) return null;

  const displayParts: string[] = [];
  if (suburb) displayParts.push(suburb);
  if (city && city !== suburb) displayParts.push(city);
  else if (!suburb && city) displayParts.push(city);
  if (state) displayParts.push(state);
  if (displayParts.length === 0) return null;

  return {
    display: displayParts.join(", "),
    suburb: suburb || city,
    city: city && city !== suburb ? city : "",
    state,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] as AuLocationHit[] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${q}, Australia`);
  url.searchParams.set("countrycodes", "au");
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "12");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-AU,en;q=0.9",
        // Nominatim returns 403 for bare library user-agents; identify the app clearly.
        "User-Agent":
          "Mozilla/5.0 (compatible; FeatherlyCalendar/1.0; +https://example.com/contact)",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Location search failed", results: [] },
        { status: 502 }
      );
    }

    const raw = (await res.json()) as NominatimItem[];
    const seen = new Set<string>();
    const results: AuLocationHit[] = [];
    for (const item of raw) {
      const hit = parseHit(item);
      if (!hit || seen.has(hit.display)) continue;
      seen.add(hit.display);
      results.push(hit);
      if (results.length >= 10) break;
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Location search failed", results: [] as AuLocationHit[] },
      { status: 502 }
    );
  }
}
