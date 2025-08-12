"use client";

import { useEffect, useState } from "react";
import Navbar from "@/ui/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";


type CartItem = {
  cartID: number;
  quantity: number;
  gameID: number;
  title: string;
  price: number;
  image_url?: string | null;
};

function resolveImg(src?: string | null) {
  if (!src) return "/placeholder.png";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads")) return `http://localhost:5000${src}`;
  return src;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isEmpty = cart.length === 0;
  const router = useRouter();

  const loadCart = () => {
    fetch("http://localhost:5000/cart", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setCart(data.items || []);
        setLoading(false);
      });
  };

  const updateQuantity = (cartID: number, qty: number) => {
    fetch(`http://localhost:5000/cart/${cartID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ quantity: qty }),
    }).then(() => loadCart());
  };

  const removeItem = (cartID: number) => {
    fetch(`http://localhost:5000/cart/${cartID}`, {
      method: "DELETE",
      credentials: "include",
    }).then(() => loadCart());
  };

  useEffect(() => {
    loadCart();
  }, []);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0E1116] text-white">
      <Navbar />
      <main className="p-6 mt-4 mx-6 rounded-md bg-[#152030] max-w-[1100px] mx-auto flex flex-col md:flex-row gap-8">
        {loading ? (
          <p>Loading cart...</p>
        ) : (
          <>
            {/* Left: Items */}
            <div className="flex-1 flex flex-col gap-4">
              {cart.map((item) => (
                <div key={item.cartID} className="bg-[#0E1116] rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <img src={resolveImg(item.image_url)} alt={item.title} className="w-20 h-12 rounded" />
                    <div>
                      <p>{item.title}</p>
                      <p className="text-sm text-gray-400">Total Item : {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="bg-green-600 px-2 rounded"
                      onClick={() => updateQuantity(item.cartID, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      className="bg-red-600 px-2 rounded"
                      onClick={() => {
                        if (item.quantity > 1) updateQuantity(item.cartID, item.quantity - 1);
                        else removeItem(item.cartID);
                      }}
                    >
                      -
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Total */}
            <div className="w-full md:w-[300px] bg-[#0E1116] p-4 rounded-lg flex flex-col gap-4">
              <div>
                <p>Total Harga Item</p>
                <p className="text-lg font-semibold">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
              >
                Return To Store
              </button>
              <button onClick={() => !isEmpty && router.push("/checkout/payment")}
                disabled={isEmpty}
                className={`px-4 py-2 rounded font-semibold ${
                  isEmpty
                    ? "bg-blue-600/50 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                aria-disabled={isEmpty}
                title={isEmpty ? "Cart kosong" : ""}
              >
                Do Payment Now
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
