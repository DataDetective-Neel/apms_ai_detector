import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';

export async function GET() {
  try {
    const duplicates = await db.getAllDuplicateMatches();
    const entries = await db.getAllEntries();
    const entryMap = new Map(entries.map((e) => [e.id, e]));

    const enriched = duplicates.map((d) => ({
      ...d,
      source_entry: entryMap.get(d.source_entry_id),
      matched_entry: entryMap.get(d.matched_entry_id),
    }));

    return NextResponse.json({ success: true, duplicates: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error fetching duplicates' }, { status: 500 });
  }
}
