"use client";

import Link from "next/link";

export default function CTA({
  href,
  label,
  variant = "solid",
}: {
  href: string;
  label: string;
  variant?: "solid" | "ghost";
}) {
  const cls =
    variant === "solid"
      ? "bg-[#274056] hover:bg-[#30506a]"
      : "bg-transparent border border-white/15 hover:border-white/25";
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-md transition-colors ${cls}`}
    >
      {label}
    </Link>
  );
}
