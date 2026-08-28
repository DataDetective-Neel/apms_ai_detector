'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Send } from 'lucide-react';

interface HumanReviewFormProps {
  entryId: string;
  currentVerdict: string;
  onReviewSubmitted: () => void;
}

export function HumanReviewForm({ entryId, currentVerdict, onReviewSubmitted }: HumanReviewFormProps) {
  const [verdict, setVerdict] = useState(currentVerdict === 'PENDING' ? 'APPROVED' : currentVerdict);
  const [reviewerName, setReviewerName] = useState('Competition Organizer');
  const [adminNotes, setAdminNotes] = useState('');
  const [flaggedForHearing, setFlaggedForHearing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId,
          verdict,
          reviewerName,
          adminNotes,
          flaggedForHearing,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Verdict successfully recorded in competition audit log.');
        onReviewSubmitted();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err?.message || 'Failed to submit'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h4 className="text-base font-bold text-slate-900 mb-1">Human Committee Final Decision</h4>
      <p className="text-xs text-slate-500 mb-4">
        Automated AI scores serve as triage evidence only. Competition organizers make the final binding decision.
      </p>

      {message && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Official Verdict</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setVerdict('APPROVED')}
              className={`p-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                verdict === 'APPROVED'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve</span>
            </button>

            <button
              type="button"
              onClick={() => setVerdict('REJECTED')}
              className={`p-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                verdict === 'REJECTED'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              onClick={() => setVerdict('DISQUALIFIED')}
              className={`p-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                verdict === 'DISQUALIFIED'
                  ? 'bg-red-900 text-white border-red-950 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Disqualify</span>
            </button>

            <button
              type="button"
              onClick={() => setVerdict('NEEDS_MORE_INFO')}
              className={`p-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                verdict === 'NEEDS_MORE_INFO'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Need Info</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Reviewer Name</label>
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Committee Notes / Rationale</label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Record notes on forensic inspection, RAW file request, or jury consensus..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hearing"
            checked={flaggedForHearing}
            onChange={(e) => setFlaggedForHearing(e.target.checked)}
            className="rounded text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="hearing" className="text-slate-700 font-medium cursor-pointer">
            Flag for participant RAW file request / jury hearing
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-slate-900 text-white hover:bg-amber-600 rounded-lg font-bold shadow transition flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? 'Submitting Verdict...' : 'Save Committee Decision'}</span>
        </button>
      </form>
    </div>
  );
}
