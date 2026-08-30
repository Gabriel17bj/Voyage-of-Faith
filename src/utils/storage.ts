import { PlayerProgress, VerseQuest, VerseReviewRecord } from '../types';

export const STORAGE_KEY_PROGRESS = 'VOYAGE_OF_FAITH_PROGRESS_V1';

/**
 * Load saved progress from localStorage with validation
 */
export function loadSavedProgress(): PlayerProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerProgress;
    if (
      parsed &&
      parsed.playerProfile &&
      Array.isArray(parsed.solvedQuestIds) &&
      parsed.questStars
    ) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('Failed to load player progress from localStorage:', err);
    return null;
  }
}

/**
 * Save player progress safely to localStorage
 */
export function saveSavedProgress(progress: PlayerProgress): void {
  try {
    const payload: PlayerProgress = {
      ...progress,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save player progress to localStorage:', err);
  }
}

/**
 * Clear player progress from localStorage
 */
export function clearSavedProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
  } catch (err) {
    console.warn('Failed to clear player progress from localStorage:', err);
  }
}

/**
 * Review Spaced Repetition (1, 3, 7, 14, 30 days) intervals
 * Calculates which solved verses are due for review.
 */
export function getDueReviewQuests(
  quests: VerseQuest[],
  solvedQuestIds: number[],
  reviewHistory: { [questId: number]: VerseReviewRecord }
): VerseQuest[] {
  const now = Date.now();

  return quests.filter((q) => {
    if (!solvedQuestIds.includes(q.id)) return false;
    const rec = reviewHistory[q.id];
    if (!rec) return true; // Never reviewed -> due

    const lastTime = new Date(rec.lastReviewedAt).getTime();
    if (isNaN(lastTime)) return true;

    const diffDays = (now - lastTime) / (1000 * 60 * 60 * 24);

    // Review interval based on successful count
    const intervalDays = rec.correctCount === 0 ? 1 : rec.correctCount === 1 ? 3 : rec.correctCount === 2 ? 7 : 14;
    return diffDays >= intervalDays;
  });
}
