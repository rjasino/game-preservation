"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const PAGE_SIZES = [10, 20, 50, 100] as const;

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  total,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updatePage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) {
        params.set("page", String(page));
      } else {
        params.delete("page");
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const updateSize = useCallback(
    (size: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (size !== 10) {
        params.set("size", String(size));
      } else {
        params.delete("size");
      }
      // Reset to page 1 when changing page size
      params.delete("page");
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      {/* Showing X–Y of Z */}
      <p className="text-xs text-zinc-400 tabular-nums">
        Showing {start}&ndash;{end} of {total.toLocaleString()}
      </p>

      <div className="flex items-center gap-3">
        {/* Page size selector */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="page-size" className="text-xs text-zinc-500">
            Per page
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => updateSize(Number(e.target.value))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page navigation */}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => updatePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>

          <span className="px-2 text-xs tabular-nums text-zinc-600">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => updatePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}
