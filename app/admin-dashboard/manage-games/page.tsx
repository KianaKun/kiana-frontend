"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/AdminShell";
import Navbar from "@/ui/Navbar";
import { API, fetchJSON } from "@/components/Api";
import ConfirmDialog from "@/components/ConfirmDialog";
import GameForm, { type GameFormValues } from "@/components/games/GameForm";
import GamePicker from "@/components/games/GamePicker";
import GameCardsPreview from "@/components/games/GameCardsPreview";
import type { Game as GameFull } from "@/components/games/types";
import { AnimatePresence, motion } from "framer-motion";

type Mode = "idle" | "add" | "edit" | "delete";

export default function ManageGamesPage() {
  const [mode, setMode] = useState<Mode>("idle");
  const [games, setGames] = useState<GameFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // toast mini
  const [toast, setToast] = useState<{ open: boolean; type: "ok" | "err"; text: string }>({
    open: false,
    type: "ok",
    text: "",
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (type: "ok" | "err", text: string, ms = 1600) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ open: true, type, text });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, open: false })), ms);
  };

  const [delOpen, setDelOpen] = useState(false);
  const [delTarget, setDelTarget] = useState<{ id: number; title: string } | null>(null);

  const [form, setForm] = useState<GameFormValues>({
    title: "",
    description: "",
    price: 0,
    image: null,
  });

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetchJSON(`${API}/admin/games`, { credentials: "include" });
      setGames(d.items || d);
    } finally {
      setLoading(false);
    }
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
  };

  const submitAdd = async () => {
    try {
      const res = await fetch(`${API}/admin/games`, {
        method: "POST",
        body: buildFD(),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      showToast("ok", "Game added");
      await load();
      reset();
    } catch (e: any) {
      showToast("err", e?.message || "Failed to add");
    }
  };

  const submitEdit = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`${API}/admin/games/${selectedId}`, {
        method: "PUT",
        body: buildFD(),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      showToast("ok", "Game updated");
      await load();
      reset();
    } catch (e: any) {
      showToast("err", e?.message || "Failed to update");
    }
  };

  const askDelete = () => {
    const g = games.find((x) => x.gameID === selectedId!);
    if (!g) return;
    setDelTarget({ id: g.gameID, title: g.title });
    setDelOpen(true);
  };
  const confirmDelete = async () => {
    if (!delTarget) return;
    try {
      await fetchJSON(`${API}/admin/games/${delTarget.id}`, { method: "DELETE", credentials: "include" });
      setDelOpen(false);
      setDelTarget(null);
      showToast("ok", `"${delTarget.title}" deleted`);
      await load();
      reset();
    } catch (e: any) {
      showToast("err", e?.message || "Failed to delete");
    }
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

  // Label yang tampil di header
  const headerLabel = useMemo(() => {
    switch (mode) {
      case "add": return "Add Game";
      case "edit": return "Edit Game";
      case "delete": return "Delete Game";
      default: return "Manage Games";
    }
  }, [mode]);

  return (
    <AdminRoute>
      <Navbar />
      <AdminShell>
        {/* Header */}
        <motion.div
          className="bg-[#152030] p-4 rounded-md mb-4 border border-white/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-medium">{headerLabel}</h2>
              <p className="text-xs text-white/60">
                Kelola katalog—tambah, ubah, dan hapus game. Pratinjau ada di bawah.
              </p>
            </div>
            <div className="text-xs text-white/60 hidden sm:block">
              {new Date().toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}{" "}
              WIB
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {(["add", "edit", "delete"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded transition ${
                  mode === m ? "bg-[#30506a]" : "bg-[#274056] hover:bg-[#30506a]"
                }`}
              >
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
            {mode !== "idle" && (
              <button onClick={reset} className="px-4 py-2 rounded bg-[#0E1116] hover:bg-[#151a21] transition">
                Cancel
              </button>
            )}
          </div>
        </motion.div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#152030] border border-white/10 p-4 rounded-md animate-pulse">
                  <div className="h-28 bg-white/10 rounded" />
                  <div className="h-4 bg-white/10 rounded mt-3 w-2/3" />
                  <div className="h-3 bg-white/10 rounded mt-2 w-1/2" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {mode === "add" && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <GameForm
                    values={form}
                    onChange={(p) => setForm((f) => ({ ...f, ...p }))}
                    onSubmit={submitAdd}
                    submitText="Add Game"
                  />
                </motion.div>
              )}

              {mode === "edit" && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <GamePicker games={games} value={selectedId} onChange={onPickGame} label="Choose Game" />
                  {selectedId && (
                    <div className="mt-4">
                      <GameForm
                        values={form}
                        onChange={(p) => setForm((f) => ({ ...f, ...p }))}
                        onSubmit={submitEdit}
                        submitText="Update"
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {mode === "delete" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#152030] p-4 rounded-md border border-white/10"
                >
                  <GamePicker games={games} value={selectedId} onChange={setSelectedId} label="Choose Game to Delete" />
                  <div className="mt-3">
                    <button
                      onClick={askDelete}
                      disabled={!selectedId}
                      className="bg-red-700 px-4 py-2 rounded disabled:opacity-50 hover:bg-red-800 transition"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="mt-4">
                <GameCardsPreview games={games} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialog delete */}
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

        {/* Toast */}
        <AnimatePresence>
          {toast.open && (
            <motion.div
              key="games-toast"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]"
            >
              <div
                className={`relative flex items-center gap-3 rounded-full px-4 py-2 shadow-xl border ${
                  toast.type === "ok"
                    ? "bg-[#12202f]/95 border-emerald-500/30 text-emerald-200"
                    : "bg-[#2b1720]/95 border-rose-500/30 text-rose-200"
                }`}
              >
                <span className="relative inline-flex">
                  <span
                    className={`absolute inline-flex h-7 w-7 rounded-full ${
                      toast.type === "ok" ? "bg-emerald-500" : "bg-rose-500"
                    } opacity-60 animate-ping`}
                  />
                  <span
                    className={`relative inline-flex items-center justify-center h-7 w-7 rounded-full ${
                      toast.type === "ok" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  >
                    {toast.type === "ok" ? "✓" : "!"}
                  </span>
                </span>
                <span className="font-medium">{toast.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AdminShell>
    </AdminRoute>
  );
}
