"use client";

export default function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="w-full h-48 rounded-lg bg-[#0E1116]" />
      <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
      <div className="mt-2 h-3 w-2/5 rounded bg-white/10" />
    </div>
  );
}
