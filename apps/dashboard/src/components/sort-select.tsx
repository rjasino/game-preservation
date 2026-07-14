"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const SORT_OPTIONS = [
  {
    value: "risk_score-desc",
    label: "Risk Score (Highest First)",
    field: "risk_score",
    order: "desc",
  },
  {
    value: "risk_score-asc",
    label: "Risk Score (Lowest First)",
    field: "risk_score",
    order: "asc",
  },
  { value: "title-asc", label: "Title (A \u2013 Z)", field: "title", order: "asc" },
  { value: "title-desc", label: "Title (Z \u2013 A)", field: "title", order: "desc" },
  {
    value: "release_date-desc",
    label: "Release Date (Newest)",
    field: "release_date",
    order: "desc",
  },
  {
    value: "release_date-asc",
    label: "Release Date (Oldest)",
    field: "release_date",
    order: "asc",
  },
];

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") ?? "";
  const currentOrder = searchParams.get("order") ?? "";
  const selectedValue =
    currentSort && currentOrder ? `${currentSort}-${currentOrder}` : "";

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        const [field, order] = value.split("-");
        params.set("sort", field);
        params.set("order", order);
      } else {
        params.delete("sort");
        params.delete("order");
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-select"
        className="text-xs font-medium text-zinc-500 whitespace-nowrap"
      >
        Sort by
      </label>
      <select
        id="sort-select"
        value={selectedValue}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
      >
        <option value="">Default (Highest Risk)</option>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
