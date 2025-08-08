"use client";

export type Game = {
  gameID: number;
  title: string;
};

export default function GamePicker({
  games,
  value,
  onChange,
  label = "Choose Game",
}: {
  games: Game[];
  value: number | null;
  onChange: (id: number) => void;
  label?: string;
}) {
  return (
    <div className="bg-[#152030] p-4 rounded-md">
      <label className="text-sm">{label}</label>
      <select
        className="w-full px-3 py-2 bg-[#0E1116] rounded mt-1"
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={0}>-- Select --</option>
        {games.map((g) => (
          <option key={g.gameID} value={g.gameID}>
            {g.title}
          </option>
        ))}
      </select>
    </div>
  );
}
