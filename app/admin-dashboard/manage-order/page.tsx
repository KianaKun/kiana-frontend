"use client";

import React, { useEffect, useState } from "react";
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
  key_code_masked?: string;
  key_code?: string;
  gameID: number;
  title: string;
};

type Panel = { loading: boolean; items: AssignedKey[]; error?: string; hidden?: boolean };
type Msg = { kind: "ok" | "err" | "warn"; text: string } | null;

function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Yes",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} aria-hidden />
      <div className="relative w-[95%] max-w-lg mx-auto">
        <div className="bg-[#0B1220] border border-white/10 rounded-lg p-5 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-white/80 mb-4">{message}</p>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 rounded bg-white/5 hover:bg-white/10" disabled={loading}>
              {cancelText}
            </button>
            <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white" disabled={loading}>
              {loading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toasts({ toasts, remove }: { toasts: { id: string; kind: "ok" | "err" | "warn"; text: string }[]; remove: (id: string) => void }) {
  return (
    <div className="fixed right-4 bottom-6 z-60 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded shadow-md text-sm max-w-sm break-words ${
            t.kind === "ok" ? "bg-green-700/90 text-white" : t.kind === "warn" ? "bg-yellow-600/95 text-black" : "bg-red-700/95 text-white"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>{t.text}</div>
            <button onClick={() => remove(t.id)} className="ml-3 font-bold">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ManageOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState<Msg>(null);
  const [panel, setPanel] = useState<Record<number, Panel>>({});
  const [confirmData, setConfirmData] = useState<{ id: number; action: "approved" | "rejected"; loading?: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<{ id: string; kind: "ok" | "err" | "warn"; text: string }[]>([]);

  const pushToast = (kind: "ok" | "err" | "warn", text: string, ttl = 4500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((s) => [...s, { id, kind, text }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), ttl);
  };

  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  const load = () =>
    fetchJSON(`${API}/admin/orders`, { credentials: "include" })
      .then((d) => setOrders(d.items || d))
      .catch((e: any) => {
        setMsg({ kind: "err", text: e.message });
        pushToast("err", e.message || "Gagal load orders");
      });

  useEffect(() => {
    load();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    return o.orderID.toString().includes(q) || (o.email && o.email.toLowerCase().includes(q));
  });

  // toggle panel and load keys (masked) if necessary
  const togglePanel = async (orderID: number) => {
    const cur = panel[orderID];
    if (cur && !cur.hidden) {
      setPanel((p) => ({ ...p, [orderID]: { ...cur, hidden: true } }));
      return;
    }
    if (cur && cur.items && cur.items.length > 0) {
      setPanel((p) => ({ ...p, [orderID]: { ...cur, hidden: false } }));
      return;
    }

    setPanel((p) => ({ ...p, [orderID]: { loading: true, items: [], error: undefined } }));
    try {
      const data = await fetchJSON(`${API}/admin/orders/${orderID}/keys`, { credentials: "include" });
      const items: AssignedKey[] = (data.items || data).map((it: any) => ({
        SteamkeyID: it.SteamkeyID,
        key_code_masked: it.key_code_masked || it.key_code || "••••••••",
        gameID: it.gameID,
        title: it.title,
      }));
      setPanel((p) => ({ ...p, [orderID]: { loading: false, items, hidden: false } }));
    } catch (e: any) {
      setPanel((p) => ({ ...p, [orderID]: { loading: false, items: [], error: e.message || "Gagal load keys", hidden: false } }));
      pushToast("err", e.message || "Gagal load keys");
    }
  };

  // reveal specific key -- kept but no UI button for reveal (per request)
  const revealKey = async (orderID: number, steamkeyID: number) => {
    setPanel((p) => {
      const cur = p[orderID];
      if (!cur) return p;
      return { ...p, [orderID]: { ...cur, loading: true } };
    });

    try {
      const res = await fetch(`${API}/admin/keys/${steamkeyID}/reveal`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Gagal reveal key");
      }
      const j = await res.json();
      const realKey = j.key_code;

      setPanel((p) => {
        const cur = p[orderID];
        if (!cur) return p;
        const items = cur.items.map((it) => (it.SteamkeyID === steamkeyID ? { ...it, key_code: realKey } : it));
        return { ...p, [orderID]: { ...cur, loading: false, items } };
      });

      pushToast("ok", "Key direveal");
    } catch (e: any) {
      setPanel((p) => {
        const cur = p[orderID];
        if (!cur) return p;
        return { ...p, [orderID]: { ...cur, loading: false, error: e.message } };
      });
      pushToast("err", e.message || "Gagal reveal key");
    }
  };

  // confirm flow
  const confirmAction = (orderID: number, action: "approved" | "rejected") => {
    setConfirmData({ id: orderID, action, loading: false });
  };

  const doAction = async (orderID: number, status: "approved" | "rejected") => {
    try {
      setConfirmData((c) => (c && c.id === orderID ? { ...c, loading: true } : c));
      const res = await fetch(`${API}/admin/orders/${orderID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (res.status === 409) {
        const j = await res.json().catch(() => ({}));
        const message = j.message || "Stock kurang";
        setMsg({ kind: "warn", text: message });
        pushToast("warn", message);
        setConfirmData(null);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Gagal update");
      }

      setOrders((prev) =>
        status === "rejected" ? prev.filter((o) => o.orderID !== orderID) : prev.map((o) => (o.orderID === orderID ? { ...o, status } : o))
      );

      const successText = `Order ${orderID} ${status === "approved" ? "approved" : "rejected"}`;
      setMsg({ kind: "ok", text: "Berhasil" });
      pushToast("ok", successText);
      setConfirmData(null);
    } catch (e: any) {
      setMsg({ kind: "err", text: e.message });
      pushToast("err", e.message || "Gagal melakukan aksi");
      setConfirmData(null);
    }
  };

  return (
    <AdminRoute>
      <AdminShell>
        <div className="w-full p-6 overflow-x-hidden">
          <div className="bg-[#152030] p-4 rounded-md mb-4">
            <h2 className="mb-3 font-medium">Manage Orders</h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="Cari berdasarkan Order ID atau Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-80 px-4 py-2 rounded bg-[#0E1116] text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button onClick={load} className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-600 text-white">
                  Refresh
                </button>
                <button onClick={() => setSearch("")} className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-white">
                  Clear
                </button>
              </div>
            </div>

            {msg && (
              <div
                className={`rounded px-4 py-2 text-sm ${
                  msg.kind === "ok" ? "bg-green-700/30 text-green-200" : msg.kind === "warn" ? "bg-yellow-700/30 text-yellow-200" : "bg-red-700/30 text-red-200"
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>

          <div className="rounded-md overflow-x-auto border border-white/10 bg-[#152030]">
            <table className="min-w-full text-sm w-full">
              <thead className="bg-[#0E1116] text-white/90">
                <tr>
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((o) => {
                    const p = panel[o.orderID];
                    return (
                      <React.Fragment key={o.orderID}>
                        <tr className="border-t border-white/10">
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
                            <div className="flex gap-2 items-center">
                              {o.status === "pending" ? (
                                <>
                                  <button className="px-3 py-2 rounded bg-green-700 hover:bg-green-600" onClick={() => confirmAction(o.orderID, "approved")}>
                                    Approve
                                  </button>
                                  <button className="px-3 py-2 rounded bg-red-700 hover:bg-red-600" onClick={() => confirmAction(o.orderID, "rejected")}>
                                    Reject
                                  </button>
                                  {/* Do NOT show Show Keys when pending */}
                                </>
                              ) : (
                                // Not pending: only show the Show Keys button (no "No action" text)
                                <button onClick={() => togglePanel(o.orderID)} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs">
                                  {p && !p.hidden ? "Hide Keys" : "Show Keys"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {p && !p.hidden && (
                          <tr className="bg-[#0B1220]">
                            <td colSpan={5} className="px-4 py-3">
                              {p.loading ? (
                                <div>Loading keys...</div>
                              ) : p.error ? (
                                <div className="text-red-300">Error: {p.error}</div>
                              ) : p.items.length === 0 ? (
                                <div className="text-white/70 italic">No keys assigned</div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {p.items.map((k) => (
                                    <div key={k.SteamkeyID} className="flex items-center justify-between border rounded p-3 bg-[#091016]">
                                      <div>
                                        <div className="text-sm font-medium">{k.title}</div>
                                        <div className="text-xs text-white/70 font-mono">
                                          {/* show only title + masked/or real key; no 'Hidden' text or extra label */}
                                          {k.key_code ? k.key_code : (k.key_code_masked ?? "")}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {k.key_code ? (
                                          <button className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm" onClick={() => navigator.clipboard.writeText(k.key_code || "").then(() => pushToast("ok", "Key copied"))}>
                                            Copy
                                          </button>
                                        ) : (
                                          // nothing shown when key not revealed
                                          null
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-white/70 italic">
                      Tidak ada hasil ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmModal
          open={!!confirmData}
          title={confirmData?.action === "rejected" ? "Konfirmasi Penolakan" : "Konfirmasi Approve"}
          message={
            confirmData?.action === "rejected"
              ? "Apakah Anda yakin ingin menolak order ini? Tindakan ini akan menghapus order dari daftar."
              : "Apakah Anda yakin ingin menyetujui order ini?"
          }
          confirmText={confirmData?.action === "rejected" ? "Reject" : "Approve"}
          loading={!!confirmData?.loading}
          onCancel={() => setConfirmData(null)}
          onConfirm={() => {
            if (!confirmData) return;
            doAction(confirmData.id, confirmData.action);
          }}
        />

        <Toasts toasts={toasts} remove={removeToast} />
      </AdminShell>
    </AdminRoute>
  );
}
