"use client";

import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/AdminShell";
import { useEffect, useState } from "react";
import { API, fetchJSON } from "@/components/Api";

type AdminStats = {
  totalPurchase: number;
  totalVisitors: number;
  needConfirm: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchJSON(`${API}/admin/data`)
      .then((d) => setStats(d))
      .catch((e: any) => setMsg(e.message || "Failed to load"));
  }, []);

  return (
    <AdminRoute>
      <AdminShell>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-[#152030] rounded-md p-4">
            <div className="opacity-80 text-sm">Total Purchase</div>
            <div className="text-2xl font-semibold mt-2">{stats?.totalPurchase ?? "-"}</div>
          </div>
          <div className="bg-[#152030] rounded-md p-4">
            <div className="opacity-80 text-sm">Visitors</div>
            <div className="text-2xl font-semibold mt-2">{stats?.totalVisitors ?? "-"}</div>
          </div>
          <div className="bg-[#152030] rounded-md p-4">
            <div className="opacity-80 text-sm">Need Confirmation</div>
            <div className="text-2xl font-semibold mt-2">{stats?.needConfirm ?? "-"}</div>
          </div>
        </div>
        {msg && <p className="mt-4 text-sm">{msg}</p>}
      </AdminShell>
    </AdminRoute>
  );
}
