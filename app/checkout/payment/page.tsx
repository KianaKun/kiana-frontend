"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/ui/Navbar";
import Image from "next/image";
import { fetchJSON, resolveImg } from "@/components/Api"; // ← pakai helper bersama

type CartItem = {
  cartID: number;
  quantity: number;
  gameID: number;
  title: string;
  price: number;
  image_url?: string | null;
};

const PAY_METHODS = [
  { code: "QRIS", label: "QRIS", img: "/image/qris.png" },
  { code: "BCA", label: "BCA", img: "/image/bca.png" },
  { code: "SEABANK", label: "SeaBank", img: "/image/seabank.png" },
] as const;

type MethodCode = (typeof PAY_METHODS)[number]["code"];

export default function ChoosePaymentPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MethodCode | "">("");
  const [orderID, setOrderID] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const total = useMemo(
    () => cart.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [cart]
  );

  useEffect(() => {
    (async () => {
      try {
        const me = await fetchJSON("/me", { cache: "no-store" });
        if (!me?.loggedIn) { router.push("/login"); return; }
        const res = await fetchJSON("/cart", { cache: "no-store" });
        setCart(res?.items ?? []);
      } catch {
        setCart([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleBuyNow() {
    if (cart.length === 0) return;
    if (!selected) { alert("Pilih metode pembayaran terlebih dahulu"); return; }

    setProcessing(true);
    try {
      // 1) Create order sekali saja
      let oid = orderID;
      if (!oid) {
        const res = await fetchJSON("/checkout/create-order", { method: "POST" });
        if (!res?.success) throw new Error("Gagal membuat order");
        oid = res.orderID as number;
        setOrderID(oid);
      }

      // 2) Simpan metode bayar
      const res2 = await fetchJSON(`/orders/${oid}/payment-method`, {
        method: "PUT",
        body: JSON.stringify({ method: selected }),
      });
      if (!res2?.success) throw new Error("Gagal menyimpan metode pembayaran");

      // 3) Ke summary
      router.push(`/checkout/summary/${oid}`);
    } catch (err: any) {
      alert(err?.message || "Terjadi kesalahan");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E1116] text-white">
      <Navbar />
      <main className="px-6 py-6">
        <div className="bg-[#152030] rounded-xl mx-auto p-6" style={{ width: "1100px" }}>
          <h1 className="text-2xl font-semibold mb-4">Payment Method</h1>

          {loading ? (
            <p>Loading…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-8">
              <div>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.cartID}
                      className="bg-[#24435D] rounded-xl p-4 flex items-center gap-4 w-[620px]"
                    >
                      <div className="w-28 h-16 rounded-lg overflow-hidden">
                        <img
                          src={resolveImg(item.image_url)}  // ← via /api/uploads/...
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 font-semibold">
                        {item.title} × {item.quantity}
                      </div>
                      <div className="bg-[#0E1116] rounded-full px-4 py-2 text-sm font-semibold">
                        Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="bg-[#203345] p-4 rounded-2xl space-y-3">
                {PAY_METHODS.map((m) => (
                  <button
                    key={m.code}
                    onClick={() => setSelected(m.code)}
                    className={`w-full rounded-xl px-3 py-3 flex items-center gap-3 ${
                      selected === m.code ? "ring-2 ring-[#7CC3FF]" : ""
                    }`}
                  >
                    <div className="relative w-[260px] h-[64px]">
                      <Image src={m.img} alt={m.label} fill className="object-contain rounded-md" />
                    </div>
                    <span
                      className={`ml-auto inline-block w-4 h-4 rounded-full border-2 ${
                        selected === m.code ? "bg-[#7CC3FF] border-[#7CC3FF]" : "border-white/50"
                      }`}
                    />
                  </button>
                ))}

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => router.push("/cart")}
                    className="flex-1 bg-[#2A3E54] hover:bg-[#314a64] rounded-xl px-4 py-3 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={processing || cart.length === 0}
                    className="flex-1 bg-[#7CC3FF] hover:bg-[#8fd0ff] text-black rounded-xl px-4 py-3 font-semibold disabled:opacity-50"
                  >
                    {processing ? "Processing…" : "Buy Now"}
                  </button>
                </div>

                <div className="pt-2 text-sm text-right opacity-80">
                  Total: <span className="font-semibold">Rp {total.toLocaleString("id-ID")}</span>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
