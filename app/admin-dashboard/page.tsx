"use client";

import { useEffect, useMemo, useState } from "react";
import AdminRoute from "@/components/admin-dashboard/AdminRoute";
import AdminShell from "@/components/admin-dashboard/AdminShell";
import { API, fetchJSON } from "@/components/admin-dashboard/Api";
import { AnimatePresence, motion } from "framer-motion";

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

  // 🔄 Auto-refresh tiap 15 detik
  useEffect(() => {
    const load = async () => {
      setErr(null);
      setLoading(true);
      try {
        const d = await fetchJSON(`${API}/admin/data`, {
          credentials: "include",
          cache: "no-store",
        });
        setData(d);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    load(); // first load
    const interval = setInterval(load, 15000); // auto reload every 15s
    return () => clearInterval(interval); // cleanup interval
  }, []);

  const nowText = useMemo(
    () =>
      new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) + " WIB",
    [data, loading]
  );

  return (
    <AdminRoute>
      <AdminShell>
        <div className="w-full p-4 sm:p-6">
          {/* Header */}
          <motion.div
            className="bg-[#152030] p-4 rounded-md mb-4 border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-white mb-1">
                  Dashboard
                </h2>
                <p className="text-xs text-white/60">
                  Ringkasan aktivitas hari ini (zona waktu WIB)
                </p>
              </div>
              <div className="text-xs sm:text-sm text-white/60">{nowText}</div>
            </div>

            {err && (
              <div className="mt-3 rounded px-4 py-2 bg-red-700/30 text-red-200 text-sm">
                {err}
              </div>
            )}
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-white/10 bg-[#152030] p-4 animate-pulse"
                  >
                    <div className="h-3 w-24 bg-white/10 rounded" />
                    <div className="h-8 w-16 bg-white/10 rounded mt-3" />
                    <div className="h-3 w-32 bg-white/10 rounded mt-2" />
                  </div>
                ))}
              </motion.div>
            ) : data ? (
              <motion.div
                key="cards"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card
                    label="Orders Today (WIB)"
                    value={data.ordersToday}
                    hint="Semua order dibuat hari ini"
                    color="text-blue-300"
                  />
                  <Card
                    label="Approved Today"
                    value={data.approvedToday}
                    hint="Order disetujui hari ini"
                    color="text-emerald-300"
                  />
                  <Card
                    label="Pending Confirmation"
                    value={data.pendingOrders}
                    hint="Butuh tindakan di Manage Order"
                    color="text-yellow-300"
                  />
                  <Card
                    label="Visitors Today"
                    value={
                      data.visitorsToday.guest + data.visitorsToday.auth
                    }
                    hint={`Guest: ${data.visitorsToday.guest} • Logged-in: ${data.visitorsToday.auth}`}
                    color="text-purple-300"
                  />
                </div>

                <p className="text-xs text-white/50 text-center mt-2">
                  Auto-refresh setiap 15 detik
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-md border border-white/10 bg-[#152030] p-6 text-center text-white/70"
              >
                Data tidak tersedia.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AdminShell>
    </AdminRoute>
  );
}

/* ---- Card komponen ---- */
function Card({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: number | string;
  hint?: string;
  color?: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative overflow-hidden rounded-md border border-white/10 bg-[#152030] p-4"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/5" />
      <div className="flex items-start justify-between">
        <div className="text-white/80 text-sm">{label}</div>
        <div className={`ml-2 h-5 w-5 rounded-full border-2 ${color}`} />
      </div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-white/60 mt-1">{hint}</div>}
    </motion.div>
  );
}
