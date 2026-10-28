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

  // 5. 완주 보너스 (36문제 전체 완주 시에만 일회성으로 지급, 플레이 중에는 시간 경과로 인한 감점 없음!)
  let completionBonus = 0;
  if (isCompleted) {
    // 36문제 완료 보너스: 1,000점 기본 보장 + 신속 완주(20분 이내) 시 최대 1,000점 추가
    const baseTargetMs = 20 * 60 * 1000;
    if (elapsedTimeMs <= baseTargetMs) {
      const ratio = 1 - Math.min(1, Math.max(0, elapsedTimeMs / baseTargetMs));
      completionBonus = Math.round(1000 + ratio * 1000);
    } else {
      completionBonus = 1000;
    }
  }

  const rawScore = questBaseScore + starScore + completionBonus - hintPenalty - wrongPenalty;

  // 0 ~ 20,000점 클램핑
  return Math.max(0, Math.min(20000, rawScore));
}
