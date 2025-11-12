"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AdminRoute from "@/components/admin-dashboard/AdminRoute";
import AdminShell from "@/components/admin-dashboard/AdminShell";
import { API, fetchJSON } from "@/components/admin-dashboard/Api";
import GameKeyCard from "@/components/admin-steamkey/gamekeycard";
import ConfirmToast from "@/components/admin-steamkey/confirmtoast";
import InfoToast from "@/components/admin-steamkey/infotoast";


type Game = {
  gameID: number;
  title: string;
  image_url?: string | null;
  is_deleted?: 0 | 1;
};

type SteamKey = {
  SteamkeyID: number;
  gameID: number;
  key_code: string;
  status: "available" | "sold" | "used" | string;
};

type PendingAction =
  | { kind: "none" }
  | { kind: "global-add"; gameID: number; key_code: string }
  | { kind: "quick-add"; gameID: number; key_code: string };

export default function ManageSteamkeyPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [keys, setKeys] = useState<SteamKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ gameID: 0, key_code: "" });

  const [pending, setPending] = useState<PendingAction>({ kind: "none" });
  const [confirmToast, setConfirmToast] = useState({
    open: false,
    title: "",
    desc: "",
  });
  const [infoToast, setInfoToast] = useState({
    open: false,
    text: "",
    type: "ok" as "ok" | "err",
  });
  const [submitting, setSubmitting] = useState(false);

  const SK_API = `${API}/admin/manage-steamkey`;

  const load = async () => {
    setLoading(true);
    try {
      const [gamesRes, keysRes] = await Promise.all([
        fetchJSON(`${API}/admin/games?active=1`, { credentials: "include" }),
        fetchJSON(SK_API, { credentials: "include" }).catch(() => ({ items: [] })),
      ]);

      const rawGames = (gamesRes.items || gamesRes) as Game[];
      const activeGames = rawGames.filter((g) => (g?.is_deleted ?? 0) === 0);
      setGames(activeGames);

      const availableKeys = (keysRes.items || keysRes || []).filter(
        (k: SteamKey) => String(k.status).toLowerCase() === "available"
      );
      setKeys(availableKeys);

      if (form.gameID && !activeGames.some((g) => g.gameID === form.gameID)) {
        setForm({ gameID: 0, key_code: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<number, SteamKey[]>();
    for (const k of keys) {
      const arr = map.get(k.gameID) || [];
      arr.push(k);
      map.set(k.gameID, arr);
    }
    return map;
  }, [keys]);

  const gamesWithStock = useMemo(
    () => games.filter((g) => (grouped.get(g.gameID)?.length ?? 0) > 0),
    [games, grouped]
  );

  const askConfirm = (payload: PendingAction) => {
    setPending(payload);
    setConfirmToast({
      open: true,
      title: "Yakin submit steamkey?",
      desc: "Setelah disimpan, key tidak bisa dihapus.",
    });
  };

  const doSubmit = async () => {
    if (pending.kind === "none") return;
    setSubmitting(true);
    try {
      const { gameID, key_code } =
        pending.kind === "global-add" || pending.kind === "quick-add"
          ? pending
          : { gameID: 0, key_code: "" };

      await fetchJSON(SK_API, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          gameID,
          key_code: key_code.trim(),
          status: "available",
        }),
      });

      setInfoToast({ open: true, text: "✅ Key berhasil disimpan", type: "ok" });
      if (pending.kind === "global-add") setForm({ gameID: 0, key_code: "" });
      await load();
    } catch (e: any) {
      setInfoToast({ open: true, text: `❌ ${e?.message || "Gagal menyimpan key"}`, type: "err" });
    } finally {
      setSubmitting(false);
      setConfirmToast((c) => ({ ...c, open: false }));
      setPending({ kind: "none" });
    }
  };

  return (
    <AdminRoute>
      <AdminShell>
        {/* Header */}
        <div className="bg-[#152030] p-4 rounded-md border border-white/10">
          <h2 className="mb-1 font-medium">Manage Steam Keys</h2>
          <p className="text-xs text-white/60 mb-4">
            Hanya stok <b>available</b> yang ditampilkan. Setelah disubmit, key tidak bisa dihapus.
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
                askConfirm({ kind: "global-add", gameID: form.gameID, key_code: form.key_code });
              }}
              disabled={!form.gameID || !form.key_code.trim()}
              className={`px-4 py-2 rounded font-semibold ${
                !form.gameID || !form.key_code.trim()
                  ? "bg-[#274056]/50 cursor-not-allowed"
                  : "bg-[#274056] hover:bg-[#30506a]"
              }`}
            >
              Save
            </button>
          </div>
        </div>

        {/* Game Cards */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 relative">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#152030] border border-white/10 rounded-lg p-4 animate-pulse"
              >
                <div className="h-36 rounded bg-white/10" />
                <div className="h-4 bg-white/10 rounded mt-3 w-2/3" />
                <div className="h-3 bg-white/10 rounded mt-2 w-1/2" />
              </div>
            ))
          ) : (
            <AnimatePresence mode="sync">
              {(() => {
                // kalau user pilih game tertentu
                if (form.gameID) {
                  const selectedGame = games.find((g) => g.gameID === form.gameID);
                  const selectedKeys = grouped.get(form.gameID) || [];

                  if (!selectedGame || selectedKeys.length === 0) {
                    return (
                      <motion.div
                        key="empty-selected"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="col-span-full rounded-lg border border-white/10 bg-[#152030] p-6 text-center text-white/70"
                      >
                        Belum ada stok <b>available</b> untuk game ini.
                      </motion.div>
                    );
                  }

                  // kalau ada stok untuk game yang dipilih
                  return (
                    <motion.div
                      key={selectedGame.gameID}
                      layout
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <GameKeyCard
                        game={selectedGame}
                        keys={selectedKeys}
                        onQuickAdd={(keyCode, done) => {
                          askConfirm({
                            kind: "quick-add",
                            gameID: selectedGame.gameID,
                            key_code: keyCode.trim(),
                          });
                          done?.();
                        }}
                      />
                    </motion.div>
                  );
                }

                // kalau user gak pilih apa-apa (form.gameID = 0)
                const stockedGames = games.filter(
                  (g) => (grouped.get(g.gameID)?.length ?? 0) > 0
                );

                if (stockedGames.length === 0) {
                  return (
                    <motion.div
                      key="empty-all"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="col-span-full rounded-lg border border-white/10 bg-[#152030] p-6 text-center text-white/70"
                    >
                      Belum ada stok <b>available</b>. Tambahkan key baru lewat form di atas atau quick-add per game.
                    </motion.div>
                  );
                }

                // tampilkan semua game dengan stok
                return stockedGames.map((g) => (
                  <motion.div
                    key={g.gameID}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <GameKeyCard
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
                  </motion.div>
                ));
              })()}
            </AnimatePresence>
          )}
        </div>


        {/* Toast Components */}
        <ConfirmToast
          open={confirmToast.open}
          title={confirmToast.title}
          desc={confirmToast.desc}
          loading={submitting}
          onCancel={() => {
            if (!submitting) {
              setConfirmToast((c) => ({ ...c, open: false }));
              setPending({ kind: "none" });
            }
          }}
          onConfirm={() => !submitting && doSubmit()}
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
