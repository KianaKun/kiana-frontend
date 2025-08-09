"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

type User = {
  id: number;
  name: string;
  role: "admin" | "user";
} | null;

// ganti ke "/api/auth/me" jika pakai proxy Next.js
const AUTH_BASE = "http://localhost:5000";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User>(null);
  const { qty } = useCart?.() ?? { qty: 0 }; // aman kalau belum ada CartProvider

  const recheck = useCallback(() => {
    fetch(`${AUTH_BASE}/auth/me`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((u) => setUser(u ?? null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => { recheck(); }, [recheck, pathname]);     // recheck saat route berubah
  useEffect(() => {                                         // recheck saat tab fokus
    window.addEventListener("focus", recheck);
    return () => window.removeEventListener("focus", recheck);
  }, [recheck]);

  async function handleLogout() {
    try {
      await fetch(`${AUTH_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-[#152030]">
      {/* Logo */}
      <div className="flex items-center space-x-2 bg-[#0E1116] px-4 py-2 rounded-xl">
        <span className="text-xl">🔑</span>
        <span className="font-bold">KianaStore Key</span>
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center px-6">
        <input
          type="text"
          placeholder="Search Games"
          className="w-1/3 px-4 py-2 rounded-full bg-[#274056] text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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
              onClick={handleLogout}
              className="bg-red-600 px-4 py-2 rounded-sm hover:bg-red-700"
            >
              Logout
            </button>
          </>
        )}

        {user?.role === "admin" && (
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded-sm hover:bg-red-700"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
function useCart(): { qty: any; } {
    throw new Error("Function not implemented.");
}

