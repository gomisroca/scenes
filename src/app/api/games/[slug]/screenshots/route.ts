import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getScreenshotsPage, type ScreenshotSort } from "@/db/queries";

const PAGE_SIZE = 24;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;

  const sortParam = searchParams.get("sort");
  const sort: ScreenshotSort = sortParam === "oldest" ? "oldest" : "newest";

  const cursorParam = searchParams.get("cursor");
  const cursor = cursorParam ? Number(cursorParam) : undefined;

  if (cursorParam && (cursor === undefined || Number.isNaN(cursor))) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  const [game] = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.slug, slug))
    .limit(1);

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const page = await getScreenshotsPage({
    gameId: game.id,
    sort,
    cursor,
    limit: PAGE_SIZE,
  });

  return NextResponse.json(page);
}
