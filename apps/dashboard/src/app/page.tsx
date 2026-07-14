import { Suspense } from "react";
import { queryGames, getUniqueGenres, getUniquePlatforms, getUniqueDevelopers, getUniquePublishers, getCategoryCounts } from "@/lib/data";
import { GameTable } from "@/components/game-table";
import { SearchInput } from "@/components/search-input";
import { FilterBar } from "@/components/filter-bar";
import { SortSelect } from "@/components/sort-select";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    platform?: string;
    contentType?: string;
    developer?: string;
    publisher?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const {
    q = "",
    genre = "",
    platform = "",
    contentType = "",
    developer = "",
    publisher = "",
    sort = "",
    order = "",
  } = params;

  // Load filter options from data (these are lightweight)
  const genres = await getUniqueGenres();
  const platforms = await getUniquePlatforms();
  const developers = await getUniqueDevelopers();
  const publishers = await getUniquePublishers();
  const categoryCounts = await getCategoryCounts();

  const hasDlc = categoryCounts.dlc > 0;

  // Count active filters for the summary
  const activeFilters = [genre, platform, contentType, developer, publisher].filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          PS Vita Exclusive Games
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Browse and explore{" "}
          <span className="font-semibold text-zinc-700">2,129</span> games
          available exclusively on PlayStation Vita.
        </p>
      </header>

      {/* Search + Filter Bar */}
      <div className="mb-6 space-y-4">
        {/* Title search */}
        <SearchInput defaultValue={q} />

        {/* Genre / Platform / Content Type / Developer / Publisher filters */}
        <FilterBar
          genres={genres}
          platforms={platforms}
          developers={developers}
          publishers={publishers}
          categoryCounts={categoryCounts}
          hasDlc={hasDlc}
        />
      </div>

      {/* Results */}
      <Suspense fallback={<TableSkeleton />}>
        <GamesList
          search={q}
          genre={genre}
          platform={platform}
          contentType={contentType}
          developer={developer}
          publisher={publisher}
          sort={sort}
          order={order}
          activeFilters={activeFilters}
        />
      </Suspense>
    </div>
  );
}

async function GamesList({
  search,
  genre,
  platform,
  contentType,
  developer,
  publisher,
  sort,
  order,
  activeFilters,
}: {
  search: string;
  genre: string;
  platform: string;
  contentType: string;
  developer: string;
  publisher: string;
  sort: string;
  order: string;
  activeFilters: number;
}) {
  let result;
  let errorMessage: string | null = null;

  try {
    result = await queryGames({
      search,
      genre: genre || undefined,
      platform: platform || undefined,
      contentType: contentType || undefined,
      developer: developer || undefined,
      publisher: publisher || undefined,
      sort: (sort as "title" | "release_date") || undefined,
      order: (order as "asc" | "desc") || undefined,
    });
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Failed to load game data.";
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} />;
  }

  if (!result || result.games.length === 0) {
    return <EmptyState query={search} activeFilters={activeFilters} />;
  }

  return (
    <>
      {/* Sort controls + count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-zinc-400">
          Showing {result.total} game{result.total !== 1 ? "s" : ""}
          {activeFilters > 0 && (
            <span className="ml-1">
              (filtered from 2,129)
            </span>
          )}
        </p>
        <SortSelect />
      </div>

      <GameTable games={result.games} />
    </>
  );
}

function EmptyState({
  query,
  activeFilters,
}: {
  query: string;
  activeFilters: number;
}) {
  const hasFilters = Boolean(query) || activeFilters > 0;
  if (!hasFilters) return null;

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
      <p className="text-lg font-medium">No games found</p>
      <p className="text-sm">
        {query && activeFilters > 0
          ? `No results for \u201c${query}\u201d with the selected filters.`
          : query
            ? `No results for \u201c${query}\u201d.`
            : "Try adjusting your filters."}
      </p>
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
