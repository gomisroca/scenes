import { GameSort, getGamesWithCounts } from "@/db/queries";
import Link from "next/link";
import { GameCard } from "@/components/GameCard";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const activeSort: GameSort =
    sort === "alphabetical" ? "alphabetical" : "recent";

  const entries = await getGamesWithCounts(activeSort);

  return (
    <>
      <header className="max-w-2xl mx-auto px-6 pt-14 pb-8 border-b border-tan">
        <p className="font-utility text-xs uppercase tracking-wider text-rust mb-2.5 inline-block -rotate-[0.6deg]">
          № archive — public
        </p>
        <h1 className="font-display text-[40px] font-semibold leading-tight tracking-tight mb-2">
          screenshot logbook
        </h1>
        <p className="text-[15px] text-fade max-w-md leading-relaxed">
          a running collection of moments captured from games I&apos;ve played,
          sorted by title and kept more or less in order.
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-6 pb-2 flex gap-2 font-utility text-xs">
        <Link
          href="/?sort=recent"
          className={`bg-card border px-3 py-1.5 rounded-[2px] ${
            activeSort === "recent"
              ? "border-ink shadow-[1px_1px_0_var(--color-ink)]"
              : "border-tan text-fade"
          }`}
        >
          recently added
        </Link>
        <Link
          href="/?sort=alphabetical"
          className={`bg-card border px-3 py-1.5 rounded-[2px] ${
            activeSort === "alphabetical"
              ? "border-ink shadow-[1px_1px_0_var(--color-ink)]"
              : "border-tan text-fade"
          }`}
        >
          alphabetical
        </Link>
      </div>

      <main className="max-w-2xl mx-auto px-6 pt-9 pb-24 flex flex-col gap-12">
        {entries.length === 0 ? (
          <p className="font-utility text-sm text-fade text-center py-20">
            no games in the archive yet.
          </p>
        ) : (
          entries.map(({ game, screenshotCount }) => (
            <GameCard
              key={game.id}
              game={game}
              screenshotCount={screenshotCount}
            />
          ))
        )}
      </main>
    </>
  );
}
