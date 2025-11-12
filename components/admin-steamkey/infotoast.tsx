"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function InfoToast({
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
            <button
              className="ml-2 text-xs underline opacity-80 hover:opacity-100"
              onClick={onClose}
            >
              Tutup
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
