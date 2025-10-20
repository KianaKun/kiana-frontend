"use client";

import React, { useMemo } from "react";
import type { Game } from "./types";
import ImageServer from "@/components/ui/ImageServer";

type Props = {
  games: Game[];
  onAdd?: () => void; // jika disediakan, akan tampil card Add
  onEdit?: (id: number) => void;
  onDelete?: (id: number, title: string) => void;
  className?: string;
  showOnlyActive?: boolean; // default true
};

export default function GameCardsPreview({
  games,
  onAdd,
  onEdit,
  onDelete,
  className = "",
  showOnlyActive = true,
}: Props) {
  // filter aktif
  const activeGames = useMemo(() => {
    const arr = Array.isArray(games) ? games : [];
    if (!showOnlyActive) return arr;
    return arr.filter((g: any) => g.is_deleted === undefined || g.is_deleted === 0 || g.is_deleted === false);
  }, [games, showOnlyActive]);

  const formatRp = (n: number) =>
    "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);

  return (
    <div className={`bg-[#152030] p-4 rounded-md overflow-hidden ${className}`}>
      <h3 className="mb-3 font-medium">Catalog Preview</h3>

      <div className="w-full overflow-hidden">
        {/* Responsive grid: 1 / 2 / 3 / 4 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Add card (optional) */}
          {onAdd && (
            <div
              role="button"
              onClick={() => onAdd()}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#0E1116] hover:bg-[#151a21] transition cursor-pointer min-h-[180px]"
            >
              <div className="text-3xl">＋</div>
              <div className="font-semibold">Add Game</div>
              <div className="text-xs text-white/60">Create new product</div>
            </div>
          )}

          {/* Game cards */}
          {activeGames.map((g: any) => (
            <article
              key={g.gameID}
              className="bg-[#0E1116] rounded-lg p-3 flex flex-col h-full min-h-[180px] overflow-hidden"
            >
              <div className="relative w-full h-36 rounded overflow-hidden bg-white/5">
                {/* ImageServer expects src and className */}
                <ImageServer
                  src={g.image_url || "/placeholder.png"}
                  className="w-full h-full object-cover"
                  alt={g.title || "Game image"}
                />
              </div>

              <div className="mt-3 flex-1">
                <h4 className="font-medium text-sm line-clamp-2">{g.title}</h4>
                <p className="text-xs text-white/70 mt-1 line-clamp-2">{g.description || "-"}</p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{formatRp(Number(g.price || 0))}</div>

                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(Number(g.gameID))}
                      className="px-3 py-1 text-xs rounded-full bg-[#274056] hover:bg-[#30506a]"
                      aria-label={`Edit ${g.title}`}
                    >
                      Edit
                    </button>
                  )}

                  {onDelete && (
                    <button
                      onClick={() => onDelete(Number(g.gameID), g.title)}
                      className="px-3 py-1 text-xs rounded-full bg-rose-600 hover:bg-rose-700 text-white"
                      aria-label={`Delete ${g.title}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {activeGames.length === 0 && !onAdd && (
            <div className="col-span-full text-sm text-white/60 p-4 bg-[#0E1116] rounded">
              No games yet.
            </div>
          )}

          {activeGames.length === 0 && onAdd && (
            <div className="col-span-full text-sm text-white/60 p-4">
              {/* When onAdd exists but no games, still keep empty message out of the grid */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
