"use client";

import { useState } from "react";
import type { EnrichedGame, GameListInfo } from "@/lib/types";
import { getRiskLevelColors } from "@/lib/preservation";
import { SaveButton } from "@/components/save-button";

interface GameTableProps {
  games: EnrichedGame[];
  lists: GameListInfo[];
}

export function GameTable({ games, lists }: GameTableProps) {
  const [selectedGame, setSelectedGame] = useState<EnrichedGame | null>(null);

  if (games.length === 0) {
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
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-lg font-medium">No games found</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="w-10 px-3 py-3">
                <span className="sr-only">Saved</span>
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Cover</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Risk</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 hidden lg:table-cell">
                Genre
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 hidden lg:table-cell">
                Developer
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 hidden lg:table-cell">
                Platforms
              </th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50"
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedGame(game);
                  }
                }}
              >
                <td className="px-3 py-3">
                  <SaveButton
                    gameId={game.id}
                    saved={game.saved}
                    listIds={game.listIds}
                    lists={lists}
                  />
                </td>
                <td className="px-4 py-3">
                  {game.cover_url ? (
                    <img
                      src={game.cover_url}
                      alt={`${game.name} cover`}
                      className="h-16 w-12 rounded object-cover ring-1 ring-zinc-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-16 w-12 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400 ring-1 ring-zinc-200">
                      N/A
                    </div>
                  )}
                </td>
                <td className="max-w-64 px-4 py-3">
                  <span className="font-medium text-zinc-900 truncate block">
                    {game.name}
                  </span>
                  {game.listIds.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {game.listIds.slice(0, 3).map((lid) => {
                        const list = lists.find((l) => l.id === lid);
                        if (!list) return null;
                        return (
                          <span
                            key={lid}
                            className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: `${list.color}18`,
                              color: list.color,
                              borderColor: `${list.color}40`,
                            }}
                            title={list.name}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: list.color }}
                            />
                            {list.name}
                          </span>
                        );
                      })}
                      {game.listIds.length > 3 && (
                        <span className="text-[10px] text-zinc-400">
                          +{game.listIds.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <RiskBadge
                    level={game.endangerment.level}
                    score={game.endangerment.score}
                    salvaged={game.endangerment.salvagedByModernVersion}
                    salvageReason={game.endangerment.salvageReason}
                  />
                </td>
                <td className="px-4 py-3 text-zinc-600 hidden lg:table-cell">
                  {game.genres.length > 0
                    ? game.genres.join(", ")
                    : "\u2014"}
                </td>
                <td className="px-4 py-3 text-zinc-600 hidden lg:table-cell">
                  {game.developers.length > 0
                    ? game.developers[0]
                    : "\u2014"}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <PlatformBadges platforms={game.platforms} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </>
  );
}

/**
 * Renders a coloured badge for the risk level and score.
 * When a game is salvaged by a modern version, adds a green indicator.
 */
function RiskBadge({
  level,
  score,
  salvaged,
  salvageReason,
}: {
  level: string;
  score: number;
  salvaged?: boolean;
  salvageReason?: string | null;
}) {
  const colors = getRiskLevelColors(level as Parameters<typeof getRiskLevelColors>[0]);

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colors.bg} ${colors.text} ${colors.ring}`}
        title={`Score: ${score} \u2014 ${level}`}
      >
        {level}
        <span className="opacity-60 tabular-nums">{score}</span>
      </span>
      {salvaged && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10"
          title={salvageReason ?? "Modern version available"}
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Salvaged
        </span>
      )}
    </span>
  );
}

/**
 * Display up to 2 platform badges with a "+N more" indicator for the rest.
 */
function PlatformBadges({ platforms }: { platforms: string[] }) {
  const maxVisible = 2;
  const visible = platforms.slice(0, maxVisible);
  const remaining = platforms.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((p) => (
        <span
          key={p}
          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
        >
          {p}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-zinc-400">+{remaining} more</span>
      )}
    </div>
  );
}

/**
 * Map IGDB category id to a human-readable label.
 */
function getCategoryLabel(category: number | null): string {
  if (category === null) return "Unknown";
  switch (category) {
    case 0: return "Base Game";
    case 1: return "DLC / Add-on";
    case 2: return "Expansion";
    case 3: return "Bundle";
    case 4: return "Standalone Expansion";
    default: return `Category ${category}`;
  }
}

/**
 * Convert a release_formats value to a human-readable label.
 */
function formatReleaseFormatLabel(format: string): string {
  switch (format) {
    case "physical_and_digital":
      return "Physical + Digital";
    case "digital_likely":
      return "Digital Only";
    default:
      return format;
  }
}

function GameDetailModal({
  game,
  onClose,
}: {
  game: EnrichedGame;
  onClose: () => void;
}) {
  const contentTypeLabel = getCategoryLabel(game.category);
  const { endangerment } = game;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${game.name}`}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {game.cover_url ? (
              <img
                src={game.cover_url}
                alt={`${game.name} cover`}
                className="h-24 w-18 flex-shrink-0 rounded-lg object-cover ring-1 ring-zinc-200"
              />
            ) : (
              <div className="flex h-24 w-18 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400 ring-1 ring-zinc-200">
                No Cover
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-zinc-900 break-words">
                {game.name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <PlatformBadges platforms={game.platforms} />
                {game.is_version && game.version_title && (
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                    {game.version_title}
                  </span>
                )}
                {game.release_formats && (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-600/10">
                    {formatReleaseFormatLabel(game.release_formats)}
                  </span>
                )}
                {game.category !== null && game.category !== 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-700/10">
                    {contentTypeLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* --- Preservation Risk Section --- */}
          <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Preservation Risk
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <RiskBadge
                level={endangerment.level}
                score={endangerment.score}
                salvaged={endangerment.salvagedByModernVersion}
                salvageReason={endangerment.salvageReason}
              />
              <span className="text-xs text-zinc-400">
                Score: <span className="font-semibold text-zinc-700">{endangerment.score}</span>
              </span>
            </div>

            {/* Salvage notice */}
            {endangerment.salvagedByModernVersion && (
              <div className="mt-3 rounded-md bg-green-50 p-3 ring-1 ring-inset ring-green-200">
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Salvaged by Modern Version
                    </p>
                    <p className="mt-0.5 text-xs text-green-700">
                      {endangerment.salvageReason}
                    </p>
                    <p className="mt-0.5 text-xs text-green-600">
                      This game can be excluded from at-risk reports.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reasons */}
            {endangerment.reasons.length > 0 && (
              <ul className="mt-3 space-y-1">
                {endangerment.reasons.map((reason, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-zinc-600"
                  >
                    <span className="mt-0.5 flex-shrink-0 text-zinc-400">&#x2022;</span>
                    {reason}
                  </li>
                ))}
              </ul>
            )}

            {/* Ecosystem Families */}
            {endangerment.ecosystemFamilies.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-zinc-500">Ecosystems:</span>
                {endangerment.ecosystemFamilies.map((family) => (
                  <span
                    key={family}
                    className="inline-flex rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700"
                  >
                    {family}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Modern Versions */}
          {game.modern_versions && game.modern_versions.length > 0 && (
            <section className="rounded-lg border border-green-200 bg-green-50/50 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-green-700">
                Modern Versions
              </h3>
              <div className="space-y-3">
                {game.modern_versions.map((mv) => (
                  <div
                    key={mv.id}
                    className="rounded-lg border border-green-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-zinc-900">
                          {mv.name}
                        </span>
                        <span className="ml-2 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {mv.relation}
                        </span>
                      </div>
                      {mv.salvages_original && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Salvages Original
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-zinc-500">Platforms:</span>
                      {mv.platforms.map((p) => (
                        <span
                          key={p}
                          className="inline-flex rounded-md bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-zinc-500">Risk:</span>
                      <RiskBadge level={mv.risk_level} score={0} />
                      {mv.ecosystem_families.length > 0 && (
                        <>
                          <span className="text-xs text-zinc-400">|</span>
                          <span className="text-xs text-zinc-500">Ecosystems:</span>
                          {mv.ecosystem_families.map((f) => (
                            <span
                              key={f}
                              className="inline-flex rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600"
                            >
                              {f}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Summary */}
          {game.summary && (
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Summary
              </h3>
              <p className="text-sm leading-relaxed text-zinc-700">
                {game.summary}
              </p>
            </section>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Rating */}
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Rating
              </h3>
              {game.rating !== null ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-zinc-900">
                    {game.rating.toFixed(0)}%
                  </span>
                  <span className="text-xs text-zinc-400">
                    ({game.rating_count} review{game.rating_count !== 1 ? "s" : ""})
                  </span>
                </div>
              ) : (
                <p className="text-sm text-zinc-400">Not rated</p>
              )}
            </section>

            {/* Release Date */}
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                First Release
              </h3>
              <p className="text-sm text-zinc-700">
                {game.first_release_date > 0
                  ? new Date(game.first_release_date * 1000).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )
                  : "Unknown"}
              </p>
            </section>

            {/* Content Type */}
            {game.category !== null && game.category !== 0 && (
              <section>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Content Type
                </h3>
                <p className="text-sm text-zinc-700">{contentTypeLabel}</p>
              </section>
            )}

            {/* Developer */}
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Developer{game.developers.length !== 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-zinc-700">
                {game.developers.length > 0
                  ? game.developers.join(", ")
                  : "\u2014"}
              </p>
            </section>

            {/* Publisher */}
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Publisher{game.publishers.length !== 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-zinc-700">
                {game.publishers.length > 0
                  ? game.publishers.join(", ")
                  : "\u2014"}
              </p>
            </section>
          </div>

          {/* Platforms */}
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Platform{game.platforms.length !== 1 ? "s" : ""}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {game.platforms.length > 0
                ? game.platforms.map((p) => (
                    <span
                      key={p}
                      className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                    >
                      {p}
                    </span>
                  ))
                : <span className="text-sm text-zinc-400">\u2014</span>}
            </div>
          </section>

          {/* Genres */}
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Genre{game.genres.length !== 1 ? "s" : ""}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {game.genres.length > 0
                ? game.genres.map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
                    >
                      {genre}
                    </span>
                  ))
                : <span className="text-sm text-zinc-400">\u2014</span>}
            </div>
          </section>

          {/* Themes */}
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Theme{game.themes.length !== 1 ? "s" : ""}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {game.themes.length > 0
                ? game.themes.map((theme) => (
                    <span
                      key={theme}
                      className="inline-flex rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10"
                    >
                      {theme}
                    </span>
                  ))
                : <span className="text-sm text-zinc-400">\u2014</span>}
            </div>
          </section>

          {/* Game Modes */}
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Game Mode{game.game_modes.length !== 1 ? "s" : ""}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {game.game_modes.length > 0
                ? game.game_modes.map((mode) => (
                    <span
                      key={mode}
                      className="inline-flex rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10"
                    >
                      {mode}
                    </span>
                  ))
                : <span className="text-sm text-zinc-400">\u2014</span>}
            </div>
          </section>

          {/* Releases */}
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Release{game.releases.length !== 1 ? "s" : ""}
            </h3>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">
                      Region
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {game.releases.map((release, i) => (
                    <tr
                      key={`${release.date}-${release.region}-${i}`}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-3 py-2 text-zinc-700">{release.date}</td>
                      <td className="px-3 py-2 text-zinc-500">{release.region}</td>
                      <td className="px-3 py-2 text-zinc-500 capitalize">{release.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* External link */}
          <section>
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
            >
              View on IGDB
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
