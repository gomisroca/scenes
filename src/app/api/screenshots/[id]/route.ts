import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { screenshots } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteObjectFromR2 } from "@/lib/r2/upload";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(screenshots)
    .where(eq(screenshots.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Screenshot not found" },
      { status: 404 },
    );
  }

  // Delete the DB row first
  await db.delete(screenshots).where(eq(screenshots.id, id));

  try {
    await deleteObjectFromR2(existing.r2Key);
  } catch (err) {
    // The DB row is already gone, so the screenshot is correctly
    // removed from the site regardless of this outcome
    console.error(`Failed to delete R2 object ${existing.r2Key}:`, err);
  }

  return NextResponse.json({ ok: true });
}
