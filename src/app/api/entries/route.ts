import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { processPhotographUpload } from '@/lib/queue/job-queue';

export async function GET() {
  try {
    const entries = await db.getAllEntries();

    const stats = {
      total: entries.length,
      completed: entries.filter((e) => e.status === 'COMPLETED').length,
      processing: entries.filter((e) => e.status === 'PROCESSING' || e.status === 'QUEUED').length,
      aiSuspected: entries.filter((e) => e.overall_result === 'AI_SUSPECTED').length,
      likelyAuthentic: entries.filter((e) => e.overall_result === 'LIKELY_AUTHENTIC').length,
      manualReview: entries.filter((e) => e.overall_result === 'MANUAL_REVIEW').length,
      partialOrUnavailable: entries.filter((e) => e.overall_result === 'PARTIAL_ANALYSIS' || e.overall_result === 'ANALYSIS_UNAVAILABLE').length,
      approved: entries.filter((e) => e.review_verdict === 'APPROVED').length,
      rejected: entries.filter((e) => e.review_verdict === 'REJECTED' || e.review_verdict === 'DISQUALIFIED').length,
    };

    return NextResponse.json({ success: true, stats, entries });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch entries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const entryId = (formData.get('entryId') as string) || `APMS-2026-${String(Date.now()).slice(-4)}`;
    const participantName = (formData.get('participantName') as string) || 'Anonymous Participant';
    const participantEmail = (formData.get('participantEmail') as string) || '';
    const participantPhone = (formData.get('participantPhone') as string) || '';
    const clubAffiliation = (formData.get('clubAffiliation') as string) || '';
    const category = (formData.get('category') as string) || 'Pooja Moments';
    const photoTitle = (formData.get('photoTitle') as string) || file?.name || 'Untitled';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No photo file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const result = await processPhotographUpload({
      entryId,
      participantName,
      participantEmail,
      participantPhone,
      clubAffiliation,
      category,
      photoTitle,
      originalFilename: file.name,
      mimeType: file.type || 'image/jpeg',
      fileBuffer,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error processing single upload:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Processing failed' }, { status: 500 });
  }
}
