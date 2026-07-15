"use client";

import { useState, useTransition } from "react";
import { createGameList, deleteGameList, renameGameList } from "@/actions/games";
import type { GameListInfo } from "@/lib/types";

interface ListManagerProps {
  lists: GameListInfo[];
}

const PRESET_COLORS = [
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
];

export function ListManager({ lists }: ListManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    startTransition(async () => {
      await createGameList(trimmed, newColor);
      setNewName("");
    });
  };

  const handleDelete = (listId: number) => {
    startTransition(async () => {
      await deleteGameList(listId);
    });
  };

  const handleRename = (listId: number) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    startTransition(async () => {
      await renameGameList(listId, trimmed);
      setEditingId(null);
      setEditName("");
    });
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:bg-zinc-50"
      >
        <span>Lists ({lists.length})</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-zinc-200 px-4 py-3 space-y-3">
          {/* Existing lists */}
          {lists.length > 0 && (
            <ul className="space-y-1.5">
              {lists.map((list) => (
                <li
                  key={list.id}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-50"
                >
                  {editingId === list.id ? (
                    <div className="flex flex-1 items-center gap-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(list.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 rounded border border-zinc-300 px-2 py-0.5 text-xs"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(list.id)}
                        className="rounded p-0.5 text-green-600 hover:bg-green-50"
                        title="Save"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100"
                        title="Cancel"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-3 w-3 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                        <span className="truncate text-xs font-medium text-zinc-700">
                          {list.name}
                        </span>
                        <span className="flex-shrink-0 text-xs text-zinc-400">
                          ({list.gameCount})
                        </span>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-0.5">
                        <button
                          onClick={() => {
                            setEditingId(list.id);
                            setEditName(list.name);
                          }}
                          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                          title="Rename"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(list.id)}
                          className="rounded p-0.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                          title="Delete"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Create new list */}
          <div className="border-t border-zinc-100 pt-3">
            <p className="mb-2 text-xs font-medium text-zinc-500">Create new list</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`h-5 w-5 rounded-full border-2 transition-all ${
                      newColor === color
                        ? "border-zinc-900 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                placeholder="List name..."
                className="flex-1 rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isPending}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
