export type FamId = 'agape' | 'shalom' | 'wisdom';

export interface PlayerProfile {
  name: string;
  /** 선생님이 알려준 5자리 수업 코드 (없으면 혼자 연습) */
  classCode?: string;
  /** 기록 호환용 (화면에서는 사용하지 않음) */
  fam: FamId;
  characterId?: string;
}

/** 이 기기에 저장되는 진행 상황 (이어하기용) */
export interface PlayerProgress {
  profile: PlayerProfile;
  /** 말씀 번호 → 별(1~3) */
  solved: Record<number, number>;
  hintsUsed: number;
  wrongCount: number;
  wrongByVerse: Record<string, number>;
  elapsedMs: number;
  startedAt: number;
  updatedAt: number;
}

export interface StudentSession {
  id: string;
  classCode: string;
  studentName: string;
  famId: FamId;
  characterId?: string;
  score: number;
  solvedCount: number;
  solvedQuestIds: number[];
  totalStars: number;
  hintsUsed: number;
  wrongAnswersCount: number;
  wrongQuestCounts?: { [questId: string]: number };
  currentQuestId: number | null;
  elapsedTimeMs: number;
  joinedAt?: number;
  lastActiveAt: number;
  isOnline: boolean;
  isCompleted: boolean;
  completedAt?: number;
}

export interface Classroom {
  code: string;
  title: string;
  teacherEmail: string;
  createdAt: number;
  isClosed?: boolean;
}

export type GameResultReason = 'completed' | 'quit';

/** 수업 내 학생 1회 게임 결과 기록 (영구 보관용) */
export interface GameResult {
  id: string;
  classCode: string;
  studentId: string;
  studentName: string;
  famId: FamId;
  characterId?: string;
  score: number;
  solvedCount: number;
  totalStars: number;
  hintsUsed: number;
  wrongAnswersCount: number;
  elapsedTimeMs: number;
  isCompleted: boolean;
  reason: GameResultReason;
  startedAt?: number;
  finishedAt: number;
}
