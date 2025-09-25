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
    const isCurrentlyShown = p && !p.hidden;
    
    if (isCurrentlyShown) {
      // If this panel is currently shown, hide it
      setPanel((s) => ({ ...s, [orderID]: { ...p, hidden: true } }));
    } else {
      // Hide all other panels first
      const updatedPanels = { ...panel };
      Object.keys(updatedPanels).forEach(key => {
        const panelKey = parseInt(key);
        if (updatedPanels[panelKey] && panelKey !== orderID) {
          updatedPanels[panelKey] = { ...updatedPanels[panelKey], hidden: true };
        }
      });
      
      // Then show the requested panel
      if (!p) {
        // If panel doesn't exist, load the keys
        setPanel(updatedPanels);
        viewKeys(orderID);
      } else {
        // If panel exists, just show it
        updatedPanels[orderID] = { ...p, hidden: false };
        setPanel(updatedPanels);
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
      // Visual feedback
      const btn = event.currentTarget;
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('text-green-400');
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('text-green-400');
      }, 2000);
      
      // Show success toast
      showToast('Steam key berhasil disalin ke clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      try {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = keyCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show success toast for fallback method
        showToast('Steam key berhasil disalin ke clipboard!');
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
        showToast('Gagal menyalin steam key. Silakan copy manual.', 'error');
      }
    }
  };

  const doAction = async (orderID: number, status: "approved" | "rejected") => {
    setMsg(null);
    try {
      const res = await fetch(`${API}/admin/orders/${orderID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (res.status === 409) {
        const j = await res.json();
        setMsg({ kind: "warn", text: j.message || "Stock habis / kurang" });
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Gagal set status ${status}`);
      }

      const j = await res.json();
      setMsg({ kind: "ok", text: j.message || "OK" });

      if (status === "rejected") {
        setOrders((prev) => prev.filter((o) => o.orderID !== orderID));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.orderID === orderID ? { ...o, status } : o))
        );
      }
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
        <div className="w-full p-6">
          <div className="bg-[#152030] p-4 rounded-md mb-4">
            <h2 className="mb-3 font-medium">Manage Orders</h2>
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

          <div className="rounded-md overflow-x-auto border border-white/10 bg-[#152030]">
            <table className="min-w-full text-sm">
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
                      <td className="px-4 py-3">{o.email || "-"}</td>
                      <td className="px-4 py-3">
                        {new Date(o.order_date).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
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

          {/* Key panels */}
          {orders.map((o) => {
            const p = panel[o.orderID];
            if (!p || p.hidden) return null;
            return (
              <div key={`panel-${o.orderID}`} className="mt-3 rounded-md border border-white/10 bg-[#152030] p-4">
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
                        <div className="font-mono flex-1">
                          <span className="text-green-300 font-medium">{k.key_code}</span>
                          <span className="opacity-70 ml-2">— {k.title} (#{k.SteamkeyID})</span>
                        </div>
                        <button
                          onClick={(e) => copyKey(k.key_code, e)}
                          className="ml-3 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                          </svg>
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

        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className={`px-4 py-3 rounded-md shadow-lg ${
              toast.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              <div className="flex items-center gap-2">
                {toast.type === 'success' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                )}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
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
                  className={`px-4 py-2 rounded ${confirmData.action === "approved" ? "bg-green-700 hover:bg-green-600" : "bg-red-700 hover:bg-red-600"}`}
                  onClick={confirmAction}
                >
                  Ya, {confirmData.action === "approved" ? "Approve" : "Decline"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminShell>
    </AdminRoute>
  );
}