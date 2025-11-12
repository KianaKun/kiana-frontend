"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { fetchJSON, resolveImg } from "@/components/admin-dashboard/Api";

export default function OrderSummaryPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  let orderID = Array.isArray(params?.orderID) ? params.orderID[0] : (params?.orderID as string | undefined);
  if (!orderID) {
    const fromQuery = search.get("orderId") || search.get("orderID");
    if (fromQuery) orderID = fromQuery;
  }

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderID) return;
    (async () => {
      try {
        const res = await fetchJSON(`/orders/${orderID}`, { cache: "no-store" });
        if (!res?.success) {
          alert(res?.message || "Order tidak ditemukan");
          router.push("/");
          return;
        }
        setOrder(res.order);
        setItems(res.items || []);
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderID, router]);

  if (!orderID) return <div className="text-white p-6">Menunggu orderID…</div>;
  if (loading) return <div className="text-white p-6">Loading…</div>;

  function copyOrderID() {
    navigator.clipboard.writeText(order.orderID.toString());
    alert("Order ID berhasil disalin!");
  }

  function contactWhatsApp() {
    const message = encodeURIComponent(`Halo, saya ingin konfirmasi pesanan dengan Order ID: ${order.orderID}`);
    window.open(`https://wa.me/6281234567890?text=${message}`, "_blank");
  }

  const payLogos: Record<string, string> = {
    QRIS: "/image/qris.png",
    BCA: "/image/bca.png",
    SEABANK: "/image/seabank.png",
  };

  return (
    <div className="min-h-screen bg-[#0E1116] text-white">
      <main className="px-6 py-8 flex justify-center">
        <div className="w-full max-w-4xl space-y-6">
          {/* Title */}
          <h1 className="text-3xl font-bold border-b border-white/10 pb-4">Order Summary</h1>

          {/* Items List */}
          <div className="bg-[#152030] rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b border-white/10 pb-2">Items</h2>
            {items.map((item) => (
              <div
                key={item.orderItemID}
                className="flex items-center gap-4 bg-[#1B2A3A] p-4 rounded-lg hover:bg-[#213245] transition"
              >
                <img
                  src={item.image_url ? resolveImg(item.image_url) : "/placeholder.png"}
                  alt={item.title}
                  className="w-24 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-400">x{item.quantity}</div>
                </div>
                <div className="text-right font-semibold">
                  Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                </div>
              </div>
            ))}
          </div>

          {/* Payment Info */}
          <div className="bg-[#152030] rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b border-white/10 pb-2">Payment Information</h2>

            <div className="flex items-center justify-between">
              <span className="font-medium">Order ID:</span>
              <span
                className="cursor-pointer text-blue-400 hover:underline"
                onClick={copyOrderID}
              >
                {order.orderID}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <span className="capitalize">{order.status}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold">Rp {order.total_price.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Payment Method:</span>
              <div className="flex items-center gap-2">
                {payLogos[order.payment_method] && (
                  <img
                    src={payLogos[order.payment_method]}
                    alt={order.payment_method}
                    className="w-10 h-auto object-contain rounded bg-white p-1"
                  />
                )}
                <span>{order.payment_method || "-"}</span>
              </div>
            </div>

            {/* Extra payment details */}
            {order.payment_method === "QRIS" && (
              <div className="mt-4 text-center">
                <p className="mb-2">Scan QRIS berikut untuk membayar:</p>
                <img src="/image/qris_dynamic.jpg" alt="QRIS" className="w-60 mx-auto rounded" />
              </div>
            )}
            {order.payment_method === "BCA" && (
              <div className="mt-4 text-center">
                <p>Transfer ke rekening BCA berikut:</p>
                <p className="text-lg font-bold">1234567890 a.n. PT Kiana Store</p>
              </div>
            )}
            {order.payment_method === "SEABANK" && (
              <div className="mt-4 text-center">
                <p>Transfer ke rekening SeaBank berikut:</p>
                <p className="text-lg font-bold">9876543210 a.n. PT Kiana Store</p>
              </div>
            )}

            <button
              onClick={contactWhatsApp}
              className="mt-6 w-full bg-green-500 hover:bg-green-600 px-4 py-3 rounded font-semibold transition"
            >
              Hubungi via WhatsApp
            </button>
          </div>

          {/* Return Button */}
          <div className="flex justify-end">
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold transition"
            >
              Return to Store
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
