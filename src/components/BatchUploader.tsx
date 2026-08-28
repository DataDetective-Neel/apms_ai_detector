'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';

export function BatchUploader() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [participantName, setParticipantName] = useState('Competition Participant');
  const [category, setCategory] = useState('Pooja Moments');
  const [isUploading, setIsUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setIsUploading(true);
    setProgressText(`Uploading & analyzing ${files.length} photograph(s)...`);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      formData.append('participantName', participantName);
      formData.append('category', category);

      const res = await fetch('/api/batch-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setUploadResult(data);
      if (data.success) {
        setProgressText(`Successfully processed ${data.processedCount} photographs!`);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setProgressText(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setProgressText(`Upload failed: ${err?.message || 'Network error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900">Upload Competition Photographs</h2>
      <p className="text-xs text-slate-500 mt-1 mb-6">
        Upload single or batch photographs for Durga Puja competition screening (~300 capacity). Original files are stored securely and analyzed by the 3-detector ensemble.
      </p>

      <form onSubmit={handleUpload} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Participant / Submitter Name</label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Competition Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Pooja Moments">Pooja Moments</option>
              <option value="Immersion (Bishorjon)">Immersion (Bishorjon)</option>
              <option value="Traditional Pandal">Traditional Pandal</option>
              <option value="Street & Cultural">Street & Cultural</option>
              <option value="Creative & Artistic">Creative & Artistic</option>
            </select>
          </div>
        </div>

        {/* Drag Drop Box */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Select Photographs (Single or Batch)</label>
          <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-amber-50/40">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <span className="font-semibold text-slate-800 text-sm">Click to choose files</span>
              <span className="text-slate-500 block mt-0.5">or drag and drop JPG, PNG, WebP up to 50MB</span>
            </label>
          </div>
        </div>

        {files.length > 0 && (
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>Selected Files ({files.length}):</span>
              <span className="text-amber-700">Ready for batch queue</span>
            </div>
            <ul className="mt-2 space-y-1 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-600">
              {files.map((f, i) => (
                <li key={i} className="truncate">
                  {i + 1}. {f.name} ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        {progressText && (
          <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg font-medium flex items-center gap-2">
            {isUploading && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
            <span>{progressText}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={files.length === 0 || isUploading}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow transition flex items-center justify-center gap-2 ${
            files.length === 0 || isUploading
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>{isUploading ? 'Running 3-Detector Ensemble...' : `Upload & Process ${files.length} Photo(s)`}</span>
        </button>
      </form>
    </div>
  );
}
