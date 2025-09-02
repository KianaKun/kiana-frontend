"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/ui/Navbar";
import { fetchJSON, resolveImg } from "@/components/Api";
import { motion, AnimatePresence } from "framer-motion";

type OrderItem = {
  orderItemID: number;
  quantity: number;
  price: number | string;
  title: string;
  image_url?: string | null;
};

type Order = {
  orderID: number;
  total_price: number | string;
  status: "pending" | "approved" | "rejected";
  payment_method?: string | null;
  order_date: string;
};

/* Helper format rupiah */
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

export default function ChoosePaymentPage() {
  const router = useRouter();
  const qs = useSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  type Method = "QRIS" | "BCA" | "SEABANK";
  const [method, setMethod] = useState<Method | null>(null);

  // Ambil orderId
  const orderId = useMemo(() => {
    const q = qs.get("orderId") || qs.get("orderID") || "";
    if (q) return q;
    if (typeof window !== "undefined") {
      const last = sessionStorage.getItem("lastOrderId");
      return last || "";
    }
    return "";
  }, [qs]);

  // Load order & items
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        if (!orderId) {
          setErr("Order tidak ditemukan.");
          setLoading(false);
          return;
        }

        const me = await fetchJSON("/me", { cache: "no-store" });
        if (!me.loggedIn) {
          router.push("/login");
          return;
        }

        const d = await fetchJSON(`/orders/${orderId}`);
        setOrder(d.order);
        setItems(d.items || []);
        setMethod(((d.order?.payment_method || "") as Method) || "QRIS");
      } catch (e: any) {
        setErr(e?.message || "Gagal memuat order");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, router]);

  // Simpan metode pembayaran
  const saveAndContinue = async () => {
    if (!order || !method || saving) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetchJSON(`/orders/${order.orderID}/payment-method`, {
        method: "PUT",
        body: JSON.stringify({ method }),
      });
      if (!res?.success) throw new Error(res?.message || "Gagal menyimpan metode");

      router.push(`/checkout/summary/${order.orderID}`);
    } catch (e: any) {
      setErr(e?.message || "Gagal menyimpan metode pembayaran");
    } finally {
      setSaving(false);
    }
  };

  const recomputedTotal = items.reduce(
    (s, it) => s + Number(it.price || 0) * it.quantity,
    0
  );
  const totalText = toIDR(order?.total_price ?? recomputedTotal);

  return (
    <div className="min-h-screen bg-[#0E1116] text-white">
      <Navbar />

      <main className="p-6 mt-4 mx-6 rounded-2xl bg-[#152030] border border-white/10 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <section className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            {err && (
              <div className="mb-4 rounded px-3 py-2 bg-red-700/30 text-red-200 text-sm">
                {err}
              </div>
            )}

            {loading ? (
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
            ) : (
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white/70 bg-[#0E1116] border border-white/10 rounded-lg p-6"
                  >
                    Tidak ada item pada order ini.
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {items.map((it) => (
                      <motion.div
                        key={it.orderItemID}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0E1116] rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-28 h-16 rounded bg-white/5 overflow-hidden">
                            <img
                              src={it.image_url ? resolveImg(it.image_url) : "/placeholder.png"}
                              alt={it.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{it.title}</div>
                            <div className="text-sm text-white/70">
                              {it.quantity} × {toIDR(it.price)}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {toIDR(Number(it.price || 0) * it.quantity)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            )}
          </section>

          {/* Payment Method */}
          <aside className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <div className="bg-[#152030] rounded-xl border border-white/10 p-4 space-y-4">
              <PayOption
                label="QRIS"
                description="QR Code Standar Pembayaran Nasional"
                selected={method === "QRIS"}
                onClick={() => setMethod("QRIS")}
                logo={
                  <div className="bg-white p-2 rounded-md flex items-center justify-center">
                    <img
                      src="/image/qris.png"
                      alt="QRIS"
                      className="w-16 h-auto object-contain"
                    />
                  </div>
                }
              />
              <PayOption
                label="BCA"
                selected={method === "BCA"}
                description="Via Nomor Rekening"
                onClick={() => setMethod("BCA")}
                logo={
                  <div className="bg-white p-2 rounded-md flex items-center justify-center">
                    <img
                      src="/image/bca.png"
                      alt="BCA"
                      className="w-16 h-auto object-contain"
                    />
                  </div>
                }
              />
              <PayOption
                label="SeaBank"
                selected={method === "SEABANK"}
                description="Via Nomor Rekening"
                onClick={() => setMethod("SEABANK")}
                logo={
                  <div className="bg-white p-2 rounded-md flex items-center justify-center">
                    <img
                      src="/image/seabank.png"
                      alt="SeaBank"
                      className="w-16 h-auto object-contain"
                    />
                  </div>
                }
              />

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <div className="text-white/70 text-sm">Total:</div>
                <div className="text-2xl font-semibold">{totalText}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  className="px-4 py-2 rounded-md bg-[#274056] hover:bg-[#30506a]"
                  onClick={() => router.back()}
                >
                  Cancel
                </button>
                <button
                  onClick={saveAndContinue}
                  disabled={saving || !order}
                  className={`px-4 py-2 rounded-md font-semibold ${
                    saving || !order
                      ? "bg-[#274056]/50 cursor-not-allowed"
                      : "bg-[#274056] hover:bg-[#30506a]"
                  }`}
                >
                  {saving ? "Saving…" : "Buy Now"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PayOption({
  label,
  description,
  selected,
  onClick,
  logo,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  logo: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg p-4 border transition-colors ${
        selected
          ? "border-white/30 bg-white/5 ring-1 ring-white/20"
          : "border-white/10 bg-transparent hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>{logo}</div>
          <div>
            <div className="font-medium">{label}</div>
            {description && (
              <div className="text-xs text-white/60">{description}</div>
            )}
          </div>
        </div>
        <div
          className={`h-3 w-3 rounded-full ${
            selected
              ? "bg-blue-300 shadow-[0_0_0_3px_rgba(59,130,246,0.3)]"
              : "bg-white/20"
          }`}
        />
      </div>
    </button>
  );
}
