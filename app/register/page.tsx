"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const API = "/api"; // sama seperti Login: lewat proxy Next.js

// ===== Password rules =====
// - Min 8
// - ≥ 1 huruf besar
// - ≥ 1 angka ATAU karakter spesial
// Rules:
const PASS_MIN = 8;
const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasDigit  = (s: string) => /\d/.test(s);
// Hanya simbol umum, TIDAK termasuk spasi:
const hasSpecial = (s: string) => /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/.test(s);
const isLongEnough = (s: string) => s.length >= PASS_MIN;

// Wajib: ≥1 huruf besar, panjang ≥8, dan (angka ATAU simbol)
const isPasswordValid = (s: string) =>
  isLongEnough(s) && hasUpper(s) && (hasDigit(s) || hasSpecial(s));

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const disabled = useMemo(() => {
    return submitting || email.trim() === "" || !isPasswordValid(password);
  }, [submitting, email, password]);

  async function handleRegister() {
    setMsg(null);

    // Hard-stop kalau tidak valid (meski tombol somehow tertekan)
    if (!isPasswordValid(password) || email.trim() === "") {
      setMsg({ type: "err", text: "Password tidak memenuhi aturan." });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setMsg({ type: "err", text: data?.message || `${res.status} ${res.statusText}` });
        setSubmitting(false);
        return;
      }
      setMsg({ type: "ok", text: "Registrasi berhasil. Mengarahkan ke halaman login…" });
      setTimeout(() => (window.location.href = "/login"), 900);
    } catch {
      setMsg({ type: "err", text: "⚠️ Gagal koneksi ke server" });
      setSubmitting(false);
    }
  }

  // progress mini-bar: 0..3 terpenuhi
  const score =
    (isLongEnough(password) ? 1 : 0) +
    (hasUpper(password) ? 1 : 0) +
    ((hasDigit(password) || hasSpecial(password)) ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#0E1116] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Kartu */}
        <div className="relative rounded-xl bg-[#152030] border border-white/10 overflow-hidden shadow-xl">
          <div className="h-2 bg-gradient-to-r from-[#274056] via-[#30506a] to-[#274056]" />

          <div className="p-7">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-lg font-semibold">Create Account</h1>
              <div className="text-xs text-white/70">
                Sudah punya akun?{" "}
                <Link className="text-[#7CC3FF] hover:underline" href="/login">
                  Login
                </Link>
              </div>
            </div>

            <Label>Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div className="mt-4" />

            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              aria-invalid={!isPasswordValid(password) && password.length > 0}
              aria-describedby="password-help"
            />

            {/* helper mini-bar */}
            <div className="mt-2 h-1 w-full bg-white/10 rounded" aria-hidden>
              <div
                className={`h-1 rounded transition-all ${
                  score === 0
                    ? "w-0"
                    : score === 1
                    ? "w-1/3 bg-red-400"
                    : score === 2
                    ? "w-2/3 bg-yellow-300"
                    : "w-full bg-emerald-400"
                }`}
              />
            </div>

            {/* Checklist syarat password */}
            <ul id="password-help" className="mt-3 space-y-1 text-xs">
              <CheckItem ok={isLongEnough(password)}>
                Minimal {PASS_MIN} karakter
              </CheckItem>
              <CheckItem ok={hasUpper(password)}>
                Memiliki setidaknya satu huruf besar (A–Z)
              </CheckItem>
              <CheckItem ok={(hasDigit(password) || hasSpecial(password))}>
                Memiliki angka <span className="opacity-80">(0–9)</span> atau karakter spesial
                <span className="opacity-80"> (!@#$%^&* dll.)</span>
              </CheckItem>
            </ul>

            <button
              onClick={handleRegister}
              disabled={disabled}
              className={`mt-6 w-full rounded-full px-4 py-2 font-semibold transition ${
                disabled
                  ? "bg-[#0E1116]/60 cursor-not-allowed"
                  : "bg-[#0E1116] hover:bg-[#1c2027]"
              }`}
            >
              {submitting ? "Registering…" : "Register"}
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

function CheckItem({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? "text-emerald-300" : "text-white/60"}`}>
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
          ok ? "border-emerald-400 bg-emerald-500/20" : "border-white/30"
        }`}
        aria-hidden
      >
        {ok ? "✓" : ""}
      </span>
      <span>{children}</span>
    </li>
  );
}
