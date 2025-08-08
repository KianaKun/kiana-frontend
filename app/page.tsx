"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-[#152030]">
        {/* Logo */}
        <div className="flex items-center space-x-2 bg-[#0E1116] px-4 py-2 rounded-xl">
          <span className="text-xl">🔑</span>
          <span className="font-bold">KianaStore Key</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center px-6">
          <input
            type="text"
            placeholder="Search Games"
            className="w-1/3 px-4 py-2 rounded-full bg-[#274056] text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-2">
          <Link href="/register">
            <button className="bg-[#274056] px-4 py-2 rounded-sm hover:bg-[#30506a]">
              Create account
            </button>
          </Link>
          <Link href="/login">
            <button className="bg-[#274056] px-4 py-2 rounded-sm hover:bg-[#30506a]">
              Login
            </button>
          </Link>
        </div>
      </nav>

      {/* Content */}
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
