"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

type User = {
  id: number;
  email: string;
  role: "admin" | "user";
} | null;

const AUTH_BASE = "http://localhost:5000";

export default function Navbars() {
  const pathname = usePathname();
  const [user, setUser] = useState<User>(null);
  const [showConfirm, setShowConfirm] = useState(false); // state modal konfirmasi
  const { qty } = useCart?.() ?? { qty: 0 };

  const recheck = useCallback(() => {
    fetch(`${AUTH_BASE}/me`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.loggedIn) {
          setUser(null);
          return;
        }
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

  async function handleLogout() {
    try {
      await fetch(`${AUTH_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error", err);
    }
  }

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-4 bg-[#152030]">
        {/* Logo */}
        <div className="flex items-center space-x-2 bg-[#0E1116] px-4 py-2 rounded-xl text-white">
          <span className="text-xl">🔑</span>
          <span className="font-bold">KianaStore Key</span>
        </div>

        {/* Search (hanya untuk user biasa) */}
        {user?.role !== "admin" && (
          <div className="flex-1 flex justify-center px-6">
            <input
              type="text"
              placeholder="Search Games"
              className="w-1/3 px-4 py-2 rounded-full bg-[#274056] text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {!user && (
            <>
              <Link href="/register">
                <button className="bg-[#274056] px-4 py-2 rounded-sm hover:bg-[#30506a]">
                  Create account
                </button>
              </Link>
              <Link href="/login">
                <button className="bg-[#274056] px-4 py-2 rounded-sm hover:bg-[#30506a]">
                  Login
                </button>
              </Link>
            </>
          )}

          {user?.role === "user" && (
            <>
              <Link href="/cart" className="relative">
                <button className="bg-[#274056] px-4 py-2 rounded-sm hover:bg-[#30506a]">
                  Cart
                </button>
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

      {/* Popup konfirmasi logout */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#152030] p-6 rounded-lg text-center shadow-lg">
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
          </div>
        </div>
      )}
    </>
  );
}

function useCart(): { qty: number } {
  return { qty: 0 };
}
