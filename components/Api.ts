// components/Api.ts
export const API = "/api"; // pakai satu pintu

// Selalu kirim cookie & auto-prefix ke /api
export async function fetchJSON(url: string, init: RequestInit = {}) {
  let finalUrl = url;

  // kalau bukan absolute http/https → normalisasi ke /api/...
  if (!/^https?:\/\//i.test(url)) {
    const p = url.startsWith("/") ? url : `/${url}`;
    finalUrl = p.startsWith("/api/") ? p : `${API}${p}`;
  }

  const res = await fetch(finalUrl, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Normalisasi path gambar dari Backend:
 * - null/undefined -> placeholder
 * - http(s)        -> langsung
 * - /uploads/...   -> prefix via /api (agar konsisten & CORS aman)
 */
export function resolveImg(src?: string | null) {
  if (!src) return "/placeholder.png";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads")) return `${API}${src}`; // -> /api/uploads/...
  return src;
}
