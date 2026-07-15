import Database from "better-sqlite3";
import path from "node:path";
import { mkdirSync, existsSync } from "node:fs";

/**
 * Path to the SQLite database file.
 */
const DB_PATH = path.join(process.cwd(), "data", "saved_games.db");

let db: Database.Database | null = null;
let _migrated = false;

/**
 * Returns a singleton instance of the SQLite database, creating it and
 * running any pending migrations on first access.
 */
export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  const dir = path.dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create current schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_lists (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      color      TEXT NOT NULL DEFAULT '#f59e0b',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_list_items (
      list_id  INTEGER NOT NULL,
      game_id  INTEGER NOT NULL,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (list_id, game_id),
      FOREIGN KEY (list_id) REFERENCES game_lists(id) ON DELETE CASCADE
    );
  `);

  // Run migration if needed
  if (!_migrated) {
    _runMigrations();
    _migrated = true;
  }

  return db;
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

function _runMigrations(): void {
  const d = db!;

  // Check if legacy saved_games table exists
  const legacyExists = d
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='saved_games'"
    )
    .get();

  if (legacyExists) {
    // Check if it has rows
    const count = (
      d.prepare("SELECT COUNT(*) as c FROM saved_games").get() as { c: number }
    ).c;

    if (count > 0) {
      // Create a default "Watchlist" list if it doesn't exist
      const existing = d
        .prepare("SELECT id FROM game_lists WHERE name = 'Watchlist'")
        .get() as { id: number } | undefined;

      let watchlistId: number;
      if (existing) {
        watchlistId = existing.id;
      } else {
        const result = d
          .prepare(
            "INSERT INTO game_lists (name, color) VALUES (?, ?)"
          )
          .run("Watchlist", "#f59e0b");
        watchlistId = Number(result.lastInsertRowid);
      }

      // Migrate saved game IDs into the watchlist
      const rows = d.prepare("SELECT game_id FROM saved_games").all() as {
        game_id: number;
      }[];
      const insert = d.prepare(
        "INSERT OR IGNORE INTO game_list_items (list_id, game_id) VALUES (?, ?)"
      );
      for (const row of rows) {
        insert.run(watchlistId, row.game_id);
      }
    }

    // Drop the legacy table
    d.exec("DROP TABLE IF EXISTS saved_games");
  }
}

// ---------------------------------------------------------------------------
// List CRUD
// ---------------------------------------------------------------------------

export interface GameListRow {
  id: number;
  name: string;
  color: string;
  created_at: string;
  game_count: number;
}

/**
 * Return every list with the count of games in each.
 */
export function getAllLists(): GameListRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT l.id, l.name, l.color, l.created_at,
              COUNT(li.game_id) AS game_count
       FROM game_lists l
       LEFT JOIN game_list_items li ON li.list_id = l.id
       GROUP BY l.id
       ORDER BY l.name`
    )
    .all() as GameListRow[];
}

/**
 * Create a new list and return it.
 */
export function createList(
  name: string,
  color: string = "#f59e0b"
): GameListRow {
  const db = getDb();
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("List name cannot be empty");
  }

  const result = db
    .prepare("INSERT INTO game_lists (name, color) VALUES (?, ?)")
    .run(cleanName, color);

  return {
    id: Number(result.lastInsertRowid),
    name: cleanName,
    color,
    created_at: new Date().toISOString(),
    game_count: 0,
  };
}

/**
 * Delete a list and all its game associations (CASCADE).
 */
export function deleteList(listId: number): void {
  const db = getDb();
  db.prepare("DELETE FROM game_lists WHERE id = ?").run(listId);
}

/**
 * Rename an existing list.
 */
export function renameList(listId: number, name: string): void {
  const db = getDb();
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("List name cannot be empty");
  }
  db.prepare("UPDATE game_lists SET name = ? WHERE id = ?").run(
    cleanName,
    listId
  );
}

/**
 * Toggle a game's membership in a specific list.
 * @returns true if the game was added, false if removed.
 */
export function toggleGameInList(listId: number, gameId: number): boolean {
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT 1 FROM game_list_items WHERE list_id = ? AND game_id = ?"
    )
    .get(listId, gameId);

  if (existing) {
    db.prepare("DELETE FROM game_list_items WHERE list_id = ? AND game_id = ?").run(
      listId,
      gameId
    );
    return false;
  }

  db.prepare(
    "INSERT INTO game_list_items (list_id, game_id) VALUES (?, ?)"
  ).run(listId, gameId);
  return true;
}

/**
 * Check if a game is in a specific list.
 */
export function isGameInList(listId: number, gameId: number): boolean {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT 1 FROM game_list_items WHERE list_id = ? AND game_id = ?"
    )
    .get(listId, gameId);
  return row !== undefined;
}

// ---------------------------------------------------------------------------
// Game-centric queries
// ---------------------------------------------------------------------------

/**
 * Return IDs of all lists a game belongs to.
 */
export function getGameListIds(gameId: number): number[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT list_id FROM game_list_items WHERE game_id = ?")
    .all(gameId) as { list_id: number }[];
  return rows.map((r) => r.list_id);
}

/**
 * Return full list objects for every list a game belongs to.
 */
export function getGameLists(gameId: number): GameListRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT l.id, l.name, l.color, l.created_at,
              (SELECT COUNT(*) FROM game_list_items WHERE list_id = l.id) AS game_count
       FROM game_lists l
       INNER JOIN game_list_items li ON li.list_id = l.id
       WHERE li.game_id = ?
       ORDER BY l.name`
    )
    .all(gameId) as GameListRow[];
}

// ---------------------------------------------------------------------------
// Bulk queries (for enriching game lists in the data layer)
// ---------------------------------------------------------------------------

/**
 * Return a Map from game_id → Set of list IDs that game belongs to.
 * Used to efficiently enrich all games with their list memberships.
 */
export function getAllGameListMappings(): Map<number, Set<number>> {
  const db = getDb();
  const rows = db
    .prepare("SELECT game_id, list_id FROM game_list_items")
    .all() as { game_id: number; list_id: number }[];

  const map = new Map<number, Set<number>>();
  for (const row of rows) {
    if (!map.has(row.game_id)) {
      map.set(row.game_id, new Set());
    }
    map.get(row.game_id)!.add(row.list_id);
  }
  return map;
}

/**
 * Return all game IDs that belong to a specific list.
 */
export function getGameIdsInList(listId: number): Set<number> {
  const db = getDb();
  const rows = db
    .prepare("SELECT game_id FROM game_list_items WHERE list_id = ?")
    .all(listId) as { game_id: number }[];
  return new Set(rows.map((r) => r.game_id));
}

// ---------------------------------------------------------------------------
// Legacy compatibility (keeps existing code working)
// ---------------------------------------------------------------------------

const DEFAULT_LIST_NAME = "Watchlist";

function _getOrCreateDefaultListId(): number {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM game_lists WHERE name = ?")
    .get(DEFAULT_LIST_NAME) as { id: number } | undefined;

  if (existing) {
    return existing.id;
  }

  const result = db
    .prepare("INSERT INTO game_lists (name, color) VALUES (?, ?)")
    .run(DEFAULT_LIST_NAME, "#f59e0b");
  return Number(result.lastInsertRowid);
}

export function getSavedGameIds(): Set<number> {
  const listId = _getOrCreateDefaultListId();
  return getGameIdsInList(listId);
}

export function isGameSaved(gameId: number): boolean {
  const listId = _getOrCreateDefaultListId();
  return isGameInList(listId, gameId);
}

export function toggleSavedGame(gameId: number): boolean {
  const listId = _getOrCreateDefaultListId();
  return toggleGameInList(listId, gameId);
}

export function getSavedCount(): number {
  const listId = _getOrCreateDefaultListId();
  return getGameIdsInList(listId).size;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _setDb(override: Database.Database): void {
  db = override;
  _migrated = true; // Skip migration in tests
}

export function _closeDb(): void {
  if (db) {
    db.close();
    db = null;
    _migrated = false;
  }
}
