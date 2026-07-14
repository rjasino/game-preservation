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
 * Search games by name (case-insensitive substring match).
 */
export async function searchGames(query: string): Promise<Game[]> {
  const data = await loadGames();
  const q = query.toLowerCase();
  return data.games.filter((g) => g.name.toLowerCase().includes(q));
}
