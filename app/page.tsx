"use client";

import { useEffect, useState } from "react";
import Navbar from "@/ui/Navbar";

type Game = {
  gameID: number;
  title: string;
  image_url?: string | null;
  description?: string;
  price?: number;
};

function resolveImg(src?: string | null) {
  if (!src) return "/placeholder.png";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads")) return `http://localhost:5000${src}`;
  return src;
}

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(data.items || data);
        setLoading(false);
      })
      .catch(() => {
        setGames([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0E1116] text-white">
      <Navbar /> {/* ✅ Navbar selalu ada */}

      <main className="p-6 bg-[#152030] mt-4 mx-6 rounded-md">
        {loading ? (
          <p className="text-center text-gray-300">Loading games...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {games.length === 0 ? (
              <p className="text-center text-gray-300 col-span-full">No games available.</p>
            ) : (
              games.map((game) => (
                <div key={game.gameID} className="bg-transparent">
                  <div className="w-full h-48 bg-[#0E1116] rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={resolveImg(game.image_url)}
                      alt={game.title}
                      className="object-cover w-full h-full rounded-lg"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-2 text-center">{game.title}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
