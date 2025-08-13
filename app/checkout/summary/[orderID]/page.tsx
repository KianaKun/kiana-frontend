"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/ui/Navbar";
import { fetchJSON, resolveImg } from "@/components/Api";

export default function OrderSummaryPage() {
  const params = useParams();
  const orderID = Array.isArray(params?.orderID) ? params.orderID[0] : (params?.orderID as string);
  const router = useRouter();

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
      } catch (e) {
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

  return (
    <div className="min-h-screen bg-[#0E1116] text-white">
      <Navbar />
      <main className="px-6 py-6">
        <div className="bg-[#152030] rounded-xl mx-auto p-6" style={{ width: "900px" }}>
          <h1 className="text-2xl font-semibold mb-4">Order Summary</h1>

          {/* Items */}
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.orderItemID} className="flex items-center gap-4 bg-[#24435D] p-4 rounded-lg">
                <img src={resolveImg(item.image_url)} alt={item.title} className="w-24 h-16 object-cover rounded" />
                <div className="flex-1">{item.title}</div>
                <div>{item.quantity}x</div>
                <div>Rp {item.price.toLocaleString("id-ID")}</div>
              </div>
            ))}
          </div>

          {/* Payment Info */}
          <div className="bg-[#203345] p-4 rounded-lg mb-6">
            <p>
              <strong>Order ID:</strong>{" "}
              <span className="cursor-pointer text-blue-400 hover:underline" onClick={copyOrderID}>
                {order.orderID}
              </span>
            </p>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Total:</strong> Rp {order.total_price.toLocaleString("id-ID")}</p>
            <p><strong>Payment Method:</strong> {order.payment_method || "-"}</p>

            {order.payment_method === "QRIS" && (
              <div className="mt-4">
                <p>Scan QRIS berikut untuk membayar:</p>
                <img src="/image/qris_dynamic.jpg" alt="QRIS" className="w-60 mt-2" />
              </div>
            )}
            {order.payment_method === "BCA" && (
              <div className="mt-4">
                <p>Transfer ke rekening BCA berikut:</p>
                <p className="text-lg font-bold">1234567890 a.n. PT Kiana Store</p>
              </div>
            )}
            {order.payment_method === "SEABANK" && (
              <div className="mt-4">
                <p>Transfer ke rekening SeaBank berikut:</p>
                <p className="text-lg font-bold">9876543210 a.n. PT Kiana Store</p>
              </div>
            )}

            <button onClick={contactWhatsApp} className="mt-4 bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-semibold w-full">
              Hubungi via WhatsApp
            </button>
          </div>

          <button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold">
            Return to Store
          </button>
        </div>
      </main>
    </div>
  );
}
