"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@/db/schema";

export function EditGameForm({ game }: { game: Game }) {
  const router = useRouter();
  const [name, setName] = useState(game.name);
  const [shortDescription, setShortDescription] = useState(
    game.shortDescription ?? "",
  );
  // Stored as a comma-separated string while editing
  const [genresText, setGenresText] = useState((game.genres ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const genres = genresText
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/games/${game.slug}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          shortDescription: shortDescription.trim() || null,
          genres,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Could not save changes");
        return;
      }

      router.push(`/games/${game.slug}`);
    } catch {
      setError("Unexpected error saving changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <header>
        <p className="font-utility text-xs uppercase tracking-wider text-rust mb-2">
          archive access
        </p>
        <h1 className="font-display text-2xl font-semibold">edit game</h1>
      </header>

      {error ? <p className="font-utility text-xs text-rust">{error}</p> : null}

      <div className="flex flex-col gap-1.5">
        <label className="font-utility text-xs uppercase tracking-wider text-fade">
          name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border border-tan bg-[#FBF8F0] px-3 py-2 font-display text-base focus:outline-none focus:border-rust"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-utility text-xs uppercase tracking-wider text-fade">
          description
        </label>
        <textarea
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          rows={4}
          className="border border-tan bg-[#FBF8F0] px-3 py-2 font-display text-sm italic leading-relaxed focus:outline-none focus:border-rust resize-y"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-utility text-xs uppercase tracking-wider text-fade">
          genres <span className="text-fade/70">(comma separated)</span>
        </label>
        <input
          type="text"
          value={genresText}
          onChange={(e) => setGenresText(e.target.value)}
          placeholder="e.g. action rpg, open world"
          className="border border-tan bg-[#FBF8F0] px-3 py-2 font-utility text-sm focus:outline-none focus:border-rust"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="font-utility text-xs uppercase tracking-wider bg-ink text-paper px-5 py-2.5 disabled:opacity-40 transition-opacity"
        >
          {saving ? "saving..." : "save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/games/${game.slug}`)}
          className="font-utility text-xs uppercase tracking-wider text-fade px-5 py-2.5"
        >
          cancel
        </button>
      </div>
    </form>
  );
}
