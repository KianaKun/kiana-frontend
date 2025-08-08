"use client";
import { useRef, useState } from "react";
import ImageServer from "@/components/ui/ImageServer";

export type GameFormValues = {
  title: string;
  description: string;
  price: number;
  image?: File | null;       // file baru
  currentImageUrl?: string;  // url lama dari DB (untuk edit)
};

export default function GameForm({
  values, onChange, onSubmit, submitText = "Save",
}: {
  values: GameFormValues;
  onChange: (patch: Partial<GameFormValues>) => void;
  onSubmit: () => void;
  submitText?: string;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="bg-[#152030] p-4 rounded-md">
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm">Title</label>
          <input className="w-full px-3 py-2 bg-[#0E1116] rounded"
                 value={values.title}
                 onChange={(e) => onChange({ title: e.target.value })}/>
        </div>

        <div>
          <label className="text-sm">Image</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="w-full px-3 py-2 bg-[#0E1116] rounded"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              onChange({ image: f });
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          {/* preview: file baru > gambar lama > placeholder */}
          <div className="mt-2 w-full h-28">
            {preview ? (
              <img src={preview} className="w-full h-full object-cover rounded" />
            ) : (
              <ImageServer src={values.currentImageUrl} className="w-full h-full object-cover rounded" />
            )}
          </div>
        </div>

        <div>
          <label className="text-sm">Price</label>
          <input type="number" className="w-full px-3 py-2 bg-[#0E1116] rounded"
                 value={values.price}
                 onChange={(e) => onChange({ price: Number(e.target.value) })}/>
        </div>
      </div>

      <div className="mt-3">
        <label className="text-sm">Description</label>
        <textarea rows={3} className="w-full px-3 py-2 bg-[#0E1116] rounded"
                  value={values.description}
                  onChange={(e) => onChange({ description: e.target.value })}/>
      </div>

      <div className="mt-3">
        <button onClick={onSubmit} className="bg-[#274056] px-4 py-2 rounded hover:bg-[#30506a]">
          {submitText}
        </button>
      </div>
    </div>
  );
}
