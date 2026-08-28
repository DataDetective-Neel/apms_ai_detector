import React from 'react';
import { OverallResult, RiskLevel } from '@/lib/detectors/detector-interface';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: OverallResult | string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-300';
  let Icon = HelpCircle;
  let label = status;

  switch (status) {
    case 'LIKELY_AUTHENTIC':
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
      Icon = CheckCircle;
      label = 'LIKELY AUTHENTIC';
      break;
    case 'MANUAL_REVIEW':
      bgClass = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      Icon = AlertTriangle;
      label = 'MANUAL REVIEW';
      break;
    case 'AI_SUSPECTED':
      bgClass = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
      Icon = XCircle;
      label = 'AI SUSPECTED';
      break;
    case 'PARTIAL_ANALYSIS':
      bgClass = 'bg-purple-50 text-purple-700 border-purple-300 font-medium';
      Icon = AlertTriangle;
      label = 'PARTIAL ANALYSIS';
      break;
    case 'ANALYSIS_UNAVAILABLE':
      bgClass = 'bg-gray-100 text-gray-700 border-gray-300 font-medium';
      Icon = HelpCircle;
      label = 'ANALYSIS UNAVAILABLE';
      break;
    case 'QUEUED':
    case 'PROCESSING':
      bgClass = 'bg-blue-50 text-blue-700 border-blue-300 font-medium';
      label = 'PROCESSING';
      break;
    case 'APPROVED':
      bgClass = 'bg-emerald-600 text-white border-emerald-700 font-bold';
      Icon = CheckCircle;
      label = 'APPROVED';
      break;
    case 'REJECTED':
      bgClass = 'bg-rose-600 text-white border-rose-700 font-bold';
      Icon = XCircle;
      label = 'REJECTED';
      break;
    case 'DISQUALIFIED':
      bgClass = 'bg-red-900 text-white border-red-950 font-bold';
      Icon = XCircle;
      label = 'DISQUALIFIED';
      break;
    case 'NEEDS_MORE_INFO':
      bgClass = 'bg-amber-500 text-white border-amber-600 font-bold';
      Icon = AlertTriangle;
      label = 'NEEDS MORE INFO';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${sizeClass} ${bgClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
