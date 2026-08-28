import React from 'react';
import { MetadataRecord } from '@/lib/types/database';
import { Camera, Aperture, Clock, Zap, Layers, Info } from 'lucide-react';

interface ExifViewerProps {
  metadata?: MetadataRecord | null;
  sha256?: string;
  phash?: string;
}

export function ExifViewer({ metadata, sha256, phash }: ExifViewerProps) {
  if (!metadata || !metadata.has_exif) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-600" />
          <span>Forensic Camera Metadata</span>
        </h4>
        <div className="mt-3 p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1">No EXIF Metadata Header Found</p>
          <p>
            <strong>Important Competition Rule:</strong> Missing EXIF metadata does <em>not</em> prove an image is AI-generated. Photographs transferred via messaging platforms (WhatsApp, Messenger) or social media often have metadata automatically removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-600" />
          <span>Forensic Camera & Capture Metadata</span>
        </h4>
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
          EXIF Verified
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block">Camera Make / Model:</span>
          <span className="font-semibold text-slate-900 mt-0.5 block">
            {metadata.camera_make || ''} {metadata.camera_model || 'Unknown'}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block">Lens:</span>
          <span className="font-semibold text-slate-900 mt-0.5 block truncate">
            {metadata.lens_model || 'Standard / Kit'}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block">Focal Length:</span>
          <span className="font-semibold text-slate-900 mt-0.5 block">
            {metadata.focal_length || 'N/A'}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block">Aperture:</span>
          <span className="font-semibold text-slate-900 mt-0.5 block">
            {metadata.aperture || 'N/A'}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block">Shutter Speed:</span>
          <span className="font-semibold text-slate-900 mt-0.5 block">
            {metadata.shutter_speed || 'N/A'}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block">ISO Sensitivity:</span>
          <span className="font-semibold text-slate-900 mt-0.5 block">
            {metadata.iso ? `ISO ${metadata.iso}` : 'N/A'}
          </span>
        </div>
      </div>

      {metadata.software_tags && (
        <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-950">
          <span className="font-semibold">Software Tag: </span>
          <span>{metadata.software_tags}</span>
          <span className="block text-[11px] text-blue-800 mt-1">
            (Notice: Normal post-processing in Adobe Photoshop or Lightroom is permitted under competition guidelines unless rules explicitly forbid editing).
          </span>
        </div>
      )}
    </div>
  );
}
