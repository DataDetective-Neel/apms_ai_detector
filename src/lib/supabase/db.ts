import crypto from 'crypto';
import { Entry, ImageRecord, MetadataRecord, DuplicateMatchRecord, ReviewRecord, AuditLogRecord } from '../types/database';
import { supabaseAdmin } from './server';

export const db = {
  async getAllEntries(): Promise<Entry[]> {
    console.log('[SUPABASE-DB] [SELECT] Operation: getAllEntries');
    try {
      const { data: entries, error, status } = await supabaseAdmin
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`[SUPABASE-DB] [ERROR] Operation: getAllEntries | HTTP: ${status} | Code: ${error.code} | Message: ${error.message}`);
        return [];
      }

      if (!Array.isArray(entries) || entries.length === 0) {
        console.log('[SUPABASE-DB] [SUCCESS] Operation: getAllEntries | Count: 0');
        return [];
      }

      console.log(`[SUPABASE-DB] [SUCCESS] Operation: getAllEntries | Count: ${entries.length}`);
      const entryIds = entries.map((e: any) => e.id);

      const [{ data: images, error: imgErr }, { data: metaList, error: metaErr }, { data: reviewsList }, { data: dupsList }] =
        await Promise.all([
          supabaseAdmin.from('images').select('*').in('entry_id', entryIds),
          supabaseAdmin.from('metadata').select('*'),
          supabaseAdmin.from('reviews').select('*').in('entry_id', entryIds),
          supabaseAdmin.from('duplicate_matches').select('*'),
        ]);

      if (imgErr) console.warn(`[SUPABASE-DB] [WARN] Operation: select images | Code: ${imgErr.code} | Message: ${imgErr.message}`);
      if (metaErr) console.warn(`[SUPABASE-DB] [WARN] Operation: select metadata | Code: ${metaErr.code} | Message: ${metaErr.message}`);

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
    } catch (err: any) {
      console.error(`[SUPABASE-DB] [EXCEPTION] Operation: getAllEntries | Error: ${err?.message}`);
      return [];
    }
  },

  async getEntryById(id: string): Promise<Entry | null> {
    console.log(`[SUPABASE-DB] [SELECT] Operation: getEntryById | ID: ${id}`);
    try {
      const { data: entry, error, status } = await supabaseAdmin
        .from('entries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`[SUPABASE-DB] [ERROR] Operation: getEntryById | HTTP: ${status} | Code: ${error.code} | Message: ${error.message}`);
        return null;
      }

      if (!entry) return null;

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
    } catch (err: any) {
      console.error(`[SUPABASE-DB] [EXCEPTION] Operation: getEntryById | Error: ${err?.message}`);
      return null;
    }
  },

  async saveEntry(entry: Entry): Promise<void> {
    console.log(`[SUPABASE-DB] [INSERT/UPSERT] Operation: saveEntry | Entry ID: ${entry.id} | Title: ${entry.photo_title}`);
    try {
      const insertPayload = {
        id: entry.id,
        category: entry.category,
        photo_title: entry.photo_title,
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
      };

      const { error, status } = await supabaseAdmin.from('entries').upsert(insertPayload);

      if (error) {
        console.error(`[SUPABASE-DB] [ERROR] Operation: saveEntry | HTTP: ${status} | Code: ${error.code} | Message: ${error.message}`);
      } else {
        console.log(`[SUPABASE-DB] [SUCCESS] Operation: saveEntry | Entry ID: ${entry.id} | HTTP: ${status}`);
      }

      // Save detector results & analysis run if present
      if (entry.detector_results && Array.isArray(entry.detector_results) && entry.detector_results.length > 0) {
        const runId = crypto.randomUUID();
        const { error: runErr } = await supabaseAdmin.from('analysis_runs').insert({
          id: runId,
          entry_id: entry.id,
          status: 'COMPLETED',
          overall_result: entry.overall_result,
          ai_generation_verdict: entry.overall_result,
          ai_edit_detection_status: 'NOT_AVAILABLE',
        });

        if (runErr) {
          console.warn(`[SUPABASE-DB] [WARN] Operation: insert analysis_run | Code: ${runErr.code} | Message: ${runErr.message}`);
        }

        for (const dr of entry.detector_results) {
          const { error: drErr } = await supabaseAdmin.from('detector_results').insert({
            id: crypto.randomUUID(),
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

          if (drErr) {
            console.warn(`[SUPABASE-DB] [WARN] Operation: insert detector_result | Code: ${drErr.code} | Message: ${drErr.message}`);
          }
        }
      }
    } catch (err: any) {
      console.error(`[SUPABASE-DB] [EXCEPTION] Operation: saveEntry | Error: ${err?.message}`);
    }
  },

  async saveImage(image: ImageRecord): Promise<void> {
    console.log(`[SUPABASE-DB] [INSERT/UPSERT] Operation: saveImage | Entry ID: ${image.entry_id} | Image ID: ${image.id}`);
    try {
      const { error, status } = await supabaseAdmin.from('images').upsert({
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

      if (error) {
        console.error(`[SUPABASE-DB] [ERROR] Operation: saveImage | HTTP: ${status} | Code: ${error.code} | Message: ${error.message}`);
      } else {
        console.log(`[SUPABASE-DB] [SUCCESS] Operation: saveImage | Entry ID: ${image.entry_id} | HTTP: ${status}`);
      }
    } catch (err: any) {
      console.error(`[SUPABASE-DB] [EXCEPTION] Operation: saveImage | Error: ${err?.message}`);
    }
  },

  async saveMetadata(meta: MetadataRecord, entryId: string): Promise<void> {
    console.log(`[SUPABASE-DB] [INSERT/UPSERT] Operation: saveMetadata | Entry ID: ${entryId} | Meta ID: ${meta.id}`);
    try {
      const { error, status } = await supabaseAdmin.from('metadata').upsert({
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

      if (error) {
        console.error(`[SUPABASE-DB] [ERROR] Operation: saveMetadata | HTTP: ${status} | Code: ${error.code} | Message: ${error.message}`);
      } else {
        console.log(`[SUPABASE-DB] [SUCCESS] Operation: saveMetadata | Entry ID: ${entryId} | HTTP: ${status}`);
      }
    } catch (err: any) {
      console.error(`[SUPABASE-DB] [EXCEPTION] Operation: saveMetadata | Error: ${err?.message}`);
    }
  },

  async addDuplicateMatch(match: DuplicateMatchRecord): Promise<void> {
    try {
      const { error, status } = await supabaseAdmin.from('duplicate_matches').insert({
        id: match.id,
        source_entry_id: match.source_entry_id,
        matched_entry_id: match.matched_entry_id,
        match_type: match.match_type,
        similarity_percentage: match.similarity_percentage,
        hamming_distance: match.hamming_distance,
      });

      if (error) {
        console.error(`[SUPABASE-DB] [ERROR] Operation: addDuplicateMatch | HTTP: ${status} | Code: ${error.code} | Message: ${error.message}`);
      }
    } catch (err: any) {
      console.error(`[SUPABASE-DB] [EXCEPTION] Operation: addDuplicateMatch | Error: ${err?.message}`);
    }
  },

  async addReview(review: ReviewRecord): Promise<void> {
    console.log(`[SUPABASE-DB] [INSERT] Operation: addReview | Entry ID: ${review.entry_id} | Verdict: ${review.verdict}`);
    try {
      const { error, status } = await supabaseAdmin.from('reviews').insert({
        id: review.id,
        entry_id: review.entry_id,
        verdict: review.verdict,
        reviewer_name: review.reviewer_name,
        reviewer_role: review.reviewer_role,
        admin_notes: review.admin_notes,
        flagged_for_hearing: review.flagged_for_hearing,
      });

      if (error) {
        console.error(`[SUPABASE-DB] [ERROR] Operation: addReview | HTTP: ${status} | Code: ${error.code} | Message: ${error.message}`);
      }

      await supabaseAdmin.from('entries').update({
        review_verdict: review.verdict,
        updated_at: new Date().toISOString(),
      }).eq('id', review.entry_id);
    } catch (err: any) {
      console.error(`[SUPABASE-DB] [EXCEPTION] Operation: addReview | Error: ${err?.message}`);
    }
  },

  async logAudit(action: string, entityType: string, entityId: string, details?: any, actor = 'admin'): Promise<void> {
    try {
      await supabaseAdmin.from('audit_logs').insert({
        id: crypto.randomUUID(),
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || null,
        actor,
      });
    } catch (err) {
      // ignore
    }
  },

  async getAllAuditLogs(): Promise<AuditLogRecord[]> {
    try {
      const { data, error } = await supabaseAdmin.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (!error && data) return data as AuditLogRecord[];
    } catch (err) {
      // ignore
    }
    return [];
  },

  async getAllDuplicateMatches(): Promise<DuplicateMatchRecord[]> {
    try {
      const { data, error } = await supabaseAdmin.from('duplicate_matches').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as DuplicateMatchRecord[];
    } catch (err) {
      // ignore
    }
    return [];
  },
};
