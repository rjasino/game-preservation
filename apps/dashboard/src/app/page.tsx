import { Suspense } from "react";
import {
  queryGames,
  getUniqueGenres,
  getUniqueDevelopers,
  getUniquePublishers,
  getRiskLevelCounts,
} from "@/lib/data";
import type { EndangermentLevel } from "@/lib/types";
import { getRiskLevelColors, RISK_LEVEL_ORDER } from "@/lib/preservation";
import { GameTable } from "@/components/game-table";
import { SearchInput } from "@/components/search-input";
import { FilterBar } from "@/components/filter-bar";
import { SortSelect } from "@/components/sort-select";
import { PaginationControls } from "@/components/pagination-controls";

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseSize(raw: string | undefined): number {
  const n = Number(raw);
  return [10, 20, 50, 100].includes(n) ? n : 10;
}

interface PageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    developer?: string;
    publisher?: string;
    riskLevel?: string;
    sort?: string;
    order?: string;
    page?: string;
    size?: string;
    salvaged?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const {
    q = "",
    genre = "",
    developer = "",
    publisher = "",
    riskLevel = "",
    sort = "",
    order = "",
    page: pageRaw,
    size: sizeRaw,
    salvaged = "",
  } = params;

  const page = parsePage(pageRaw);
  const pageSize = parseSize(sizeRaw);
  const salvagedMode: "all" | "exclude" | "only" =
    salvaged === "exclude" ? "exclude" : salvaged === "only" ? "only" : "all";


  // Load filter options and risk counts
  const genres = await getUniqueGenres();
  const developers = await getUniqueDevelopers();
  const publishers = await getUniquePublishers();
  const riskCounts = await getRiskLevelCounts();

  const totalGames =
    riskCounts.Critical +
    riskCounts.High +
    riskCounts.Medium +
    riskCounts.Low +
    riskCounts.Minimal;

  // Count active filters
  const activeFilters = [
    genre,
    developer,
    publisher,
    riskLevel,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          PS Vita Game Preservation
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Browse and explore{" "}
          <span className="font-semibold text-zinc-700">
            {totalGames.toLocaleString()}
          </span>{" "}
          games available on PlayStation Vita.
        </p>
      </header>

      {/* Risk Level Summary Bar */}
      <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Preservation Risk Overview
          </h2>
          {/* Three-way salvaged filter toggle */}
          <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-xs">
            <a
              href={`?${buildParamString(params, "salvaged", "")}`}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                salvagedMode === "all"
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              All
            </a>
            <a
              href={`?${buildParamString(params, "salvaged", "exclude")}`}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                salvagedMode === "exclude"
                  ? "bg-orange-100 text-orange-700 shadow-sm ring-1 ring-orange-200"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
              title="Hide games that have widely-available modern versions"
            >
              At-Risk Only
            </a>
            <a
              href={`?${buildParamString(params, "salvaged", "only")}`}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                salvagedMode === "only"
                  ? "bg-green-100 text-green-700 shadow-sm ring-1 ring-green-200"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
              title="Show only games salvaged by modern ports/remasters/remakes"
            >
              Salvaged Only
            </a>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {RISK_LEVEL_ORDER.map((level) => {
            const count = riskCounts[level];
            const colors = getRiskLevelColors(level);
            const isActive = riskLevel === level;

            return (
              <a
                key={level}
                href={
                  isActive
                    ? `?${buildParamString(params, "riskLevel", "")}`
                    : `?${buildParamString(params, "riskLevel", level)}`
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                  colors.bg
                } ${colors.text} ${colors.ring} ${
                  isActive
                    ? "ring-2 ring-offset-1"
                    : "hover:ring-2"
                }`}
              >
                {level}
                <span className="tabular-nums opacity-75">{count}</span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Search + Filter Bar */}
      <div className="mb-6 space-y-4">
        <SearchInput defaultValue={q} />
        <FilterBar
          genres={genres}
          developers={developers}
          publishers={publishers}
          riskLevelCounts={riskCounts}
        />
      </div>

      {/* Results */}
      <Suspense fallback={<TableSkeleton />}>
        <GamesList
          search={q}
          genre={genre}
          developer={developer}
          publisher={publisher}
          riskLevel={riskLevel}
          sort={sort}
          order={order}
          page={page}
          pageSize={pageSize}
          salvagedMode={salvagedMode}
          activeFilters={activeFilters}
          totalGames={totalGames}
        />
      </Suspense>
    </div>
  );
}

/** Build a query string by setting or removing a single param on top of existing params. */
function buildParamString(
  current: Record<string, string>,
  key: string,
  value: string
): string {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v && k !== key) {
      next.set(k, v);
    }
  }
  if (value) {
    next.set(key, value);
  }
  return next.toString();
}

// ---------------------------------------------------------------------------
// Games List (server component inside Suspense)
// ---------------------------------------------------------------------------

async function GamesList({
  search,
  genre,
  developer,
  publisher,
  riskLevel,
  sort,
  order,
  page,
  pageSize,
  salvagedMode,
  activeFilters,
  totalGames,
}: {
  search: string;
  genre: string;
  developer: string;
  publisher: string;
  riskLevel: string;
  sort: string;
  order: string;
  page: number;
  pageSize: number;
  salvagedMode: "all" | "exclude" | "only";
  activeFilters: number;
  totalGames: number;
}) {
  let result;
  let errorMessage: string | null = null;

  try {
    result = await queryGames({
      search,
      genre: genre || undefined,
      developer: developer || undefined,
      publisher: publisher || undefined,
      riskLevel: (riskLevel as EndangermentLevel) || undefined,
      sort: (sort as "title" | "release_date" | "risk_score") || undefined,
      order: (order as "asc" | "desc") || undefined,
      page,
      pageSize,
      salvaged: salvagedMode,
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
          {result.total} game{result.total !== 1 ? "s" : ""}
          {activeFilters > 0 && (
            <span className="ml-1">
              (filtered from {totalGames.toLocaleString()})
            </span>
          )}
        </p>
        <SortSelect />
      </div>

      <GameTable games={result.games} />

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="mt-6">
          <PaginationControls
            currentPage={result.page}
            totalPages={result.totalPages}
            pageSize={result.pageSize}
            total={result.total}
          />
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Empty / Error / Skeleton States
// ---------------------------------------------------------------------------

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
