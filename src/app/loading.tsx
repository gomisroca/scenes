export default function HomeLoading() {
  return (
    <>
      <header className="max-w-2xl mx-auto px-6 pt-14 pb-8 border-b border-tan">
        <div className="h-3 w-32 bg-tan/50 rounded-sm mb-3 animate-pulse" />
        <div className="h-9 w-72 bg-tan/50 rounded-sm mb-3 animate-pulse" />
        <div className="h-4 w-96 bg-tan/30 rounded-sm animate-pulse" />
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-9 pb-24 flex flex-col gap-12">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-card border border-card-border aspect-460/215 m-3.5 mt-0 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </main>
    </>
  );
}
