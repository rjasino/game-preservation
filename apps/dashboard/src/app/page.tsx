import { Suspense } from "react";
import { loadGames } from "@/lib/data";
import { GameTable } from "@/components/game-table";
import { SearchInput } from "@/components/search-input";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          PS Vita Exclusive Games
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Browse and explore {""}
          <span className="font-semibold text-zinc-700">2,129</span> games
          available exclusively on PlayStation Vita.
        </p>
      </header>

      {/* Search bar */}
      <div className="mb-6">
        <SearchInput defaultValue={q} />
      </div>

      {/* Results */}
      <Suspense fallback={<TableSkeleton />}>
        <GamesList query={q} />
      </Suspense>
    </div>
  );
}

async function GamesList({ query }: { query: string }) {
  let games;
  let errorMessage: string | null = null;

  try {
    const data = await loadGames();
    const q = query.toLowerCase().trim();

    games = q
      ? data.games.filter((g) => g.name.toLowerCase().includes(q))
      : data.games;
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Failed to load game data.";
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} />;
  }

  if (!games || games.length === 0) {
    return <EmptyState query={query} />;
  }

  return <GameTable games={games} />;
}

function EmptyState({ query }: { query: string }) {
  if (!query) return null;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
      <svg
        className="mb-4 h-12 w-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <p className="text-lg font-medium">No results for &ldquo;{query}&rdquo;</p>
      <p className="text-sm">Try a different search term.</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 py-16 text-center">
      <svg
        className="mb-4 h-12 w-12 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <h2 className="text-lg font-semibold text-red-800">
        Failed to load games
      </h2>
      <p className="mt-1 text-sm text-red-600">{message}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="animate-pulse space-y-4 px-4 py-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-16 w-12 rounded bg-zinc-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-zinc-200" />
              <div className="h-3 w-32 rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
