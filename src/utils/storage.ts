import { PlayerProgress } from '../types';

const STORAGE_KEY_PROGRESS = 'VOYAGE_OF_FAITH_PROGRESS_V2';

export function loadSavedProgress(): PlayerProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!raw) return null;
    const p = JSON.parse(raw) as PlayerProgress;
    if (p && p.profile && p.solved && typeof p.elapsedMs === 'number') return p;
  } catch {}
  return null;
}

export function saveSavedProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify({ ...progress, updatedAt: Date.now() }));
  } catch {}
}

export function clearSavedProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
  } catch {}
}
