import { NextRequest, NextResponse } from "next/server";
import { searchSteamApps } from "@/lib/steam/client";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchSteamApps(query, 8);
  return NextResponse.json({ results });
}
