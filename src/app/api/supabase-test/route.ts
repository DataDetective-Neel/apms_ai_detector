import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY || '';

  let supabaseHost: string | null = null;
  try {
    if (supabaseUrl) {
      supabaseHost = new URL(supabaseUrl.trim()).hostname;
    }
  } catch {
    supabaseHost = 'invalid-url';
  }

  const envCheck = {
    supabaseUrlConfigured: Boolean(supabaseUrl),
    supabaseHost,
    secretKeyConfigured: Boolean(secretKey),
  };

  // 1. Validate environment
  if (!supabaseUrl || !secretKey) {
    return NextResponse.json(
      {
        success: false,
        environment: envCheck,
        error: {
          failedStep: 'environment_variables',
          message: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY on server runtime',
        },
      },
      { status: 500 }
    );
  }

  // 2. Query 'entries' table (head request, count only)
  let entriesResult = { accessible: false, count: 0, error: null as any };
  try {
    const { count, error, status } = await supabaseAdmin
      .from('entries')
      .select('id', { count: 'exact', head: true });

    if (error) {
      entriesResult = {
        accessible: false,
        count: 0,
        error: {
          httpStatus: status,
          code: error.code,
          message: error.message,
        },
      };
    } else {
      entriesResult = {
        accessible: true,
        count: count ?? 0,
        error: null,
      };
    }
  } catch (err: any) {
    entriesResult = {
      accessible: false,
      count: 0,
      error: {
        message: err?.message || 'Network / connection error querying entries table',
      },
    };
  }

  // 3. Query 'competitions' table (head request, count only)
  let competitionsResult = { accessible: false, count: 0, error: null as any };
  try {
    const { count, error, status } = await supabaseAdmin
      .from('competitions')
      .select('id', { count: 'exact', head: true });

    if (error) {
      competitionsResult = {
        accessible: false,
        count: 0,
        error: {
          httpStatus: status,
          code: error.code,
          message: error.message,
        },
      };
    } else {
      competitionsResult = {
        accessible: true,
        count: count ?? 0,
        error: null,
      };
    }
  } catch (err: any) {
    competitionsResult = {
      accessible: false,
      count: 0,
      error: {
        message: err?.message || 'Network / connection error querying competitions table',
      },
    };
  }

  const isConnected = entriesResult.accessible && competitionsResult.accessible;

  return NextResponse.json({
    success: isConnected,
    environment: envCheck,
    database: {
      connected: isConnected,
      entriesTable: entriesResult,
      competitionsTable: competitionsResult,
    },
  });
}
