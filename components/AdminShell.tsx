"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const items = [
    { label: "Dashboard",       href: "/admin-dashboard" },
    { label: "Manage Games",    href: "/admin-dashboard/manage-games" },
    { label: "Manage Steamkey", href: "/admin-dashboard/manage-steamkey" },
    { label: "Manage Order",    href: "/admin-dashboard/manage-order" },
  ];

  return (
    <div className="min-h-screen bg-[#0E1116] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#152030] flex flex-col items-center py-6 space-y-4">
        <div className="flex items-center space-x-2 bg-[#0E1116] px-4 py-2 rounded-xl mb-6">
          <span className="text-xl">🔑</span>
          <span className="font-bold">KianaStore Key</span>
        </div>

        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              prefetch={false}
              className={`w-40 text-center py-2 rounded-full transition
                ${active ? "bg-[#30506a]" : "bg-[#274056] hover:bg-[#30506a]"}`}
            >
              {it.label}
            </Link>
          );
        })}
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        <div className="flex justify-end items-center mb-6 space-x-4">
          <div className="bg-[#274056] px-4 py-2 rounded-full">Administrator</div>
          <div className="w-10 h-10 bg-[#274056] rounded-full flex items-center justify-center">👤</div>
        </div>
        {children}
      </main>
    </div>
  );
}
