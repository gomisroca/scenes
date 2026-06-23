import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getGameBySlug, getScreenshotsPage } from "@/db/queries";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const INITIAL_PAGE_SIZE = 24;

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const entry = await getGameBySlug(slug);
  if (!entry) notFound();

  const { game, screenshotCount } = entry;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAdmin = verifySessionToken(token);

  const firstPage = await getScreenshotsPage({
    gameId: game.id,
    sort: "newest",
    limit: INITIAL_PAGE_SIZE,
  });

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 pt-7 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="font-utility text-xs text-fade hover:text-rust"
        >
          &larr; back to archive
        </Link>
        {isAdmin ? (
          <Link
            href={`/games/${game.slug}/edit`}
            className="font-utility text-xs text-fade hover:text-rust"
          >
            edit details
          </Link>
        ) : null}
      </div>

      <header className="max-w-4xl mx-auto px-6 pt-5">
        <div className="relative bg-card border border-card-border shadow-[1px_2px_4px_rgba(43,38,34,0.06),0_8px_18px_rgba(43,38,34,0.05)] rotate-[-0.3deg]">
          <span
            aria-hidden
            className="absolute -top-1.75 left-12.5 w-3.5 h-3.5 rounded-full shadow-[0_2px_3px_rgba(0,0,0,0.25)] z-10"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #E8836A, #A8412A 70%)",
            }}
          />

          <div className="relative aspect-920/430 m-3.5 mb-0 overflow-hidden border border-card-border bg-[#1c1a17]">
            {game.headerImageUrl ? (
              <Image
                src={game.headerImageUrl}
                alt={`${game.name} banner`}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                priority
                className="object-cover filter-[saturate(0.9)_contrast(1.03)_brightness(0.96)]"
              />
            ) : null}

            <div
              className="absolute top-5 right-6 text-[13px] tracking-wide text-rust border border-rust px-2.75 py-0.75 rounded-[3px] z-10 font-utility -rotate-6"
              style={{ mixBlendMode: "multiply" }}
            >
              № {String(game.catalogNumber).padStart(3, "0")}
            </div>
          </div>

          <div className="relative -mt-4.5 ml-7 inline-block bg-card px-5.5 pt-3 pb-2.5 border border-card-border shadow-[2px_3px_0_rgba(43,38,34,0.08)] z-10 -rotate-1">
            <h1 className="font-display text-[32px] font-bold leading-tight">
              {game.name}
            </h1>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3.5 px-7 pt-4.5 pb-6">
            <div className="flex gap-2 flex-wrap">
              {game.genres?.map((genre) => (
                <span
                  key={genre}
                  className="font-utility text-[11px] text-sage border border-dashed border-tan px-2.25 py-0.75 rounded-full bg-[#FBF8F0]"
                >
                  {genre.toLowerCase()}
                </span>
              ))}
            </div>
            <div className="flex gap-4.5 items-baseline font-utility text-xs text-fade">
              {game.releaseDate ? (
                <span>
                  released{" "}
                  <strong className="text-ink font-medium">
                    {game.releaseDate}
                  </strong>
                </span>
              ) : null}
              {game.developer ? (
                <span>
                  by{" "}
                  <strong className="text-ink font-medium">
                    {game.developer}
                  </strong>
                </span>
              ) : null}
              <span>
                <strong className="text-ink font-medium">
                  {screenshotCount}
                </strong>{" "}
                captures
              </span>
            </div>
          </div>
        </div>
      </header>

      {game.shortDescription ? (
        <section className="max-w-4xl mx-auto px-6 pt-7">
          <div className="bg-[#FBF8F0] border border-tan border-l-[3px] border-l-rust px-5.5 py-4 rotate-[0.3deg] shadow-[1px_2px_3px_rgba(43,38,34,0.04)]">
            <p className="font-utility text-[11px] uppercase tracking-wider text-rust mb-2">
              from the store page
            </p>
            <p className="font-display text-base italic leading-relaxed text-[#3A332C]">
              {game.shortDescription}
            </p>
          </div>
        </section>
      ) : null}

      <section className="max-w-4xl mx-auto px-6 pt-10 pb-24 w-full">
        <ScreenshotGallery
          gameSlug={game.slug}
          initialItems={firstPage.items}
          initialHasMore={firstPage.hasMore}
          totalCount={screenshotCount}
          isAdmin={isAdmin}
        />
      </section>
    </>
  );
}
