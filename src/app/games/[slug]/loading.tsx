export default function GameLoading() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-6 pt-7">
        <div className="h-3 w-24 bg-tan/40 rounded-sm animate-pulse" />
      </div>

      <header className="max-w-4xl mx-auto px-6 pt-5">
        <div className="bg-card border border-card-border rotate-[-0.3deg]">
          <div className="aspect-920/430 m-3.5 mb-0 bg-tan/40 animate-pulse" />
          <div className="px-7 pt-4.5 pb-6">
            <div className="h-3 w-48 bg-tan/40 rounded-sm animate-pulse" />
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-10 pb-24">
        <div className="h-3 w-20 bg-tan/40 rounded-sm mb-3.5 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="aspect-video bg-tan/30 border border-card-border animate-pulse"
              style={{ animationDelay: `${(i % 3) * 100}ms` }}
            />
          ))}
        </div>
      </section>
    </>
  );
}
