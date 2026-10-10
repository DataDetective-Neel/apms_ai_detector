import { createHmac, timingSafeEqual } from 'crypto';

export const MAX_PHOTO_BYTES = 50 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadTicket {
  path: string;
  name: string;
  type: string;
  size: number;
  expires: number;
}

function signature(payload: string) {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('Upload storage is not configured');
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function signUploadTicket(ticket: UploadTicket) {
  const payload = Buffer.from(JSON.stringify(ticket)).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifyUploadTicket(value: string): UploadTicket {
  const [payload, supplied, extra] = value.split('.');
  if (!payload || !supplied || extra) throw new Error('Invalid upload ticket');
  const expected = Buffer.from(signature(payload));
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Invalid upload ticket');
  }
  const ticket: UploadTicket = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (ticket.expires < Date.now()) throw new Error('Upload expired. Please select the photograph again.');
  return ticket;
}
