"use client";
import { useState } from "react";
import { resolveImg } from "@/components/Api";

export default function ImageServer({
  src,
  alt = "",
  className = "",
}: { src?: string | null; alt?: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  const url = resolveImg(src);

  if (!src || broken) {
    return (
      <div className={`bg-[#152030] text-white/60 flex items-center justify-center ${className}`}>
        🎮
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setBroken(true)}
    />
  );
}
