"use client";
export default function ConfirmDialog({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-[#152030] shadow-xl border border-[#274056]">
          <div className="px-5 py-4 border-b border-[#274056]">
            <h3 className="text-white font-semibold">{title}</h3>
          </div>
          <div className="px-5 py-4 text-gray-200">
            {message}
          </div>
          <div className="px-5 py-4 flex justify-end gap-2 border-t border-[#274056]">
            <button
              onClick={onCancel}
              className="bg-[#0E1116] hover:bg-[#1c2027] px-4 py-2 rounded"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="bg-red-700 hover:brightness-110 px-4 py-2 rounded"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
