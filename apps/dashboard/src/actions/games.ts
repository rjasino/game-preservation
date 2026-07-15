"use server";

import { revalidatePath } from "next/cache";
import {
  toggleSavedGame,
  isGameSaved,
  createList,
  deleteList,
  renameList,
  toggleGameInList,
  isGameInList,
  getAllLists,
} from "@/lib/db";
import type { GameListRow } from "@/lib/db";

// ---------------------------------------------------------------------------
// Legacy save toggle (still works with the default Watchlist)
// ---------------------------------------------------------------------------

export interface ToggleSaveResult {
  success: boolean;
  saved: boolean;
}

export async function toggleSaveGame(
  gameId: number
): Promise<ToggleSaveResult> {
  try {
    const saved = toggleSavedGame(gameId);
    revalidatePath("/");
    return { success: true, saved };
  } catch {
    return { success: false, saved: isGameSaved(gameId) };
  }
}

// ---------------------------------------------------------------------------
// List CRUD
// ---------------------------------------------------------------------------

export interface CreateListResult {
  success: boolean;
  list?: GameListRow;
  error?: string;
}

export async function createGameList(
  name: string,
  color?: string
): Promise<CreateListResult> {
  try {
    const list = createList(name, color);
    revalidatePath("/");
    return { success: true, list };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create list",
    };
  }
}

export interface DeleteListResult {
  success: boolean;
  error?: string;
}

export async function deleteGameList(listId: number): Promise<DeleteListResult> {
  try {
    deleteList(listId);
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete list",
    };
  }
}

export interface RenameListResult {
  success: boolean;
  error?: string;
}

export async function renameGameList(
  listId: number,
  name: string
): Promise<RenameListResult> {
  try {
    renameList(listId, name);
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to rename list",
    };
  }
}

// ---------------------------------------------------------------------------
// Game ↔ List toggling
// ---------------------------------------------------------------------------

export interface ToggleListResult {
  success: boolean;
  inList: boolean;
}

/**
 * Toggle a game's membership in a specific list.
 * Returns the new state (true = now in list).
 */
export async function toggleGameInListAction(
  listId: number,
  gameId: number
): Promise<ToggleListResult> {
  try {
    const inList = toggleGameInList(listId, gameId);
    revalidatePath("/");
    return { success: true, inList };
  } catch {
    return { success: false, inList: isGameInList(listId, gameId) };
  }
}

// ---------------------------------------------------------------------------
// Read (no revalidation needed)
// ---------------------------------------------------------------------------

export async function fetchAllLists(): Promise<GameListRow[]> {
  return getAllLists();
}
