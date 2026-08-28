-- ====================================================================
-- DURGA PUJA PHOTOGRAPHY COMPETITION - AI AUTHENTICITY SCHEMA
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPETITIONS
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'Durga Puja Photography Competition 2026',
    edition TEXT NOT NULL DEFAULT '2026',
    max_entries INTEGER NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PARTICIPANTS
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    club_affiliation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ENTRIES
CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY, -- e.g. APMS-2026-001
    competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'General',
    photo_title TEXT NOT NULL,
    submission_number SERIAL,
    status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, PROCESSING, COMPLETED, ERROR
    overall_result TEXT NOT NULL DEFAULT 'PENDING', -- AI_SUSPECTED, LIKELY_AUTHENTIC, MANUAL_REVIEW, PARTIAL_ANALYSIS, ANALYSIS_UNAVAILABLE, PENDING
    risk_level TEXT NOT NULL DEFAULT 'UNKNOWN', -- LOW, MEDIUM, HIGH, UNKNOWN
    ai_votes INTEGER NOT NULL DEFAULT 0,
    real_votes INTEGER NOT NULL DEFAULT 0,
    inconclusive_votes INTEGER NOT NULL DEFAULT 0,
    error_votes INTEGER NOT NULL DEFAULT 0,
    summary_explanation TEXT,
    review_verdict TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, DISQUALIFIED, NEEDS_MORE_INFO
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. IMAGES
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    storage_path_original TEXT NOT NULL,
    storage_path_analysis TEXT,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    sha256 TEXT NOT NULL,
    phash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. METADATA (EXIF / FORENSICS)
CREATE TABLE IF NOT EXISTS metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    camera_make TEXT,
    camera_model TEXT,
    lens_model TEXT,
    focal_length TEXT,
    aperture TEXT,
    shutter_speed TEXT,
    iso INTEGER,
    software_tags TEXT,
    color_space TEXT,
    orientation INTEGER,
    date_time_original TIMESTAMPTZ,
    has_exif BOOLEAN NOT NULL DEFAULT false,
    raw_exif_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. DUPLICATE MATCHES
CREATE TABLE IF NOT EXISTS duplicate_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    matched_entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    match_type TEXT NOT NULL, -- EXACT_SHA256, PERCEPTUAL_SIMILARITY
    similarity_percentage NUMERIC(5,2) NOT NULL,
    hamming_distance INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ANALYSIS RUNS (HISTORICAL AUDIT)
CREATE TABLE IF NOT EXISTS analysis_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    run_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, FAILED
    overall_result TEXT,
    ai_generation_verdict TEXT,
    ai_edit_detection_status TEXT NOT NULL DEFAULT 'NOT_AVAILABLE',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- 8. DETECTOR RESULTS
CREATE TABLE IF NOT EXISTS detector_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    detector_id TEXT NOT NULL, -- detector-1, detector-2, detector-3
    model_id TEXT NOT NULL,
    model_version TEXT,
    provider TEXT NOT NULL DEFAULT 'huggingface',
    raw_response JSONB,
    normalized_classification TEXT NOT NULL, -- AI, REAL, INCONCLUSIVE, ERROR
    ai_score NUMERIC(6,4),
    real_score NUMERIC(6,4),
    confidence NUMERIC(6,4),
    deadband_gated BOOLEAN NOT NULL DEFAULT true,
    latency_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. REVIEWS (HUMAN COMMITTEE DECISIONS)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    verdict TEXT NOT NULL, -- PENDING, APPROVED, REJECTED, DISQUALIFIED, NEEDS_MORE_INFO
    reviewer_name TEXT NOT NULL,
    reviewer_role TEXT NOT NULL DEFAULT 'Organizer / Judge',
    admin_notes TEXT,
    flagged_for_hearing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB,
    actor TEXT NOT NULL DEFAULT 'admin',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for rapid indexing
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_overall_result ON entries(overall_result);
CREATE INDEX IF NOT EXISTS idx_images_sha256 ON images(sha256);
CREATE INDEX IF NOT EXISTS idx_images_phash ON images(phash);
CREATE INDEX IF NOT EXISTS idx_detector_results_entry ON detector_results(entry_id);
CREATE INDEX IF NOT EXISTS idx_detector_results_run ON detector_results(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_reviews_entry ON reviews(entry_id);

-- Insert Default Competition
INSERT INTO competitions (name, edition, max_entries)
VALUES ('Durga Puja Photography Competition 2026', '2026', 300)
ON CONFLICT DO NOTHING;
