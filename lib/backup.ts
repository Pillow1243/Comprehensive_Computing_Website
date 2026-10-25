/**
 * Portable backup / restore (v5) — the honest sync story for a static,
 * account-free app: your whole on-device state (settings, history, bookmarks,
 * practice, learning progress, workspace) travels as one JSON file that you
 * can move between devices yourself. Nothing is uploaded anywhere.
 */
import { verificationCode } from '@/lib/advanced-math';

export const BACKUP_SCHEMA = 'solveeverything.backup/v1';

export interface BackupEnvelope {
  schema: typeof BACKUP_SCHEMA;
  appVersion: string;
  exportedAt: string;
  checksum: string;
  state: Record<string, unknown>;
}

const STATE_KEYS = [
  'settings',
  'history',
  'bookmarks',
  'recent',
  'practice',
  'learnDone',
  'workspace',
  'whatsNewSeen',
] as const;

export type BackupStateKey = (typeof STATE_KEYS)[number];

/** Build a checksummed backup envelope from the persisted slices of the store. */
export function createBackup(state: Record<string, unknown>, appVersion: string): string {
  const slices: Record<string, unknown> = {};
  for (const key of STATE_KEYS) {
    if (key in state) slices[key] = state[key];
  }
  const envelope: BackupEnvelope = {
    schema: BACKUP_SCHEMA,
    appVersion,
    exportedAt: new Date().toISOString(),
    checksum: verificationCode(slices),
    state: slices,
  };
  return `${JSON.stringify(envelope, null, 2)}\n`;
}

/**
 * Parse and validate a backup file. Only known state slices are returned, so a
 * hostile or corrupted file cannot smuggle arbitrary keys into the store.
 */
export function parseBackup(text: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Backup file is not valid JSON');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Backup file is malformed');
  const envelope = parsed as Partial<BackupEnvelope>;
  if (envelope.schema !== BACKUP_SCHEMA) throw new Error('Unsupported backup schema');
  if (!envelope.state || typeof envelope.state !== 'object') throw new Error('Backup state is missing');
  if (envelope.checksum !== verificationCode(envelope.state)) {
    throw new Error('Backup checksum mismatch — the file may be corrupted');
  }
  const clean: Record<string, unknown> = {};
  for (const key of STATE_KEYS) {
    if (key in envelope.state) clean[key] = (envelope.state as Record<string, unknown>)[key];
  }
  if ('history' in clean && !Array.isArray(clean.history)) throw new Error('Backup history is malformed');
  if ('bookmarks' in clean && !Array.isArray(clean.bookmarks)) throw new Error('Backup bookmarks are malformed');
  if ('workspace' in clean && !Array.isArray(clean.workspace)) throw new Error('Backup workspace is malformed');
  return clean;
}

export const BACKUP_STATE_KEYS = STATE_KEYS;
