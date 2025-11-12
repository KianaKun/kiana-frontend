"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const items = [
    { label: "Dashboard", href: "/admin-dashboard" },
    { label: "Manage Games", href: "/admin-dashboard/manage-games" },
    { label: "Manage Steamkey", href: "/admin-dashboard/manage-steamkey" },
    { label: "Manage Order", href: "/admin-dashboard/manage-order" },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin-dashboard" && pathname.startsWith(href));

  return (
    <div className="min-h-screen w-full bg-[#0E1116] text-white flex flex-col md:flex-row pt-14 md:pt-0 overflow-x-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-[#152030] flex-col items-center py-6 space-y-4">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`w-40 text-center py-2 rounded-full transition ${
              isActive(it.href)
                ? "bg-white text-black font-semibold"
                : "bg-[#274056] text-white hover:bg-[#30506a]"
            }`}
          >
            {it.label}
          </Link>
        ))}
      </aside>

      {/* Sidebar Mobile */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#152030] flex flex-col items-center py-6 space-y-4 z-50 transform transition-transform md:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => setIsOpen(false)}
            className={`w-40 text-center py-2 rounded-full transition ${
              isActive(it.href)
                ? "bg-white text-black font-semibold"
                : "bg-[#274056] text-white hover:bg-[#30506a]"
            }`}
          >
            {it.label}
          </Link>
        ))}

        <button
          onClick={() => alert("Logout clicked")}
          className="mt-4 w-40 bg-red-600 py-2 rounded-full hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-full p-6 overflow-x-hidden">{children}</main>
    </div>
  );
}
