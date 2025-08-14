"use client";

import { useMemo, useState } from "react";

export type Game = {
  gameID: number;
  title: string;
};

type Props = {
  games: Game[];
  value: number | null;
  onChange: (id: number) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  loading?: boolean;
};

export default function GamePicker({
  games,
  value,
  onChange,
  label = "Choose Game",
  placeholder = "-- Select --",
  helperText,
  errorText,
  disabled = false,
  loading = false,
}: Props) {
  const [q, setQ] = useState("");

  // filter by query (case-insensitive)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return games;
    return games.filter((g) => g.title.toLowerCase().includes(term));
  }, [games, q]);

  const hasError = !!errorText;

  return (
    <div className="bg-[#152030] p-4 rounded-md border border-white/10">
      {/* Label + selected badge */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm text-white/80">{label}</label>
        {value ? (
          <span className="text-[11px] bg-[#0E1116] px-2 py-[2px] rounded-full text-white/70">
            ID: {value}
          </span>
        ) : null}
      </div>

      {/* Search */}
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul…"
            className="w-full px-3 py-2 pl-9 rounded bg-[#0E1116] text-white outline-none ring-1 ring-transparent focus:ring-[#30506a] placeholder-white/40"
            disabled={disabled || loading}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔎</span>
        </div>

        {/* Clear selected */}
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`px-3 py-2 rounded bg-[#0E1116] hover:bg-[#1a232e] text-sm transition
                      ${!value ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={!value || disabled || loading}
          title="Clear selection"
        >
          Clear
        </button>
      </div>

      {/* Select */}
      <select
        className={`mt-2 w-full px-3 py-2 bg-[#0E1116] rounded text-white outline-none ring-1 ring-transparent focus:ring-[#30506a] transition
                    ${hasError ? "ring-1 ring-rose-500" : ""}`}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled || loading || filtered.length === 0}
      >
        <option value={0}>{loading ? "Loading…" : placeholder}</option>
        {filtered.map((g) => (
          <option key={g.gameID} value={g.gameID}>
            {g.title}
          </option>
        ))}
      </select>

      {/* Footer info */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-white/60">
          {loading
            ? "Mengambil data…"
            : filtered.length > 0
            ? `${filtered.length} game`
            : "Tidak ada hasil"}
        </span>
        {helperText && !hasError && (
          <span className="text-white/50">{helperText}</span>
        )}
        {hasError && <span className="text-rose-300">{errorText}</span>}
      </div>
    </div>
  );
}
