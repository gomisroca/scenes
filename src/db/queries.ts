import { db } from "@/db";
import { games, screenshots } from "@/db/schema";
import { count, eq, desc, asc, and, sql } from "drizzle-orm";

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

/**
 * Fetches a single game by its slug, plus its total screenshot count.
 */
export async function getGameBySlug(
  slug: string,
): Promise<GameWithCount | null> {
  const [row] = await db
    .select({
      game: games,
      screenshotCount: count(screenshots.id),
    })
    .from(games)
    .leftJoin(screenshots, eq(screenshots.gameId, games.id))
    .where(eq(games.slug, slug))
    .groupBy(games.id)
    .limit(1);

  return row ?? null;
}

export type ScreenshotSort = "newest" | "oldest";

/**
 * Fetches one page of screenshots for a game, newest-or-oldest first,
 * using cursor-based pagination.
 */
export async function getScreenshotsPage(params: {
  gameId: number;
  sort: ScreenshotSort;
  cursor?: number;
  limit: number;
}) {
  const { gameId, sort, cursor, limit } = params;

  const baseCondition = eq(screenshots.gameId, gameId);
  const cursorCondition =
    cursor === undefined
      ? undefined
      : sort === "oldest"
        ? sql`${screenshots.id} > ${cursor}`
        : sql`${screenshots.id} < ${cursor}`;

  const rows = await db
    .select()
    .from(screenshots)
    .where(
      cursorCondition ? and(baseCondition, cursorCondition) : baseCondition,
    )
    .orderBy(sort === "oldest" ? asc(screenshots.id) : desc(screenshots.id))
    .limit(limit + 1); // fetch one extra to know if there's a next page

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);

  return {
    items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
/**
 * Updates the editable subset of a game's fields
 */
export async function updateGameDetails(
  slug: string,
  updates: {
    name: string;
    shortDescription: string | null;
    genres: string[];
  },
) {
  const [updated] = await db
    .update(games)
    .set({
      name: updates.name,
      shortDescription: updates.shortDescription,
      genres: updates.genres,
      updatedAt: new Date(),
    })
    .where(eq(games.slug, slug))
    .returning();

  return updated ?? null;
}
