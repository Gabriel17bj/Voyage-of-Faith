/**
 * Faith Voyage (믿음의 항해) Score Calculation Utility
 * 
 * 공식:
 * - 푼 말씀 개수 (solvedCount): 1개당 250점 (36개 올클리어 시 9,000점)
 * - 획득한 별 개수 (totalStars): 별 1개당 80점 (최대 108별 = 8,640점)
 * - 힌트 페널티 (hintsUsed): 1회당 -30점 (페널티 상한: 600점)
 * - 오답 페널티 (wrongAnswersCount): 1회당 -20점 (페널티 상한: 500점)
 * - 시간 보너스:
 *   - 36개 완주 시: 기준 시간(25분 = 1,500,000ms) 이내 달성 시 최대 2,000점 보너스
 *   - 진행 중: 적정 진도 대비 빠른 풀이 보너스 (최대 1,000점)
 * 
 * 점수 범위: 0 ~ 20,000점
 */

export interface ScoreParams {
  solvedCount: number;
  totalStars: number;
  hintsUsed: number;
  wrongAnswersCount: number;
  elapsedTimeMs: number;
  isCompleted?: boolean;
}

export function calculateScore(params: ScoreParams): number {
  const {
    solvedCount,
    totalStars,
    hintsUsed,
    wrongAnswersCount,
    elapsedTimeMs,
    isCompleted = solvedCount >= 36,
  } = params;

  // 1. 말씀 해결 기본 점수 (최대 9,000점)
  const questBaseScore = Math.min(36, Math.max(0, solvedCount)) * 250;

  // 2. 별 획득 점수 (최대 8,640점)
  const starScore = Math.min(108, Math.max(0, totalStars)) * 80;

  // 3. 힌트 사용 감점 (최대 -600점)
  const hintPenalty = Math.min(600, Math.max(0, hintsUsed) * 30);

  // 4. 오답 감점 (최대 -500점)
  const wrongPenalty = Math.min(500, Math.max(0, wrongAnswersCount) * 20);

  // 5. 시간 보너스
  let timeBonus = 0;
  if (isCompleted) {
    // 36문제 완료 보너스: 25분(1,500,000ms) 기준
    const baseTargetMs = 25 * 60 * 1000;
    if (elapsedTimeMs <= baseTargetMs) {
      // 15분 미만 초고속 완주 시 최대 2,000점, 25분이면 1,000점
      const ratio = 1 - Math.min(1, Math.max(0, elapsedTimeMs / baseTargetMs));
      timeBonus = Math.round(1000 + ratio * 1000);
    } else {
      // 25분 초과 시에도 완주 보너스 최소 500점 보장 (시간에 따라 완만 감소)
      timeBonus = Math.max(200, Math.round(1000 - ((elapsedTimeMs - baseTargetMs) / 60000) * 25));
    }
  } else if (solvedCount > 0) {
    // 진행 중 시간 효율 보너스 (문제당 평균 40초 이내면 보너스)
    const expectedTimeMs = solvedCount * 45 * 1000;
    if (elapsedTimeMs < expectedTimeMs) {
      timeBonus = Math.min(600, Math.round(((expectedTimeMs - elapsedTimeMs) / expectedTimeMs) * 600));
    }
  }

  const rawScore = questBaseScore + starScore + timeBonus - hintPenalty - wrongPenalty;

  // 0 ~ 20,000점 클램핑
  return Math.max(0, Math.min(20000, rawScore));
}

export interface RankTier {
  tier: string;
  badge: string;
  color: string;
  bgGradient: string;
}

export function getRankTier(score: number, solvedCount: number): RankTier {
  if (solvedCount >= 36 && score >= 17000) {
    return {
      tier: '믿음의 사도 (Grandmaster)',
      badge: '👑',
      color: 'text-amber-300',
      bgGradient: 'from-amber-500 to-yellow-600',
    };
  }
  if (score >= 13000) {
    return {
      tier: '빛의 인도자 (Master)',
      badge: '⭐',
      color: 'text-purple-300',
      bgGradient: 'from-purple-500 to-indigo-600',
    };
  }
  if (score >= 9000) {
    return {
      tier: '진리의 항해사 (Navigator)',
      badge: '🧭',
      color: 'text-sky-300',
      bgGradient: 'from-sky-500 to-blue-600',
    };
  }
  if (score >= 5000) {
    return {
      tier: '약속의 탐험가 (Explorer)',
      badge: '🌿',
      color: 'text-emerald-300',
      bgGradient: 'from-emerald-500 to-teal-600',
    };
  }
  return {
    tier: '초보 순례자 (Pilgrim)',
    badge: '⛵',
    color: 'text-slate-300',
    bgGradient: 'from-slate-600 to-slate-700',
  };
}
