import React from 'react';
import { Files, CheckCircle2, AlertTriangle, ShieldAlert, AlertCircle, Clock } from 'lucide-react';

interface StatsProps {
  stats: {
    total: number;
    completed: number;
    processing: number;
    aiSuspected: number;
    likelyAuthentic: number;
    manualReview: number;
    partialOrUnavailable: number;
    approved: number;
    rejected: number;
  };
}

export function DashboardCards({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
      {/* Total Entries */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Entries</span>
          <Files className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
          <span className="ml-1.5 text-xs text-slate-500">/ 300 max</span>
        </div>
      </div>

      {/* Likely Authentic (GREEN) */}
      <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Likely Authentic</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-emerald-900">{stats.likelyAuthentic}</span>
          <span className="block text-xs text-emerald-700 mt-0.5">Green Screened</span>
        </div>
      </div>

      {/* Manual Review (YELLOW) */}
      <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Manual Review</span>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-amber-900">{stats.manualReview}</span>
          <span className="block text-xs text-amber-700 mt-0.5">Split / Deadband</span>
        </div>
      </div>

      {/* AI Suspected (RED) */}
      <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">AI Suspected</span>
          <ShieldAlert className="w-4 h-4 text-rose-600" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-rose-900">{stats.aiSuspected}</span>
          <span className="block text-xs text-rose-700 mt-0.5">2+ AI Votes (Triage)</span>
        </div>
      </div>

      {/* Partial / Unavailable (GRAY) */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Partial / Error</span>
          <AlertCircle className="w-4 h-4 text-slate-500" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-slate-900">{stats.partialOrUnavailable}</span>
          <span className="block text-xs text-slate-600 mt-0.5">Needs Re-run</span>
        </div>
      </div>

      {/* Committee Approved */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-slate-900">{stats.approved}</span>
          <span className="block text-xs text-slate-500 mt-0.5">Final Verdict</span>
        </div>
      </div>

      {/* Committee Rejected / Disqualified */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disqualified</span>
          <ShieldAlert className="w-4 h-4 text-red-500" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-slate-900">{stats.rejected}</span>
          <span className="block text-xs text-slate-500 mt-0.5">Human Decision</span>
        </div>
      </div>
    </div>
  );
}
