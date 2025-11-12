"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API } from "./Api";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/me`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!alive) return;
        if (d.loggedIn && d.user?.role === "admin") setOk(true);
        else router.replace("/login");
      })
      .catch(() => router.replace("/login"));
    return () => { alive = false; };
  }, [router]);

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E1116] text-white">
        Loading...
      </div>
    );
  }
  return <>{children}</>;
}
