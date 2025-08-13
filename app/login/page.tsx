"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const API = "/api"; // proxy ke backend

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const disabled = useMemo(() => {
    return submitting || email.trim() === "" || password.trim() === "";
  }, [submitting, email, password]);

  async function handleLogin() {
    setMsg(null);
    if (disabled) return;

    try {
      setSubmitting(true);

      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // penting untuk session cookie
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg({ type: "err", text: data?.message || `${res.status} ${res.statusText}` });
        setSubmitting(false);
        return;
      }

      setMsg({ type: "ok", text: data.message || "Login sukses" });

      setTimeout(() => {
        window.location.href = data.role === "admin" ? "/admin-dashboard" : "/";
      }, 800);
    } catch {
      setMsg({ type: "err", text: "⚠️ Gagal koneksi ke server" });
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E1116] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Kartu */}
        <div className="relative rounded-xl bg-[#152030] border border-white/10 overflow-hidden shadow-xl">
          {/* top strip */}
          <div className="h-2 bg-gradient-to-r from-[#274056] via-[#30506a] to-[#274056]" />

          <div className="p-7">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-lg font-semibold">Login</h1>
              <div className="text-xs text-white/70">
                Belum punya akun?{" "}
                <Link className="text-[#7CC3FF] hover:underline" href="/register">
                  Register
                </Link>
              </div>
            </div>

            <Label>Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="mt-4" />

            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={handleLogin}
              disabled={disabled}
              className={`mt-6 w-full rounded-full px-4 py-2 font-semibold transition ${
                disabled
                  ? "bg-[#0E1116]/60 cursor-not-allowed"
                  : "bg-[#0E1116] hover:bg-[#1c2027]"
              }`}
            >
              {submitting ? "Logging in…" : "Login"}
            </button>

            {/* Alert/Toast kecil */}
            {msg && (
              <div
                className={`mt-4 text-sm rounded-md px-3 py-2 ${
                  msg.type === "ok"
                    ? "bg-emerald-600/20 text-emerald-200 border border-emerald-500/30"
                    : "bg-red-700/20 text-red-200 border border-red-500/30"
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        </div>

        {/* Footer kecil */}
        <div className="text-center text-white/50 text-xs mt-4">
          © {new Date().getFullYear()} KianaStore Key
        </div>
      </div>
    </div>
  );
}

/* ———— UI kecil biar rapi & konsisten ———— */

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm text-white/80 mb-1">{children}</label>;
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 rounded bg-[#0E1116] text-white outline-none border border-white/10 focus:border-white/20 focus:ring-2 focus:ring-[#274056] ${className || ""}`}
    />
  );
}
