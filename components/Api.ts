// components/Api.ts
export const API =
  process.env.NEXT_PUBLIC_API?.replace(/\/$/, "") || "http://localhost:5000";

export async function fetchJSON(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Normalisasi path gambar dari DB/Backend:
 * - null/undefined -> placeholder
 * - http(s)        -> langsung
 * - /uploads/...   -> prefix dengan API (http://localhost:5000/uploads/...)
 * - lainnya        -> return apa adanya
 */
export function resolveImg(src?: string | null) {
  if (!src) return "/placeholder.png"; // ganti kalau mau
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads")) return `${API}${src}`;
  return src;
}
