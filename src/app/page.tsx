import Link from "next/link";
import { getGamesWithCounts, type GameSort } from "@/db/queries";
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
        <h1 className="font-display text-[40px] font-semibold leading-tight tracking-tight mb-2">
          scenes
        </h1>
        <p className="text-[15px] text-fade max-w-md leading-relaxed">
          a collection of moments captured from games
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-6 pb-2 flex gap-2 font-utility text-xs">
        <Link
          href="/?sort=recent"
          className={`bg-card border px-3 py-1.5 rounded-xs ${
            activeSort === "recent"
              ? "border-ink shadow-[1px_1px_0_var(--color-ink)]"
              : "border-tan text-fade"
          }`}
        >
          recently added
        </Link>
        <Link
          href="/?sort=alphabetical"
          className={`bg-card border px-3 py-1.5 rounded-xs ${
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
          <div className="bg-card border border-card-border px-8 py-12 text-center rotate-[0.3deg] shadow-[1px_2px_4px_rgba(43,38,34,0.06),0_8px_18px_rgba(43,38,34,0.05)]">
            <p className="font-utility text-xs uppercase tracking-wider text-rust mb-3">
              № empty
            </p>
            <h2 className="font-display text-xl font-semibold mb-2">
              the archive is empty
            </h2>
            <p className="font-utility text-sm text-fade mb-6 max-w-sm mx-auto">
              nothing&apos;s been logged yet. add a game to start the
              collection.
            </p>
            <Link
              href="/admin/games/new"
              className="font-utility text-xs uppercase tracking-wider bg-ink text-paper px-5 py-2.5 inline-block"
            >
              add a game
            </Link>
          </div>
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
