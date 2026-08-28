import { ExtractedMetadata } from '../forensic/exif-extractor';
import { DetectorResult, MajorityVoteDecision, OverallResult, RiskLevel } from '../detectors/detector-interface';

export interface Entry {
  id: string; // e.g. APMS-2026-001
  competition_id?: string;
  participant_name: string;
  participant_email?: string;
  participant_phone?: string;
  club_affiliation?: string;
  category: string;
  photo_title: string;
  submission_number: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  overall_result: OverallResult;
  risk_level: RiskLevel;
  ai_votes: number;
  real_votes: number;
  inconclusive_votes: number;
  error_votes: number;
  summary_explanation?: string;
  review_verdict: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISQUALIFIED' | 'NEEDS_MORE_INFO';
  created_at: string;
  updated_at: string;
  image?: ImageRecord;
  metadata?: MetadataRecord;
  detector_results?: DetectorResult[];
  duplicate_matches?: DuplicateMatchRecord[];
  reviews?: ReviewRecord[];
}

export interface ImageRecord {
  id: string;
  entry_id: string;
  storage_path_original: string;
  storage_path_analysis?: string;
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  width: number;
  height: number;
  sha256: string;
  phash: string;
  signed_url?: string;
  created_at: string;
}

export interface MetadataRecord {
  id: string;
  image_id: string;
  camera_make?: string | null;
  camera_model?: string | null;
  lens_model?: string | null;
  focal_length?: string | null;
  aperture?: string | null;
  shutter_speed?: string | null;
  iso?: number | null;
  software_tags?: string | null;
  color_space?: string | null;
  orientation?: number | null;
  date_time_original?: string | null;
  has_exif: boolean;
  raw_exif_json?: Record<string, any>;
  forensic_notes?: string[];
  created_at: string;
}

export interface DuplicateMatchRecord {
  id: string;
  source_entry_id: string;
  matched_entry_id: string;
  match_type: 'EXACT_SHA256' | 'PERCEPTUAL_SIMILARITY';
  similarity_percentage: number;
  hamming_distance: number;
  created_at: string;
}

export interface ReviewRecord {
  id: string;
  entry_id: string;
  verdict: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISQUALIFIED' | 'NEEDS_MORE_INFO';
  reviewer_name: string;
  reviewer_role: string;
  admin_notes?: string;
  flagged_for_hearing: boolean;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: any;
  actor: string;
  timestamp: string;
}
