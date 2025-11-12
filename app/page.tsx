// app/HomePage.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchJSON, resolveImg } from "@/components/admin-dashboard/Api";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import CTA from "@/components/landing/CTA";
import Stat from "@/components/landing/Stat";
import SkeletonCard from "@/components/landing/SkeletonCard";
import GameCard, { type Game } from "@/components/landing/Gamecard";

const ROTATE_MS = 3500;

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);

  const [heroImgs, setHeroImgs] = useState<string[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const rotateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  // ===== Fetch games + filter stok kosong =====
  useEffect(() => {
    setLoading(true);
    const url = q ? `/games?search=${encodeURIComponent(q)}` : "/games";
    fetchJSON(url)
      .then((data) => {
        const allGames: Game[] = data.items || data || [];
        // Filter hanya game yang punya stok (stok > 0)
        const filtered = allGames.filter((g) => {
          // Kalau backend belum kasih stock, tampilkan semua
          if (typeof g.stock === "undefined" || g.stock === null) return true;
          return g.stock > 0;
        });
        setGames(filtered);
      })
      .catch(() => setGames([]))
      .finally(() => {
        setLoading(false);
        setFirstLoad(false);
      });
  }, [q]);

  // ===== Fetch hero images =====
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchJSON("/images/games?limit=24");
        const list: string[] = res?.items || [];
        if (!alive) return;

        setHeroImgs(list);
        list.slice(0, 6).forEach((src) => {
          const img = new Image();
          img.src = resolveImg(src);
        });
      } catch {
        if (!alive) return;
        setHeroImgs([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ===== Rotasi hero images =====
  useEffect(() => {
    if (rotateRef.current) clearInterval(rotateRef.current);
    if (heroImgs.length <= 1) return;
    rotateRef.current = setInterval(
      () => setHeroIdx((i) => (i + 1) % heroImgs.length),
      ROTATE_MS
    );
    return () => {
      if (rotateRef.current) clearInterval(rotateRef.current);
    };
  }, [heroImgs]);

  const title = useMemo(
    () =>
      q
        ? `Showing ${games.length} result${games.length !== 1 ? "s" : ""} for “${q}”`
        : "Featured Games",
    [q, games.length]
  );

  const currentHero = heroImgs[heroIdx] ? resolveImg(heroImgs[heroIdx]) : null;

  return (
    <div className="min-h-screen bg-[#0E1116] text-white overflow-x-hidden">
      {/* Hero Section — sembunyikan kalau sedang search */}
      {!q && (
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 -left-24 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-20 bg-[#274056] animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20 bg-[#30506a] animate-[pulse_3s_ease-in-out_infinite]" />
          </div>

          <div className="mx-6 mt-6">
            <motion.div
              className="rounded-2xl bg-[#152030] border border-white/10 p-8 md:p-10"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <motion.h1
                    className="text-3xl md:text-4xl font-semibold leading-tight"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    Temukan Steam Key Favoritmu 👇
                  </motion.h1>
                  <motion.p
                    className="mt-3 text-white/70"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    Pembayaran lokal (BCA, SeaBank, QRIS), verifikasi manual anti-gagal, dan pengiriman cepat via WhatsApp atau email.
                  </motion.p>

                  <motion.div
                    className="mt-5 flex flex-wrap gap-3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <CTA href="#games" label="Browse Games" />
                    <CTA variant="ghost" href="/cart" label="Lihat Keranjang" />
                  </motion.div>

                  <motion.div
                    className="mt-6 grid grid-cols-3 gap-2 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45, duration: 0.6 }}
                  >
                    <Stat label="Keamanan" value="Manual Verify" />
                    <Stat label="Metode" value="QRIS & Bank" />
                    <Stat label="Kecepatan" value="Instan" />
                  </motion.div>
                </div>

                {/* Showcase card slideshow */}
                <motion.div
                  className="relative rounded-xl border border-white/10 bg-[#0E1116] p-3"
                  initial={{ opacity: 0, scale: 0.98, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                >
                  <div className="aspect-[16/10] w-full overflow-hidden rounded-lg relative">
                    {!currentHero && (
                      <div className="h-full w-full bg-gradient-to-br from-[#274056] to-[#30506a] flex items-center justify-center">
                        <div className="text-center px-6">
                          <div className="text-5xl md:text-6xl">🎮</div>
                          <div className="mt-2 text-sm text-white/80">
                            Deals harian, katalog terus bertambah.
                          </div>
                        </div>
                      </div>
                    )}
                    <AnimatePresence mode="wait">
                      {currentHero && (
                        <motion.img
                          key={currentHero}
                          src={currentHero}
                          alt="Showcase"
                          className="absolute inset-0 h-full w-full object-cover"
                          initial={{ opacity: 0.0, scale: 1.01 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0.0, scale: 1.01 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          loading="eager"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="absolute -top-3 -right-3 rounded-md bg-[#274056] px-2 py-1 text-xs">
                    Hot Today
                  </div>
                  {heroImgs.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                      {heroImgs.slice(0, 8).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-3 rounded-full transition-all ${
                            i === heroIdx ? "bg-white/90 w-5" : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Games Section */}
      <section id="games" className="p-6 mt-6 mx-6 rounded-2xl bg-[#152030] border border-white/10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">{title}</h2>
            {q && !loading && (
              <div className="text-xs text-white/60">
                Tekan <span className="px-1 rounded bg-[#0E1116]">Esc</span> di kolom search untuk hapus filter
              </div>
            )}
          </div>
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-white/60"
            >
              {new Date().toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })} WIB
            </motion.div>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && (
          <AnimatePresence mode="popLayout">
            {games.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-center text-gray-300 py-12"
              >
                Nggak ketemu game-nya. Coba kata kunci lain ya.
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                layout
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
              >
                {games.map((game, idx) => (
                  <motion.div
                    key={game.gameID}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: (firstLoad ? 0.02 : 0) + idx * 0.03, duration: 0.35, ease: "easeOut" }}
                  >
                    <GameCard game={game} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </section>

      <footer className="mx-6 mt-6 mb-10">
        <div className="rounded-2xl bg-[#152030] border border-white/10 p-5 text-center text-white/70">
          © {new Date().getFullYear()} KianaStore Key — Made for gamers in Indonesia.
        </div>
      </footer>
    </div>
  );
}
