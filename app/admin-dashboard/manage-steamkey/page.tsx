"use client";

import { useEffect, useMemo, useState } from "react";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/AdminShell";
import Navbar from "@/ui/Navbar";
import { API, fetchJSON, resolveImg } from "@/components/Api";
import ImageServer from "@/components/ui/ImageServer";
import { AnimatePresence, motion } from "framer-motion";

type Game = {
  gameID: number;
  title: string;
  image_url?: string | null;
  is_deleted?: 0 | 1; // ⬅️ penting untuk guard FE
};

type SteamKey = {
  SteamkeyID: number;
  gameID: number;
  key_code: string;
  status: "available" | "sold" | "used" | string;
  title?: string;
};

type PendingAction =
  | { kind: "none" }
  | { kind: "global-add"; gameID: number; key_code: string }
  | { kind: "quick-add"; gameID: number; key_code: string };

export default function ManageSteamkeyPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [keys, setKeys] = useState<SteamKey[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<{ gameID: number; key_code: string }>({
    gameID: 0,
    key_code: "",
  });

  const [infoToast, setInfoToast] = useState<{ open: boolean; text: string; type: "ok" | "err" }>({
    open: false,
    text: "",
    type: "ok",
  });
  const [confirmToast, setConfirmToast] = useState<{ open: boolean; title: string; desc: string }>({
    open: false,
    title: "",
    desc: "",
  });
  const [pending, setPending] = useState<PendingAction>({ kind: "none" });
  const [submitting, setSubmitting] = useState(false);

  const SK_API = `${API}/admin/manage-steamkey`;

  const load = async () => {
    setLoading(true);
    try {
      const [gamesData, keysData] = await Promise.all([
        // ⬇️ ambil hanya game aktif dari backend
        fetchJSON(`${API}/admin/games?active=1`, { credentials: "include" }),
        fetchJSON(SK_API, { credentials: "include" }).catch(() => ({ items: [] })),
      ]);

      // ⬇️ guard FE kalau backend keliru/legacy
      const rawGames: Game[] = (gamesData.items || gamesData || []) as Game[];
      const activeGames = rawGames.filter((g) => (g?.is_deleted ?? 0) === 0);
      setGames(activeGames);

      // ⬇️ hanya stok available
      const allKeys: SteamKey[] = (keysData.items || keysData || []).filter(
        (k: SteamKey) => String(k.status).toLowerCase() === "available"
      );
      setKeys(allKeys);

      // jika game ter-archive saat ini, reset pilihan
      if (form.gameID && !activeGames.some((g) => g.gameID === form.gameID)) {
        setForm((f) => ({ ...f, gameID: 0 }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set ID game aktif, untuk menyaring keys orphan/nggak valid
  const activeIds = useMemo(() => new Set(games.map((g) => g.gameID)), [games]);

  // Grouping keys per game (hanya untuk game aktif)
  const grouped = useMemo(() => {
    const map = new Map<number, SteamKey[]>();
    for (const k of keys) {
      if (!activeIds.has(k.gameID)) continue; // ⬅️ cegah munculnya game yg sudah di-archive
      const arr = map.get(k.gameID) || [];
      arr.push(k);
      map.set(k.gameID, arr);
    }
    return map;
  }, [keys, activeIds]);

  const gamesWithStock = useMemo(
    () => games.filter((g) => (grouped.get(g.gameID)?.length || 0) > 0),
    [games, grouped]
  );

  const askConfirm = (payload: PendingAction) => {
    setPending(payload);
    setConfirmToast({
      open: true,
      title: "Yakin submit steamkey?",
      desc: "Ini tidak akan bisa dihapus lagi nanti.",
    });
  };

  const doSubmit = async () => {
    if (pending.kind === "none") return;
    setSubmitting(true);
    try {
      const { gameID, key_code } =
        pending.kind === "global-add" || pending.kind === "quick-add" ? pending : { gameID: 0, key_code: "" };

      await fetchJSON(SK_API, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          gameID,
          key_code: key_code.trim(),
          status: "available",
        }),
      });

      setInfoToast({ open: true, text: "✅ Key submitted", type: "ok" });
      if (pending.kind === "global-add") setForm({ gameID: 0, key_code: "" });
      await load();
    } catch (e: any) {
      setInfoToast({ open: true, text: `❌ ${e?.message || "Failed to submit key"}`, type: "err" });
    } finally {
      setSubmitting(false);
      setConfirmToast((c) => ({ ...c, open: false }));
      setPending({ kind: "none" });
    }
  };

  return (
    <AdminRoute>
      <Navbar />
      <AdminShell>
        {/* Header + Global Add */}
        <div className="bg-[#152030] p-4 rounded-md border border-white/10">
          <h2 className="mb-1 font-medium">Manage Steam Keys</h2>
          <p className="text-xs text-white/60 mb-4">
            Hanya menampilkan stok <span className="font-semibold">available</span>. Keys yang sudah{" "}
            <span className="font-semibold">used/sold</span> tidak ditampilkan. <br className="hidden sm:block" />
            Setelah disubmit, key <span className="font-semibold">tidak bisa dihapus</span>.
          </p>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Game</label>
              <select
                className="w-full px-3 py-2 bg-[#0E1116] rounded text-white"
                value={form.gameID}
                onChange={(e) => setForm((f) => ({ ...f, gameID: Number(e.target.value) }))}
              >
                <option value={0}>-- Select Game --</option>
                {games.map((g) => (
                  <option key={g.gameID} value={g.gameID}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Key Code</label>
              <input
                className="w-full px-3 py-2 bg-[#0E1116] rounded text-white"
                placeholder="XXXXX-XXXXX-XXXXX"
                value={form.key_code}
                onChange={(e) => setForm((f) => ({ ...f, key_code: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-3 flex gap-2 items-center">
            <button
              onClick={() => {
                if (!form.gameID || !form.key_code.trim()) return;
                askConfirm({ kind: "global-add", gameID: Number(form.gameID), key_code: form.key_code });
              }}
              className={`px-4 py-2 rounded font-semibold ${
                !form.gameID || !form.key_code.trim()
                  ? "bg-[#274056]/50 cursor-not-allowed"
                  : "bg-[#274056] hover:bg-[#30506a]"
              }`}
              disabled={!form.gameID || !form.key_code.trim()}
            >
              Save
            </button>
          </div>
        </div>

        {/* Cards per Game */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#152030] border border-white/10 rounded-lg p-4 animate-pulse">
                <div className="h-36 rounded bg-white/10" />
                <div className="h-4 bg-white/10 rounded mt-3 w-2/3" />
                <div className="h-3 bg-white/10 rounded mt-2 w-1/2" />
              </div>
            ))
          ) : (
            gamesWithStock.map((g) => (
              <GameKeyCard
                key={g.gameID}
                game={g}
                keys={grouped.get(g.gameID)!}
                onQuickAdd={(keyCode, done) => {
                  askConfirm({
                    kind: "quick-add",
                    gameID: g.gameID,
                    key_code: keyCode.trim(),
                  });
                  done?.();
                }}
              />
            ))
          )}

          {!loading && gamesWithStock.length === 0 && (
            <div className="col-span-full rounded-lg border border-white/10 bg-[#152030] p-6 text-center text-white/70">
              Belum ada stok <b>available</b>. Tambahkan key baru lewat form di atas atau quick-add per game.
            </div>
          )}
        </div>

        <ConfirmToast
          open={confirmToast.open}
          title={confirmToast.title}
          desc={confirmToast.desc}
          onCancel={() => {
            if (submitting) return;
            setConfirmToast((c) => ({ ...c, open: false }));
            setPending({ kind: "none" });
          }}
          onConfirm={() => {
            if (!submitting) doSubmit();
          }}
          loading={submitting}
        />

        <InfoToast
          open={infoToast.open}
          text={infoToast.text}
          type={infoToast.type}
          onClose={() => setInfoToast((t) => ({ ...t, open: false }))}
        />
      </AdminShell>
    </AdminRoute>
  );
}

/* --------- Card per Game ---------- */
function GameKeyCard({
  game,
  keys,
  onQuickAdd,
}: {
  game: Game;
  keys: SteamKey[];
  onQuickAdd: (keyCode: string, done?: () => void) => void;
}) {
  const [keyInput, setKeyInput] = useState("");

  const submitQuick = () => {
    if (!keyInput.trim()) return;
    onQuickAdd(keyInput, () => setKeyInput(""));
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#152030] overflow-hidden flex flex-col">
      <div className="relative h-40 w-full overflow-hidden">
        <ImageServer src={resolveImg(game.image_url)} alt={game.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#152030] via-transparent to-transparent" />
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold truncate">{game.title}</div>
          <div className="text-xs bg-[#0E1116] rounded-full px-2 py-1">{keys.length} available</div>
        </div>

        <div className="space-y-2 max-h-40 overflow-auto pr-1">
          {keys.map((k) => (
            <div key={k.SteamkeyID} className="flex items-center gap-2 bg-[#0E1116] rounded-md px-3 py-2">
              <code className="font-mono text-sm truncate">{k.key_code}</code>
            </div>
          ))}
        </div>

        <div className="mt-1 flex gap-2">
          <input
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Add new key (XXXXX-XXXXX-XXXXX)"
            className="flex-1 px-3 py-2 bg-[#0E1116] rounded text-sm"
          />
          <button
            onClick={submitQuick}
            className={`px-3 py-2 rounded text-sm ${
              keyInput.trim() ? "bg-[#274056] hover:bg-[#30506a]" : "bg-[#274056]/50 cursor-not-allowed"
            }`}
            disabled={!keyInput.trim()}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------- Confirm Toast ---------- */
function ConfirmToast({
  open,
  title,
  desc,
  onCancel,
  onConfirm,
  loading,
}: {
  open: boolean;
  title: string;
  desc?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center px-4 py-6 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
          <motion.div
            className="relative w-full max-w-md rounded-xl border border-amber-400/20 bg-[#2b1f0e] text-amber-100 shadow-2xl p-4"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-7 w-7 rounded-full bg-amber-500 text-black grid place-items-center font-bold">
                !
              </div>
              <div className="flex-1">
                <div className="font-semibold">{title}</div>
                {desc && <div className="text-sm opacity-90 mt-1">{desc}</div>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={onCancel}
                    disabled={loading}
                    className="px-4 py-2 rounded bg-[#0E1116] hover:bg-[#161c23] disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="px-4 py-2 rounded bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50"
                  >
                    {loading ? "Submitting…" : "Ya, Submit"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------- Info Toast ---------- */
function InfoToast({
  open,
  text,
  type,
  onClose,
}: {
  open: boolean;
  text: string;
  type: "ok" | "err";
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="info-toast"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70]"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div
            className={`flex items-center gap-3 rounded-full border px-4 py-2 shadow-xl ${
              type === "ok"
                ? "bg-[#12202f]/95 border-emerald-500/30 text-emerald-200"
                : "bg-[#2b1720]/95 border-rose-500/30 text-rose-200"
            }`}
          >
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                type === "ok" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            >
              {type === "ok" ? "✓" : "!"}
            </span>
            <span className="font-medium">{text}</span>
            <button className="ml-2 text-xs underline opacity-80 hover:opacity-100" onClick={onClose}>
              Tutup
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
