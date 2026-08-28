'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Entry } from '@/lib/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { DetectorResultCard } from '@/components/DetectorResultCard';
import { ExifViewer } from '@/components/ExifViewer';
import { HumanReviewForm } from '@/components/HumanReviewForm';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Fingerprint,
  Layers,
  Trash2,
} from 'lucide-react';

export default function EntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeMsg, setReanalyzeMsg] = useState<string | null>(null);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchEntry = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/entries/${entryId}`);
      const data = await res.json();
      if (data.success) {
        setEntry(data.entry);
      }
    } catch (err) {
      console.error('Error fetching entry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entryId) {
      fetchEntry();
    }
  }, [entryId]);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    setReanalyzeMsg(null);
    try {
      const res = await fetch('/api/reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      const data = await res.json();
      if (data.success) {
        setEntry(data.entry);
        setReanalyzeMsg('Re-analysis completed successfully.');
      } else {
        setReanalyzeMsg(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setReanalyzeMsg(`Failed: ${err?.message || 'Error'}`);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setDeleteError(data.error || 'Failed to delete entry');
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Network error deleting entry');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-3" />
        <p className="font-semibold text-sm">Loading entry forensic report...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="py-16 text-center text-slate-700">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Entry Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">No photograph found with ID {entryId}.</p>
        <Link href="/" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-amber-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>{reanalyzing ? 'Re-analyzing...' : 'Run Analysis Again'}</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete Photo</span>
          </button>
        </div>
      </div>

      {reanalyzeMsg && (
        <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold">
          {reanalyzeMsg}
        </div>
      )}

      {deleteError && (
        <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-lg text-xs font-semibold">
          {deleteError}
        </div>
      )}

      {/* Official Disclaimer */}
      <DisclaimerBanner />

      {/* Main Grid: Left (Image & Hashes), Right (Ensemble Decision) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image & Forensic Hashes (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Image Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="relative bg-slate-950 aspect-[4/3] flex items-center justify-center">
              {entry.image?.signed_url ? (
                <img
                  src={entry.image.signed_url}
                  alt={entry.photo_title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-xs">No image available</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-slate-900">{entry.photo_title}</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                  {entry.category}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                <span>By </span>
                <strong className="text-slate-800">{entry.participant_name}</strong>
                {entry.club_affiliation && ` (${entry.club_affiliation})`}
              </div>
              {entry.image && (
                <div className="text-[11px] text-slate-400 font-mono">
                  {entry.image.width} × {entry.image.height} px • {(entry.image.file_size_bytes / (1024 * 1024)).toFixed(2)} MB • {entry.image.mime_type}
                </div>
              )}
            </div>
          </div>

          {/* Forensic Hash & Duplication Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-amber-600" />
              <span>Cryptographic & Perceptual Hashes</span>
            </h4>

            {entry.duplicate_matches && entry.duplicate_matches.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Duplicate Flagged ({entry.duplicate_matches.length} Match)</span>
                </div>
                {entry.duplicate_matches.map((m, idx) => (
                  <p key={idx} className="text-[11px]">
                    Matched with <strong>{m.matched_entry_id}</strong> ({m.match_type}: {m.similarity_percentage}% similarity)
                  </p>
                ))}
              </div>
            )}

            <div>
              <span className="text-slate-500 font-medium block">SHA-256 Hash (Exact Deduplication):</span>
              <span className="font-mono text-[11px] text-slate-800 bg-slate-50 p-1.5 rounded border border-slate-200 block break-all mt-0.5">
                {entry.image?.sha256 || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Perceptual dHash (Visual Similarity):</span>
              <span className="font-mono text-[11px] text-slate-800 bg-slate-50 p-1.5 rounded border border-slate-200 block break-all mt-0.5">
                {entry.image?.phash || 'N/A'}
              </span>
            </div>
          </div>

          {/* EXIF Viewer */}
          <ExifViewer metadata={entry.metadata} />
        </div>

        {/* Right Column: 3-Model Ensemble Decision, Breakdown, and Review Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Majority Voting Summary Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Entry ID: {entry.id}</div>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">3-Model Ensemble Assessment</h3>
              </div>
              <StatusBadge status={entry.overall_result} size="lg" />
            </div>

            {/* Voting Score Box */}
            <div className="grid grid-cols-3 gap-3 my-4 text-center">
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <span className="text-xs font-semibold text-rose-800 block">AI Votes</span>
                <span className="text-2xl font-bold text-rose-900 mt-1 block">{entry.ai_votes} / 3</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-xs font-semibold text-emerald-800 block">Real Votes</span>
                <span className="text-2xl font-bold text-emerald-900 mt-1 block">{entry.real_votes} / 3</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-xs font-semibold text-amber-800 block">Inconclusive</span>
                <span className="text-2xl font-bold text-amber-900 mt-1 block">{entry.inconclusive_votes || 0} / 3</span>
              </div>
            </div>

            {/* Summary Explanation */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
              <p className="font-semibold text-slate-900">Ensemble Summary:</p>
              <p>{entry.summary_explanation}</p>
            </div>

            {/* Separate Tasks Reporting */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                  Task A: Full AI Generation Detection
                </span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {entry.overall_result === 'AI_SUSPECTED'
                    ? 'AI SUSPECTED (Full Synthesis Flagged)'
                    : entry.overall_result === 'LIKELY_AUTHENTIC'
                    ? 'LIKELY AUTHENTIC (Camera Consistent)'
                    : 'MANUAL REVIEW REQUIRED'}
                </span>
              </div>

              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                  Task B: AI Inpainting / Edit Detection
                </span>
                <span className="font-semibold text-slate-600 mt-1 block text-[11px]">
                  NOT AVAILABLE (Full-image classifiers active; localized Generative Fill requires visual inspection)
                </span>
              </div>
            </div>
          </div>

          {/* 3 Individual Detector Cards */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Independent Detector Breakdown</span>
            </h4>

            <div className="grid grid-cols-1 gap-4">
              {entry.detector_results && entry.detector_results.length >= 3 ? (
                <>
                  <DetectorResultCard
                    detector={entry.detector_results[0]}
                    detectorNumber={1}
                    friendlyName="SwinV2 Transformer"
                    architecture="Hierarchical Shifted Window Transformer (5.9% FPR, High Precision Anchor)"
                  />
                  <DetectorResultCard
                    detector={entry.detector_results[1]}
                    detectorNumber={2}
                    friendlyName="SigLIP Vision-Language Classifier"
                    architecture="Sigmoid Contrastive Vision-Language Backbone"
                  />
                  <DetectorResultCard
                    detector={entry.detector_results[2]}
                    detectorNumber={3}
                    friendlyName="ViT-Base Photographic Artifact Detector"
                    architecture="Conservative Vision Transformer Sentry"
                  />
                </>
              ) : (
                <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                  No detector breakdown data available for this run.
                </div>
              )}
            </div>
          </div>

          {/* Human Committee Review Form */}
          <HumanReviewForm
            entryId={entry.id}
            currentVerdict={entry.review_verdict}
            onReviewSubmitted={fetchEntry}
          />

          {/* Past Review History */}
          {entry.reviews && entry.reviews.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Committee Decision History</h4>
              <div className="space-y-2">
                {entry.reviews.map((rev, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{rev.reviewer_name}</span>
                      <StatusBadge status={rev.verdict} size="sm" />
                    </div>
                    {rev.admin_notes && <p className="text-slate-700 italic">"{rev.admin_notes}"</p>}
                    <span className="text-[11px] text-slate-400 block">{new Date(rev.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        entry={entry}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
