"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmToast({
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
