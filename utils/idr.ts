// utils/idr.ts
export function toIDR(v: unknown) {
  const n =
    typeof v === "number" ? v :
    v == null ? NaN :
    Number(String(v).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return "Rp -";
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}
