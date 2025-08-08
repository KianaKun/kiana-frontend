"use client";

import { useEffect, useState } from "react";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/AdminShell";
import { API, fetchJSON } from "@/components/Api";

type Game = { gameID: number; title: string };
type SteamKey = {
  SteamkeyID: number;
  gameID: number;
  key_code: string;
  status: "available" | "sold";
  title?: string;
};

export default function ManageSteamkeyPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [keys, setKeys] = useState<SteamKey[]>([]);
  const [form, setForm] = useState<Partial<SteamKey>>({ gameID: 0, key_code: "", status: "available" });
  const [msg, setMsg] = useState("");

  const SK_API = `${API}/admin/manage-steamkey`;

  const load = () =>
    Promise.all([
      fetchJSON(`${API}/admin/games`).then((d) => setGames(d.items || d)),
      fetchJSON(SK_API)
        .then((d) => setKeys(d.items || d))
        .catch(() => setKeys([])),
    ]);

  useEffect(() => {
    load();
  }, []);

  const addKey = async () => {
    try {
      await fetchJSON(SK_API, {
        method: "POST",
        body: JSON.stringify({
          gameID: Number(form.gameID),
          key_code: form.key_code,
          status: form.status || "available",
        }),
      });
      setMsg("Key added successfully");
      setForm({ gameID: 0, key_code: "", status: "available" });
      load();
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const deleteKey = async (id: number) => {
    if (!confirm("Are you sure you want to delete this key?")) return;
    try {
      await fetchJSON(`${SK_API}/${id}`, { method: "DELETE" });
      setMsg("Key deleted");
      load();
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <AdminRoute>
      <AdminShell>
        {/* Add Steamkey Form */}
        <div className="bg-[#152030] p-4 rounded-md">
          <h2 className="mb-3 font-medium">Add Steam Key</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Game</label>
              <select
                className="w-full px-3 py-2 bg-[#0E1116] rounded"
                value={form.gameID ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, gameID: Number(e.target.value) }))}
              >
                <option value={0}>-- Select --</option>
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
                className="w-full px-3 py-2 bg-[#0E1116] rounded"
                value={form.key_code || ""}
                onChange={(e) => setForm((f) => ({ ...f, key_code: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={addKey}
              className="bg-[#274056] px-4 py-2 rounded hover:bg-[#30506a]"
              disabled={!form.gameID || !form.key_code}
            >
              Save
            </button>
            {msg && <span className="text-sm">{msg}</span>}
          </div>
          <p className="text-sm opacity-80 mt-3">
            ℹ️ Keys with status <b>available</b> will be assigned when an order is approved.
          </p>
        </div>

        {/* Key List */}
        <div className="bg-[#152030] p-4 rounded-md mt-4">
          <h3 className="mb-3 font-medium">Key Stock</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-300">
                <th className="p-2">Game</th>
                <th className="p-2">Key</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.SteamkeyID} className="border-t border-[#0E1116]">
                  <td className="p-2">{k.title || k.gameID}</td>
                  <td className="p-2 font-mono">{k.key_code}</td>
                  <td className="p-2">{k.status}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => deleteKey(k.SteamkeyID)} className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr>
                  <td className="p-2 text-sm text-gray-300" colSpan={4}>
                    No keys listed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminShell>
    </AdminRoute>
  );
}
