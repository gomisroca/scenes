import { db } from "@/db";
import { games, screenshots } from "@/db/schema";
import { count, eq, desc, asc } from "drizzle-orm";

export type GameWithCount = {
  game: typeof games.$inferSelect;
  screenshotCount: number;
};

export type GameSort = "recent" | "alphabetical";

/**
 * Fetches every game along with how many screenshots it has.
 */
export async function getGamesWithCounts(
  sort: GameSort = "recent",
): Promise<GameWithCount[]> {
  const rows = await db
    .select({
      game: games,
      screenshotCount: count(screenshots.id),
    })
    .from(games)
    .leftJoin(screenshots, eq(screenshots.gameId, games.id))
    .groupBy(games.id)
    .orderBy(
      sort === "alphabetical" ? asc(games.name) : desc(games.catalogNumber),
    );

  return rows;
}
