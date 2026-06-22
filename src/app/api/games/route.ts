import { NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({ id: games.id, slug: games.slug, name: games.name })
    .from(games)
    .orderBy(asc(games.name));

  return NextResponse.json({ games: rows });
}
