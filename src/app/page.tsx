'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardCards } from '@/components/DashboardCards';
import { EntryTable } from '@/components/EntryTable';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { Entry } from '@/lib/types/database';
import { Upload, RefreshCw, AlertCircle, Camera } from 'lucide-react';

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
    <div>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Durga Puja Photography Competition 2026</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Internal 3-Model AI Screening Ensemble with Forensic Hashing & EXIF Camera Verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntries}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/upload"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photos</span>
          </Link>
        </div>
      </div>

      {/* Official Disclaimer */}
      <DisclaimerBanner />

      {/* Metrics Summary Cards */}
      <DashboardCards stats={stats} />

      {/* Main Table */}
      <EntryTable entries={entries} />
    </div>
  );
}
