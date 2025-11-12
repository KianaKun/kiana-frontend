"use client";

import { useEffect, useState } from "react";
import AdminRoute from "@/components/admin-dashboard/AdminRoute";
import AdminShell from "@/components/admin-dashboard/AdminShell";
import { API, fetchJSON } from "@/components/admin-dashboard/Api";

type Order = {
  orderID: number;
  customerID: number;
  email?: string;
  order_date: string;
  status: "pending" | "approved" | "rejected";
};

type AssignedKey = {
  SteamkeyID: number;
  key_code: string;
  gameID: number;
  title: string;
};

type Panel = { loading: boolean; items: AssignedKey[]; error?: string; hidden?: boolean };
type Msg = { kind: "ok" | "err" | "warn"; text: string };

export default function ManageOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [panel, setPanel] = useState<Record<number, Panel>>({});
  const [confirmData, setConfirmData] = useState<{ id: number; action: "approved" | "rejected" } | null>(null);
  const [search, setSearch] = useState(""); // 🔍 search bar

  const load = () =>
    fetchJSON(`${API}/admin/orders`, { credentials: "include" })
      .then((d) => setOrders(d.items || d))
      .catch((e: any) => setMsg({ kind: "err", text: e.message }));

  useEffect(() => { load(); }, []);

  const filteredOrders = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    return (
      o.orderID.toString().includes(q) ||
      (o.email && o.email.toLowerCase().includes(q))
    );
  });

  const doAction = async (orderID: number, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`${API}/admin/orders/${orderID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (res.status === 409) {
        const j = await res.json();
        setMsg({ kind: "warn", text: j.message || "Stock kurang" });
        return;
      }
      if (!res.ok) throw new Error((await res.json()).message || "Gagal update");

      setOrders((prev) =>
        status === "rejected"
          ? prev.filter((o) => o.orderID !== orderID)
          : prev.map((o) =>
              o.orderID === orderID ? { ...o, status } : o
            )
      );

      setMsg({ kind: "ok", text: "Berhasil" });
    } catch (e: any) {
      setMsg({ kind: "err", text: e.message });
    }
  };

  return (
    <AdminRoute>
      <AdminShell>
        <div className="w-full p-6 overflow-x-hidden">
          <div className="bg-[#152030] p-4 rounded-md mb-4">
            <h2 className="mb-3 font-medium">Manage Orders</h2>

            {/* 🔍 Search bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="Cari berdasarkan Order ID atau Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-80 px-4 py-2 rounded bg-[#0E1116] text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={load}
                className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-600 text-white"
              >
                Refresh
              </button>
            </div>

            {msg && (
              <div
                className={`rounded px-4 py-2 text-sm ${
                  msg.kind === "ok"
                    ? "bg-green-700/30 text-green-200"
                    : msg.kind === "warn"
                    ? "bg-yellow-700/30 text-yellow-200"
                    : "bg-red-700/30 text-red-200"
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>

          {/* Table Orders */}
          <div className="rounded-md overflow-x-auto border border-white/10 bg-[#152030]">
            <table className="min-w-full text-sm w-full">
              <thead className="bg-[#0E1116] text-white/90">
                <tr>
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((o) => (
                    <tr key={o.orderID} className="border-t border-white/10">
                      <td className="px-4 py-3">{o.orderID}</td>
                      <td className="px-4 py-3 break-all">{o.email || "-"}</td>
                      <td className="px-4 py-3">
                        {new Date(o.order_date).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </td>
                      <td className="px-4 py-3 capitalize">{o.status}</td>
                      <td className="px-4 py-3">
                        {o.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-2 rounded bg-green-700 hover:bg-green-600"
                              onClick={() => doAction(o.orderID, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              className="px-3 py-2 rounded bg-red-700 hover:bg-red-600"
                              onClick={() => doAction(o.orderID, "rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">No action</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-4 text-white/70 italic"
                    >
                      Tidak ada hasil ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminShell>
    </AdminRoute>
  );
}
