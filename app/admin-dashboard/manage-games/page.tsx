"use client";

import { useEffect, useState } from "react";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/AdminShell";
import { API, fetchJSON } from "@/components/Api";
import ConfirmDialog from "@/components/ConfirmDialog";
import GameForm, { GameFormValues } from "@/components/games/GameForm";
import GamePicker from "@/components/games/GamePicker";
import GameCardsPreview from "@/components/games/GameCardsPreview";
import type { Game as GameFull } from "@/components/games/types";
import Navbar from "@/ui/Navbar";

type Mode = "idle" | "add" | "edit" | "delete";

export default function ManageGamesPage() {
  const [mode, setMode] = useState<Mode>("idle");
  const [games, setGames] = useState<GameFull[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [delOpen, setDelOpen] = useState(false);
  const [delTarget, setDelTarget] = useState<{ id: number; title: string } | null>(null);

  const [form, setForm] = useState<GameFormValues>({
    title: "",
    description: "",
    price: 0,
    image: null,
  });

  const load = async () => {
    const d = await fetchJSON(`${API}/admin/games`);
    setGames(d.items || d);
  };
  useEffect(() => {
    load();
  }, []);

  const buildFD = () => {
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("price", String(form.price));
    if (form.image) fd.append("image", form.image);
    return fd;
  };

  const reset = () => {
    setMode("idle");
    setSelectedId(null);
    setForm({ title: "", description: "", price: 0, image: null });
    setMsg("");
  };

  const submitAdd = async () => {
    const res = await fetch(`${API}/admin/games`, {
      method: "POST",
      body: buildFD(),
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed");
    setMsg("Game added");
    await load();
    reset();
  };

  const submitEdit = async () => {
    if (!selectedId) return;
    const res = await fetch(`${API}/admin/games/${selectedId}`, {
      method: "PUT",
      body: buildFD(),
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed");
    setMsg("Game updated");
    await load();
    reset();
  };

  const askDelete = () => {
    const g = games.find((x) => x.gameID === selectedId!);
    if (!g) return;
    setDelTarget({ id: g.gameID, title: g.title });
    setDelOpen(true);
  };
  const confirmDelete = async () => {
    if (!delTarget) return;
    await fetchJSON(`${API}/admin/games/${delTarget.id}`, { method: "DELETE" });
    setDelOpen(false);
    setDelTarget(null);
    setMsg(`"${delTarget.title}" deleted`);
    await load();
  };

  const onPickGame = (id: number) => {
    setSelectedId(id);
    const g = games.find((x) => x.gameID === id);
    if (g && mode === "edit") {
      setForm({
        title: g.title ?? "",
        description: g.description ?? "",
        price: Number(g.price ?? 0),
        image: null,
        currentImageUrl: g.image_url ?? undefined,
      });
    }
  };

  return (
    <AdminRoute>
      <Navbar />
      <AdminShell>
        <div className="bg-[#152030] p-4 rounded-md mb-4">
          <h2 className="mb-3 font-medium">Manage Games</h2>
          <div className="flex flex-wrap gap-3">
            {(["add", "edit", "delete"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded ${mode === m ? "bg-[#30506a]" : "bg-[#274056] hover:bg-[#30506a]"}`}
              >
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
            {mode !== "idle" && (
              <button onClick={reset} className="px-4 py-2 rounded bg-[#0E1116]">
                Cancel
              </button>
            )}
          </div>
          {msg && <p className="mt-2 text-sm">{msg}</p>}
        </div>

        {mode === "add" && (
          <GameForm values={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} onSubmit={submitAdd} submitText="Add Game" />
        )}

        {mode === "edit" && (
          <>
            <GamePicker games={games} value={selectedId} onChange={onPickGame} label="Choose Game" />
            {selectedId && (
              <div className="mt-4">
                <GameForm values={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} onSubmit={submitEdit} submitText="Update" />
              </div>
            )}
          </>
        )}

        {mode === "delete" && (
          <div className="bg-[#152030] p-4 rounded-md">
            <GamePicker games={games} value={selectedId} onChange={setSelectedId} label="Choose Game to Delete" />
            <div className="mt-3">
              <button onClick={askDelete} disabled={!selectedId} className="bg-red-700 px-4 py-2 rounded disabled:opacity-50">
                Delete
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <GameCardsPreview games={games} />
        </div>

        <ConfirmDialog
          open={delOpen}
          title="Delete Game"
          message={`Delete "${delTarget?.title}"? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDelOpen(false);
            setDelTarget(null);
          }}
        />
      </AdminShell>
    </AdminRoute>
  );
}
