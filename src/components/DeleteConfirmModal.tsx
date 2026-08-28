'use client';

import React from 'react';
import { Entry } from '@/lib/types/database';
import { Trash2, AlertTriangle, X, RefreshCw } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  entry: Entry | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  entry,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  if (!isOpen || !entry) return null;

  const imgUrl = entry.image?.signed_url || `/uploads/${entry.image?.filename}`;
  const fileSizeMb = entry.image?.file_size_bytes
    ? (entry.image.file_size_bytes / (1024 * 1024)).toFixed(2)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-rose-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Photo & Free Storage</h3>
              <p className="text-xs text-slate-500 mt-0.5">Permanent removal confirmation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-600">
          {/* Target Photo Preview Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden border border-slate-300 shrink-0 relative">
              {entry.image?.signed_url ? (
                <img
                  src={entry.image.signed_url}
                  alt={entry.photo_title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                  No img
                </div>
              )}
            </div>

            <div className="truncate space-y-0.5 flex-1">
              <div className="font-mono font-bold text-amber-700 text-xs">{entry.id}</div>
              <div className="font-semibold text-slate-900 truncate text-xs">{entry.photo_title}</div>
              <div className="text-slate-500 text-[11px]">
                By {entry.participant_name} • {entry.category}
              </div>
              {fileSizeMb && (
                <div className="text-slate-400 text-[10px] font-mono">
                  Storage size: {fileSizeMb} MB
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed text-[11px] space-y-1">
            <p className="font-semibold">What will be removed:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800">
              <li>Pristine original file in Supabase Storage</li>
              <li>AI detector majority vote and 3-model breakdown</li>
              <li>Forensic EXIF camera and software metadata</li>
              <li>Committee audit logs and review verdicts</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting & Cleaning Storage...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
