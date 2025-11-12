"use client";

import { useMemo, useRef, useState } from "react";
import ImageServer from "@/components/imageserver/ImageServer";

export type GameFormValues = {
  title: string;
  description: string;
  price: number;               // tetap number di state parent
  image?: File | null;         // file baru (opsional)
  currentImageUrl?: string;    // url lama (saat edit)
};

export default function GameForm({
  values,
  onChange,
  onSubmit,
  submitText = "Save",
}: {
  values: GameFormValues;
  onChange: (patch: Partial<GameFormValues>) => void;
  onSubmit: () => void;
  submitText?: string;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // ——— UX: input harga (string tampilan), tapi state tetap number ———
  const [priceText, setPriceText] = useState<string>(values.price ? String(values.price) : "");
  // sinkronisasi kalau parent mereset form
  useMemo(() => {
    setPriceText(values.price ? String(values.price) : "");
  }, [values.price]);

  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; price?: string; image?: string }>({});

  const idr = (n: number) =>
    "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);

  function pickFile() {
    fileRef.current?.click();
  }
  function setFile(f: File | null) {
    onChange({ image: f });
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, image: "File harus berupa gambar." }));
      return;
    }
    setErrors((p) => ({ ...p, image: undefined }));
    setFile(f);
  }

  function validate() {
    const next: typeof errors = {};
    if (!values.title.trim()) next.title = "Judul wajib diisi.";
    if (!priceText.trim() || Number(priceText) <= 0) next.price = "Harga wajib diisi dan > 0.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onSubmit();
  }

  return (
    <div className="bg-[#152030] p-5 rounded-xl border border-white/10">
      {/* GRID: Title | Image | Price */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Title */}
        <div>
          <label className="block text-sm text-white/80 mb-1">Title</label>
          <input
            className={`w-full px-3 py-2 rounded bg-[#0E1116] text-white outline-none
                        ring-1 ring-transparent focus:ring-[#30506a] transition
                        ${errors.title ? "ring-1 ring-rose-500" : ""}`}
            placeholder="Contoh: Elden Ring"
            value={values.title}
            onChange={(e) => {
              if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
              onChange({ title: e.target.value });
            }}
          />
          {errors.title && <p className="mt-1 text-xs text-rose-300">{errors.title}</p>}
        </div>

        {/* Image with drag & drop */}
        <div>
          <label className="block text-sm text-white/80 mb-1">Image</label>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`group relative w-full h-28 rounded overflow-hidden border
                        ${dragOver ? "border-[#7CC3FF]" : "border-white/10"}
                        bg-[#0E1116] cursor-pointer flex items-center justify-center`}
            onClick={pickFile}
            role="button"
            aria-label="Upload image"
            title="Klik atau tarik file ke sini"
          >
            {/* Preview: file baru > gambar lama > placeholder */}
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : values.currentImageUrl ? (
              <ImageServer src={values.currentImageUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-white/60 text-sm">
                <div className="text-2xl mb-1">🖼️</div>
                Drag & drop / click to upload
              </div>
            )}

            {/* Overlay action */}
            <div
              className={`absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition grid place-items-center`}
            >
              <span className="bg-[#274056] hover:bg-[#30506a] text-sm px-3 py-1 rounded-full">Choose file</span>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              if (f && !f.type.startsWith("image/")) {
                setErrors((p) => ({ ...p, image: "File harus berupa gambar." }));
                return;
              }
              setErrors((p) => ({ ...p, image: undefined }));
              setFile(f);
            }}
          />

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setFile(null)}
              className="px-3 py-1 rounded bg-[#0E1116] hover:bg-[#151b23] text-xs transition"
            >
              Clear
            </button>
            <span className="text-xs text-white/50 self-center">.jpg .png • max ~5MB</span>
          </div>

          {errors.image && <p className="mt-1 text-xs text-rose-300">{errors.image}</p>}
        </div>

        {/* Price (Rupiah) */}
        <div>
          <label className="block text-sm text-white/80 mb-1">Price</label>
          <div className={`relative`}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 select-none">Rp</span>
            <input
              inputMode="numeric"
              className={`w-full pl-10 pr-3 py-2 rounded bg-[#0E1116] text-white outline-none
                          ring-1 ring-transparent focus:ring-[#30506a] transition
                          ${errors.price ? "ring-1 ring-rose-500" : ""}`}
              placeholder="0"
              value={priceText}
              onChange={(e) => {
                // terima hanya angka
                const raw = e.target.value.replace(/[^\d]/g, "");
                setPriceText(raw);
                onChange({ price: raw === "" ? 0 : Number(raw) });
                if (errors.price) setErrors((p) => ({ ...p, price: undefined }));
              }}
              onBlur={() => {
                // tetap tampil angka mentah, atau bisa di-format:
                // setPriceText(priceText ? String(Number(priceText)) : "");
              }}
            />
          </div>
          <div className="mt-1 text-xs text-white/50">
            {values.price > 0 ? idr(values.price) : "Masukkan harga produk"}
          </div>
          {errors.price && <p className="mt-1 text-xs text-rose-300">{errors.price}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <label className="block text-sm text-white/80 mb-1">Description</label>
        <textarea
          rows={4}
          className="w-full px-3 py-2 rounded bg-[#0E1116] text-white outline-none ring-1 ring-transparent focus:ring-[#30506a] transition"
          placeholder="Deskripsi singkat game, region, catatan aktivasi, dsb."
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
        <div className="mt-1 text-xs text-white/50">
          {values.description.length}/500
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          className="bg-[#274056] hover:bg-[#30506a] px-5 py-2 rounded-full font-semibold transition"
        >
          {submitText}
        </button>
        <span className="text-xs text-white/50">
          Pastikan gambar dan harga sudah benar sebelum menyimpan.
        </span>
      </div>
    </div>
  );
}
