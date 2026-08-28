export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entry = await db.getEntryById(params.id);
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Entry not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error fetching entry' }, { status: 500 });
  }
}
