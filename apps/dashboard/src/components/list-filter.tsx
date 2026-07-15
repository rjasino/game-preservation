"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import type { GameListInfo } from "@/lib/types";

interface ListFilterProps {
  lists: GameListInfo[];
  /** Currently selected list ID (from URL). */
  currentListId: number | null;
}

export function ListFilter({ lists, currentListId }: ListFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("list", value);
      } else {
        params.delete("list");
      }
      params.delete("page");
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div>
      <label
        htmlFor="filter-list"
        className="mb-1 block text-xs font-medium text-zinc-500"
      >
        List
      </label>
      <select
        id="filter-list"
        value={currentListId?.toString() ?? ""}
        onChange={(e) => updateParam(e.target.value)}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
      >
        <option value="">All Lists</option>
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name} ({list.gameCount})
          </option>
        ))}
      </select>
      {isPending && (
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-500" />
          Updating...
        </div>
      )}
    </div>
  );
}
