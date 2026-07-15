"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { toggleSaveGame, toggleGameInListAction } from "@/actions/games";
import type { GameListInfo } from "@/lib/types";

interface SaveButtonProps {
  gameId: number;
  /** IDs of lists this game belongs to. */
  listIds: number[];
  /** All available lists for the dropdown. */
  lists: GameListInfo[];
  /** Whether the game is in any list (for quick toggle). */
  saved: boolean;
}

/**
 * A star button that opens a dropdown of user-created lists.
 * Click the star to quickly toggle the default "Watchlist" list.
 * Use the dropdown to manage membership in specific lists.
 */
export function SaveButton({
  gameId,
  listIds,
  lists,
  saved: initialSaved,
}: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [open, setOpen] = useState(false);
  const [pendingListIds, setPendingListIds] = useState<Set<number>>(
    new Set(listIds)
  );
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external prop changes
  const [prevInitialSaved, setPrevInitialSaved] = useState(initialSaved);
  if (initialSaved !== prevInitialSaved) {
    setPrevInitialSaved(initialSaved);
    setSaved(initialSaved);
  }

  // Sync list IDs from server revalidation
  const listIdKey = listIds.sort().join(",");
  const [prevListIdKey, setPrevListIdKey] = useState(listIdKey);
  if (listIdKey !== prevListIdKey) {
    setPrevListIdKey(listIdKey);
    setPendingListIds(new Set(listIds));
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Quick toggle: add/remove from the default Watchlist
    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      const result = await toggleSaveGame(gameId);
      if (!result.success) {
        setSaved(!next);
      }
    });
  };

  const handleListToggle = (listId: number) => {
    const currentlyIn = pendingListIds.has(listId);
    const next = new Set(pendingListIds);
    if (currentlyIn) {
      next.delete(listId);
    } else {
      next.add(listId);
    }
    setPendingListIds(next);

    startTransition(async () => {
      await toggleGameInListAction(listId, gameId);
      // Revalidation will sync via props
    });
  };

  const totalLists = lists.length;
  const activeCount = pendingListIds.size;

  const label =
    activeCount > 0
      ? `In ${activeCount} list${activeCount > 1 ? "s" : ""}`
      : "Add to list";

  return (
    <div ref={containerRef} className="relative inline-flex">
      {/* Star button — quick toggle for default Watchlist */}
      <button
        onClick={handleStarClick}
        disabled={isPending}
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center rounded-l-md p-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 ${
          saved
            ? "text-amber-500 hover:text-amber-600"
            : "text-zinc-300 hover:text-amber-400"
        } ${isPending ? "opacity-50 cursor-wait" : ""}`}
      >
        {saved ? (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        )}
      </button>

      {/* Dropdown trigger */}
      {totalLists > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          disabled={isPending}
          className="rounded-r-md border-l border-zinc-200 px-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 focus:outline-none"
          title="Manage list membership"
        >
          <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Dropdown menu */}
      {open && totalLists > 0 && (
        <div
          className="absolute left-0 top-full z-40 mt-1 w-56 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Add to list
          </p>
          {lists.map((list) => {
            const checked = pendingListIds.has(list.id);
            return (
              <button
                key={list.id}
                onClick={() => handleListToggle(list.id)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-zinc-50"
              >
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                    checked
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-zinc-300"
                  }`}
                >
                  {checked && (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: list.color }}
                />
                <span className="flex-1 truncate text-zinc-700">{list.name}</span>
                <span className="text-xs text-zinc-400">{list.gameCount}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
