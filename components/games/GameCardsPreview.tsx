"use client";
import { useMemo } from "react";
import type { Game } from "./types";
import ImageServer from "@/components/ui/ImageServer";

export default function GameCardsPreview({ games }: { games: Game[] }) {
  // Tampilkan hanya game aktif (is_deleted=0). Jika kolom tidak ada, anggap aktif.
  const activeGames = useMemo(
    () => games.filter((g: any) => g.is_deleted === undefined || g.is_deleted === 0 || g.is_deleted === false),
    [games]
  );

  return (
    <div className="bg-[#152030] p-4 rounded-md">
      <h3 className="mb-3 font-medium">Catalog Preview</h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeGames.map((g: any) => (
          <div key={g.gameID} className="bg-[#0E1116] rounded p-3">
            <ImageServer
              src={g.image_url || "/placeholder.png"}
              className="w-full h-28 rounded object-cover"
            />
            <div className="mt-2 font-medium">{g.title}</div>
            <div className="text-sm opacity-80 truncate">{g.description}</div>
            <div className="mt-1">Rp {Number(g.price || 0)}</div>
          </div>
        ))}

        {activeGames.length === 0 && (
          <div className="text-sm text-gray-300">No games yet.</div>
        )}
      </div>
    </div>
  );
}
