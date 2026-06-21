"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Something went wrong");
        return;
      }

      // Refresh so the Server Component re-checks the cookie and renders the actual component.
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-card border border-card-border p-8 max-w-sm mx-auto rotate-[-0.3deg] shadow-[1px_2px_4px_rgba(43,38,34,0.06),0_8px_18px_rgba(43,38,34,0.05)]">
      <p className="font-utility text-xs uppercase tracking-wider text-rust mb-2">
        archive access
      </p>
      <h1 className="font-display text-2xl font-semibold mb-6">
        enter the password
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="border border-tan bg-[#FBF8F0] px-3 py-2 font-utility text-sm focus:outline-none focus:border-rust"
          placeholder="password"
        />

        {error ? (
          <p className="font-utility text-xs text-rust">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="font-utility text-xs uppercase tracking-wider bg-ink text-paper px-4 py-2.5 disabled:opacity-40 transition-opacity"
        >
          {submitting ? "checking..." : "enter"}
        </button>
      </form>
    </div>
  );
}
