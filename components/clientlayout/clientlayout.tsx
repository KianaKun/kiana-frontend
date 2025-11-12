"use client";

import Navbar from "@/components/navbar/Navbar";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ✅ daftar halaman yang tidak menampilkan navbar
  const hideNavbar = ["/login", "/register"].includes(pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className="min-h-screen">{children}</main>
    </>
  );
}
