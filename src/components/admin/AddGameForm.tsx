"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SteamAppListEntry = { appid: number; name: string };

export function AddGameForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SteamAppListEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingAppId, setAddingAppId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/admin/games/search?q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Derived at render time rather than cleared via setState inside
  // the effect above — avoids a synchronous setState-in-effect,
  // which can trigger an extra cascading render.
  const visibleResults = query.trim().length < 2 ? [] : results;

  async function handleAdd(appId: number) {
    setAddingAppId(appId);
    setError(null);

    try {
      const res = await fetch("/api/admin/games/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Could not add this game");
        return;
      }

      // Off to the homepage so it's immediately visible there —
      // confirms the add actually worked. (Redirects to the homepage
      // rather than the game's own page, since /games/[slug] hasn't
      // been built yet — update this once it exists.)
      router.push("/");
    } catch {
      setError("Unexpected error adding this game");
    } finally {
      setAddingAppId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-utility text-xs uppercase tracking-wider text-rust mb-2">
          archive access
        </p>
        <h1 className="font-display text-2xl font-semibold">add a game</h1>
        <p className="font-utility text-sm text-fade mt-2">
          search Steam by name, then pick the right result.
        </p>
      </header>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        placeholder="e.g. Hollow Knight"
        className="border border-tan bg-[#FBF8F0] px-3 py-2 font-utility text-sm focus:outline-none focus:border-rust"
      />

      {error ? <p className="font-utility text-xs text-rust">{error}</p> : null}

      <div className="flex flex-col gap-2">
        {searching ? (
          <p className="font-utility text-xs text-fade">searching...</p>
        ) : null}

        {!searching &&
        query.trim().length >= 2 &&
        visibleResults.length === 0 ? (
          <p className="font-utility text-xs text-fade">no matches.</p>
        ) : null}

        {visibleResults.map((result) => (
          <div
            key={result.appid}
            className="flex items-center justify-between gap-4 bg-card border border-card-border px-4 py-3"
          >
            <div className="flex flex-col">
              <span className="font-display text-base">{result.name}</span>
              <span className="font-utility text-xs text-fade">
                app {result.appid}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleAdd(result.appid)}
              disabled={addingAppId !== null}
              className="font-utility text-xs uppercase tracking-wider bg-ink text-paper px-4 py-2 disabled:opacity-40 transition-opacity whitespace-nowrap"
            >
              {addingAppId === result.appid ? "adding..." : "add"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
