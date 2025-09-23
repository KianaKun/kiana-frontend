"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/ui/Navbar";
import { fetchJSON, resolveImg } from "@/components/Api";
import { motion, AnimatePresence } from "framer-motion";

/* ===== Helper Rupiah aman untuk string/number ===== */
function toIDR(v: unknown) {
  const n =
    typeof v === "number"
      ? v
      : v == null
      ? NaN
      : Number(String(v).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return "Rp -";
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}

type GameDetail = {
  gameID: number;
  title: string;
  image_url?: string | null;
  description?: string | null;
  price?: number | string | null;
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [addedToast, setAddedToast] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyErr, setBuyErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;

    (async () => {
      try {
        const me = await fetchJSON("/me", { cache: "no-store" });
        if (!me.loggedIn) {
          router.push("/login");
          return;
        }
        const product = await fetchJSON(`/games/${id}`);
        if (!alive) return;
        setGame(product);
      } catch {
        if (!alive) return;
        setGame(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, router]);

  const addToCart = async () => {
    if (!game) return;
    setBuyErr(null);
    try {
      const res = await fetchJSON("/cart", {
        method: "POST",
        body: JSON.stringify({ gameID: Number(game.gameID), quantity: 1 }),
      });
      if (res?.success) {
        setAddedToast(true);
        setTimeout(() => setAddedToast(false), 1600);
      } else {
        setBuyErr(res?.message || "Gagal menambahkan ke cart");
      }
    } catch {
      setBuyErr("Network error saat menambahkan ke cart");
    }
  };

  /** BUY NOW:
   * 1) paksa tambah produk ini ke cart (+1 jika sudah ada)
   * 2) create order dari seluruh cart
   * 3) redirect ke /checkout/payment?orderId=...
   */
  const buyNowAll = async () => {
    if (!game || buying) return;
    setBuying(true);
    setBuyErr(null);
    try {
      // 1) pastikan produk ini MASUK cart (+1 jika sudah ada)
      const add = await fetchJSON("/cart", {
        method: "POST",
        body: JSON.stringify({ gameID: Number(game.gameID), quantity: 1 }),
      });
      if (!add?.success) throw new Error(add?.message || "Gagal menambahkan item ke cart");

      // 2) buat order dari SELURUH cart
      const order = await fetchJSON("/checkout/create-order", { method: "POST" });
      if (!order?.success || !order?.orderID) throw new Error(order?.message || "Gagal membuat order");

      // 3) simpan cadangan & redirect
      sessionStorage.setItem("lastOrderId", String(order.orderID));
      router.push(`/checkout/payment?orderId=${order.orderID}`);
    } catch (e: any) {
      setBuyErr(e?.message || "Buy Now gagal");
    } finally {
      setBuying(false);
    }
  };

  const priceText = toIDR(game?.price ?? 0);

  return (
    <div className="min-h-screen bg-[#0E1116] text-white">
      <Navbar />

      {/* Toast success add-to-cart */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="relative flex items-center gap-3 bg-[#12202f]/95 border border-white/10 rounded-full px-4 py-2 shadow-xl">
              <span className="relative inline-flex">
                <span className="absolute inline-flex h-7 w-7 rounded-full bg-emerald-500 opacity-60 animate-ping" />
                <span className="relative inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              </span>
              <span className="font-medium">Item added to cart</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="p-6 mt-4 mx-6 rounded-2xl bg-[#152030] border border-white/10">
        {/* breadcrumb mini */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            ← Kembali
          </button>
          <div className="text-xs text-white/60">
            {new Date().toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })} WIB
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && <SkeletonDetail />}

        {/* Not found */}
        {!loading && !game && (
          <div className="text-red-300">Product not found.</div>
        )}

        {/* Content */}
        {!loading && game && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col md:flex-row gap-8 max-w-[2000px] mx-auto items-start"
          >
            {/* Left: Game Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.35 }}
              className="flex-1 flex justify-center items-start"
            >
              <div className="relative rounded-xl overflow-hidden group border border-white/10 bg-[#0E1116]">
                <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src={resolveImg(game.image_url)}
                  alt={game.title || "Game"}
                  className="rounded-xl object-cover max-h-[340px] w-full md:w-[560px] transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 text-[10px] uppercase tracking-wide bg-[#274056]/85 backdrop-blur px-2 py-1 rounded">
                  Steam Key
                </div>
              </div>
            </motion.div>

            {/* Right: Description & CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex-1 flex flex-col bg-[#0E1116] p-6 rounded-xl border border-white/10"
            >
              <h1 className="text-2xl font-semibold">{game.title}</h1>
              {/* Deskripsi game */}
              <div className="mt-2 text-white/70 leading-relaxed space-y-3">
                {formatDescription(game.description || "Tidak ada deskripsi untuk produk ini.")}
              </div>


              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Badge label="Region" value="Asia" />
                <Badge label="DRM" value="Steam" />
                <Badge label="Delivery" value="Instan" />
              </div>

              <div className="mt-6 h-px bg-white/10" />

              {buyErr && (
                <div className="mt-4 rounded-md px-3 py-2 bg-red-700/30 text-red-200 text-sm">
                  {buyErr}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-white/60">Harga</div>
                  <div className="text-3xl font-semibold">{priceText}</div>
                </div>
                <div className="hidden md:flex gap-3">
                  <button
                    onClick={addToCart}
                    disabled={buying}
                    className="px-6 py-2 rounded-full font-semibold bg-[#2A445E] hover:bg-[#325371] transition-colors disabled:opacity-60"
                  >
                    Add To Cart
                  </button>
                  <button
                    onClick={buyNowAll}
                    disabled={buying}
                    className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                      buying ? "bg-[#325371]/60 cursor-not-allowed" : "bg-[#325371] hover:bg-[#3b6587]"
                    }`}
                    title="Tambahkan produk ini ke cart lalu buat order dari semua cart"
                  >
                    {buying ? "Processing..." : "Buy Now"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>

      {/* Mobile sticky CTA */}
      {!loading && !!game && (
        <div className="md:hidden sticky bottom-0 left-0 right-0 z-40">
          <div className="bg-[#0E1116]/95 backdrop-blur border-t border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="text-lg font-semibold">{priceText}</div>
            <div className="flex gap-2">
              <button
                onClick={addToCart}
                disabled={buying}
                className="px-4 py-2 rounded-full font-semibold bg-[#2A445E] hover:bg-[#325371] transition-colors disabled:opacity-60"
              >
                Add
              </button>
              <button
                onClick={buyNowAll}
                disabled={buying}
                className={`px-4 py-2 rounded-full font-semibold ${
                  buying ? "bg-[#325371]/60 cursor-not-allowed" : "bg-[#325371] hover:bg-[#3b6587]"
                }`}
              >
                {buying ? "..." : "Buy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay progress saat Buy Now */}
      <AnimatePresence>
        {buying && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-[#152030] border border-white/10 rounded-xl p-6 w-full max-w-sm text-center"
            >
              <div className="relative inline-flex">
                <span className="absolute inline-flex h-10 w-10 rounded-full bg-[#274056] opacity-60 animate-ping" />
                <span className="relative inline-flex items-center justify-center h-10 w-10 rounded-full bg-[#274056]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" className="opacity-30" />
                    <path d="M4 12a8 8 0 018-8" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 font-medium">Mempersiapkan order…</div>
              <div className="text-sm text-white/70">Menambahkan item ke cart dan membuat order.</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------- Small components ------- */

function SkeletonDetail() {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        <div className="h-[340px] w-full rounded-xl bg-[#0E1116] animate-pulse" />
      </div>
      <div className="flex-1 bg-[#0E1116] p-6 rounded-xl border border-white/10">
        <div className="h-6 w-2/3 bg-white/10 rounded animate-pulse" />
        <div className="mt-3 h-4 w-full bg-white/10 rounded animate-pulse" />
        <div className="mt-2 h-4 w-5/6 bg-white/10 rounded animate-pulse" />
        <div className="mt-2 h-4 w-4/6 bg-white/10 rounded animate-pulse" />
        <div className="mt-6 h-px bg-white/10" />
        <div className="mt-6 flex items-center justify-between">
          <div className="h-8 w-40 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-white/10 rounded-full animate-pulse" />
            <div className="h-10 w-24 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#0E1116] border border-white/10 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-base font-semibold mt-1">{value}</div>
    </div>
  );
}

function formatDescription(desc: string) {
  // 1. Pecah dulu berdasarkan newline ganda
  let parts = desc.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  // 2. Kalau ternyata hasilnya cuma 1 (nggak ada newline),
  //    coba pecah berdasarkan titik + spasi
  if (parts.length === 1) {
    parts = desc.split(/(?<=\.)\s+/).map(p => p.trim()).filter(Boolean);
  }

  return parts.map((para, idx) => <p key={idx}>{para}</p>);
}

