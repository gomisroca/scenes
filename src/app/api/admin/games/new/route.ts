import { NextRequest, NextResponse } from "next/server";
import { fetchSteamGameDetails } from "@/lib/steam/client";
import { db } from "@/db";
import { games } from "@/db/schema";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const appId = body?.appId;

  if (typeof appId !== "number") {
    return NextResponse.json({ error: "appId is required" }, { status: 400 });
  }

  const details = await fetchSteamGameDetails(appId);

  if (!details) {
    return NextResponse.json(
      { error: `Steam has no details for app ${appId}` },
      { status: 404 },
    );
  }

  const baseSlug = slugify(details.name);

  // Slugs must be unique. Rather than fail outright on a collision
  // (two games sharing a name, e.g. a remaster), append a short
  // numeric suffix and retry a few times before giving up — this
  // keeps "add a game" a one-click action in the overwhelmingly
  // common case while still handling the rare collision gracefully.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    const [inserted] = await db
      .insert(games)
      .values({
        slug,
        steamAppId: details.steamAppId,
        name: details.name,
        headerImageUrl: details.headerImageUrl,
        shortDescription: details.shortDescription,
        releaseDate: details.releaseDate,
        developer: details.developer,
        publisher: details.publisher,
        genres: details.genres,
      })
      .onConflictDoNothing({ target: games.slug })
      .returning();

    if (inserted) {
      return NextResponse.json({ game: inserted });
    }
  }

  return NextResponse.json(
    { error: "Could not generate a unique slug for this game" },
    { status: 409 },
  );
}
