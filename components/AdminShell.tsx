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
    <div className="min-h-screen bg-[#0E1116] text-white flex pt-10">
      {/* Sidebar */}
      <aside className="w-64 bg-[#152030] flex flex-col items-center py-6 space-y-4">

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
        {children}
      </main>
    </div>
  );
}
