"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { fetchJSON } from "@/components/Api";
import { AnimatePresence, motion } from "framer-motion";

type User = { id?: number; email: string; role: "admin" | "user" } | null;

export default function Navbars() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { qty } = useCart?.() ?? { qty: 0 };

  // === Toast state ===
  const [toast, setToast] = useState<{ open: boolean; type: "ok" | "err"; text: string }>({
    open: false,
    type: "ok",
    text: "",
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (type: "ok" | "err", text: string, delayClose = 1600) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ open: true, type, text });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, open: false })), delayClose);
  };

  // sinkronkan nilai input dengan ?q= di URL
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  useEffect(() => { setQ(searchParams.get("q") ?? ""); }, [searchParams]);

  const recheck = useCallback(() => {
    fetchJSON("/me", { cache: "no-store" })
      .then((data) => {
        if (!data.loggedIn) { setUser(null); return; }
        const mappedRole = data.user.role === "customer" ? "user" : data.user.role;
        setUser({ ...data.user, role: mappedRole });
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => { recheck(); }, [recheck, pathname]);
  useEffect(() => {
    window.addEventListener("focus", recheck);
    return () => window.removeEventListener("focus", recheck);
  }, [recheck]);

  // debounce push ?q=
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeQ = (val: string) => {
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const url = val ? `/?q=${encodeURIComponent(val)}` : "/";
      router.push(url);
    }, 300);
  };

  async function handleLogout() {
    try {
      const res = await fetchJSON("/logout", { method: "POST" });
      if (res?.success) {
        setShowConfirm(false);
        setUser(null);
        showToast("ok", "Berhasil logout");
        // beri 900ms supaya animasi toast sempat terlihat baru redirect
        setTimeout(() => { window.location.href = "/"; }, 900);
      } else {
        showToast("err", "Gagal logout");
      }
    } catch (err) {
      console.error("Logout error", err);
      showToast("err", "Gagal koneksi ke server");
    }
  }

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-4 bg-[#152030]">
        <div className="flex items-center space-x-2 bg-[#0E1116] px-4 py-2 rounded-xl text-white">
          <span className="text-xl">🔑</span>
          <span className="font-bold">KianaStore Key</span>
        </div>

        {user?.role !== "admin" && (
          <div className="flex-1 flex justify-center px-6">
            <input
              type="text"
              placeholder="Search Games"
              value={q}
              onChange={(e) => onChangeQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const url = q ? `/?q=${encodeURIComponent(q)}` : "/";
                  router.push(url);
                }
              }}
              className="w-1/3 px-4 py-2 rounded-full bg-[#274056] text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {!user && (
            <>
              <Link href="/register" className="bg-[#274056] px-4 py-2 rounded-sm hover:bg-[#30506a]">Create account</Link>
              <Link href="/login" className="bg-[#274056] px-4 py-2 rounded-sm hover:bg-[#30506a]">Login</Link>
            </>
          )}

          {user?.role === "user" && (
            <>
              <Link href="/cart" className="relative bg-[#274056] px-4 py-2 rounded-sm hover:bg-[#30506a]">
                Cart
                {qty > 0 && (
                  <span className="absolute -top-2 -right-2 text-xs bg-white text-[#0E1116] rounded-full px-2">
                    {qty}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setShowConfirm(true)}
                className="bg-red-600 px-4 py-2 rounded-sm hover:bg-red-700"
              >
                Logout
              </button>
            </>
          )}

          {user?.role === "admin" && (
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-red-600 px-4 py-2 rounded-sm hover:bg-red-700"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* Modal konfirmasi logout */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="bg-[#152030] border border-white/10 p-6 rounded-lg text-center shadow-2xl"
          >
            <p className="text-white mb-4">Anda yakin ingin logout?</p>
            <div className="flex justify-center gap-4">
              <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
                Ya
              </button>
              <button onClick={() => setShowConfirm(false)} className="bg-gray-500 px-4 py-2 rounded hover:bg-gray-600">
                Batal
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast logout */}
{/* Modal konfirmasi logout + animasi exit */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            key="logout-overlay"
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)} // klik backdrop = tutup dg animasi
          >
            <motion.div
              key="logout-dialog"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-[#152030] border border-white/10 p-6 rounded-lg text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()} // cegah close saat klik konten
            >
              <p className="text-white mb-4">Anda yakin ingin logout?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleLogout}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
                >
                  Ya
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="bg-gray-500 px-4 py-2 rounded hover:bg-gray-600"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function useCart(): { qty: number } {
  return { qty: 0 };
}
