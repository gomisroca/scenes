import { NextRequest, NextResponse } from "next/server";
import { updateGameDetails } from "@/db/queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);

  const name = body?.name;
  const shortDescription = body?.shortDescription;
  const genres = body?.genres;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "name is required and cannot be empty" },
      { status: 400 },
    );
  }

  if (shortDescription !== null && typeof shortDescription !== "string") {
    return NextResponse.json(
      { error: "shortDescription must be a string or null" },
      { status: 400 },
    );
  }

  if (!Array.isArray(genres) || !genres.every((g) => typeof g === "string")) {
    return NextResponse.json(
      { error: "genres must be an array of strings" },
      { status: 400 },
    );
  }

  const updated = await updateGameDetails(slug, {
    name: name.trim(),
    shortDescription:
      typeof shortDescription === "string" && shortDescription.trim()
        ? shortDescription.trim()
        : null,
    genres: genres.map((g) => g.trim()).filter(Boolean),
  });

  if (!updated) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({ game: updated });
}
