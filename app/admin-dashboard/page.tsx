"use client";

import { useEffect, useState } from "react";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/AdminShell";
import Navbar from "@/ui/Navbar";
import { API, fetchJSON } from "@/components/Api";

type DashData = {
  success: boolean;
  ordersToday: number;
  approvedToday: number;
  pendingOrders: number;
  visitorsToday: { guest: number; auth: number };
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const d = await fetchJSON(`${API}/admin/data`, { credentials: "include" });
      setData(d);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <AdminRoute>
      <Navbar />
      <AdminShell>
        <div className="w-full p-6">
          <div className="bg-[#152030] p-4 rounded-md mb-4">
            <h2 className="mb-2 font-medium">Dashboard</h2>
            {err && <div className="rounded px-4 py-2 bg-red-700/30 text-red-200 text-sm">{err}</div>}
          </div>

          {loading ? (
            <div className="text-gray-300">Loading…</div>
          ) : (
            data && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card label="Orders Today (WIB)" value={data.ordersToday} hint="Semua order dibuat hari ini" />
                  <Card label="Approved Today" value={data.approvedToday} hint="Order disetujui hari ini" />
                  <Card label="Pending Confirmation" value={data.pendingOrders} hint="Butuh tindakan di Manage Order" />
                  <Card
                    label="Visitors Today"
                    value={data.visitorsToday.guest + data.visitorsToday.auth}
                    hint={`Guest: ${data.visitorsToday.guest} • Logged-in: ${data.visitorsToday.auth}`}
                  />
                </div>

                <div className="mt-4">
                  <button
                    onClick={load}
                    className="px-4 py-2 rounded bg-[#274056] hover:bg-[#30506a]"
                  >
                    Refresh
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </AdminShell>
    </AdminRoute>
  );
}

function Card({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#152030] p-4">
      <div className="text-white/80 text-sm">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-white/60 mt-1">{hint}</div>}
    </div>
  );
}
