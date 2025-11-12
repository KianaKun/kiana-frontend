"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminRoute from "@/components/admin-dashboard/AdminRoute";
import AdminShell from "@/components/admin-dashboard/AdminShell";
import { API, fetchJSON } from "@/components/admin-dashboard/Api";
import ConfirmDialog from "@/components/admin-dashboard/ConfirmDialog";
import GameForm, { type GameFormValues } from "@/components/games/GameForm";
import GamePicker from "@/components/games/GamePicker";
import GameCardsPreview from "@/components/games/GameCardsPreview";
import type { Game as GameFull } from "@/components/games/types";
import { AnimatePresence, motion } from "framer-motion";

type Mode = "idle" | "add" | "edit" | "delete";

export default function ManageGamesPage() {
  const [mode, setMode] = useState<Mode>("idle");
  const [games, setGames] = useState<GameFull[]>([]);
  const [previewGames, setPreviewGames] = useState<GameFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Toast mini
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
      const [adm, pub] = await Promise.all([
        fetchJSON(`${API}/admin/games?active=1`, { credentials: "include" }),
        fetchJSON(`${API}/games`),
      ]);
      setGames(adm.items || adm);
      setPreviewGames(pub.items || pub);
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
      const res = await fetch(`${API}/admin/games/${delTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.message || "Failed");

      setDelOpen(false);
      setDelTarget(null);

      showToast(
        "ok",
        data?.archived
          ? `"${delTarget.title}" di-arsipkan (gambar terhapus)`
          : `"${delTarget.title}" deleted"`
      );

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

  const headerLabel = useMemo(() => {
    switch (mode) {
      case "add": return "Add Game";
      case "edit": return "Edit Game";
      case "delete": return "Delete Game";
      default: return "Manage Games";
    }
  }, [mode]);

  const activeAdminGames = useMemo(
    () => games.filter((g: any) => (g.is_deleted ?? 0) === 0),
    [games]
  );

  return (
    <AdminRoute>
      <div className="flex flex-col min-h-screen bg-[#0E1116]">
        {/* Sidebar + Main Content */}
        <AdminShell>
          {/* Header */}
          <motion.div
            className="bg-[#152030] p-4 sm:p-6 rounded-md mb-4 border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">{headerLabel}</h2>
                <p className="text-xs sm:text-sm text-white/60">
                  Kelola katalog—tambah, ubah, dan hapus game. Pratinjau ada di bawah.
                </p>
              </div>
              <div className="text-xs sm:text-sm text-white/60">
                {new Date().toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })} WIB
              </div>
            </div>

            {/* Modebuttons */}
            <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
              {(["add", "edit", "delete"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded text-sm sm:text-base transition w-full sm:w-auto ${
                    mode === m ? "bg-[#30506a]" : "bg-[#274056] hover:bg-[#30506a]"
                  }`}
                >
                  {m[0].toUpperCase() + m.slice(1)}
                </button>
              ))}
              {mode !== "idle" && (
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded text-sm sm:text-base bg-[#0E1116] hover:bg-[#151a21] transition w-full sm:w-auto"
                >
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
                    <GamePicker
                      games={activeAdminGames}
                      value={selectedId}
                      onChange={onPickGame}
                      label="Choose Game"
                    />
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
                    <GamePicker
                      games={activeAdminGames}
                      value={selectedId}
                      onChange={setSelectedId}
                      label="Choose Game to Delete"
                    />
                    <div className="mt-3 flex justify-end sm:justify-start">
                      <button
                        onClick={askDelete}
                        disabled={!selectedId}
                        className="bg-red-700 px-4 py-2 rounded disabled:opacity-50 hover:bg-red-800 transition w-full sm:w-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {/* Preview */}
                {mode === "idle" && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="mt-4"
                  >
                    <GameCardsPreview games={previewGames} />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dialog Delete */}
          <ConfirmDialog
            open={delOpen}
            title="Delete Game"
            message={`Delete "${delTarget?.title}"? This cannot be undone.`}
            onConfirm={confirmDelete}
            onCancel={() => { setDelOpen(false); setDelTarget(null); }}
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
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] sm:w-auto"
              >
                <div
                  className={`flex items-center gap-3 rounded-full px-4 py-2 shadow-xl border ${
                    toast.type === "ok"
                      ? "bg-[#12202f]/95 border-emerald-500/30 text-emerald-200"
                      : "bg-[#2b1720]/95 border-rose-500/30 text-rose-200"
                  }`}
                >
                  <span className="relative inline-flex">
                    <span className={`absolute inline-flex h-7 w-7 rounded-full ${toast.type === "ok" ? "bg-emerald-500" : "bg-rose-500"} opacity-60 animate-ping`} />
                    <span className={`relative inline-flex items-center justify-center h-7 w-7 rounded-full ${toast.type === "ok" ? "bg-emerald-500" : "bg-rose-500"}`}>
                      {toast.type === "ok" ? "✓" : "!"}
                    </span>
                  </span>
                  <span className="font-medium text-sm sm:text-base">{toast.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </AdminShell>
      </div>
    </AdminRoute>
    );
  }
