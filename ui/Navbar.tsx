"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

type User = {
  id: number;
  email: string;
  role: "admin" | "user";
} | null;

const AUTH_BASE = "http://localhost:5000";

export default function Navbars() {
  const pathname = usePathname();
  const [user, setUser] = useState<User>(null);
  const { qty } = useCart?.() ?? { qty: 0 }; // Aman kalau belum ada CartProvider

  // Cek session dari backend
  const recheck = useCallback(() => {
    fetch(`${AUTH_BASE}/me`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.loggedIn) {
          setUser(null);
          return;
        }
        // Convert "customer" ke "user" biar konsisten
        const mappedRole = data.user.role === "customer" ? "user" : data.user.role;
        setUser({ ...data.user, role: mappedRole });
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    recheck();
  }, [recheck, pathname]);

  useEffect(() => {
    window.addEventListener("focus", recheck);
    return () => window.removeEventListener("focus", recheck);
  }, [recheck]);

  // Logout handler
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
    <nav className="flex items-center justify-between px-6 py-4 bg-[#152030]">
      {/* Logo */}
      <div className="flex items-center space-x-2 bg-[#0E1116] px-4 py-2 rounded-xl text-white">
        <span className="text-xl">🔑</span>
        <span className="font-bold">KianaStore Key</span>
      </div>

        {/* Right side */}
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
        {/* Belum login */}
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

        {/* User login */}
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

        {/* Admin login */}
        {user?.role === "admin" && (
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded-sm hover:bg-red-700"
          >
            Logout
          </button>
        )}

        {/* Search */}


      </div>
    </nav>
  );
}

// Dummy hook biar tidak error saat belum ada CartProvider
function useCart(): { qty: number } {
  return { qty: 0 };
}
