import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Game, GamesData, EndangermentLevel, EnrichedGame } from "./types";
import { assessEndangerment, RISK_LEVEL_ORDER } from "./preservation";

let cachedData: GamesData | null = null;

/**
 * Load the games data from the bundled JSON file.
 * Results are cached in memory for the lifetime of the server process.
 */
export async function loadGames(): Promise<GamesData> {
  if (cachedData) {
    return cachedData;
  }

  const filePath = path.join(process.cwd(), "src", "data", "games.json");
  const raw = await readFile(filePath, "utf-8");
  cachedData = JSON.parse(raw) as GamesData;

  // Ensure backward compatibility: add missing fields to legacy data
  for (const game of cachedData.games) {
    if (!game.platforms) {
      game.platforms = ["PlayStation Vita"];
    }
    if (!game.developers) {
      game.developers = [];
    }
    if (!game.publishers) {
      game.publishers = [];
    }
    if (game.category === undefined || game.category === null) {
      game.category = 0;
    }
    if (game.is_version === undefined || game.is_version === null) {
      game.is_version = false;
    }
    if (!game.version_title) {
      game.version_title = "";
    }
    if (!game.release_formats) {
      game.release_formats = "physical_and_digital";
    }
  }

  return cachedData;
}

/**
 * Get a single game by its IGDB id.
 */
export async function getGameById(id: number): Promise<Game | null> {
  const data = await loadGames();
  return data.games.find((g) => g.id === id) ?? null;
}

/**
 * Extract all unique genres from the games collection, sorted alphabetically.
 */
export async function getUniqueGenres(): Promise<string[]> {
  const data = await loadGames();
  const genres = new Set<string>();
  for (const game of data.games) {
    for (const genre of game.genres) {
      genres.add(genre);
    }
  }
  return Array.from(genres).sort();
}

/**
 * Extract all unique platforms from the games collection, sorted alphabetically.
 */
export async function getUniquePlatforms(): Promise<string[]> {
  const data = await loadGames();
  const platforms = new Set<string>();
  for (const game of data.games) {
    for (const platform of game.platforms) {
      platforms.add(platform);
    }
  }
  return Array.from(platforms).sort();
}

/**
 * Extract all unique developers from the games collection, sorted alphabetically.
 * Returns empty array when developer data is not populated.
 */
export async function getUniqueDevelopers(): Promise<string[]> {
  const data = await loadGames();
  const devs = new Set<string>();
  for (const game of data.games) {
    for (const dev of game.developers) {
      devs.add(dev);
    }
  }
  return Array.from(devs).sort();
}

/**
 * Extract all unique publishers from the games collection, sorted alphabetically.
 * Returns empty array when publisher data is not populated.
 */
export async function getUniquePublishers(): Promise<string[]> {
  const data = await loadGames();
  const pubs = new Set<string>();
  for (const game of data.games) {
    for (const pub of game.publishers) {
      pubs.add(pub);
    }
  }
  return Array.from(pubs).sort();
}

export interface CategoryCounts {
  base: number;
  dlc: number;
}

/**
 * Count how many games are base games vs DLC/expansions.
 */
export async function getCategoryCounts(): Promise<CategoryCounts> {
  const data = await loadGames();
  let base = 0;
  let dlc = 0;
  for (const game of data.games) {
    if (game.category === 0) {
      base++;
    } else if (game.category !== null && game.category >= 1 && game.category <= 4) {
      dlc++;
    }
  }
  return { base, dlc };
}

// ---------------------------------------------------------------------------
// Risk Level Counts
// ---------------------------------------------------------------------------

export interface RiskLevelCounts {
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
  Minimal: number;
}

/**
 * Count how many games fall into each endangerment level.
 */
export async function getRiskLevelCounts(): Promise<RiskLevelCounts> {
  const data = await loadGames();
  const counts: RiskLevelCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Minimal: 0,
  };

  for (const game of data.games) {
    const assessment = assessEndangerment(game);
    counts[assessment.level]++;
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Game Enrichment
// ---------------------------------------------------------------------------

/**
 * Attach preservation endangerment assessment to every game in the list.
 */
export function enrichGames(games: Game[]): EnrichedGame[] {
  return games.map((game) => ({
    ...game,
    endangerment: assessEndangerment(game),
  }));
}

// ---------------------------------------------------------------------------
// Query Interface & Implementation
// ---------------------------------------------------------------------------

export interface GameQuery {
  /** Title search (case-insensitive substring match). */
  search?: string;
  /** Single genre filter (exact match). */
  genre?: string;
  /** Developer filter (exact match within the game's developers array). */
  developer?: string;
  /** Publisher filter (exact match within the game's publishers array). */
  publisher?: string;
  /** Risk level filter (exact match on endangerment level). */
  riskLevel?: EndangermentLevel;
  /** Sort field. */
  sort?: "title" | "release_date" | "risk_score";
  /** Sort order. */
  order?: "asc" | "desc";
  /** Page number (1-indexed). Defaults to 1. */
  page?: number;
  /** Number of games per page. Defaults to 10. */
  pageSize?: number;
}

export interface GameQueryResult {
  games: EnrichedGame[];
  /** Total matching games (before pagination). */
  total: number;
  /** Current page number (1-indexed). */
  page: number;
  /** Number of games per page. */
  pageSize: number;
  /** Total number of pages. */
  totalPages: number;
}

/**
 * Query games with optional filtering and sorting.
 * All filters are applied as AND conditions.
 * Games are always enriched with preservation risk data.
 */
export async function queryGames(query: GameQuery): Promise<GameQueryResult> {
  const data = await loadGames();
  let games = enrichGames(data.games);

  // Apply title search
  if (query.search) {
    const q = query.search.toLowerCase();
    games = games.filter((g) => g.name.toLowerCase().includes(q));
  }

  // Apply genre filter (exact match within the game's genre array)
  if (query.genre) {
    games = games.filter((g) => g.genres.includes(query.genre!));
  }

  // Apply developer filter (exact match within the game's developers array)
  if (query.developer) {
    games = games.filter((g) => g.developers.includes(query.developer!));
  }

  // Apply publisher filter (exact match within the game's publishers array)
  if (query.publisher) {
    games = games.filter((g) => g.publishers.includes(query.publisher!));
  }

  // Apply risk level filter
  if (query.riskLevel) {
    games = games.filter((g) => g.endangerment.level === query.riskLevel);
  }

  // Apply sorting — name is always a secondary tiebreaker.
  if (query.sort) {
    const order = query.order === "asc" ? 1 : -1;

    games = [...games].sort((a, b) => {
      let cmp = 0;

      switch (query.sort) {
        case "title":
          cmp = a.name.localeCompare(b.name);
          return order * (cmp !== 0 ? cmp : a.name.localeCompare(b.name));

        case "release_date": {
          const dateA = a.first_release_date || 0;
          const dateB = b.first_release_date || 0;
          cmp = dateA - dateB;
          break;
        }

        case "risk_score": {
          // "asc" = least endangered first, "desc" = most endangered first.
          cmp = a.endangerment.score - b.endangerment.score;
          break;
        }

        default:
          return 0;
      }

      // Sort by primary field; break ties with name (ascending)
      const primary = order * cmp;
      if (primary !== 0) return primary;
      return a.name.localeCompare(b.name);
    });
  } else {
    // Default sort: highest risk first, then name ascending
    games = [...games].sort((a, b) => {
      const scoreCmp = b.endangerment.score - a.endangerment.score;
      if (scoreCmp !== 0) return scoreCmp;
      return a.name.localeCompare(b.name);
    });
  }

  // Pagination — slice after filtering + sorting
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;
  const total = games.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(query.page ?? 1, totalPages));
  const start = (page - 1) * pageSize;
  const paged = games.slice(start, start + pageSize);

  return { games: paged, total, page, pageSize, totalPages };
}
