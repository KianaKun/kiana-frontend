"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/AdminShell";
import Navbar from "@/ui/Navbar";
import { API, fetchJSON } from "@/components/Api";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCcw, Settings } from "lucide-react";

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

  const [auto, setAuto] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (auto) {
      intervalRef.current = setInterval(() => load(), 15_000);
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

              {/* Tombol tindakan */}
              <div className="relative">
                {/* Desktop */}
                <div className="hidden sm:flex items-center gap-3">
                  <button
                    onClick={load}
                    className="flex items-center gap-2 px-3 py-2 rounded bg-[#274056] hover:bg-[#30506a] text-sm"
                  >
                    <RefreshCcw className="w-4 h-4" /> Refresh
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

                {/* Mobile menu */}
                <div className="sm:hidden relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded bg-[#274056] hover:bg-[#30506a]"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Menu</span>
                  </button>

                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-2 w-40 rounded-md bg-[#1b2838] border border-white/10 shadow-lg z-10 p-2"
                      >
                        <button
                          onClick={() => {
                            load();
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm rounded hover:bg-[#274056]"
                        >
                          🔄 Refresh Data
                        </button>
                        <label className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#274056] rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={auto}
                            onChange={(e) => setAuto(e.target.checked)}
                            className="accent-[#30506a]"
                          />
                          Auto Refresh
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
    <div className="relative overflow-hidden rounded-md border border-white/10 bg-[#152030] p-4">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/5" />
      <div className="flex items-start justify-between">
        <div className="text-white/80 text-sm">{label}</div>
        <div className={`ml-2 h-5 w-5 rounded-full border-2 ${color}`} />
      </div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-white/60 mt-1">{hint}</div>}
    </div>
  );
}
