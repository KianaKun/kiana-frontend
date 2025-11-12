"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ImageServer from "@/components/imageserver/ImageServer";
import { resolveImg } from "@/components/admin-dashboard/Api";

type Game = {
  gameID: number;
  title: string;
  image_url?: string | null;
};

type SteamKey = {
  SteamkeyID: number;
  key_code: string;
};

export default function GameKeyCard({
  game,
  keys,
  onQuickAdd,
}: {
  game: Game;
  keys: SteamKey[];
  onQuickAdd: (keyCode: string, done?: () => void) => void;
}) {
  const [keyInput, setKeyInput] = useState("");

  // 🛡️ Jika belum ada key, jangan render sama sekali
  if (!keys || keys.length === 0) return null;

  const submitQuick = () => {
    if (!keyInput.trim()) return;
    onQuickAdd(keyInput, () => setKeyInput(""));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-lg border border-white/10 bg-[#152030] overflow-hidden flex flex-col hover:shadow-lg hover:shadow-black/30 transition-all"
    >
      {/* Gambar Game */}
      <div className="relative h-40 w-full overflow-hidden">
        <ImageServer
          src={resolveImg(game.image_url)}
          alt={game.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#152030] via-transparent to-transparent" />
      </div>

      {/* Isi Card */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold truncate">{game.title}</div>
          <div className="text-xs bg-[#0E1116] rounded-full px-2 py-1">
            {keys.length} available
          </div>
        </div>

        {/* Daftar Key */}
        <div className="space-y-2 max-h-40 overflow-auto pr-1">
          {keys.map((k) => (
            <div
              key={k.SteamkeyID}
              className="flex items-center gap-2 bg-[#0E1116] rounded-md px-3 py-2"
            >
              <code className="font-mono text-sm truncate">{k.key_code}</code>
            </div>
          ))}
        </div>

        {/* Tambah Key Cepat */}
        <div className="mt-1 flex gap-2">
          <input
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Add new key (XXXXX-XXXXX-XXXXX)"
            className="flex-1 px-3 py-2 bg-[#0E1116] rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={submitQuick}
            disabled={!keyInput.trim()}
            className={`px-3 py-2 rounded text-sm transition-all ${
              keyInput.trim()
                ? "bg-[#274056] hover:bg-[#30506a]"
                : "bg-[#274056]/50 cursor-not-allowed"
            }`}
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}
