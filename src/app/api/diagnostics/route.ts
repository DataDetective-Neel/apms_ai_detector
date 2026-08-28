import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: {
      exists: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      isCorrectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() === 'https://lhspnxlyshdouaubemmm.supabase.co',
      domain: process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null,
    },
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
      exists: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      length: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length || 0,
    },
    SUPABASE_SECRET_KEY: {
      exists: Boolean(process.env.SUPABASE_SECRET_KEY),
      length: process.env.SUPABASE_SECRET_KEY?.length || 0,
    },
    HF_TOKEN: {
      exists: Boolean(process.env.HF_TOKEN),
      length: process.env.HF_TOKEN?.length || 0,
    },
    AI_DETECTOR_MODEL_1: {
      exists: Boolean(process.env.AI_DETECTOR_MODEL_1),
      value: process.env.AI_DETECTOR_MODEL_1 || null,
    },
    AI_DETECTOR_MODEL_2: {
      exists: Boolean(process.env.AI_DETECTOR_MODEL_2),
      value: process.env.AI_DETECTOR_MODEL_2 || null,
    },
    AI_DETECTOR_MODEL_3: {
      exists: Boolean(process.env.AI_DETECTOR_MODEL_3),
      value: process.env.AI_DETECTOR_MODEL_3 || null,
    },
    AI_THRESHOLD: {
      exists: Boolean(process.env.AI_THRESHOLD),
      value: process.env.AI_THRESHOLD || '0.70',
    },
    REAL_THRESHOLD: {
      exists: Boolean(process.env.REAL_THRESHOLD),
      value: process.env.REAL_THRESHOLD || '0.30',
    },
  };

  const tablesToCheck = [
    'competitions',
    'participants',
    'entries',
    'images',
    'metadata',
    'analysis_runs',
    'detector_results',
    'reviews',
    'duplicate_matches',
    'audit_logs',
  ];

  const tableStatus: Record<string, any> = {};

  for (const table of tablesToCheck) {
    try {
      const { data, error, status } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      tableStatus[table] = {
        httpStatus: status,
        existsInSchema: status !== 404,
        error: error ? { code: error.code, message: error.message } : null,
      };
    } catch (err: any) {
      tableStatus[table] = {
        existsInSchema: false,
        error: { message: err?.message || 'Query failed' },
      };
    }
  }

  // Check Storage Bucket
  let storageStatus = { bucketExists: false, error: null as string | null };
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      storageStatus.error = error.message;
    } else {
      storageStatus.bucketExists = Boolean(buckets?.some((b) => b.name === 'competition-photos'));
    }
  } catch (err: any) {
    storageStatus.error = err?.message || 'Storage query failed';
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    isVercel: Boolean(process.env.VERCEL),
    envStatus,
    tableStatus,
    storageStatus,
  });
}
