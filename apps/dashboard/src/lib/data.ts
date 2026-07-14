import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Game, GamesData } from "./types";

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
      // All current source data was queried with `version_parent=null`,
      // which means only base games (category 0). Default accordingly.
      game.category = 0;
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

export interface GameQuery {
  /** Title search (case-insensitive substring match). */
  search?: string;
  /** Single genre filter (exact match). */
  genre?: string;
  /** Single platform filter (exact match). */
  platform?: string;
  /** Content type: "base" (category 0) or "dlc" (categories 1-4). */
  contentType?: string;
  /** Developer search (case-insensitive substring match). */
  developer?: string;
  /** Publisher search (case-insensitive substring match). */
  publisher?: string;
  /** Sort field. */
  sort?: "title" | "release_date";
  /** Sort order. */
  order?: "asc" | "desc";
}

export interface GameQueryResult {
  games: Game[];
  total: number;
}

/**
 * Query games with optional filtering and sorting.
 * All filters are applied as AND conditions.
 */
export async function queryGames(query: GameQuery): Promise<GameQueryResult> {
  const data = await loadGames();
  let games = data.games;

  // Apply title search
  if (query.search) {
    const q = query.search.toLowerCase();
    games = games.filter((g) => g.name.toLowerCase().includes(q));
  }

  // Apply genre filter (exact match within the game's genre array)
  if (query.genre) {
    games = games.filter((g) => g.genres.includes(query.genre!));
  }

  // Apply platform filter (exact match within the game's platforms array)
  if (query.platform) {
    games = games.filter((g) => g.platforms.includes(query.platform!));
  }

  // Apply content type filter
  if (query.contentType === "base") {
    // IGDB category 0 = main_game
    games = games.filter((g) => g.category === 0);
  } else if (query.contentType === "dlc") {
    // IGDB categories 1 (dlc_addon), 2 (expansion), 3 (bundle), 4 (standalone_expansion)
    games = games.filter((g) => g.category !== null && g.category >= 1 && g.category <= 4);
  }

  // Apply developer filter (exact match within the game's developers array)
  if (query.developer) {
    games = games.filter((g) => g.developers.includes(query.developer!));
  }

  // Apply publisher filter (exact match within the game's publishers array)
  if (query.publisher) {
    games = games.filter((g) => g.publishers.includes(query.publisher!));
  }

  // Apply sorting
  if (query.sort) {
    const order = query.order === "asc" ? 1 : -1;

    games = [...games].sort((a, b) => {
      if (query.sort === "title") {
        return order * a.name.localeCompare(b.name);
      }
      // release_date sort: treat 0 (unknown) as the distant past
      if (query.sort === "release_date") {
        const dateA = a.first_release_date || 0;
        const dateB = b.first_release_date || 0;
        return order * (dateA - dateB);
      }
      return 0;
    });
  }

  return { games, total: games.length };
}
