import { db } from '../supabase/db';
import { supabaseAdmin } from '../supabase/server';
import { calculateSha256, calculateDHash, calculateSimilarity } from '../forensic/hashing';
import { extractMetadata } from '../forensic/exif-extractor';
import { prepareAnalysisImage } from '../forensic/image-resizer';
import { runEnsembleAnalysis } from '../detectors';
import { Entry, ImageRecord, MetadataRecord } from '../types/database';
import fs from 'fs';
import path from 'path';

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

// Local storage directory for fallback/instant preview
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Executes full pipeline on an uploaded photograph:
 * 1. Hashes & Deduplication check
 * 2. EXIF & Metadata extraction
 * 3. Pristine storage upload & analysis copy generation
 * 4. 3-Detector Ensemble Inference & Majority Voting
 * 5. Persistent database storage & audit logging
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

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // 1. Calculate Hashes
  const sha256 = calculateSha256(fileBuffer);
  const phash = await calculateDHash(fileBuffer);

  // 2. Check for Duplicates against existing entries
  const existingEntries = await db.getAllEntries();
  const duplicateAlerts: string[] = [];

  for (const existing of existingEntries) {
    if (existing.id === entryId || !existing.image) continue;

    // Exact SHA-256 match
    if (existing.image.sha256 === sha256) {
      await db.addDuplicateMatch({
        id: `dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        source_entry_id: entryId,
        matched_entry_id: existing.id,
        match_type: 'EXACT_SHA256',
        similarity_percentage: 100,
        hamming_distance: 0,
        created_at: new Date().toISOString(),
      });
      duplicateAlerts.push(`Exact duplicate detected of entry ${existing.id} (${existing.photo_title}) via SHA-256 hash match.`);
    } else {
      // Perceptual similarity
      const similarity = calculateSimilarity(phash, existing.image.phash);
      if (similarity >= 85) {
        await db.addDuplicateMatch({
          id: `dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  // 4. Save Pristine Original & Prepare Resized Analysis Copy
  const localFileName = `${entryId}_${Date.now()}_${path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const localFilePath = path.join(UPLOADS_DIR, localFileName);
  fs.writeFileSync(localFilePath, fileBuffer);

  const storagePathOriginal = `originals/${entryId}/${localFileName}`;
  let signedUrl = `/uploads/${localFileName}`;

  // Upload original to Supabase private storage if configured
  try {
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('competition-photos')
      .upload(storagePathOriginal, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (!uploadErr) {
      const { data: signedData } = await supabaseAdmin.storage
        .from('competition-photos')
        .createSignedUrl(storagePathOriginal, 60 * 60 * 24); // 24hr signed URL

      if (signedData?.signedUrl) {
        signedUrl = signedData.signedUrl;
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload fallback to local storage:', err);
  }

  // Generate clamped 768px analysis copy
  const imgAnalysisInfo = await prepareAnalysisImage(fileBuffer);

  // 5. Run 3-Detector Ensemble Inference & Majority Voting
  const decision = await runEnsembleAnalysis(imgAnalysisInfo.analysisBuffer);

  // 6. Build Records
  const imageRecord: ImageRecord = {
    id: `img-${entryId}-${Date.now()}`,
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
    signed_url: signedUrl,
    created_at: new Date().toISOString(),
  };

  const metadataRecord: MetadataRecord = {
    id: `meta-${entryId}-${Date.now()}`,
    image_id: imageRecord.id,
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

  // 7. Persist to Database
  await db.saveImage(imageRecord);
  await db.saveMetadata(metadataRecord, entryId);
  await db.saveEntry(entryRecord);

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

  return {
    entry: entryRecord,
    image: imageRecord,
    metadata: metadataRecord,
    duplicateAlerts,
  };
}
