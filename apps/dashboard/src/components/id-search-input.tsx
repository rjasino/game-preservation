"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface IdSearchInputProps {
  defaultValue: string;
}

/**
 * Compact input for searching a game by its IGDB ID.
 * Navigates via the ``?id=`` URL search param (exact match).
 */
export function IdSearchInput({ defaultValue }: IdSearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed && /^\d+$/.test(trimmed)) {
        params.set("id", trimmed);
        // Clear name search when switching to ID lookup
        params.delete("q");
      } else {
        params.delete("id");
      }
      // Reset page when changing ID filter
      params.delete("page");
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        defaultValue={defaultValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="ID\u2026"
        className="w-24 rounded-lg border border-zinc-300 bg-white py-2.5 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        aria-label="Search by game ID"
      />
      {isPending && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        </div>
      )}
    </div>
  );
}
