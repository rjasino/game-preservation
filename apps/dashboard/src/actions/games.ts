"use server";

import { revalidatePath } from "next/cache";
import { toggleSavedGame, isGameSaved } from "@/lib/db";

export interface ToggleSaveResult {
  success: boolean;
  saved: boolean;
}

/**
 * Toggle a game's presence on the user's preservation watchlist.
 *
 * - If the game is not saved, it is added.
 * - If the game is already saved, it is removed.
 *
 * After the mutation, the root path is revalidated so server components
 * reflect the updated watchlist state.
 */
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
