"use client";

export default function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#0E1116] border border-white/10 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-base font-semibold mt-1">{value}</div>
    </div>
  );
}
