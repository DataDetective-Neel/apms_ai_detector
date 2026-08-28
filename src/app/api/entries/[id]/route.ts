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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`[API-DELETE-ENTRY] Request to delete entry: ${params.id}`);
    const success = await db.deleteEntry(params.id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete entry from database or storage' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: `Entry ${params.id} deleted successfully` });
  } catch (error: any) {
    console.error(`[API-DELETE-ENTRY] Error:`, error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || 'Error deleting entry' }, { status: 500 });
  }
}
