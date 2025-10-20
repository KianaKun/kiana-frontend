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
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false, message: "", type: "success"
  });

  const load = () =>
    fetchJSON(`${API}/admin/orders`, { credentials: "include" })
      .then((d) => setOrders(d.items || d))
      .catch((e: any) => setMsg({ kind: "err", text: e.message }));

  useEffect(() => { load(); }, []);

  const viewKeys = async (orderID: number) => {
    setPanel((p) => ({ ...p, [orderID]: { loading: true, items: [] } }));
    try {
      const r = await fetchJSON(`${API}/admin/orders/${orderID}/keys`, { credentials: "include" });
      setPanel((p) => ({ ...p, [orderID]: { loading: false, items: r.items || [] } }));
    } catch (e: any) {
      setPanel((p) => ({ ...p, [orderID]: { loading: false, items: [], error: e.message } }));
    }
  };

  const toggleKeys = (orderID: number) => {
    const p = panel[orderID];
    if (p && !p.hidden) {
      setPanel((s) => ({ ...s, [orderID]: { ...p, hidden: true } }));
    } else {
      const updated = { ...panel };
      Object.keys(updated).forEach((key) => {
        const id = parseInt(key);
        if (id !== orderID && updated[id]) {
          updated[id] = { ...updated[id], hidden: true };
        }
      });
      if (!p) {
        setPanel(updated);
        viewKeys(orderID);
      } else {
        updated[orderID] = { ...p, hidden: false };
        setPanel(updated);
      }
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const copyKey = async (keyCode: string, event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      await navigator.clipboard.writeText(keyCode);
      const btn = event.currentTarget;
      const original = btn.textContent;
      btn.textContent = "Copied!";
      btn.classList.add("text-green-400");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("text-green-400");
      }, 2000);
      showToast("Steam key berhasil disalin!");
    } catch {
      showToast("Gagal menyalin, copy manual.", "error");
    }
  };

  const doAction = async (orderID: number, status: "approved" | "rejected") => {
    setMsg(null);
    try {
      const res = await fetch(`${API}/admin/orders/${orderID}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ status })
      });

      if (res.status === 409) {
        const j = await res.json();
        setMsg({ kind: "warn", text: j.message || "Stock kurang" });
        return;
      }
      if (!res.ok) throw new Error((await res.json()).message || "Gagal update");

      if (status === "rejected") {
        setOrders((prev) => prev.filter((o) => o.orderID !== orderID));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.orderID === orderID ? { ...o, status } : o))
        );
      }
      setMsg({ kind: "ok", text: "Berhasil" });
    } catch (e: any) {
      setMsg({ kind: "err", text: e.message });
    }
  };

  const confirmAction = () => {
    if (confirmData) {
      doAction(confirmData.id, confirmData.action);
      setConfirmData(null);
    }
  };

  return (
    <AdminRoute>
      <Navbar />
      <AdminShell>
        <div className="w-full p-6 overflow-x-hidden">
          <div className="bg-[#152030] p-4 rounded-md mb-4">
            <h2 className="mb-3 font-medium">Manage Orders</h2>
            {msg && (
              <div className={`rounded px-4 py-2 text-sm ${
                msg.kind === "ok" ? "bg-green-700/30 text-green-200" :
                msg.kind === "warn" ? "bg-yellow-700/30 text-yellow-200" :
                "bg-red-700/30 text-red-200"
              }`}>
                {msg.text}
              </div>
            )}
          </div>

          {/* TABEL - aman di mobile */}
          <div className="rounded-md overflow-x-auto border border-white/10 bg-[#152030]">
            <table className="min-w-full text-sm w-full">
              <thead className="bg-[#0E1116] text-white/90">
                <tr>
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const p = panel[o.orderID];
                  const isShown = p && !p.hidden;
                  return (
                    <tr key={o.orderID} className="border-t border-white/10">
                      <td className="px-4 py-3">{o.orderID}</td>
                      <td className="px-4 py-3 break-all">{o.email || "-"}</td>
                      <td className="px-4 py-3">
                        {new Date(o.order_date).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })} WIB
                      </td>
                      <td className="px-4 py-3 capitalize">{o.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {o.status === "pending" && (
                            <>
                              <button
                                className="px-4 py-2 rounded bg-[#274056] hover:bg-[#30506a]"
                                onClick={() => setConfirmData({ id: o.orderID, action: "approved" })}
                              >
                                Approve
                              </button>
                              <button
                                className="px-4 py-2 rounded bg-red-700 hover:bg-red-600"
                                onClick={() => setConfirmData({ id: o.orderID, action: "rejected" })}
                              >
                                Decline
                              </button>
                            </>
                          )}
                          <button
                            className="px-4 py-2 rounded bg-[#274056] hover:bg-[#30506a]"
                            onClick={() => toggleKeys(o.orderID)}
                          >
                            {isShown ? "Sembunyikan Key" : "Tampilkan Key"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PANEL KEYS */}
          {orders.map((o) => {
            const p = panel[o.orderID];
            if (!p || p.hidden) return null;
            return (
              <div key={`panel-${o.orderID}`} className="mt-3 rounded-md border border-white/10 bg-[#152030] p-4 overflow-x-hidden">
                <h3 className="font-medium mb-2">Keys for Order #{o.orderID}</h3>
                {p.loading && <div className="text-blue-200">Loading…</div>}
                {!p.loading && p.error && <div className="text-red-300">{p.error}</div>}
                {!p.loading && !p.error && p.items.length === 0 && (
                  <div className="text-yellow-200">Tidak ada key yang ter-assign.</div>
                )}
                {p.items.length > 0 && (
                  <ul className="text-sm space-y-2">
                    {p.items.map((k) => (
                      <li key={k.SteamkeyID} className="flex items-center justify-between bg-black/20 rounded p-2">
                        <div className="font-mono flex-1 break-all">
                          <span className="text-green-300 font-medium">{k.key_code}</span>
                          <span className="opacity-70 ml-2">— {k.title} (#{k.SteamkeyID})</span>
                        </div>
                        <button
                          onClick={(e) => copyKey(k.key_code, e)}
                          className="ml-3 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                        >
                          Copy
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* TOAST */}
        {toast.show && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
            <div className={`px-4 py-3 rounded-md shadow-lg ${
              toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}>
              {toast.message}
            </div>
          </div>
        )}

        {/* CONFIRM MODAL */}
        {confirmData && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#152030] p-6 rounded-md max-w-sm w-full">
              <p className="mb-4">
                Yakin ingin {confirmData.action === "approved" ? "approve" : "decline"} order #{confirmData.id}?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded bg-[#274056] hover:bg-[#30506a]"
                  onClick={() => setConfirmData(null)}
                >
                  Batal
                </button>
                <button
                  className={`px-4 py-2 rounded ${
                    confirmData.action === "approved"
                      ? "bg-green-700 hover:bg-green-600"
                      : "bg-red-700 hover:bg-red-600"
                  }`}
                  onClick={confirmAction}
                >
                  Ya
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminShell>
    </AdminRoute>
  );
}
