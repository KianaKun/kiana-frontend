"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/ui/Navbar";
import { fetchJSON, resolveImg } from "@/components/Api";
import { motion, AnimatePresence } from "framer-motion";

/* ===== Helper: format Rupiah aman untuk string/number ===== */
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

/* ===== Types ===== */
type CartItem = {
  cartID: number;
  quantity: number;
  gameID: number;
  title: string;
  price: number | string; // DB bisa kirim string
  image_url?: string | null;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState<CartItem | null>(null);
  const router = useRouter();

  const loadCart = async () => {
    try {
      const data = await fetchJSON("/cart", { cache: "no-store" });
      setCart(data.items || []);
    } catch {
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartID: number, qty: number) => {
    if (qty < 1) return;
    await fetchJSON(`/cart/${cartID}`, {
      method: "PUT",
      body: JSON.stringify({ quantity: qty }),
    });
    loadCart();
  };

  const removeItem = async (cartID: number) => {
    await fetchJSON(`/cart/${cartID}`, { method: "DELETE" });
    setConfirmDel(null);
    loadCart();
  };

  useEffect(() => {
    loadCart();
  }, []);

  const totalPrice = useMemo(
    () =>
      cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0),
    [cart]
  );
  const isEmpty = !loading && cart.length === 0;

  return (
    <div className="min-h-screen bg-[#0E1116] text-white">
      <Navbar />

      <main className="p-6 mt-4 mx-6 rounded-2xl bg-[#152030] border border-white/10 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Your Cart</h1>
          <div className="text-xs text-white/60">
            {new Date().toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            WIB
          </div>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Items */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-[#0E1116] rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-16 rounded bg-white/10" />
                      <div className="flex-1">
                        <div className="h-4 w-2/3 bg-white/10 rounded" />
                        <div className="mt-2 h-3 w-1/3 bg-white/10 rounded" />
                      </div>
                      <div className="h-4 w-20 bg-white/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && cart.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-gray-300 bg-[#0E1116] border border-white/10 rounded-lg p-8"
              >
                <div className="text-5xl mb-2">🛒</div>
                <div className="mb-3">Cart kamu masih kosong.</div>
                <Link
                  href="/"
                  className="inline-block bg-[#274056] hover:bg-[#30506a] px-4 py-2 rounded-md"
                >
                  Belanja dulu
                </Link>
              </motion.div>
            )}

            {/* Items */}
            <AnimatePresence initial={false}>
              {!loading &&
                cart.map((item) => {
                  const unit = Number(item.price || 0);
                  const subtotal = unit * item.quantity;
                  return (
                    <motion.div
                      key={item.cartID}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-[#0E1116] rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={resolveImg(item.image_url)}
                            alt={item.title}
                            className="w-28 h-16 md:w-32 md:h-20 rounded object-cover border border-white/10"
                            loading="lazy"
                          />
                          <span className="absolute -top-2 -right-2 text-[10px] bg-[#274056] px-1.5 py-0.5 rounded">
                            Key
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-sm text-white/70 mt-0.5">
                            Harga: <span className="font-medium">{toIDR(unit)}</span>
                          </div>
                          <div className="text-xs text-white/50">
                            Subtotal: <span className="font-semibold">{toIDR(subtotal)}</span>
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                          <button
                            aria-label="Kurangi"
                            className="px-3 py-1 rounded bg-[#274056] hover:bg-[#30506a]"
                            onClick={() =>
                              item.quantity > 1
                                ? updateQuantity(item.cartID, item.quantity - 1)
                                : setConfirmDel(item)
                            }
                          >
                            −
                          </button>
                          <div className="px-3 py-1 rounded bg-white/10 min-w-[3rem] text-center">
                            {item.quantity}
                          </div>
                          <button
                            aria-label="Tambah"
                            className="px-3 py-1 rounded bg-[#274056] hover:bg-[#30506a]"
                            onClick={() => updateQuantity(item.cartID, item.quantity + 1)}
                          >
                            +
                          </button>
                          {/* Remove */}
                          <button
                            aria-label="Hapus item"
                            className="ml-2 px-3 py-1 rounded bg-red-700/80 hover:bg-red-700"
                            onClick={() => setConfirmDel(item)}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>

          {/* Right: Summary */}
          <div className="w-full md:w-[360px] md:sticky md:top-6 self-start">
            <div className="bg-[#0E1116] p-5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/70 text-sm">Total Harga Item</div>
                  <div className="text-3xl font-semibold mt-0.5">
                    {toIDR(totalPrice)}
                  </div>
                </div>
                <div className="text-xs text-white/60">
                  {cart.length} item
                </div>
              </div>

              <div className="mt-4 h-px bg-white/10" />


              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => router.push("/")}
                  className="w-full bg-[#274056] hover:bg-[#30506a] px-4 py-2 rounded-md font-semibold"
                >
                  Return
                </button>
                <button
                  onClick={() => !isEmpty && router.push("/checkout/payment")}
                  disabled={isEmpty}
                  className={`w-full px-4 py-2 rounded-md font-semibold ${
                    isEmpty
                      ? "bg-[#274056]/50 cursor-not-allowed"
                      : "bg-[#274056] hover:bg-[#30506a]"
                  }`}
                  aria-disabled={isEmpty}
                  title={isEmpty ? "Cart kosong" : "Lanjut bayar"}
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirm delete modal */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="bg-[#152030] border border-white/10 rounded-xl p-6 max-w-sm w-full"
            >
              <div className="text-lg font-semibold mb-2">Hapus Item</div>
              <div className="text-white/80 text-sm">
                Hapus <span className="font-medium">{confirmDel.title}</span> dari cart?
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-md bg-[#274056] hover:bg-[#30506a]"
                  onClick={() => setConfirmDel(null)}
                >
                  Batal
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-red-700 hover:bg-red-600"
                  onClick={() => removeItem(confirmDel.cartID)}
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
