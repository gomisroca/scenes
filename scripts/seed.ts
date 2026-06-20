import { db } from "../src/db";
import { games, screenshots } from "../src/db/schema";
import { fetchSteamGameDetails } from "../src/lib/steam/client";

// A small, fixed set of well-known App IDs for seeding.
const SEED_APP_IDS = [
  1245620, // Elden Ring
  1091500, // Cyberpunk 2077
  1145360, // Hades
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log(`Seeding ${SEED_APP_IDS.length} games from Steam...`);

  for (const appId of SEED_APP_IDS) {
    const details = await fetchSteamGameDetails(appId);

    if (!details) {
      console.warn(`  ⚠ no Steam data for app ${appId}, skipping`);
      continue;
    }

    const slug = slugify(details.name);

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

    if (!inserted) {
      console.log(`  – ${details.name} already exists, skipping`);
      continue;
    }

    console.log(`  ✓ ${inserted.name} (№ ${inserted.catalogNumber})`);

    // A couple of placeholder screenshot rows so the grid isn't empty.
    // These point at Steam's own header image as a stand-in — replace
    // with real uploads once R2 is wired up.
    await db.insert(screenshots).values([
      {
        gameId: inserted.id,
        r2Key: "placeholder/sample-1.jpg",
        width: 1920,
        height: 1080,
        caption: null,
      },
      {
        gameId: inserted.id,
        r2Key: "placeholder/sample-2.jpg",
        width: 1920,
        height: 1080,
        caption: null,
      },
    ]);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
