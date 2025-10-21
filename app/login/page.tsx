"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";

const API = "/api";
const TURNSTILE_SITE_KEY = "0x4AAAAAAB7oPW03sh_FON4Z";

// Declare Turnstile types
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const disabled = useMemo(() => {
    return submitting || email.trim() === "" || password.trim() === "" || !turnstileToken;
  }, [submitting, email, password, turnstileToken]);

  // Load Turnstile widget
  useEffect(() => {
    if (!turnstileLoaded || !turnstileRef.current || widgetIdRef.current) return;

    if (window.turnstile) {
      try {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'error-callback': () => {
            setTurnstileToken("");
            setMsg({ type: "err", text: "Verifikasi keamanan gagal" });
          },
          'expired-callback': () => {
            setTurnstileToken("");
          },
          theme: "dark",
          size: "normal"
        });
      } catch (error) {
        console.error("Turnstile render error:", error);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (error) {
          console.error("Turnstile cleanup error:", error);
        }
      }
    };
  }, [turnstileLoaded]);

  async function handleLogin() {
    setMsg(null);
    
    if (disabled) return;

    if (!turnstileToken) {
      setMsg({ type: "err", text: "Silakan selesaikan verifikasi keamanan." });
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          email, 
          password,
          turnstileToken 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg({ type: "err", text: data?.message || `${res.status} ${res.statusText}` });
        setSubmitting(false);
        
        // Reset Turnstile on error
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
          setTurnstileToken("");
        }
        return;
      }

      setMsg({ type: "ok", text: data.message || "Login sukses" });

      setTimeout(() => {
        window.location.href = data.role === "admin" ? "/admin-dashboard" : "/";
      }, 800);
    } catch {
      setMsg({ type: "err", text: "⚠️ Gagal koneksi ke server" });
      setSubmitting(false);
      
      // Reset Turnstile on error
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    }
  }

  return (
    <>
      {/* Load Turnstile Script */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onLoad={() => setTurnstileLoaded(true)}
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-[#0E1116] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-[420px]">
          <div className="relative rounded-xl bg-[#152030] border border-white/10 overflow-hidden shadow-xl">
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
                autoComplete="email"
              />

              <div className="mt-4" />

              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              {/* Turnstile Widget */}
              <div className="mt-6 flex justify-center">
                <div ref={turnstileRef}></div>
              </div>

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
    </>
  );
}

/* ———— UI Components ———— */

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