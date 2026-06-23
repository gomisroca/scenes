import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { games, screenshots } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyUploadKey } from "@/lib/auth/session";

/**
 * Called once the browser has successfully PUT the file to R2 using
 * the presigned URL from /api/upload/presign
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const { gameSlug, r2Key, width, height, caption, signature } = body ?? {};

  if (
    typeof gameSlug !== "string" ||
    typeof r2Key !== "string" ||
    typeof signature !== "string" ||
    typeof width !== "number" ||
    typeof height !== "number" ||
    width <= 0 ||
    height <= 0
  ) {
    return NextResponse.json(
      { error: "gameSlug, r2Key, signature, width, and height are required" },
      { status: 400 },
    );
  }

  if (!verifyUploadKey(gameSlug, r2Key, signature)) {
    return NextResponse.json(
      { error: "Invalid or missing upload signature" },
      { status: 403 },
    );
  }

  const [game] = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.slug, gameSlug))
    .limit(1);

  if (!game) {
    return NextResponse.json(
      { error: `No game found with slug "${gameSlug}"` },
      { status: 404 },
    );
  }

  const [inserted] = await db
    .insert(screenshots)
    .values({
      gameId: game.id,
      r2Key,
      width,
      height,
      caption: typeof caption === "string" && caption.trim() ? caption : null,
    })
    .returning();

  return NextResponse.json({ screenshot: inserted });
}
