import Link from "next/link";
import Image from "next/image";
import type { Game } from "@/db/schema";

type GameCardProps = {
  game: Game;
  screenshotCount: number;
};

function seededVariation(seed: number) {
  const rand = (offset: number) => {
    const x = Math.sin(seed * 999 + offset) * 10000;
    return x - Math.floor(x);
  };

  return {
    tilt: (rand(1) - 0.5) * 1.6, // -0.8deg to 0.8deg
    labelTilt: (rand(2) - 0.5) * 2.4, // -1.2deg to 1.2deg
    stampRotate: -8 + rand(3) * 12, // -8deg to 4deg
    tapeLeft: rand(4) > 0.5,
    tapeRotate: (rand(5) - 0.5) * 10,
  };
}

export function GameCard({ game, screenshotCount }: GameCardProps) {
  const v = seededVariation(game.id);

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block focus-visible:outline-none"
    >
      <article
        className="relative bg-card border border-card-border shadow-[1px_2px_4px_rgba(43,38,34,0.06),0_8px_18px_rgba(43,38,34,0.05)] transition-transform duration-200 ease-out group-hover:shadow-[1px_2px_4px_rgba(43,38,34,0.08),0_14px_28px_rgba(43,38,34,0.10)] group-hover:-translate-y-[3px] group-focus-visible:ring-2 group-focus-visible:ring-rust"
        style={{
          transform: `rotate(${v.tilt}deg)`,
        }}
      >
        {/* Pin */}
        <span
          aria-hidden
          className="absolute -top-[7px] left-10 w-3.5 h-3.5 rounded-full shadow-[0_2px_3px_rgba(0,0,0,0.25)] z-10"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #E8836A, #A8412A 70%)",
          }}
        />

        {/* Tape */}
        <span
          aria-hidden
          className="absolute -top-[10px] w-[74px] h-[26px] opacity-75 shadow-[0_1px_2px_rgba(0,0,0,0.15)] z-10 bg-tape"
          style={{
            left: v.tapeLeft ? "22px" : "auto",
            right: v.tapeLeft ? "auto" : "120px",
            transform: `rotate(${v.tapeRotate}deg)`,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent 0 3px, rgba(255,255,255,0.4) 3px 4px)",
          }}
        />

        <div className="relative aspect-[460/215] m-3.5 mt-3.5 mb-0 overflow-hidden border border-card-border bg-[#1c1a17]">
          {game.headerImageUrl ? (
            <Image
              src={game.headerImageUrl}
              alt={`${game.name} banner`}
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover [filter:saturate(0.9)_contrast(1.03)_brightness(0.98)]"
            />
          ) : null}

          <div
            className="absolute top-[14px] right-4 text-[11px] tracking-wide text-rust border border-rust px-[9px] py-[3px] rounded-[3px] z-10 font-utility"
            style={{
              transform: `rotate(${v.stampRotate}deg)`,
              mixBlendMode: "multiply",
            }}
          >
            № {String(game.catalogNumber).padStart(3, "0")}
          </div>
        </div>

        <div
          className="relative -mt-4 ml-6 inline-block bg-card px-[18px] pt-[10px] pb-2 border border-card-border shadow-[2px_3px_0_rgba(43,38,34,0.08)] z-10"
          style={{ transform: `rotate(${v.labelTilt}deg)` }}
        >
          <h2 className="font-display text-[22px] font-semibold leading-tight">
            {game.name}
          </h2>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 pt-3.5 pb-[18px] flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {game.genres?.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="font-utility text-[11px] text-sage border border-dashed border-tan px-[9px] py-[3px] rounded-full bg-[#FBF8F0]"
              >
                {genre.toLowerCase()}
              </span>
            ))}
          </div>
          <div className="font-utility text-xs text-fade whitespace-nowrap flex items-center gap-1.5">
            <span className="w-[5px] h-[5px] rounded-full bg-rust inline-block" />
            {screenshotCount} captures
          </div>
        </div>
      </article>
    </Link>
  );
}
