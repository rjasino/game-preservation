import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import {
  getDb,
  getSavedGameIds,
  isGameSaved,
  toggleSavedGame,
  getSavedCount,
  _setDb,
  _closeDb,
} from "@/lib/db";

/**
 * Create a fresh in-memory database with the saved_games table
 * so tests never touch the production database file.
 */
function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_games (
      game_id   INTEGER PRIMARY KEY,
      saved_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  return db;
}

describe("db (SQLite saved games)", () => {
  let testDb: Database.Database;

  beforeEach(() => {
    testDb = createTestDb();
    _setDb(testDb);
  });

  afterEach(() => {
    _closeDb();
  });

  describe("getDb", () => {
    it("returns the database singleton", () => {
      const db = getDb();
      expect(db).toBeDefined();
      expect(db.open).toBe(true);
    });

    it("returns the same instance on subsequent calls", () => {
      const db1 = getDb();
      const db2 = getDb();
      expect(db1).toBe(db2);
    });
  });

  describe("getSavedGameIds", () => {
    it("returns an empty set when no games are saved", () => {
      const ids = getSavedGameIds();
      expect(ids.size).toBe(0);
    });

    it("returns saved game IDs", () => {
      toggleSavedGame(100);
      toggleSavedGame(200);
      toggleSavedGame(300);

      const ids = getSavedGameIds();
      expect(ids.size).toBe(3);
      expect(ids.has(100)).toBe(true);
      expect(ids.has(200)).toBe(true);
      expect(ids.has(300)).toBe(true);
    });
  });

  describe("isGameSaved", () => {
    it("returns false for an unsaved game", () => {
      expect(isGameSaved(42)).toBe(false);
    });

    it("returns true for a saved game", () => {
      toggleSavedGame(42);
      expect(isGameSaved(42)).toBe(true);
    });

    it("returns false after a game is unsaved", () => {
      toggleSavedGame(42);
      toggleSavedGame(42); // toggle off
      expect(isGameSaved(42)).toBe(false);
    });
  });

  describe("toggleSavedGame", () => {
    it("returns true when adding a game for the first time", () => {
      const result = toggleSavedGame(1);
      expect(result).toBe(true);
    });

    it("returns false when removing a previously saved game", () => {
      toggleSavedGame(1);
      const result = toggleSavedGame(1);
      expect(result).toBe(false);
    });

    it("toggles correctly across multiple invocations", () => {
      expect(toggleSavedGame(5)).toBe(true);
      expect(toggleSavedGame(5)).toBe(false);
      expect(toggleSavedGame(5)).toBe(true);
      expect(toggleSavedGame(5)).toBe(false);
    });

    it("handles different game IDs independently", () => {
      toggleSavedGame(10);
      toggleSavedGame(20);

      expect(isGameSaved(10)).toBe(true);
      expect(isGameSaved(20)).toBe(true);

      toggleSavedGame(10); // unsave 10

      expect(isGameSaved(10)).toBe(false);
      expect(isGameSaved(20)).toBe(true);
    });

    it("idempotently re-adds a previously removed game", () => {
      toggleSavedGame(99);
      toggleSavedGame(99); // remove
      toggleSavedGame(99); // re-add

      expect(isGameSaved(99)).toBe(true);
    });
  });

  describe("getSavedCount", () => {
    it("returns 0 when no games are saved", () => {
      expect(getSavedCount()).toBe(0);
    });

    it("returns the correct count after adding games", () => {
      toggleSavedGame(1);
      expect(getSavedCount()).toBe(1);

      toggleSavedGame(2);
      toggleSavedGame(3);
      expect(getSavedCount()).toBe(3);
    });

    it("returns the correct count after removing games", () => {
      toggleSavedGame(1);
      toggleSavedGame(2);
      toggleSavedGame(3);
      toggleSavedGame(2); // remove

      expect(getSavedCount()).toBe(2);
    });

    it("returns 0 after all games are removed", () => {
      toggleSavedGame(1);
      toggleSavedGame(2);
      toggleSavedGame(1);
      toggleSavedGame(2);

      expect(getSavedCount()).toBe(0);
    });
  });
});
