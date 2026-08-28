import { NextRequest, NextResponse } from 'next/server';
import { processPhotographUpload } from '@/lib/queue/job-queue';
import { db } from '@/lib/supabase/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const category = (formData.get('category') as string) || 'General';
    const defaultParticipant = (formData.get('participantName') as string) || 'Competition Participant';

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
    }

    const existing = await db.getAllEntries();
    let currentSeq = existing.length;

    const results = [];
    const errors = [];

    // Process batch items
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      currentSeq++;
      const entryId = `APMS-2026-${String(currentSeq).padStart(3, '0')}`;
      const photoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        const res = await processPhotographUpload({
          entryId,
          participantName: defaultParticipant,
          category,
          photoTitle,
          originalFilename: file.name,
          mimeType: file.type || 'image/jpeg',
          fileBuffer,
        });

        results.push(res.entry);
      } catch (err: any) {
        console.error(`Batch processing failed for ${file.name}:`, err);
        errors.push({ filename: file.name, error: err?.message || 'Failed' });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      errorCount: errors.length,
      entries: results,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Batch upload failed' }, { status: 500 });
  }
}
