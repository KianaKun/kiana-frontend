"use client";
import type { Game } from "./types";
import ImageServer from "@/components/ui/ImageServer";

export default function GameCardsPreview({ games }: { games: Game[] }) {
  return (
    <div className="bg-[#152030] p-4 rounded-md">
      <h3 className="mb-3 font-medium">Catalog Preview</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((g) => (
          <div key={g.gameID} className="bg-[#0E1116] rounded p-3">
            <ImageServer
              src={g.image_url}
              className="w-full h-28 rounded object-cover"
            />
            <div className="mt-2 font-medium">{g.title}</div>
            <div className="text-sm opacity-80 truncate">{g.description}</div>
            <div className="mt-1">Rp {Number(g.price || 0)}</div>
          </div>
        ))}
        {games.length === 0 && <div className="text-sm text-gray-300">No games yet.</div>}
      </div>
    </div>
  );
}
