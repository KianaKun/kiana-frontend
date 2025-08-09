"use client";

import { useEffect, useState } from "react";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/AdminShell";
import { API, fetchJSON } from "@/components/Api";
import Navbar from "@/ui/Navbar";

type Order = {
  orderID: number;
  customerID: number;
  email?: string;
  order_date: string; // keep string from backend (hindari hydration mismatch)
  status: "pending" | "approved" | "rejected";
};

export default function ManageOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");

  const load = () =>
    fetchJSON(`${API}/admin/orders`)
      .then((d) => setOrders(d.items || d))
      .catch((e: any) => setMsg(e.message));

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: number, status: Order["status"]) => {
    try {
      await fetchJSON(`${API}/admin/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setMsg(`Order ${id} → ${status}`);
      load();
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <AdminRoute>
      <Navbar />
      <AdminShell>
        <div className="bg-[#152030] p-4 rounded-md">
          <h2 className="mb-3 font-medium">Orders</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-300">
                <th className="p-2">Order ID</th>
                <th className="p-2">Email</th>
                <th className="p-2">Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderID} className="border-t border-[#0E1116]">
                  <td className="p-2">{o.orderID}</td>
                  <td className="p-2">{o.email || o.customerID}</td>
                  <td className="p-2">{o.order_date}</td>
                  <td className="p-2">{o.status}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => setStatus(o.orderID, "approved")} className="bg-green-700 px-3 py-1 rounded">
                      Approve
                    </button>
                    <button onClick={() => setStatus(o.orderID, "rejected")} className="bg-red-700 px-3 py-1 rounded">
                      Decline
                    </button>
                    <button onClick={() => setStatus(o.orderID, "pending")} className="bg-[#274056] px-3 py-1 rounded">
                      Set Pending
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td className="p-2 text-sm text-gray-300" colSpan={5}>
                    No orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {msg && <p className="mt-3 text-sm">{msg}</p>}
        </div>
      </AdminShell>
    </AdminRoute>
  );
}
