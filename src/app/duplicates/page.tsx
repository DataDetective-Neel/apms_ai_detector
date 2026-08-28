'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { DuplicateMatchRecord, Entry } from '@/lib/types/database';
import { Copy, AlertTriangle, Eye, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

interface EnrichedDuplicate extends DuplicateMatchRecord {
  source_entry?: Entry;
  matched_entry?: Entry;
}

export default function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState<EnrichedDuplicate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/duplicates');
      const data = await res.json();
      if (data.success) {
        setDuplicates(data.duplicates);
      }
    } catch (err) {
      console.error('Error fetching duplicates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-amber-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Copy className="w-6 h-6 text-amber-600" />
            <span>Duplicate & Near-Duplicate Detection</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Photographs flagged via exact SHA-256 hash or perceptual dHash visual similarity (≥85%).
          </p>
        </div>

        <button
          onClick={fetchDuplicates}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <DisclaimerBanner />

      {/* Duplicate Pairs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
            <span>Loading duplicate pairs...</span>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-600 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Duplicates Detected</h3>
            <p className="text-xs text-slate-500 mt-1">
              All competition photographs currently have unique SHA-256 signatures and perceptual hashes.
            </p>
          </div>
        ) : (
          duplicates.map((dup) => {
            const srcImg = dup.source_entry?.image?.signed_url || `/uploads/${dup.source_entry?.image?.filename}`;
            const matchImg = dup.matched_entry?.image?.signed_url || `/uploads/${dup.matched_entry?.image?.filename}`;

            return (
              <div key={dup.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {dup.match_type === 'EXACT_SHA256' ? 'Exact SHA-256 Match' : 'Perceptual Visual Similarity'}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        Similarity: <strong>{dup.similarity_percentage}%</strong> (Hamming Distance: {dup.hamming_distance})
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{new Date(dup.created_at).toLocaleString()}</span>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  {/* Source Entry */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex gap-3 items-center">
                    <div className="w-20 h-20 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                      {srcImg ? (
                        <img src={srcImg} alt={dup.source_entry?.photo_title || ''} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="text-xs space-y-1 truncate">
                      <div className="font-bold text-amber-700">{dup.source_entry_id}</div>
                      <div className="font-semibold text-slate-900 truncate">{dup.source_entry?.photo_title}</div>
                      <div className="text-slate-500 text-[11px]">By {dup.source_entry?.participant_name}</div>
                      <Link
                        href={`/entries/${dup.source_entry_id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 font-semibold mt-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Entry</span>
                      </Link>
                    </div>
                  </div>

                  {/* Matched Entry */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex gap-3 items-center">
                    <div className="w-20 h-20 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                      {matchImg ? (
                        <img src={matchImg} alt={dup.matched_entry?.photo_title || ''} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="text-xs space-y-1 truncate">
                      <div className="font-bold text-amber-700">{dup.matched_entry_id}</div>
                      <div className="font-semibold text-slate-900 truncate">{dup.matched_entry?.photo_title}</div>
                      <div className="text-slate-500 text-[11px]">By {dup.matched_entry?.participant_name}</div>
                      <Link
                        href={`/entries/${dup.matched_entry_id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 font-semibold mt-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Entry</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
