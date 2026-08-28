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
    console.error('Error reading local db file:', err);
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

function saveLocalDb(db: LocalDatabase): void {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local db file:', err);
  }
}

export const db = {
  async getAllEntries(): Promise<Entry[]> {
    const local = loadLocalDb();
    const list = Object.values(local.entries);
    // Attach nested objects
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
    const local = loadLocalDb();
    local.entries[entry.id] = {
      ...entry,
      updated_at: new Date().toISOString(),
    };
    saveLocalDb(local);
  },

  async saveImage(image: ImageRecord): Promise<void> {
    const local = loadLocalDb();
    local.images[image.entry_id] = image;
    saveLocalDb(local);
  },

  async saveMetadata(meta: MetadataRecord, entryId: string): Promise<void> {
    const local = loadLocalDb();
    local.metadata[entryId] = meta;
    saveLocalDb(local);
  },

  async addDuplicateMatch(match: DuplicateMatchRecord): Promise<void> {
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
    const local = loadLocalDb();
    return local.audit_logs;
  },

  async getAllDuplicateMatches(): Promise<DuplicateMatchRecord[]> {
    const local = loadLocalDb();
    return local.duplicate_matches;
  },
};
