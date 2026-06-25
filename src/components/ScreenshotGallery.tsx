"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Screenshot } from "@/db/schema";
import { publicUrlForClient } from "@/lib/r2/client-url";

type Props = {
  gameSlug: string;
  initialItems: Screenshot[];
  initialHasMore: boolean;
  totalCount: number;
  isAdmin: boolean;
};

type SortOrder = "newest" | "oldest";

export function ScreenshotGallery({
  gameSlug,
  initialItems,
  initialHasMore,
  totalCount,
  isAdmin,
}: Props) {
  const [items, setItems] = useState<Screenshot[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [sort, setSort] = useState<SortOrder>("newest");
  const [loading, setLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const isInitialSort = useRef(true);

  const loadMore = useCallback(
    async (currentSort: SortOrder, currentItems: Screenshot[]) => {
      setLoading(true);
      try {
        const last = currentItems[currentItems.length - 1];
        const cursorParam = last ? `&cursor=${last.id}` : "";
        const res = await fetch(
          `/api/games/${gameSlug}/screenshots?sort=${currentSort}${cursorParam}`,
        );
        if (!res.ok) return;

        const data = await res.json();
        setItems((prev) => [...prev, ...data.items]);
        setHasMore(data.hasMore);
      } finally {
        setLoading(false);
      }
    },
    [gameSlug],
  );

  // Re-fetch from scratch when sort changes
  useEffect(() => {
    if (isInitialSort.current) {
      isInitialSort.current = false;
      return;
    }

    let cancelled = false;

    async function refetch() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/games/${gameSlug}/screenshots?sort=${sort}`,
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setItems(data.items);
        setHasMore(data.hasMore);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    refetch();
    return () => {
      cancelled = true;
    };
  }, [sort, gameSlug]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          loadMore(sort, items);
        }
      },
      { rootMargin: "400px" }, // start loading before the sentinel is actually visible
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hasMore, loading, sort]);

  // Keyboard navigation for the lightbox.
  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((i) =>
          i !== null && i < items.length - 1 ? i + 1 : i,
        );
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, items.length]);

  const activeShot = lightboxIndex !== null ? items[lightboxIndex] : null;

  async function deleteScreenshot(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/screenshots/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3.5">
        <div className="font-utility text-xs text-fade flex gap-1.5">
          <h2 className="font-utility text-xs uppercase tracking-wider text-fade">
            {totalCount} captures
          </h2>
          <span>·</span>
          <button
            onClick={() => setSort("newest")}
            className={sort === "newest" ? "text-ink underline" : ""}
          >
            newest first
          </button>
          <span>·</span>
          <button
            onClick={() => setSort("oldest")}
            className={sort === "oldest" ? "text-ink underline" : ""}
          >
            oldest first
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-card-border px-8 py-12 text-center rotate-[-0.3deg] shadow-[1px_2px_4px_rgba(43,38,34,0.06),0_8px_18px_rgba(43,38,34,0.05)]">
          <p className="font-utility text-xs uppercase tracking-wider text-rust mb-3">
            № empty
          </p>
          <h3 className="font-display text-lg font-semibold mb-2">
            no captures yet
          </h3>
          <p className="font-utility text-sm text-fade">
            {isAdmin
              ? "nothing's been uploaded for this game yet."
              : "nothing's been logged for this game yet."}
          </p>
          {isAdmin ? (
            <a
              href="/upload"
              className="font-utility text-xs uppercase tracking-wider bg-ink text-paper px-5 py-2.5 inline-block mt-5"
            >
              upload screenshots
            </a>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((shot, index) => (
            <div
              key={shot.id}
              role="button"
              tabIndex={0}
              onClick={() => setLightboxIndex(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setLightboxIndex(index);
                }
              }}
              className="relative w-full aspect-video overflow-hidden border border-card-border bg-[#1c1a17] group cursor-pointer focus-visible:outline-2 focus-visible:outline-rust"
            >
              <Image
                src={publicUrlForClient(shot.r2Key)}
                alt={shot.caption ?? ""}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />

              {isAdmin ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        "Delete this screenshot? This can't be undone.",
                      )
                    ) {
                      deleteScreenshot(shot.id);
                    }
                  }}
                  disabled={deletingId === shot.id}
                  aria-label="Delete screenshot"
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-[#FBF8F0] text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:bg-rust/80 z-10"
                >
                  {deletingId === shot.id ? "…" : "×"}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-px" />

      {loading ? (
        <p className="text-center mt-7 font-utility text-xs text-fade">
          <span className="inline-block border border-dashed border-tan px-4 py-1.5 rounded-sm -rotate-1">
            loading more captures...
          </span>
        </p>
      ) : null}

      {activeShot ? (
        <Lightbox
          shot={activeShot}
          index={lightboxIndex!}
          total={items.length}
          onClose={() => setLightboxIndex(null)}
          onNext={() =>
            setLightboxIndex((i) =>
              i !== null && i < items.length - 1 ? i + 1 : i,
            )
          }
          onPrev={() =>
            setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))
          }
        />
      ) : null}
    </div>
  );
}

function Lightbox({
  shot,
  index,
  total,
  onClose,
  onNext,
  onPrev,
}: {
  shot: Screenshot;
  index: number;
  total: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const maxWidth = 900;
  const maxHeight =
    typeof window !== "undefined" ? window.innerHeight * 0.7 : 700;

  const scale = Math.min(
    maxWidth / shot.width,
    maxHeight / shot.height,
    1, // never upscale beyond the original resolution
  );
  const displayWidth = Math.round(shot.width * scale);
  const displayHeight = Math.round(shot.height * scale);

  return (
    <div
      className="fixed inset-0 bg-[#1b1815f8] z-50 flex flex-col items-center justify-center p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-5 text-[#D9CFC0] font-utility text-sm border border-[#D9CFC04D] px-2.5 py-1 rounded-sm"
      >
        esc &times;
      </button>

      {index > 0 ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/6 text-[#D9CFC0] flex items-center justify-center text-xl"
        >
          &lsaquo;
        </button>
      ) : null}

      {index < total - 1 ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/6 text-[#D9CFC0] flex items-center justify-center text-xl"
        >
          &rsaquo;
        </button>
      ) : null}

      <div
        className="relative bg-black border border-[#D9CFC040]"
        style={{ width: displayWidth, height: displayHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={publicUrlForClient(shot.r2Key)}
          alt={shot.caption ?? ""}
          fill
          sizes="900px"
          className="object-contain"
        />
      </div>

      {shot.caption ? (
        <div
          className="max-w-md mt-4.5 bg-tape text-[#3A332C] font-display italic text-sm px-4.5 py-2.5 text-center rotate-[-0.8deg] shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
          onClick={(e) => e.stopPropagation()}
        >
          {shot.caption}
        </div>
      ) : null}

      <p className="mt-3.5 font-utility text-xs text-[#9C9486]">
        {index + 1} / {total}
      </p>
    </div>
  );
}
