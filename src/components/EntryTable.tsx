'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Entry } from '@/lib/types/database';
import { StatusBadge } from './StatusBadge';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Search, Eye, AlertCircle, Filter, Trash2 } from 'lucide-react';

interface EntryTableProps {
  entries: Entry[];
  onEntryDeleted?: () => void;
}

export function EntryTable({ entries, onEntryDeleted }: EntryTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Deletion modal state
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categories = ['ALL', ...Array.from(new Set(entries.map((e) => e.category)))];

  const filtered = entries.filter((e) => {
    const matchesSearch =
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.photo_title.toLowerCase().includes(search.toLowerCase()) ||
      e.participant_name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || e.overall_result === statusFilter || e.review_verdict === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/entries/${entryToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setEntryToDelete(null);
        if (onEntryDeleted) {
          onEntryDeleted();
        }
      } else {
        setDeleteError(data.error || 'Failed to delete entry');
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Network error deleting entry');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, title, participant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="LIKELY_AUTHENTIC">Likely Authentic</option>
              <option value="AI_SUSPECTED">AI Suspected</option>
              <option value="MANUAL_REVIEW">Manual Review</option>
              <option value="PARTIAL_ANALYSIS">Partial / Error</option>
              <option value="APPROVED">Verdict: Approved</option>
              <option value="DISQUALIFIED">Verdict: Disqualified</option>
            </select>
          </div>
        </div>

        {deleteError && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} className="text-rose-600 hover:text-rose-800 text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Entry ID & Title</th>
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">AI Votes</th>
                <th className="px-4 py-3">Automated Assessment</th>
                <th className="px-4 py-3">Committee Verdict</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-medium">No competition entries match your filter criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Upload photographs using the button above.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-sm shrink-0">
                          {entry.image?.signed_url ? (
                            <img
                              src={entry.image.signed_url}
                              alt={entry.photo_title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No img</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="font-semibold text-amber-700">{entry.id}</div>
                        <div className="text-slate-800 text-xs mt-0.5 truncate max-w-xs">{entry.photo_title}</div>
                        {entry.duplicate_matches && entry.duplicate_matches.length > 0 && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                            Duplicate Alert ({entry.duplicate_matches.length})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 text-xs">{entry.participant_name}</div>
                        <div className="text-slate-500 text-[11px]">{entry.club_affiliation || 'Independent'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{entry.category}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center font-bold text-xs px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                          <span className={entry.ai_votes >= 2 ? 'text-rose-600' : 'text-slate-700'}>{entry.ai_votes}</span>
                          <span className="text-slate-400 mx-0.5">/</span>
                          <span className="text-slate-500">3 AI</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={entry.overall_result} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={entry.review_verdict} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/entries/${entry.id}`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 text-white hover:bg-amber-600 rounded-lg text-xs font-semibold shadow-sm transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setEntryToDelete(entry)}
                            title="Delete Photo & Free Storage"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(entryToDelete)}
        entry={entryToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setEntryToDelete(null)}
      />
    </>
  );
}
