"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface FilterBarProps {
  genres: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
  categoryCounts: { base: number; dlc: number };
  hasDlc: boolean;
}

export function FilterBar({
  genres,
  platforms,
  developers,
  publishers,
  categoryCounts,
  hasDlc,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentGenre = searchParams.get("genre") ?? "";
  const currentPlatform = searchParams.get("platform") ?? "";
  const currentContentType = searchParams.get("contentType") ?? "";
  const currentDeveloper = searchParams.get("developer") ?? "";
  const currentPublisher = searchParams.get("publisher") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Content Type filter */}
        <div>
          <label
            htmlFor="filter-content-type"
            className="mb-1 block text-xs font-medium text-zinc-500"
          >
            Content Type
          </label>
          <select
            id="filter-content-type"
            value={currentContentType}
            onChange={(e) => updateParam("contentType", e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">
              All ({categoryCounts.base + categoryCounts.dlc})
            </option>
            <option value="base">
              Base Game ({categoryCounts.base})
            </option>
            <option
              value="dlc"
              disabled={!hasDlc}
            >
              DLC / Expansion ({categoryCounts.dlc})
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

        {/* Platform filter */}
        <div>
          <label
            htmlFor="filter-platform"
            className="mb-1 block text-xs font-medium text-zinc-500"
          >
            Platform
          </label>
          <select
            id="filter-platform"
            value={currentPlatform}
            onChange={(e) => updateParam("platform", e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">All Platforms</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
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
