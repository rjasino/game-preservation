"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import type { RiskLevelCounts } from "@/lib/data";

interface FilterBarProps {
  genres: string[];
  developers: string[];
  publishers: string[];
  riskLevelCounts: RiskLevelCounts;
}

export function FilterBar({
  genres,
  developers,
  publishers,
  riskLevelCounts,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentGenre = searchParams.get("genre") ?? "";
  const currentDeveloper = searchParams.get("developer") ?? "";
  const currentPublisher = searchParams.get("publisher") ?? "";
  const currentRiskLevel = searchParams.get("riskLevel") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset page when filter changes
      params.delete("page");
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const totalGames =
    riskLevelCounts.Critical +
    riskLevelCounts.High +
    riskLevelCounts.Medium +
    riskLevelCounts.Low +
    riskLevelCounts.Minimal;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Risk Level filter */}
        <div>
          <label
            htmlFor="filter-risk-level"
            className="mb-1 block text-xs font-medium text-zinc-500"
          >
            Risk Level
          </label>
          <select
            id="filter-risk-level"
            value={currentRiskLevel}
            onChange={(e) => updateParam("riskLevel", e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">All ({totalGames})</option>
            <option value="Critical">
              Critical ({riskLevelCounts.Critical})
            </option>
            <option value="High">
              High ({riskLevelCounts.High})
            </option>
            <option value="Medium">
              Medium ({riskLevelCounts.Medium})
            </option>
            <option value="Low">
              Low ({riskLevelCounts.Low})
            </option>
            <option value="Minimal">
              Minimal ({riskLevelCounts.Minimal})
            </option>
          </select>
        </div>

        {/* Genre filter */}
        <div>
          <label
            htmlFor="filter-genre"
            className="mb-1 block text-xs font-medium text-zinc-500"
          >
            Genre
          </label>
          <select
            id="filter-genre"
            value={currentGenre}
            onChange={(e) => updateParam("genre", e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Developer filter */}
        <div>
          <label
            htmlFor="filter-developer"
            className="mb-1 block text-xs font-medium text-zinc-500"
          >
            Developer
          </label>
          <select
            id="filter-developer"
            value={currentDeveloper}
            onChange={(e) => updateParam("developer", e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">All Developers</option>
            {developers.map((dev) => (
              <option key={dev} value={dev}>
                {dev}
              </option>
            ))}
          </select>
        </div>

        {/* Publisher filter */}
        <div>
          <label
            htmlFor="filter-publisher"
            className="mb-1 block text-xs font-medium text-zinc-500"
          >
            Publisher
          </label>
          <select
            id="filter-publisher"
            value={currentPublisher}
            onChange={(e) => updateParam("publisher", e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">All Publishers</option>
            {publishers.map((pub) => (
              <option key={pub} value={pub}>
                {pub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isPending && (
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-500" />
          Updating results...
        </div>
      )}
    </div>
  );
}
