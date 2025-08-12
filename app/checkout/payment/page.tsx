"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/ui/Navbar";
import Image from "next/image";

/* ---------------------------------- Types --------------------------------- */
type CartItem = {
  cartID: number;
  quantity: number;
  gameID: number;
  title: string;
  price: number;
  image_url?: string | null;
};

/* ------------------------------ Image resolver ---------------------------- */
const BACKEND =
  (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");
function joinUrl(base: string, path: string) {
  return `${base}/${path.replace(/^\/+/, "")}`;
}
function resolveImg(src?: string | null): string {
  if (!src || !src.trim()) return "/placeholder.png";
  const s = src.trim();
  if (/^(https?:|data:|blob:)/i.test(s)) {
    if (/^https?:/i.test(s)) {
      try { new URL(s); } catch { return "/placeholder.png"; }
    }
    return s;
  }
  if (s.startsWith("/uploads")) return joinUrl(BACKEND, s);
  if (s.startsWith("/")) return s;
  return "/placeholder.png";
}

/* ----------------------------- Payment options ---------------------------- */
const PAY_METHODS = [
  { code: "QRIS",    label: "QRIS — QR Code Standar Pembayaran Nasional", img: "/image/qris.png" },
  { code: "BCA",     label: "BCA",                                         img: "/image/bca.png"  },
  { code: "SEABANK", label: "SeaBank",                                     img: "/image/seabank.png" },
] as const;

type MethodCode = typeof PAY_METHODS[number]["code"];

/* --------------------------------- Page ----------------------------------- */
export default function ChoosePaymentPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MethodCode | "">("");
  const [creating, setCreating] = useState(false);
  const [orderID, setOrderID] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // total harga
  const total = useMemo(
    () => cart.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [cart]
  );

  useEffect(() => {
    (async () => {
      // wajib login
      const me = await fetch(`${BACKEND}/me`, { credentials: "include" }).then(r => r.json());
      if (!me?.loggedIn) { router.push("/login"); return; }

      // ambil cart
      const res = await fetch(`${BACKEND}/cart`, { credentials: "include" }).then(r => r.json()).catch(() => null);
      setCart(res?.items ?? []);
      setLoading(false);
    })();
  }, [router]);

  async function handleCreateOrder() {
    if (cart.length === 0) return;
    setCreating(true);
    const res = await fetch(`${BACKEND}/checkout/create-order`, {
      method: "POST",
      credentials: "include",
    }).then(r => r.json()).catch(() => ({ success:false }));
    setCreating(false);

    if (!res?.success) {
      alert("Gagal membuat order. Pastikan cart tidak kosong.");
      return;
    }
    setOrderID(res.orderID);
  }

  async function handleConfirm() {
    if (!orderID || !selected) return;
    setSaving(true);
    const res = await fetch(`${BACKEND}/orders/${orderID}/payment-method`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ method: selected }),
    }).then(r => r.json()).catch(() => ({ success:false }));
    setSaving(false);

    if (!res?.success) {
      alert("Gagal menyimpan metode pembayaran.");
      return;
    }
    router.push(`/checkout/summary/${orderID}`); // halaman summary kita buat setelah ini
  }

  return (
    <div className="min-h-screen bg-[#0E1116] text-white">
      <Navbar />

      <main className="px-6 py-6">
        <div
          className="bg-[#152030] rounded-xl mx-auto p-6"
          style={{ width: "1100px", minHeight: "520px" }} // fixed canvas ala mockup
        >
          <h1 className="text-2xl font-semibold mb-4">Payment Method</h1>

          {loading ? (
            <p className="text-gray-300">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-8">
              {/* Left panel: ringkasan item & total */}
              <div className="space-y-4">
                {/* Kartu ringkasan ala bar biru */}
                <div className="bg-[#24435D] rounded-xl p-4 flex items-center gap-4 w-[620px] max-w-full">
                  <div className="w-28 h-16 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={resolveImg(cart[0]?.image_url)}
                      alt={cart[0]?.title || "item"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold truncate">
                      {cart[0]?.title || "—"}
                    </p>
                  </div>
                  <div className="bg-[#0E1116] rounded-full px-4 py-2 text-sm font-semibold">
                    Rp {total.toLocaleString("id-ID")}
                  </div>
                </div>

                {/* (Kosongkan area sesuai mockup) */}
                <div className="bg-[#0E1A28] rounded-xl" style={{ minHeight: 320 }} />
              </div>

              {/* Right panel: pilihan metode */}
                <aside className="bg-[#203345] p-4 rounded-2xl space-y-3 w-[360px]">
                {PAY_METHODS.map((m) => {
                    const active = selected === m.code;
                    return (
                    <button
                        key={m.code}
                        onClick={() => setSelected(m.code)}
                        aria-pressed={active}
                        className={[
                        "w-full rounded-xl px-3 py-3 transition shadow-sm",
                        active
                            ? "ring-2 ring-[#7CC3FF] bg-[#6EA9D6]/20"
                            : "hover:bg-[#6EA9D6]/15"
                        ].join(" ")}
                    >
                        <div className="flex items-center gap-3">
                        <div className="relative w-[260px] h-[64px]">
                            {/* Pakai next/image agar tajam & cepat */}
                            <Image
                            src={m.img}
                            alt={m.label}
                            fill
                            className="object-contain rounded-md"
                            priority={false}
                            />
                        </div>
                        {/* indikator selected (pil bulat) */}
                        <span
                            className={[
                            "ml-auto inline-block w-4 h-4 rounded-full border-2",
                            active ? "bg-[#7CC3FF] border-[#7CC3FF]" : "border-white/50"
                            ].join(" ")}
                            aria-hidden="true"
                        />
                        </div>
                    </button>
                    );
                })}

                {/* Tombol aksi bawah */}
                <div className="flex items-center gap-4 pt-2">
                    <button
                    onClick={() => router.push("/cart")}
                    className="flex-1 bg-[#2A3E54] hover:bg-[#314a64] rounded-xl px-4 py-3 font-semibold"
                    >
                    Cancel Payment
                    </button>

                    {/* Tahap 1: Create order → Tahap 2: Confirm & lanjut */}
                    {!orderID ? (
                    <button
                        disabled={cart.length === 0 || creating}
                        onClick={handleCreateOrder}
                        className="flex-1 bg-[#7CC3FF] hover:bg-[#8fd0ff] disabled:opacity-50 text-black rounded-xl px-4 py-3 font-semibold"
                    >
                        {creating ? "Creating…" : "Buy Now"}
                    </button>
                    ) : (
                    <button
                        disabled={!selected || saving}
                        onClick={handleConfirm}
                        className="flex-1 bg-[#7CC3FF] hover:bg-[#8fd0ff] disabled:opacity-50 text-black rounded-xl px-4 py-3 font-semibold"
                    >
                        {saving ? "Saving…" : "Buy Now"}
                    </button>
                    )}
                </div>
                </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
