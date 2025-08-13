"use client";

import Link from "next/link";
import { resolveImg } from "@/components/Api";

export type Game = {
  gameID: number;
  title: string;
  image_url?: string | null;
  description?: string | null;
  price?: number | null;
};

export default function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/product/${game.gameID}`}>
      <div className="group bg-transparent cursor-pointer">
        <div className="w-full h-48 bg-[#0E1116] rounded-lg overflow-hidden border border-white/10 relative">
          <img
            src={resolveImg(game.image_url)}
            alt={game.title}
            className="object-cover w-full h-full rounded-lg transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-[#274056]/80 backdrop-blur px-2 py-1 rounded">
            Steam Key
          </div>
        </div>
        <div className="mt-2 text-center">
          <div className="font-medium">{game.title}</div>
          {typeof game.price === "number" && (
            <div className="text-sm text-white/70 mt-0.5">
              Rp {Intl.NumberFormat("id-ID").format(game.price)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
