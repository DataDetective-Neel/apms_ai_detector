import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { MAX_PHOTO_BYTES, PHOTO_TYPES, signUploadTicket } from '@/lib/upload-ticket';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, type, size } = await req.json();
    if (typeof name !== 'string' || !name || !PHOTO_TYPES.includes(type) ||
        !Number.isInteger(size) || size <= 0 || size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ success: false, error: 'Choose a JPG, PNG or WebP photograph up to 50MB.' }, { status: 400 });
    }
    const path = `pending/${randomUUID()}/${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { data, error } = await supabaseAdmin.storage.from('competition-photos').createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message || 'Could not prepare upload');
    return NextResponse.json({
      success: true, path, token: data.token,
      ticket: signUploadTicket({ path, name, type, size, expires: Date.now() + 2 * 60 * 60 * 1000 }),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Could not prepare upload' }, { status: 500 });
  }
}
