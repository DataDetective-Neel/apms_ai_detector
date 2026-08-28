export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';

export async function GET(req: NextRequest) {
  try {
    const format = req.nextUrl.searchParams.get('format') || 'json';
    const entries = await db.getAllEntries();

    if (format === 'csv') {
      const headers = [
        'Entry ID',
        'Title',
        'Participant',
        'Category',
        'AI Votes',
        'Real Votes',
        'Inconclusive',
        'Automated Assessment',
        'Risk Level',
        'Human Verdict',
        'Camera Make',
        'Camera Model',
        'Software',
        'Submission Time',
      ];

      const rows = entries.map((e) => [
        `"${e.id}"`,
        `"${(e.photo_title || '').replace(/"/g, '""')}"`,
        `"${(e.participant_name || '').replace(/"/g, '""')}"`,
        `"${e.category}"`,
        e.ai_votes,
        e.real_votes,
        e.inconclusive_votes,
        `"${e.overall_result}"`,
        `"${e.risk_level}"`,
        `"${e.review_verdict}"`,
        `"${e.metadata?.camera_make || 'N/A'}"`,
        `"${e.metadata?.camera_model || 'N/A'}"`,
        `"${e.metadata?.software_tags || 'N/A'}"`,
        `"${e.created_at}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="competition_report_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, entries });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Export failed' }, { status: 500 });
  }
}
