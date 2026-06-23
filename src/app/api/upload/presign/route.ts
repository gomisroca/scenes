import { NextRequest, NextResponse } from "next/server";
import { createPresignedUploadUrl } from "@/lib/r2/upload";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signUploadKey } from "@/lib/auth/session";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

/**
 * Issues a short-lived presigned PUT URL for one file
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const gameSlug = body?.gameSlug;
  const contentType = body?.contentType;

  if (typeof gameSlug !== "string" || typeof contentType !== "string") {
    return NextResponse.json(
      { error: "gameSlug and contentType are required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: `Unsupported content type: ${contentType}` },
      { status: 400 },
    );
  }

  // Confirm the game actually exists
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

  const { uploadUrl, key } = await createPresignedUploadUrl({
    gameSlug,
    contentType,
  });

  // Sign (gameSlug, key) so /api/upload/complete can later verify
  const signature = signUploadKey(gameSlug, key);

  return NextResponse.json({ uploadUrl, key, signature });
}
