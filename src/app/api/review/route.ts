import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entryId, verdict, reviewerName, reviewerRole, adminNotes, flaggedForHearing } = body;

    if (!entryId || !verdict || !reviewerName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await db.addReview({
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entry_id: entryId,
      verdict,
      reviewer_name: reviewerName,
      reviewer_role: reviewerRole || 'Organizer / Judge',
      admin_notes: adminNotes || '',
      flagged_for_hearing: Boolean(flaggedForHearing),
      created_at: new Date().toISOString(),
    });

    await db.logAudit('HUMAN_REVIEW_RECORDED', 'entry', entryId, { verdict, reviewerName, adminNotes }, reviewerName);

    const updated = await db.getEntryById(entryId);
    return NextResponse.json({ success: true, entry: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to submit review' }, { status: 500 });
  }
}
