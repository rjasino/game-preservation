import Database from "better-sqlite3";
import path from "node:path";
import { mkdirSync, existsSync } from "node:fs";

/**
 * Path to the SQLite database file that stores which games the user has
 * marked for their preservation watchlist.
 */
const DB_PATH = path.join(process.cwd(), "data", "saved_games.db");

let db: Database.Database | null = null;

/**
 * Returns a singleton instance of the SQLite database, creating it and the
 * `saved_games` table if they do not yet exist.
 */
export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure the data directory exists
  const dir = path.dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_games (
      game_id   INTEGER PRIMARY KEY,
      saved_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return db;
}

/**
 * Returns the set of all game IDs currently in the user's preservation
 * watchlist.
 */
export function getSavedGameIds(): Set<number> {
  const db = getDb();
  const rows = db.prepare("SELECT game_id FROM saved_games").all() as {
    game_id: number;
  }[];
  return new Set(rows.map((r) => r.game_id));
}

/**
 * Check whether a specific game is currently saved.
 */
export function isGameSaved(gameId: number): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT 1 FROM saved_games WHERE game_id = ?")
    .get(gameId);
  return row !== undefined;
}

/**
 * Toggle a game's saved state.
 *
 * - If the game is not saved, it is added to the watchlist.
 * - If the game is already saved, it is removed.
 *
 * @returns The new saved state (true = now saved, false = now unsaved).
 */
export function toggleSavedGame(gameId: number): boolean {
  const db = getDb();
  const existing = db
    .prepare("SELECT game_id FROM saved_games WHERE game_id = ?")
    .get(gameId);

  if (existing) {
    db.prepare("DELETE FROM saved_games WHERE game_id = ?").run(gameId);
    return false;
  }

  db.prepare("INSERT INTO saved_games (game_id) VALUES (?)").run(gameId);
  return true;
}

/**
 * Returns the total number of saved games.
 */
export function getSavedCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM saved_games").get() as {
    count: number;
  };
  return row.count;
}

// ---------------------------------------------------------------------------
// Test helpers — exposed so tests can reset state without affecting the
// production database file.
// ---------------------------------------------------------------------------

/**
 * Replace the singleton database instance (for testing with an in-memory DB).
 */
export function _setDb(override: Database.Database): void {
  db = override;
}

/**
 * Close the database connection and reset the singleton (for cleanup in tests).
 */
export function _closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
