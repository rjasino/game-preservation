"use client";

import { useState, useTransition } from "react";
import { toggleSaveGame } from "@/actions/games";

interface SaveButtonProps {
  gameId: number;
  /** Whether the game is currently on the user's preservation watchlist. */
  saved: boolean;
}

/**
 * A star/bookmark button that toggles whether a game is on the user's
 * preservation watchlist.
 *
 * Uses optimistic state for instant feedback, then fires a server action
 * to persist the change in SQLite.
 */
export function SaveButton({ gameId, saved: initialSaved }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  // Sync external prop changes (e.g. after revalidation refreshes the page)
  const [prevInitialSaved, setPrevInitialSaved] = useState(initialSaved);
  if (initialSaved !== prevInitialSaved) {
    setPrevInitialSaved(initialSaved);
    setSaved(initialSaved);
  }

  const handleToggle = () => {
    // Optimistic toggle
    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      const result = await toggleSaveGame(gameId);
      // Revert on failure
      if (!result.success) {
        setSaved(!next);
      }
      // On success, Next.js revalidation will sync via the initialSaved prop
    });
  };

  const label = saved ? "Remove from preservation watchlist" : "Add to preservation watchlist";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent row click from opening the detail modal
        handleToggle();
      }}
      disabled={isPending}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-md p-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 ${
        saved
          ? "text-amber-500 hover:text-amber-600"
          : "text-zinc-300 hover:text-amber-400"
      } ${isPending ? "opacity-50 cursor-wait" : ""}`}
    >
      {saved ? (
        // Filled bookmark star
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        // Outlined bookmark star
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      )}
    </button>
  );
}
