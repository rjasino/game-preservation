export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          Game Ako Chronicles
        </h1>
        <p className="max-w-lg text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          A game preservation retrospective — chronicling the games that shaped
          us. Tracking risk levels, platform availability, and the fight to keep
          our digital history playable.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            Preservation Tracking
          </span>
          <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Platform Analysis
          </span>
          <span className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Community Driven
          </span>
        </div>
      </main>
    </div>
  );
}
