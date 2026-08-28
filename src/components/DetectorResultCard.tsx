'use client';

import React, { useState } from 'react';
import { DetectorResult } from '@/lib/detectors/detector-interface';
import { StatusBadge } from './StatusBadge';
import { ChevronDown, ChevronUp, Cpu, Gauge, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

interface DetectorResultCardProps {
  detector: DetectorResult;
  detectorNumber: number;
  friendlyName: string;
  architecture: string;
}

export function DetectorResultCard({
  detector,
  detectorNumber,
  friendlyName,
  architecture,
}: DetectorResultCardProps) {
  const [showRaw, setShowRaw] = useState(false);

  const aiPercent = Math.round(detector.aiScore * 100);
  const realPercent = Math.round(detector.realScore * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Detector {detectorNumber}</div>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">{friendlyName}</h4>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>{architecture}</span>
            </div>
          </div>
          <StatusBadge status={detector.classification} size="sm" />
        </div>

        {/* Model ID */}
        <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 truncate">
          {detector.modelId}
        </div>

        {/* Scores Bar */}
        <div className="mt-4 space-y-2">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>Synthetic / AI Probability:</span>
              <span className="font-bold text-rose-600">{aiPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${aiPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>Natural Photo Probability:</span>
              <span className="font-bold text-emerald-600">{realPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${realPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-4 text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-200">
          {detector.explanation}
        </div>
      </div>

      {/* Footer Info & Raw Viewer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{detector.processingTimeMs} ms</span>
          </span>
          <span className="px-2 py-0.5 bg-slate-100 rounded border text-[11px] uppercase font-semibold">
            {detector.provider}
          </span>
        </div>

        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 text-xs"
        >
          <span>{showRaw ? 'Hide JSON' : 'Raw JSON'}</span>
          {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showRaw && (
        <pre className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
          {JSON.stringify(detector.rawResponse || detector, null, 2)}
        </pre>
      )}
    </div>
  );
}
