import { NextRequest, NextResponse } from 'next/server';
import { processPhotographUpload } from '@/lib/queue/job-queue';
import { db } from '@/lib/supabase/db';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyUploadTicket } from '@/lib/upload-ticket';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let pendingPath: string | undefined;
  try {
    let files: File[];
    let category: string;
    let defaultParticipant: string;
    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json();
      const ticket = verifyUploadTicket(body.ticket);
      pendingPath = ticket.path;
      const { data, error } = await supabaseAdmin.storage.from('competition-photos').download(ticket.path);
      if (error || !data) throw new Error(error?.message || 'Uploaded photograph not found');
      if (data.size !== ticket.size) throw new Error('Uploaded photograph size does not match');
      files = [new File([data], ticket.name, { type: ticket.type })];
      category = body.category || 'General';
      defaultParticipant = body.participantName || 'Competition Participant';
    } else {
      const formData = await req.formData();
      files = formData.getAll('files') as File[];
      category = (formData.get('category') as string) || 'General';
      defaultParticipant = (formData.get('participantName') as string) || 'Competition Participant';
    }

    console.log(`[API-BATCH-UPLOAD] Request received with ${files.length} file(s) | Category: ${category}`);

    if (!files || files.length === 0) {
      console.warn('[API-BATCH-UPLOAD] Rejected: No files provided in payload.');
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

      console.log(`[API-BATCH-UPLOAD] Processing file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes, type: ${file.type}) -> Generated Entry ID: ${entryId}`);

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

        console.log(`[API-BATCH-UPLOAD] [SUCCESS] Entry ID: ${entryId} completed.`);
        results.push(res.entry);
      } catch (err: any) {
        console.error(`[API-BATCH-UPLOAD] [ERROR] Entry ID: ${entryId} failed for file ${file.name}:`, err?.message || err);
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
    console.error('[API-BATCH-UPLOAD] [FATAL-ERROR]:', error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || 'Batch upload failed' }, { status: 500 });
  } finally {
    if (pendingPath) {
      const { error } = await supabaseAdmin.storage.from('competition-photos').remove([pendingPath]);
      if (error) console.error('[API-BATCH-UPLOAD] Could not remove temporary upload:', error.message);
    }
  }
}
