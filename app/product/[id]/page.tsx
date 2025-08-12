"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/ui/Navbar";

type GameDetail = {
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

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    // 🔹 1. Cek login status
    fetch("http://localhost:5000/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn) {
          router.push("/login");
          return;
        }

        // 🔹 2. Kalau sudah login, fetch produk
        fetch(`http://localhost:5000/games/${id}`)
          .then((res) => res.json())
          .then((product) => {
            setGame(product);
            setLoading(false);
          })
          .catch(() => {
            setGame(null);
            setLoading(false);
          });
      })
      .catch(() => {
        router.push("/login");
      });
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#0E1116] text-white">
      <Navbar />
      {/* Toast success – muncul di bawah tengah */}
{addedToast && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="relative flex items-center gap-3 bg-[#12202f]/95 border border-white/10 rounded-full px-4 py-2 shadow-xl">
            {/* Badge hijau beranimasi */}
            <span className="relative inline-flex">
              <span className="absolute inline-flex h-7 w-7 rounded-full bg-emerald-500 opacity-60 animate-ping"></span>
              <span className="relative inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
            </span>

            <span className="font-medium">Item added to cart</span>
          </div>
        </div>
      )}
      <main className="p-6 mt-4 mx-6 rounded-md bg-[#152030]">
        {loading ? (
          <p className="text-gray-300">Loading product...</p>
        ) : !game ? (
          <p className="text-red-400">Product not found.</p>
        ) : (
            <div className="flex flex-col md:flex-row gap-8 max-w-[2000px] mx-auto items-start">
            {/* Left: Game Image */}
            <div className="flex-1 flex justify-center items-start">
              <img
                src={resolveImg(game.image_url)}
                alt={game.title}
                className="rounded-lg object-cover max-h-[280px] w-full md:w-auto"
              />
            </div>

            {/* Right: Description */}
            <div className="flex-1 flex flex-col bg-[#0E1116] p-6 rounded-lg">
              <h2 className="text-sm text-gray-400 mb-2">Description :</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {game.description}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Preorder CDKey Steam DRM <br />
                Only Activate on Asia
              </p>
              <p className="text-lg font-semibold mb-6">
                Rp {game.price?.toLocaleString("id-ID")}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    fetch("http://localhost:5000/cart", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ gameID: game.gameID, quantity: 1 }),
                    })
                      .then((res) => res.json())
                      .then((data) => {
                        if (data?.success) {
                          setAddedToast(true);
                          setTimeout(() => setAddedToast(false), 1600); // auto hide
                        } else {
                          // kalau mau, tampilkan error toast lain
                          console.warn(data?.message || "Failed to add");
                        }
                      })
                      .catch(() => console.warn("Network error"));
                  }}
                  className="bg-[#2A445E] hover:bg-[#325371] px-6 py-2 rounded-full font-semibold"
                >
                  Add To Cart
                </button>
                <button className="bg-[#325371] hover:bg-[#3b6587] px-6 py-2 rounded-full font-semibold transition-colors">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
