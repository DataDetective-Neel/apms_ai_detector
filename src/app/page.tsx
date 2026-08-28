'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardCards } from '@/components/DashboardCards';
import { EntryTable } from '@/components/EntryTable';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { Entry } from '@/lib/types/database';
import { Upload, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    aiSuspected: 0,
    likelyAuthentic: 0,
    manualReview: 0,
    partialOrUnavailable: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/entries');
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return (
    <div className="space-y-6">
      {/* Featured Durga Puja Festival Header Card */}
      <div className="relative bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl border border-amber-500/30 overflow-hidden shadow-xl text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
        
        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Competition Portal • 2026 Edition</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Durga Puja Photography Competition
            </h1>

            <p className="text-xs sm:text-sm text-amber-100/80 leading-relaxed">
              3-Model AI Screening Ensemble with Forensic Hashing & EXIF Camera Verification. Protecting authentic photography through fair majority-vote triage.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/upload"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photographs</span>
              </Link>

              <button
                onClick={fetchEntries}
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Cultural Visual Art Card */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Durga Idol Showcase Image */}
            <div className="w-32 sm:w-40 aspect-[4/5] rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-slate-950 relative group">
              <img
                src="/images/durga-idol-showcase.jpg"
                alt="Durga Idol Pandal Art"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-bold text-amber-300">Pandal Showcase</span>
              </div>
            </div>

            {/* Official Circular Emblem */}
            <div className="w-24 sm:w-28 aspect-square rounded-full overflow-hidden border-2 border-amber-400 p-1 bg-white shadow-2xl shrink-0 hidden sm:flex items-center justify-center">
              <img
                src="/images/apms-emblem.jpg"
                alt="APMS Competition Seal"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Official Disclaimer */}
      <DisclaimerBanner />

      {/* Metrics Summary Cards */}
      <DashboardCards stats={stats} />

      {/* Main Table with onEntryDeleted handler */}
      <EntryTable entries={entries} onEntryDeleted={fetchEntries} />
    </div>
  );
}
