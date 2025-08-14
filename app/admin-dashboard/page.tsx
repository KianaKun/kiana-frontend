"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/AdminShell";
import Navbar from "@/ui/Navbar";
import { API, fetchJSON } from "@/components/Api";
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

  // Optional: auto refresh
  const [auto, setAuto] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    setErr(null);
    setLoading(true);
    try {
      const d = await fetchJSON(`${API}/admin/data`, { credentials: "include", cache: "no-store" });
      setData(d);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (auto) {
      intervalRef.current = setInterval(() => load(), 15_000); // 15 detik
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [auto]);

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
      <Navbar />
      <AdminShell>
        <div className="w-full p-6">
          {/* Header */}
          <motion.div
            className="bg-[#152030] p-4 rounded-md mb-4 border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="mb-1 font-medium">Dashboard</h2>
                <p className="text-xs text-white/60">
                  Ringkasan singkat aktivitas hari ini (berdasarkan zona waktu WIB).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={load}
                  className="px-3 py-2 rounded bg-[#274056] hover:bg-[#30506a] text-sm"
                >
                  Refresh
                </button>
                <label className="flex items-center gap-2 text-xs text-white/80">
                  <input
                    type="checkbox"
                    checked={auto}
                    onChange={(e) => setAuto(e.target.checked)}
                    className="accent-[#30506a]"
                  />
                  Auto 15s
                </label>
              </div>
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
                  <div key={i} className="rounded-md border border-white/10 bg-[#152030] p-4 animate-pulse">
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
                    icon={
                      <CircleIcon className="text-blue-300" />
                    }
                  />
                  <Card
                    label="Approved Today"
                    value={data.approvedToday}
                    hint="Order disetujui hari ini"
                    icon={<CheckIcon className="text-emerald-300" />}
                  />
                  <Card
                    label="Pending Confirmation"
                    value={data.pendingOrders}
                    hint="Butuh tindakan di Manage Order"
                    icon={<ClockIcon className="text-yellow-300" />}
                  />
                  <Card
                    label="Visitors Today"
                    value={data.visitorsToday.guest + data.visitorsToday.auth}
                    hint={`Guest: ${data.visitorsToday.guest} • Logged-in: ${data.visitorsToday.auth}`}
                    icon={<UsersIcon className="text-purple-300" />}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-white/60">
                  <div>
                    Sumber data realtime dari endpoint: <code className="bg-[#0E1116] px-1 py-0.5 rounded">/admin/data</code>
                  </div>
                  <div>{nowText}</div>
                </div>
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

/* ---- Kartu metrik dengan ikon & hiasan halus ---- */
function Card({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-md border border-white/10 bg-[#152030] p-4">
      {/* corner accent */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/5" />
      <div className="flex items-start justify-between">
        <div className="text-white/80 text-sm">{label}</div>
        {icon && <div className="ml-2">{icon}</div>}
      </div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-white/60 mt-1">{hint}</div>}
    </div>
  );
}

/* ---- Ikon kecil (tanpa library tambahan) ---- */
function CircleIcon({ className = "" }: { className?: string }) {
  return <div className={`h-5 w-5 rounded-full border-2 border-current ${className}`} />;
}
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </svg>
  );
}
function UsersIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
