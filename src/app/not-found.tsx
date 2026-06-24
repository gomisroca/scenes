import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="bg-card border border-card-border p-10 rotate-[-0.4deg] shadow-[1px_2px_4px_rgba(43,38,34,0.06),0_8px_18px_rgba(43,38,34,0.05)]">
        <p className="font-utility text-xs uppercase tracking-wider text-rust mb-3">
          № missing
        </p>
        <h1 className="font-display text-3xl font-semibold mb-3">
          page not found
        </h1>
        <p className="font-utility text-sm text-fade mb-7">
          this page doesn&apos;t exist, or the entry was removed from the
          archive.
        </p>
        <Link
          href="/"
          className="font-utility text-xs uppercase tracking-wider bg-ink text-paper px-5 py-2.5 inline-block"
        >
          back to archive
        </Link>
      </div>
    </main>
  );
}
