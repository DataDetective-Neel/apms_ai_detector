import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { prepareAnalysisImage } from '@/lib/forensic/image-resizer';
import { runEnsembleAnalysis } from '@/lib/detectors';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { entryId } = await req.json();
    if (!entryId) {
      return NextResponse.json({ success: false, error: 'Missing entryId' }, { status: 400 });
    }

    const entry = await db.getEntryById(entryId);
    if (!entry || !entry.image) {
      return NextResponse.json({ success: false, error: 'Entry or image not found' }, { status: 404 });
    }

    // Read stored file
    const localFileName = path.basename(entry.image.storage_path_original);
    const localFilePath = path.join(process.cwd(), 'public', 'uploads', localFileName);

    if (!fs.existsSync(localFilePath)) {
      return NextResponse.json({ success: false, error: 'Original image file not found on disk' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const imgInfo = await prepareAnalysisImage(fileBuffer);

    // Re-run ensemble
    const decision = await runEnsembleAnalysis(imgInfo.analysisBuffer);

    // Update entry with new run results
    const updatedEntry = {
      ...entry,
      overall_result: decision.overallResult,
      risk_level: decision.riskLevel,
      ai_votes: decision.aiVotes,
      real_votes: decision.realVotes,
      inconclusive_votes: decision.inconclusiveVotes,
      error_votes: decision.errorVotes,
      summary_explanation: decision.summaryExplanation,
      detector_results: decision.detectorResults,
      updated_at: new Date().toISOString(),
    };

    await db.saveEntry(updatedEntry);
    await db.logAudit('RE_ANALYSIS_COMPLETED', 'entry', entryId, { decision }, 'admin');

    return NextResponse.json({ success: true, entry: updatedEntry, decision });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Re-analysis failed' }, { status: 500 });
  }
}
