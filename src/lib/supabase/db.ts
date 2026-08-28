import fs from 'fs';
import path from 'path';
import { Entry, ImageRecord, MetadataRecord, DuplicateMatchRecord, ReviewRecord, AuditLogRecord } from '../types/database';
import { supabaseAdmin } from './server';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

interface LocalDatabase {
  entries: Record<string, Entry>;
  images: Record<string, ImageRecord>;
  metadata: Record<string, MetadataRecord>;
  duplicate_matches: DuplicateMatchRecord[];
  reviews: Record<string, ReviewRecord[]>;
  audit_logs: AuditLogRecord[];
}

function loadLocalDb(): LocalDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    // Expected on read-only serverless platforms like Vercel
  }
  return {
    entries: {},
    images: {},
    metadata: {},
    duplicate_matches: [],
    reviews: {},
    audit_logs: [],
  };
}

function saveLocalDb(dbData: LocalDatabase): void {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    // Ephemeral disk on Vercel is ignored
  }
}

export const db = {
  async getAllEntries(): Promise<Entry[]> {
    // 1. Primary: Query Supabase PostgreSQL
    try {
      const { data: entries, error } = await supabaseAdmin
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(entries) && entries.length > 0) {
        // Hydrate related images, metadata, and reviews
        const entryIds = entries.map((e: any) => e.id);

        const [{ data: images }, { data: metaList }, { data: reviewsList }, { data: dupsList }] = await Promise.all([
          supabaseAdmin.from('images').select('*').in('entry_id', entryIds),
          supabaseAdmin.from('metadata').select('*'),
          supabaseAdmin.from('reviews').select('*').in('entry_id', entryIds),
          supabaseAdmin.from('duplicate_matches').select('*'),
        ]);

        const imageMap = new Map((images || []).map((img: any) => [img.entry_id, img]));
        const metaMap = new Map((metaList || []).map((m: any) => [m.image_id, m]));
        const reviewsMap = new Map<string, any[]>();
        (reviewsList || []).forEach((r: any) => {
          if (!reviewsMap.has(r.entry_id)) reviewsMap.set(r.entry_id, []);
          reviewsMap.get(r.entry_id)!.push(r);
        });

        return entries.map((e: any) => {
          const img = imageMap.get(e.id);
          const meta = img ? metaMap.get(img.id) : null;
          return {
            ...e,
            image: img,
            metadata: meta,
            reviews: reviewsMap.get(e.id) || [],
            duplicate_matches: (dupsList || []).filter(
              (m: any) => m.source_entry_id === e.id || m.matched_entry_id === e.id
            ),
          };
        });
      }
    } catch (supabaseErr) {
      console.warn('Supabase database query error, checking local fallback:', supabaseErr);
    }

    // 2. Fallback: Local Cache
    const local = loadLocalDb();
    const list = Object.values(local.entries);
    return list.map((e) => ({
      ...e,
      image: local.images[e.id],
      metadata: local.metadata[e.id],
      reviews: local.reviews[e.id] || [],
      duplicate_matches: local.duplicate_matches.filter(
        (m) => m.source_entry_id === e.id || m.matched_entry_id === e.id
      ),
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getEntryById(id: string): Promise<Entry | null> {
    // 1. Primary: Query Supabase PostgreSQL
    try {
      const { data: entry, error } = await supabaseAdmin
        .from('entries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && entry) {
        const [{ data: img }, { data: reviews }, { data: dups }] = await Promise.all([
          supabaseAdmin.from('images').select('*').eq('entry_id', id).maybeSingle(),
          supabaseAdmin.from('reviews').select('*').eq('entry_id', id).order('created_at', { ascending: false }),
          supabaseAdmin.from('duplicate_matches').select('*'),
        ]);

        let meta = null;
        if (img?.id) {
          const { data: metaData } = await supabaseAdmin
            .from('metadata')
            .select('*')
            .eq('image_id', img.id)
            .maybeSingle();
          meta = metaData;
        }

        const { data: detResults } = await supabaseAdmin
          .from('detector_results')
          .select('*')
          .eq('entry_id', id);

        return {
          ...entry,
          image: img,
          metadata: meta,
          reviews: reviews || [],
          detector_results: detResults && detResults.length > 0 ? detResults : entry.detector_results,
          duplicate_matches: (dups || []).filter(
            (m: any) => m.source_entry_id === id || m.matched_entry_id === id
          ),
        };
      }
    } catch (supabaseErr) {
      console.warn('Supabase entry query error, checking local fallback:', supabaseErr);
    }

    // 2. Fallback: Local Cache
    const local = loadLocalDb();
    const e = local.entries[id];
    if (!e) return null;

    return {
      ...e,
      image: local.images[e.id],
      metadata: local.metadata[e.id],
      reviews: local.reviews[e.id] || [],
      duplicate_matches: local.duplicate_matches.filter(
        (m) => m.source_entry_id === e.id || m.matched_entry_id === e.id
      ),
    };
  },

  async saveEntry(entry: Entry): Promise<void> {
    // 1. Save to Supabase PostgreSQL
    try {
      await supabaseAdmin.from('entries').upsert({
        id: entry.id,
        category: entry.category,
        photo_title: entry.photo_title,
        submission_number: entry.submission_number,
        status: entry.status,
        overall_result: entry.overall_result,
        risk_level: entry.risk_level,
        ai_votes: entry.ai_votes,
        real_votes: entry.real_votes,
        inconclusive_votes: entry.inconclusive_votes,
        error_votes: entry.error_votes,
        summary_explanation: entry.summary_explanation,
        review_verdict: entry.review_verdict,
        updated_at: new Date().toISOString(),
      });

      // Save detector results if present
      if (entry.detector_results && Array.isArray(entry.detector_results)) {
        // Create an analysis run record first
        const runId = `run-${entry.id}-${Date.now()}`;
        await supabaseAdmin.from('analysis_runs').insert({
          id: runId,
          entry_id: entry.id,
          status: 'COMPLETED',
          overall_result: entry.overall_result,
          ai_generation_verdict: entry.overall_result,
          ai_edit_detection_status: 'NOT_AVAILABLE',
        });

        for (const dr of entry.detector_results) {
          await supabaseAdmin.from('detector_results').insert({
            analysis_run_id: runId,
            entry_id: entry.id,
            detector_id: dr.detectorId,
            model_id: dr.modelId,
            model_version: dr.modelVersion || 'main',
            provider: dr.provider,
            raw_response: dr.rawResponse || null,
            normalized_classification: dr.classification,
            ai_score: dr.aiScore,
            real_score: dr.realScore,
            confidence: dr.confidence,
            deadband_gated: dr.deadbandGated ?? true,
            latency_ms: dr.processingTimeMs,
            error_message: dr.error || null,
          });
        }
      }
    } catch (err) {
      console.warn('Supabase saveEntry error:', err);
    }

    // 2. Cache locally
    const local = loadLocalDb();
    local.entries[entry.id] = {
      ...entry,
      updated_at: new Date().toISOString(),
    };
    saveLocalDb(local);
  },

  async saveImage(image: ImageRecord): Promise<void> {
    try {
      await supabaseAdmin.from('images').upsert({
        id: image.id,
        entry_id: image.entry_id,
        storage_path_original: image.storage_path_original,
        storage_path_analysis: image.storage_path_analysis,
        filename: image.filename,
        mime_type: image.mime_type,
        file_size_bytes: image.file_size_bytes,
        width: image.width,
        height: image.height,
        sha256: image.sha256,
        phash: image.phash,
      });
    } catch (err) {
      console.warn('Supabase saveImage error:', err);
    }

    const local = loadLocalDb();
    local.images[image.entry_id] = image;
    saveLocalDb(local);
  },

  async saveMetadata(meta: MetadataRecord, entryId: string): Promise<void> {
    try {
      await supabaseAdmin.from('metadata').upsert({
        id: meta.id,
        image_id: meta.image_id,
        camera_make: meta.camera_make,
        camera_model: meta.camera_model,
        lens_model: meta.lens_model,
        focal_length: meta.focal_length,
        aperture: meta.aperture,
        shutter_speed: meta.shutter_speed,
        iso: meta.iso,
        software_tags: meta.software_tags,
        color_space: meta.color_space,
        orientation: meta.orientation,
        date_time_original: meta.date_time_original,
        has_exif: meta.has_exif,
        raw_exif_json: meta.raw_exif_json || null,
      });
    } catch (err) {
      console.warn('Supabase saveMetadata error:', err);
    }

    const local = loadLocalDb();
    local.metadata[entryId] = meta;
    saveLocalDb(local);
  },

  async addDuplicateMatch(match: DuplicateMatchRecord): Promise<void> {
    try {
      await supabaseAdmin.from('duplicate_matches').insert({
        id: match.id,
        source_entry_id: match.source_entry_id,
        matched_entry_id: match.matched_entry_id,
        match_type: match.match_type,
        similarity_percentage: match.similarity_percentage,
        hamming_distance: match.hamming_distance,
      });
    } catch (err) {
      console.warn('Supabase addDuplicateMatch error:', err);
    }

    const local = loadLocalDb();
    const exists = local.duplicate_matches.some(
      (m) =>
        (m.source_entry_id === match.source_entry_id && m.matched_entry_id === match.matched_entry_id) ||
        (m.source_entry_id === match.matched_entry_id && m.matched_entry_id === match.source_entry_id)
    );
    if (!exists) {
      local.duplicate_matches.push(match);
      saveLocalDb(local);
    }
  },

  async addReview(review: ReviewRecord): Promise<void> {
    try {
      await supabaseAdmin.from('reviews').insert({
        id: review.id,
        entry_id: review.entry_id,
        verdict: review.verdict,
        reviewer_name: review.reviewer_name,
        reviewer_role: review.reviewer_role,
        admin_notes: review.admin_notes,
        flagged_for_hearing: review.flagged_for_hearing,
      });

      await supabaseAdmin.from('entries').update({
        review_verdict: review.verdict,
        updated_at: new Date().toISOString(),
      }).eq('id', review.entry_id);
    } catch (err) {
      console.warn('Supabase addReview error:', err);
    }

    const local = loadLocalDb();
    if (!local.reviews[review.entry_id]) {
      local.reviews[review.entry_id] = [];
    }
    local.reviews[review.entry_id].unshift(review);
    if (local.entries[review.entry_id]) {
      local.entries[review.entry_id].review_verdict = review.verdict;
      local.entries[review.entry_id].updated_at = new Date().toISOString();
    }
    saveLocalDb(local);
  },

  async logAudit(action: string, entityType: string, entityId: string, details?: any, actor = 'admin'): Promise<void> {
    try {
      await supabaseAdmin.from('audit_logs').insert({
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || null,
        actor,
      });
    } catch (err) {
      // ignore
    }

    const local = loadLocalDb();
    const log: AuditLogRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      actor,
      timestamp: new Date().toISOString(),
    };
    local.audit_logs.unshift(log);
    saveLocalDb(local);
  },

  async getAllAuditLogs(): Promise<AuditLogRecord[]> {
    try {
      const { data, error } = await supabaseAdmin.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (!error && data) return data as AuditLogRecord[];
    } catch (err) {
      // fallback
    }
    const local = loadLocalDb();
    return local.audit_logs;
  },

  async getAllDuplicateMatches(): Promise<DuplicateMatchRecord[]> {
    try {
      const { data, error } = await supabaseAdmin.from('duplicate_matches').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as DuplicateMatchRecord[];
    } catch (err) {
      // fallback
    }
    const local = loadLocalDb();
    return local.duplicate_matches;
  },
};
