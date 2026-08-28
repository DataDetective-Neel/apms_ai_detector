import crypto from 'crypto';
import { db } from '../supabase/db';
import { supabaseAdmin } from '../supabase/server';
import { calculateSha256, calculateDHash, calculateSimilarity } from '../forensic/hashing';
import { extractMetadata } from '../forensic/exif-extractor';
import { prepareAnalysisImage } from '../forensic/image-resizer';
import { runEnsembleAnalysis } from '../detectors';
import { Entry, ImageRecord, MetadataRecord } from '../types/database';

export interface ProcessUploadOptions {
  entryId: string;
  participantName: string;
  participantEmail?: string;
  participantPhone?: string;
  clubAffiliation?: string;
  category: string;
  photoTitle: string;
  originalFilename: string;
  mimeType: string;
  fileBuffer: Buffer;
}

export interface ProcessingResult {
  entry: Entry;
  image: ImageRecord;
  metadata: MetadataRecord;
  duplicateAlerts: string[];
}

/**
 * Executes full pipeline on an uploaded photograph with safe server-side logging.
 * Pure in-memory + Supabase Storage (zero local disk dependency for Vercel compatibility).
 */
export async function processPhotographUpload(options: ProcessUploadOptions): Promise<ProcessingResult> {
  const {
    entryId,
    participantName,
    participantEmail,
    participantPhone,
    clubAffiliation,
    category,
    photoTitle,
    originalFilename,
    mimeType,
    fileBuffer,
  } = options;

  console.log(`[UPLOAD-PIPELINE] [START] Entry: ${entryId} | File: ${originalFilename} | Size: ${fileBuffer.length} bytes | Type: ${mimeType}`);

  // 1. Calculate Hashes
  const sha256 = calculateSha256(fileBuffer);
  const phash = await calculateDHash(fileBuffer);
  console.log(`[UPLOAD-PIPELINE] [HASHES] Entry: ${entryId} | SHA256: ${sha256.substring(0, 16)}... | dHash: ${phash}`);

  // 2. Check for Duplicates against existing entries
  const existingEntries = await db.getAllEntries();
  const duplicateAlerts: string[] = [];

  for (const existing of existingEntries) {
    if (existing.id === entryId || !existing.image) continue;

    if (existing.image.sha256 === sha256) {
      await db.addDuplicateMatch({
        id: crypto.randomUUID(),
        source_entry_id: entryId,
        matched_entry_id: existing.id,
        match_type: 'EXACT_SHA256',
        similarity_percentage: 100,
        hamming_distance: 0,
        created_at: new Date().toISOString(),
      });
      duplicateAlerts.push(`Exact duplicate detected of entry ${existing.id} (${existing.photo_title}) via SHA-256 hash match.`);
    } else {
      const similarity = calculateSimilarity(phash, existing.image.phash);
      if (similarity >= 85) {
        await db.addDuplicateMatch({
          id: crypto.randomUUID(),
          source_entry_id: entryId,
          matched_entry_id: existing.id,
          match_type: 'PERCEPTUAL_SIMILARITY',
          similarity_percentage: similarity,
          hamming_distance: 64 - Math.round((similarity / 100) * 64),
          created_at: new Date().toISOString(),
        });
        duplicateAlerts.push(`Near-duplicate detected (${similarity}% visual similarity) to entry ${existing.id} (${existing.photo_title}).`);
      }
    }
  }

  // 3. Extract EXIF & Forensic Metadata
  const rawMeta = await extractMetadata(fileBuffer);
  console.log(`[UPLOAD-PIPELINE] [EXIF] Entry: ${entryId} | hasExif: ${rawMeta.hasExif} | Camera: ${rawMeta.cameraMake || 'N/A'} ${rawMeta.cameraModel || ''}`);

  // 4. Upload Pristine Original to Supabase Storage
  const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePathOriginal = `originals/${entryId}/${Date.now()}_${sanitizedFilename}`;
  let signedUrl = '';

  try {
    console.log(`[UPLOAD-PIPELINE] [STORAGE-UPLOAD] Operation: upload | Bucket: competition-photos | Path: ${storagePathOriginal}`);
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('competition-photos')
      .upload(storagePathOriginal, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.error(`[UPLOAD-PIPELINE] [STORAGE-ERROR] Operation: upload | Code: ${uploadErr.name} | Message: ${uploadErr.message}`);
    } else {
      console.log(`[UPLOAD-PIPELINE] [STORAGE-SUCCESS] Operation: upload | Path: ${storagePathOriginal}`);
      const { data: signedData, error: signErr } = await supabaseAdmin.storage
        .from('competition-photos')
        .createSignedUrl(storagePathOriginal, 60 * 60 * 24 * 7); // 7 days

      if (!signErr && signedData?.signedUrl) {
        signedUrl = signedData.signedUrl;
        console.log(`[UPLOAD-PIPELINE] [STORAGE-SIGNED-URL] Operation: createSignedUrl | Status: SUCCESS`);
      }
    }
  } catch (err: any) {
    console.error(`[UPLOAD-PIPELINE] [STORAGE-EXCEPTION] ${err?.message || 'Storage error'}`);
  }

  // 5. Generate In-Memory Clamped 768px Analysis Copy & Run Ensemble Inference
  console.log(`[UPLOAD-PIPELINE] [ANALYSIS-IMAGE] Preparing 768px in-memory buffer...`);
  const imgAnalysisInfo = await prepareAnalysisImage(fileBuffer);
  console.log(`[UPLOAD-PIPELINE] [ANALYSIS-IMAGE] Dimensions: ${imgAnalysisInfo.analysisWidth}x${imgAnalysisInfo.analysisHeight} px | Size: ${imgAnalysisInfo.analysisBuffer.length} bytes`);

  console.log(`[UPLOAD-PIPELINE] [INFERENCE-ENSEMBLE] Calling 3-model screening ensemble...`);
  const decision = await runEnsembleAnalysis(imgAnalysisInfo.analysisBuffer);
  console.log(`[UPLOAD-PIPELINE] [INFERENCE-RESULT] Overall: ${decision.overallResult} | AI Votes: ${decision.aiVotes}/3 | Real Votes: ${decision.realVotes}/3 | Inconclusive: ${decision.inconclusiveVotes}`);

  // 6. Build Valid UUID Records
  const imageId = crypto.randomUUID();
  const metadataId = crypto.randomUUID();

  const imageRecord: ImageRecord = {
    id: imageId,
    entry_id: entryId,
    storage_path_original: storagePathOriginal,
    storage_path_analysis: `analysis/${entryId}.jpg`,
    filename: originalFilename,
    mime_type: mimeType,
    file_size_bytes: fileBuffer.length,
    width: imgAnalysisInfo.originalWidth,
    height: imgAnalysisInfo.originalHeight,
    sha256,
    phash,
    signed_url: signedUrl || undefined,
    created_at: new Date().toISOString(),
  };

  const metadataRecord: MetadataRecord = {
    id: metadataId,
    image_id: imageId,
    camera_make: rawMeta.cameraMake,
    camera_model: rawMeta.cameraModel,
    lens_model: rawMeta.lensModel,
    focal_length: rawMeta.focalLength,
    aperture: rawMeta.aperture,
    shutter_speed: rawMeta.shutterSpeed,
    iso: rawMeta.iso,
    software_tags: rawMeta.softwareTags,
    color_space: rawMeta.colorSpace,
    orientation: rawMeta.orientation,
    date_time_original: rawMeta.dateTimeOriginal,
    has_exif: rawMeta.hasExif,
    raw_exif_json: rawMeta.rawExif,
    forensic_notes: rawMeta.forensicNotes,
    created_at: new Date().toISOString(),
  };

  const entryRecord: Entry = {
    id: entryId,
    participant_name: participantName,
    participant_email: participantEmail,
    participant_phone: participantPhone,
    club_affiliation: clubAffiliation,
    category,
    photo_title: photoTitle,
    submission_number: existingEntries.length + 1,
    status: 'COMPLETED',
    overall_result: decision.overallResult,
    risk_level: decision.riskLevel,
    ai_votes: decision.aiVotes,
    real_votes: decision.realVotes,
    inconclusive_votes: decision.inconclusiveVotes,
    error_votes: decision.errorVotes,
    summary_explanation: decision.summaryExplanation,
    review_verdict: 'PENDING',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    detector_results: decision.detectorResults,
  };

  // 7. Persist Records to Supabase PostgreSQL
  console.log(`[UPLOAD-PIPELINE] [DB-INSERT] Saving entry ${entryId} to Supabase...`);
  await db.saveEntry(entryRecord);
  await db.saveImage(imageRecord);
  await db.saveMetadata(metadataRecord, entryId);

  // 8. Log Audit Record
  await db.logAudit(
    'UPLOAD_AND_ANALYSIS_COMPLETED',
    'entry',
    entryId,
    {
      photoTitle,
      overallResult: decision.overallResult,
      aiVotes: decision.aiVotes,
      realVotes: decision.realVotes,
      duplicateCount: duplicateAlerts.length,
    },
    'system'
  );

  console.log(`[UPLOAD-PIPELINE] [COMPLETE] Successfully processed entry ${entryId}`);

  return {
    entry: entryRecord,
    image: imageRecord,
    metadata: metadataRecord,
    duplicateAlerts,
  };
}
