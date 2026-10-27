import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, getFirebaseConfigSummary } from './firebase';
import { GAS_WEB_APP_URL } from '../config';
import { StudentSession, Classroom, PlayerProfile, FamId, GameResult } from '../types';

/**
 * 실시간 수업 연동 엔진 (하나의 엔진만 사용해 기록이 섞이지 않도록 함)
 *
 *  - 'gas'      : 구글 스프레드시트 + Apps Script 웹 앱 (gas/Code.gs). 설정되어 있으면 최우선 사용.
 *                 시트에 학생 현황/게임 기록이 남고, 교사 화면은 몇 초마다 새로 불러옴.
 *  - 'firebase' : Firestore(구글) 사용. Vercel 배포 시 기본. 모든 기기 간 실시간 동기화 + 영구 기록.
 *  - 'server'   : server.ts(Express) API 사용. AI Studio 미리보기 / `npm run dev` 환경.
 *  - 'local'    : 위 둘 다 없을 때. 같은 브라우저 안에서만 동작하는 데모 모드.
 */
export type SyncMode = 'gas' | 'firebase' | 'server' | 'local';

// ============================================================================
// CONSTANTS & STORAGE KEYS FOR LOCAL / OFFLINE FALLBACK
// ============================================================================
const STORAGE_CLASSROOMS_KEY = 'PROMISE_LAND_LOCAL_CLASSROOMS_V1';
const STORAGE_STUDENTS_PREFIX = 'PROMISE_LAND_LOCAL_STUDENTS_';
const STORAGE_RESULTS_PREFIX = 'PROMISE_LAND_LOCAL_RESULTS_';
const STORAGE_STUDENT_ID_KEY = 'PROMISE_LAND_STUDENT_UID_V1';
const STORAGE_TEACHER_SESSION_KEY = 'PROMISE_LAND_TEACHER_AUTH_V1';
const SYNC_CHANNEL_NAME = 'PROMISE_LAND_BROADCAST_SYNC_V1';

/** 이 시간 안에 신호가 있으면 '접속 중'으로 표시 */
export const ONLINE_THRESHOLD_MS = 75 * 1000;
/** 스프레드시트 모드는 Apps Script 사용량 한도를 고려해 신호 간격이 길어 기준도 넉넉하게 */
const GAS_ONLINE_THRESHOLD_MS = 150 * 1000;

const GAS_URL = String(import.meta.env.VITE_GAS_URL || GAS_WEB_APP_URL || '').trim();

export function isGasConfigured(): boolean {
  return /^https:\/\/script\.google(usercontent)?\.com\/.+/.test(GAS_URL);
}

export function getGasUrlPreview(): string {
  if (!GAS_URL) return '';
  const m = GAS_URL.match(/\/s\/([^/]+)\//);
  return m ? `…/s/${m[1].slice(0, 8)}…${m[1].slice(-4)}/exec` : GAS_URL.slice(0, 40);
}

/** 교사 화면의 '구글 시트 열기' 링크용 */
export async function getGasSheetUrl(): Promise<string | null> {
  if (!isGasConfigured()) return null;
  try {
    const data = await withTimeout(gasGet<{ sheetUrl?: string }>({ action: 'health' }), 20000);
    return data.sheetUrl || null;
  } catch {
    return null;
  }
}

/** 학생 기기의 접속 신호 간격 (스프레드시트 모드는 60초) */
export function getHeartbeatIntervalMs(): number {
  return resolvedSyncMode === 'gas' ? 60000 : 30000;
}

// Initial preloaded classrooms
export const DEFAULT_DEMO_CLASSROOMS: Classroom[] = [
  {
    code: 'FAITH',
    title: '2026 초등부 성경탐험대',
    teacherEmail: 'teacher@promise.land',
    createdAt: Date.now() - 3600000 * 2,
    isClosed: false,
  },
  {
    code: 'GRACE',
    title: '중고등부 믿음의 항해',
    teacherEmail: 'teacher@promise.land',
    createdAt: Date.now() - 86400000,
    isClosed: false,
  },
];

// Initial preloaded students for class 'FAITH'
export const DEFAULT_DEMO_STUDENTS: StudentSession[] = [
  {
    id: 'demo-st-1',
    classCode: 'FAITH',
    studentName: '다윗',
    famId: 'agape',
    characterId: 'sailor_boy',
    score: 17200,
    solvedCount: 36,
    solvedQuestIds: Array.from({ length: 36 }, (_, i) => i + 1),
    totalStars: 106,
    hintsUsed: 2,
    wrongAnswersCount: 1,
    wrongQuestCounts: { 14: 1 },
    currentQuestId: null,
    elapsedTimeMs: 384000,
    lastActiveAt: Date.now(),
    isOnline: true,
    isCompleted: true,
  },
  {
    id: 'demo-st-2',
    classCode: 'FAITH',
    studentName: '에스더',
    famId: 'shalom',
    characterId: 'bible_girl',
    score: 16400,
    solvedCount: 35,
    solvedQuestIds: Array.from({ length: 35 }, (_, i) => i + 1),
    totalStars: 101,
    hintsUsed: 3,
    wrongAnswersCount: 2,
    wrongQuestCounts: { 7: 1, 14: 1 },
    currentQuestId: 36,
    elapsedTimeMs: 420000,
    lastActiveAt: Date.now() - 10000,
    isOnline: true,
    isCompleted: false,
  },
  {
    id: 'demo-st-3',
    classCode: 'FAITH',
    studentName: '요셉',
    famId: 'wisdom',
    characterId: 'adventurer_boy',
    score: 15100,
    solvedCount: 32,
    solvedQuestIds: Array.from({ length: 32 }, (_, i) => i + 1),
    totalStars: 92,
    hintsUsed: 5,
    wrongAnswersCount: 3,
    wrongQuestCounts: { 14: 2, 22: 1 },
    currentQuestId: 33,
    elapsedTimeMs: 495000,
    lastActiveAt: Date.now() - 25000,
    isOnline: true,
    isCompleted: false,
  },
  {
    id: 'demo-st-4',
    classCode: 'FAITH',
    studentName: '사무엘',
    famId: 'shalom',
    characterId: 'explorer_boy',
    score: 14200,
    solvedCount: 30,
    solvedQuestIds: Array.from({ length: 30 }, (_, i) => i + 1),
    totalStars: 87,
    hintsUsed: 4,
    wrongAnswersCount: 4,
    wrongQuestCounts: { 7: 2, 14: 2 },
    currentQuestId: 31,
    elapsedTimeMs: 512000,
    lastActiveAt: Date.now() - 5000,
    isOnline: true,
    isCompleted: false,
  },
  {
    id: 'demo-st-5',
    classCode: 'FAITH',
    studentName: '마리아',
    famId: 'agape',
    characterId: 'jesus_lantern',
    score: 13500,
    solvedCount: 28,
    solvedQuestIds: Array.from({ length: 28 }, (_, i) => i + 1),
    totalStars: 82,
    hintsUsed: 6,
    wrongAnswersCount: 2,
    wrongQuestCounts: { 14: 1, 18: 1 },
    currentQuestId: 29,
    elapsedTimeMs: 480000,
    lastActiveAt: Date.now() - 180000,
    isOnline: false,
    isCompleted: false,
  },
  {
    id: 'demo-st-6',
    classCode: 'FAITH',
    studentName: '다니엘',
    famId: 'wisdom',
    characterId: 'sailor_boy',
    score: 11800,
    solvedCount: 25,
    solvedQuestIds: Array.from({ length: 25 }, (_, i) => i + 1),
    totalStars: 73,
    hintsUsed: 8,
    wrongAnswersCount: 6,
    wrongQuestCounts: { 14: 3, 22: 2, 28: 1 },
    currentQuestId: 26,
    elapsedTimeMs: 620000,
    lastActiveAt: Date.now() - 4000,
    isOnline: true,
    isCompleted: false,
  },
  {
    id: 'demo-st-7',
    classCode: 'FAITH',
    studentName: '디모데',
    famId: 'agape',
    characterId: 'explorer_boy',
    score: 9800,
    solvedCount: 21,
    solvedQuestIds: Array.from({ length: 21 }, (_, i) => i + 1),
    totalStars: 60,
    hintsUsed: 9,
    wrongAnswersCount: 5,
    wrongQuestCounts: { 7: 2, 14: 2, 33: 1 },
    currentQuestId: 22,
    elapsedTimeMs: 710000,
    lastActiveAt: Date.now() - 12000,
    isOnline: true,
    isCompleted: false,
  },
  {
    id: 'demo-st-8',
    classCode: 'FAITH',
    studentName: '여호수아',
    famId: 'wisdom',
    characterId: 'adventurer_boy',
    score: 8200,
    solvedCount: 17,
    solvedQuestIds: Array.from({ length: 17 }, (_, i) => i + 1),
    totalStars: 49,
    hintsUsed: 12,
    wrongAnswersCount: 7,
    wrongQuestCounts: { 14: 4, 18: 2, 29: 1 },
    currentQuestId: 18,
    elapsedTimeMs: 830000,
    lastActiveAt: Date.now() - 120000,
    isOnline: false,
    isCompleted: false,
  },
  {
    id: 'demo-st-9',
    classCode: 'FAITH',
    studentName: '루디아',
    famId: 'shalom',
    characterId: 'bible_girl',
    score: 6500,
    solvedCount: 14,
    solvedQuestIds: Array.from({ length: 14 }, (_, i) => i + 1),
    totalStars: 40,
    hintsUsed: 7,
    wrongAnswersCount: 4,
    wrongQuestCounts: { 7: 2, 10: 2 },
    currentQuestId: 15,
    elapsedTimeMs: 540000,
    lastActiveAt: Date.now() - 15000,
    isOnline: true,
    isCompleted: false,
  },
  {
    id: 'demo-st-10',
    classCode: 'FAITH',
    studentName: '한나',
    famId: 'agape',
    characterId: 'jesus_lantern',
    score: 4900,
    solvedCount: 10,
    solvedQuestIds: Array.from({ length: 10 }, (_, i) => i + 1),
    totalStars: 28,
    hintsUsed: 6,
    wrongAnswersCount: 8,
    wrongQuestCounts: { 7: 3, 10: 2, 14: 3 },
    currentQuestId: 11,
    elapsedTimeMs: 430000,
    lastActiveAt: Date.now() - 8000,
    isOnline: true,
    isCompleted: false,
  },
];

// ============================================================================
// SYNC MODE DETECTION
// ============================================================================
let syncModePromise: Promise<SyncMode> | null = null;
let resolvedSyncMode: SyncMode | null = null;

export function detectSyncMode(): Promise<SyncMode> {
  if (!syncModePromise) {
    syncModePromise = (async (): Promise<SyncMode> => {
      if (isGasConfigured()) return 'gas';
      if (isFirebaseConfigured() && db) return 'firebase';
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok) return 'server';
        }
      } catch (e) {}
      return 'local';
    })().then((mode) => {
      resolvedSyncMode = mode;
      console.info(`[Cloud] 실시간 연동 모드: ${mode}`);
      return mode;
    });
  }
  return syncModePromise;
}

export function getResolvedSyncMode(): SyncMode | null {
  return resolvedSyncMode;
}

/** 네트워크가 막혀 무한 대기하지 않도록 시간 제한 */
function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'timeout' })), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

/** Firebase/서버 오류를 학생·교사가 이해할 수 있는 안내문으로 변환 */
export function describeSyncError(err: any): string {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');
  if (code === 'class-not-found' || code === 'closed' || code === 'exists') return msg;
  if (code === 'busy') return '접속하는 학생이 많아 잠시 밀렸습니다. 몇 초 뒤 다시 시도해 주세요.';
  if (code === 'gas-unreachable') {
    return '구글 스프레드시트 서버에 연결할 수 없습니다. (교사: Apps Script를 "웹 앱"으로 배포하고 액세스 권한을 "모든 사용자"로 설정했는지, 주소가 /exec 로 끝나는지 확인)';
  }
  if (code === 'gas-not-json') {
    return '구글 스프레드시트 서버가 올바른 응답을 주지 않았습니다. (교사: 웹 앱 액세스 권한을 "모든 사용자"로 다시 배포했는지 확인)';
  }
  if (code === 'server-error') return `스프레드시트 서버 오류: ${msg}`;
  if (code === 'timeout' || code === 'unavailable' || /offline/i.test(msg)) {
    return '수업 서버에 응답이 없습니다. 인터넷 연결을 확인하세요. (교사: Firebase 콘솔에서 Firestore 데이터베이스를 만들었는지 확인)';
  }
  if (code === 'permission-denied' || /permission/i.test(msg)) {
    if (/API has not been used|SERVICE_DISABLED|disabled/i.test(msg)) {
      return '이 구글 API 키의 프로젝트에서 Cloud Firestore API가 꺼져 있습니다. (교사: Firebase 프로젝트의 웹 앱 API 키를 사용하세요)';
    }
    return '수업 서버가 접근을 거부했습니다. (교사: Firestore 규칙에 firestore.rules 내용을 게시했는지 확인)';
  }
  if (/api[- ]?key|API_KEY_INVALID|invalid-api-key|API key not valid/i.test(code + msg)) {
    return '구글 API 키가 올바르지 않습니다. (교사: VITE_FIREBASE_API_KEY에 Firebase 웹 앱의 apiKey를 넣으세요)';
  }
  if (/referer|referrer|blocked/i.test(msg)) {
    return '구글 API 키에 웹사이트 제한이 걸려 있습니다. (교사: Google Cloud 콘솔 > API 키 > 웹사이트 제한에 배포 주소를 추가)';
  }
  if (code === 'not-found' || /database .* does not exist|NOT_FOUND/i.test(msg)) {
    return 'Firestore 데이터베이스가 없습니다. (교사: Firebase 콘솔 > Firestore Database > 데이터베이스 만들기)';
  }
  return `수업 서버 연결 오류: ${code || msg || '알 수 없는 오류'}`;
}

export const LOCAL_MODE_JOIN_ERROR =
  '이 사이트에 수업 기록 서버(구글 스프레드시트)가 설정되어 있지 않아 선생님 화면과 연결할 수 없습니다. 선생님께 알려주세요. (혼자 연습하기는 가능)';

async function apiJson<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || `요청 실패 (${res.status})`);
  }
  return data as T;
}

// ============================================================================
// GOOGLE SHEETS (APPS SCRIPT) HELPERS
// ============================================================================

async function gasParse<T>(res: Response): Promise<T> {
  let data: any;
  try {
    data = await res.json();
  } catch {
    throw Object.assign(new Error('not json'), { code: 'gas-not-json' });
  }
  if (!data || data.success === false) {
    throw Object.assign(new Error(data?.error || '요청 실패'), { code: data?.code || 'server-error' });
  }
  return data as T;
}

async function gasGet<T = any>(params: Record<string, string>): Promise<T> {
  const url = `${GAS_URL}?${new URLSearchParams({ ...params, _: String(Date.now()) })}`;
  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store' });
  } catch {
    throw Object.assign(new Error('unreachable'), { code: 'gas-unreachable' });
  }
  return gasParse<T>(res);
}

/** Content-Type을 text/plain으로 보내야 브라우저 사전요청(CORS preflight) 없이 Apps Script에 전달됨 */
async function gasPost<T = any>(body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(GAS_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
  } catch {
    throw Object.assign(new Error('unreachable'), { code: 'gas-unreachable' });
  }
  return gasParse<T>(res);
}

/** 일정 간격으로 불러오기 (탭이 숨겨져 있으면 쉬어서 Apps Script 사용량 절약) */
function startPolling(fn: () => Promise<void> | void, intervalMs: number): () => void {
  let stopped = false;
  let timer: number | undefined;
  const tick = async () => {
    if (stopped) return;
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      try {
        await fn();
      } catch {}
    }
    if (!stopped) timer = window.setTimeout(tick, intervalMs);
  };
  tick();
  const onVisible = () => {
    if (document.visibilityState === 'visible' && !stopped) {
      window.clearTimeout(timer);
      tick();
    }
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

// ============================================================================
// LOCAL HELPERS
// ============================================================================

// BroadcastChannel for cross-tab communication
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('[Cloud] BroadcastChannel not supported:', e);
}

function notifySyncEvent(type: string, detail: any) {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type, detail, timestamp: Date.now() });
    }
  } catch (err) {}
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('promise_land_sync', { detail: { type, detail } }));
    }
  } catch (err) {}
}

/** 로컬 변경을 구독 (같은 탭 + 다른 탭) */
function listenLocalSync(handler: () => void, storageKey?: string): () => void {
  const onStorage = (e: StorageEvent) => {
    if (!storageKey || e.key === storageKey) handler();
  };
  if (broadcastChannel) broadcastChannel.addEventListener('message', handler);
  window.addEventListener('storage', onStorage);
  window.addEventListener('promise_land_sync', handler);
  return () => {
    if (broadcastChannel) broadcastChannel.removeEventListener('message', handler);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('promise_land_sync', handler);
  };
}

// Local Device ID Generator/Getter
export function getOrCreateLocalStudentId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_STUDENT_ID_KEY);
    if (existing) return existing;
    const newId = 'st_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(STORAGE_STUDENT_ID_KEY, newId);
    return newId;
  } catch (e) {
    return 'st_local_' + Math.floor(Math.random() * 100000);
  }
}

/** 기기 ID + 이름으로 학생 ID 생성 (한 기기를 여러 학생이 번갈아 써도 기록이 분리됨) */
function buildStudentId(name: string): string {
  const base = getOrCreateLocalStudentId();
  let hash = 0;
  const clean = name.trim();
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) | 0;
  }
  return `${base}_${Math.abs(hash).toString(36)}`;
}

// 현재 접속 중인 학생 세션 정보 (join 시 설정)
let activeStudentId: string | null = null;
let activeClassCode: string | null = null;
// 교사가 수업 중 현황을 초기화해도 다음 동기화 때 학생 정보가 온전히 다시 생성되도록 보관
let activeIdentity: Pick<StudentSession, 'id' | 'classCode' | 'studentName' | 'famId' | 'characterId'> | null = null;

function currentStudentId(): string {
  return activeStudentId || getOrCreateLocalStudentId();
}

// Teacher Local Session Storage
export function saveLocalTeacherSession(email: string) {
  try {
    localStorage.setItem(STORAGE_TEACHER_SESSION_KEY, JSON.stringify({
      email: email.trim(),
      uid: 'teacher_' + btoa(email.trim()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16),
      savedAt: Date.now(),
    }));
  } catch (e) {}
}

export function getLocalTeacherSession(): { email: string; uid: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_TEACHER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function clearLocalTeacherSession() {
  try {
    localStorage.removeItem(STORAGE_TEACHER_SESSION_KEY);
  } catch (e) {}
}

// Local Classrooms Store
export function getLocalClassrooms(): Classroom[] {
  try {
    const raw = localStorage.getItem(STORAGE_CLASSROOMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  try {
    localStorage.setItem(STORAGE_CLASSROOMS_KEY, JSON.stringify(DEFAULT_DEMO_CLASSROOMS));
  } catch (e) {}
  return DEFAULT_DEMO_CLASSROOMS;
}

export function saveLocalClassrooms(classrooms: Classroom[]) {
  try {
    localStorage.setItem(STORAGE_CLASSROOMS_KEY, JSON.stringify(classrooms));
    notifySyncEvent('CLASSROOMS_UPDATED', classrooms);
  } catch (e) {}
}

// Local Students Store
export function getLocalStudents(classCode: string): StudentSession[] {
  const code = classCode.trim().toUpperCase();
  try {
    const raw = localStorage.getItem(STORAGE_STUDENTS_PREFIX + code);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}

  // 로컬 데모 모드에서만 FAITH 반 예시 학생을 채워 넣음
  if (code === 'FAITH' && resolvedSyncMode === 'local') {
    try {
      localStorage.setItem(STORAGE_STUDENTS_PREFIX + 'FAITH', JSON.stringify(DEFAULT_DEMO_STUDENTS));
    } catch (e) {}
    return DEFAULT_DEMO_STUDENTS;
  }

  return [];
}

export function saveLocalStudents(classCode: string, students: StudentSession[]) {
  const code = classCode.trim().toUpperCase();
  try {
    localStorage.setItem(STORAGE_STUDENTS_PREFIX + code, JSON.stringify(students));
    notifySyncEvent('STUDENTS_UPDATED', { classCode: code, count: students.length });
  } catch (e) {}
}

function getLocalResults(classCode: string): GameResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_RESULTS_PREFIX + classCode.trim().toUpperCase());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveLocalResults(classCode: string, results: GameResult[]) {
  try {
    localStorage.setItem(STORAGE_RESULTS_PREFIX + classCode.trim().toUpperCase(), JSON.stringify(results));
    notifySyncEvent('RESULTS_UPDATED', { classCode });
  } catch (e) {}
}

function upsertLocalStudent(classCode: string, studentId: string, patch: Partial<StudentSession>) {
  const list = getLocalStudents(classCode);
  const idx = list.findIndex((s) => s.id === studentId);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
    saveLocalStudents(classCode, list);
  }
}

// ============================================================================
// SHARED HELPERS
// ============================================================================

function newStudentSession(
  id: string,
  classCode: string,
  profile: PlayerProfile,
  initialScore: number
): StudentSession {
  const now = Date.now();
  return {
    id,
    classCode,
    studentName: profile.name,
    famId: profile.fam,
    characterId: profile.characterId || 'sailor_boy',
    score: initialScore,
    solvedCount: 0,
    solvedQuestIds: [],
    totalStars: 0,
    hintsUsed: 0,
    wrongAnswersCount: 0,
    wrongQuestCounts: {},
    currentQuestId: null,
    elapsedTimeMs: 0,
    joinedAt: now,
    lastActiveAt: now,
    isOnline: true,
    isCompleted: false,
  };
}

function defaultClassroom(code: string): Classroom {
  return {
    code,
    title: `${code} 성경탐험대`,
    teacherEmail: 'teacher@promise.land',
    createdAt: Date.now(),
    isClosed: false,
  };
}

/** Firestore는 undefined 값을 허용하지 않으므로 제거 */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out as T;
}

export function sortStudentsByRank(list: StudentSession[]): StudentSession[] {
  const now = Date.now();
  return [...list]
    .map((st) => ({
      ...st,
      isOnline:
        st.isOnline !== false &&
        now - (st.lastActiveAt || 0) < (resolvedSyncMode === 'gas' ? GAS_ONLINE_THRESHOLD_MS : ONLINE_THRESHOLD_MS),
    }))
    .sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      if ((b.totalStars || 0) !== (a.totalStars || 0)) return (b.totalStars || 0) - (a.totalStars || 0);
      return (a.elapsedTimeMs || 0) - (b.elapsedTimeMs || 0);
    });
}

// ============================================================================
// PUBLIC SYNC & DASHBOARD APIS
// ============================================================================

/** (호환용) 이제 학생 기록은 인증 없이 기기 ID로 저장합니다. */
export async function ensureStudentAuth(): Promise<null> {
  return null;
}

/**
 * 학생이 수업 코드로 반에 입장
 */
export async function joinClassroom(
  rawClassCode: string,
  profile: PlayerProfile,
  initialScore: number = 0
): Promise<{ success: boolean; error?: string; session?: StudentSession; mode?: SyncMode }> {
  const classCode = rawClassCode.trim().toUpperCase();
  if (!classCode) {
    return { success: false, error: '수업 코드를 입력해주세요.' };
  }

  const studentId = buildStudentId(profile.name);
  const mode = await detectSyncMode();

  // 공유 서버가 없으면 다른 기기(선생님 화면)와 연결할 수 없으므로 '연결됨'으로 속이지 않음
  if (mode === 'local') {
    return { success: false, error: LOCAL_MODE_JOIN_ERROR, mode };
  }

  const notFound = () =>
    Object.assign(
      new Error(`수업 코드 [${classCode}]를 찾을 수 없습니다. 선생님이 알려준 코드를 다시 확인하세요. (0과 O, 1과 I 구분)`),
      { code: 'class-not-found' }
    );

  try {
    let session: StudentSession;

    if (mode === 'firebase' && db) {
      const classRef = doc(db, 'classrooms', classCode);
      const classSnap = await withTimeout(getDoc(classRef));
      if (!classSnap.exists()) {
        // 오타 코드로 엉뚱한 빈 수업이 만들어지지 않도록, 교사가 만든 수업에만 입장
        throw notFound();
      } else if ((classSnap.data() as Classroom).isClosed) {
        return { success: false, error: '해당 수업은 입장이 마감되었습니다.' };
      }

      const studentRef = doc(db, 'classrooms', classCode, 'students', studentId);
      const existingSnap = await withTimeout(getDoc(studentRef));
      const now = Date.now();
      if (existingSnap.exists()) {
        const patch = {
          studentName: profile.name,
          famId: profile.fam,
          characterId: profile.characterId || 'sailor_boy',
          lastActiveAt: now,
          isOnline: true,
        };
        await withTimeout(updateDoc(studentRef, patch));
        session = { ...(existingSnap.data() as StudentSession), ...patch, id: studentId };
      } else {
        session = newStudentSession(studentId, classCode, profile, initialScore);
        await withTimeout(setDoc(studentRef, session));
      }
    } else if (mode === 'gas') {
      const data = await withTimeout(
        gasPost<{ session: StudentSession }>({
          action: 'join',
          classCode,
          session: newStudentSession(studentId, classCode, profile, initialScore),
        }),
        20000
      );
      session = data.session;
    } else {
      const data = await withTimeout(apiJson<{ session: StudentSession }>(`/api/classrooms/${classCode}/join`, {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          studentName: profile.name,
          famId: profile.fam,
          characterId: profile.characterId || 'sailor_boy',
          initialScore,
        }),
      }));
      session = data.session;
    }

    activeStudentId = studentId;
    activeClassCode = classCode;
    activeIdentity = {
      id: studentId,
      classCode,
      studentName: session.studentName,
      famId: session.famId,
      characterId: session.characterId,
    };
    notifySyncEvent('STUDENT_JOIN', { classCode, student: session });
    return { success: true, session, mode };
  } catch (err: any) {
    console.warn('[Cloud] joinClassroom failed:', err);
    if (mode === 'server' && /찾을 수 없습니다/.test(String(err?.message))) {
      return { success: false, error: notFound().message, mode };
    }
    return { success: false, error: describeSyncError(err), mode };
  }
}

/**
 * 학생 진행도 실시간 동기화
 */
export async function updateStudentProgress(
  classCode: string,
  updates: Partial<StudentSession>
): Promise<void> {
  const cleanCode = classCode.trim().toUpperCase();
  if (!cleanCode) return;

  const studentId = currentStudentId();
  const mode = await detectSyncMode();
  const payload = stripUndefined({ ...updates, lastActiveAt: Date.now(), isOnline: true });

  try {
    if (mode === 'firebase' && db) {
      const identity = activeIdentity && activeIdentity.classCode === cleanCode ? stripUndefined({ ...activeIdentity }) : {};
      await setDoc(doc(db, 'classrooms', cleanCode, 'students', studentId), { ...identity, ...payload }, { merge: true });
    } else if (mode === 'gas') {
      const identity = activeIdentity && activeIdentity.classCode === cleanCode ? stripUndefined({ ...activeIdentity }) : {};
      await gasPost({ action: 'progress', classCode: cleanCode, studentId, updates: payload, identity });
    } else if (mode === 'server') {
      await apiJson(`/api/classrooms/${cleanCode}/progress`, {
        method: 'POST',
        body: JSON.stringify({ studentId, updates: payload }),
      });
    } else {
      upsertLocalStudent(cleanCode, studentId, payload);
      notifySyncEvent('STUDENT_PROGRESS', { classCode: cleanCode, studentId });
    }
  } catch (err) {
    console.warn('[Cloud] updateStudentProgress failed:', err);
  }
}

/**
 * 접속 신호 (Heartbeat)
 */
export async function sendHeartbeat(classCode: string): Promise<void> {
  const cleanCode = classCode.trim().toUpperCase();
  if (!cleanCode) return;

  const studentId = currentStudentId();
  const mode = await detectSyncMode();
  const now = Date.now();

  try {
    if (mode === 'firebase' && db) {
      await updateDoc(doc(db, 'classrooms', cleanCode, 'students', studentId), {
        lastActiveAt: now,
        isOnline: true,
      });
    } else if (mode === 'gas') {
      await gasPost({ action: 'heartbeat', classCode: cleanCode, studentId });
    } else if (mode === 'server') {
      await apiJson(`/api/classrooms/${cleanCode}/heartbeat`, {
        method: 'POST',
        body: JSON.stringify({ studentId }),
      });
    } else {
      upsertLocalStudent(cleanCode, studentId, { lastActiveAt: now, isOnline: true });
    }
  } catch (err) {}
}

/**
 * 학생이 앱을 닫거나 다른 앱으로 전환했을 때 '오프라인' 표시 (best-effort)
 */
export function markStudentOffline(classCode?: string): void {
  const cleanCode = (classCode || activeClassCode || '').trim().toUpperCase();
  if (!cleanCode) return;
  const studentId = currentStudentId();
  const mode = resolvedSyncMode;

  try {
    if (mode === 'firebase' && db) {
      updateDoc(doc(db, 'classrooms', cleanCode, 'students', studentId), { isOnline: false }).catch(() => {});
    } else if (mode === 'gas') {
      const body = JSON.stringify({ action: 'offline', classCode: cleanCode, studentId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(GAS_URL, new Blob([body], { type: 'text/plain;charset=utf-8' }));
      }
    } else if (mode === 'server') {
      const body = JSON.stringify({ studentId, updates: { isOnline: false } });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `/api/classrooms/${cleanCode}/offline`,
          new Blob([body], { type: 'application/json' })
        );
      }
    } else {
      upsertLocalStudent(cleanCode, studentId, { isOnline: false });
    }
  } catch (e) {}
}

/**
 * 게임 결과 기록 (완주 / 중도 종료) — 학생 현황과 별도로 영구 보관
 */
export async function recordGameResult(
  classCode: string,
  result: Omit<GameResult, 'id' | 'classCode' | 'studentId' | 'finishedAt'> & { finishedAt?: number }
): Promise<void> {
  const cleanCode = classCode.trim().toUpperCase();
  if (!cleanCode) return;

  const studentId = currentStudentId();
  const finishedAt = result.finishedAt || Date.now();
  const record: GameResult = stripUndefined({
    ...result,
    id: `${studentId}_${finishedAt}`,
    classCode: cleanCode,
    studentId,
    finishedAt,
  });

  const mode = await detectSyncMode();
  try {
    if (mode === 'firebase' && db) {
      await setDoc(doc(db, 'classrooms', cleanCode, 'results', record.id), record);
    } else if (mode === 'gas') {
      // 실패해도 기록이 남도록 한 번 더 시도
      try {
        await gasPost({ action: 'result', classCode: cleanCode, record });
      } catch {
        await new Promise((r) => setTimeout(r, 3000));
        await gasPost({ action: 'result', classCode: cleanCode, record });
      }
    } else if (mode === 'server') {
      await apiJson(`/api/classrooms/${cleanCode}/results`, {
        method: 'POST',
        body: JSON.stringify(record),
      });
    } else {
      saveLocalResults(cleanCode, [record, ...getLocalResults(cleanCode)]);
    }
  } catch (err) {
    console.warn('[Cloud] recordGameResult failed:', err);
  }
}

/**
 * 수업의 게임 결과 기록 구독 (최신순)
 */
export function subscribeClassResults(
  classCode: string,
  onUpdate: (results: GameResult[]) => void
): () => void {
  const cleanCode = classCode.trim().toUpperCase();
  if (!cleanCode) {
    onUpdate([]);
    return () => {};
  }

  const sortResults = (list: GameResult[]) => [...list].sort((a, b) => b.finishedAt - a.finishedAt);
  let stopped = false;
  let cleanup: (() => void) | null = null;

  detectSyncMode().then((mode) => {
    if (stopped) return;

    if (mode === 'firebase' && db) {
      cleanup = onSnapshot(
        collection(db, 'classrooms', cleanCode, 'results'),
        (snap) => onUpdate(sortResults(snap.docs.map((d) => ({ ...(d.data() as GameResult), id: d.id })))),
        (err) => console.warn('[Cloud] subscribeClassResults error:', err)
      );
    } else if (mode === 'gas') {
      cleanup = startPolling(async () => {
        const data = await gasGet<{ results: GameResult[] }>({ action: 'results', code: cleanCode });
        if (!stopped) onUpdate(sortResults(data.results || []));
      }, 15000);
    } else if (mode === 'server') {
      const fetchLatest = async () => {
        try {
          const data = await apiJson<{ results: GameResult[] }>(`/api/classrooms/${cleanCode}/results`);
          if (!stopped) onUpdate(sortResults(data.results || []));
        } catch (e) {}
      };
      fetchLatest();
      const interval = window.setInterval(fetchLatest, 5000);
      cleanup = () => clearInterval(interval);
    } else {
      const refresh = () => onUpdate(sortResults(getLocalResults(cleanCode)));
      refresh();
      cleanup = listenLocalSync(refresh, STORAGE_RESULTS_PREFIX + cleanCode);
    }
  });

  return () => {
    stopped = true;
    if (cleanup) cleanup();
  };
}

export interface SyncDiagnosis {
  mode: SyncMode;
  ok: boolean;
  config: ReturnType<typeof getFirebaseConfigSummary>;
  steps: { label: string; ok: boolean; detail: string }[];
  sheetUrl?: string;
}

/**
 * 교사용 연결 진단: 다른 기기의 학생이 접속할 수 있는 상태인지 실제로 읽기/쓰기 시험
 */
export async function diagnoseConnection(classCode?: string): Promise<SyncDiagnosis> {
  const mode = await detectSyncMode();
  const config = getFirebaseConfigSummary();
  const steps: SyncDiagnosis['steps'] = [];

  if (mode === 'local') {
    steps.push({
      label: '기록 서버 설정',
      ok: false,
      detail:
        '구글 스프레드시트(Apps Script) 웹 앱 주소가 없습니다. src/config.ts 의 GAS_WEB_APP_URL 에 주소를 넣거나 Vercel 환경변수 VITE_GAS_URL 을 등록한 뒤 다시 배포하세요.',
    });
    return { mode, ok: false, config, steps };
  }

  if (mode === 'gas') {
    let sheetUrl: string | undefined;
    try {
      const health = await withTimeout(gasGet<{ sheetUrl?: string }>({ action: 'health' }), 20000);
      sheetUrl = health.sheetUrl;
      steps.push({ label: '스프레드시트 서버 연결', ok: true, detail: `웹 앱 응답 정상 (${getGasUrlPreview()})` });
    } catch (e) {
      steps.push({ label: '스프레드시트 서버 연결', ok: false, detail: describeSyncError(e) });
      return { mode, ok: false, config, steps };
    }
    const code = (classCode || '').trim().toUpperCase();
    if (code) {
      try {
        const data = await withTimeout(gasGet<{ classrooms: Classroom[] }>({ action: 'classrooms' }), 20000);
        const exists = (data.classrooms || []).some((c) => c.code === code);
        steps.push(
          exists
            ? { label: `수업 [${code}] 확인`, ok: true, detail: "시트의 '수업' 탭에 등록되어 있어 학생이 입장할 수 있습니다." }
            : { label: `수업 [${code}] 확인`, ok: false, detail: "시트에 이 수업이 없습니다. [+] 새 수업 만들기로 다시 만들어 주세요." }
        );
      } catch (e) {
        steps.push({ label: `수업 [${code}] 확인`, ok: false, detail: describeSyncError(e) });
      }
    }
    return { mode, ok: steps.every((st) => st.ok), config, steps, sheetUrl };
  }

  if (mode === 'server') {
    try {
      await withTimeout(apiJson('/api/health'), 8000);
      steps.push({ label: '서버 연결', ok: true, detail: '서버(server.ts) 응답 정상' });
    } catch (e) {
      steps.push({ label: '서버 연결', ok: false, detail: describeSyncError(e) });
    }
    return { mode, ok: steps.every((st) => st.ok), config, steps };
  }

  steps.push({
    label: 'Firebase 설정',
    ok: true,
    detail: `프로젝트: ${config.projectId} / 키: ${config.apiKeyPreview} / DB: ${config.databaseId}`,
  });

  try {
    const snap = await withTimeout(getDocs(collection(db!, 'classrooms')), 12000);
    steps.push({ label: '읽기 (학생 목록 불러오기)', ok: true, detail: `수업 ${snap.size}개 확인` });
  } catch (e) {
    steps.push({ label: '읽기 (학생 목록 불러오기)', ok: false, detail: describeSyncError(e) });
    return { mode, ok: false, config, steps };
  }

  const code = (classCode || '').trim().toUpperCase();
  if (code) {
    try {
      const ref = doc(db!, 'classrooms', code);
      const existing = await withTimeout(getDoc(ref));
      if (!existing.exists()) {
        steps.push({
          label: `수업 [${code}] 확인`,
          ok: false,
          detail: '이 수업이 클라우드에 없습니다. [+] 새 수업 만들기로 다시 만들어 주세요.',
        });
      } else {
        const data = existing.data() as Classroom;
        await withTimeout(setDoc(ref, { code, title: data.title || `${code} 수업` }, { merge: true }));
        steps.push({ label: `쓰기 (수업 [${code}] 저장)`, ok: true, detail: '학생 입장/기록 저장 가능' });
      }
    } catch (e) {
      steps.push({ label: `쓰기 (수업 [${code}] 저장)`, ok: false, detail: describeSyncError(e) });
    }
  }

  return { mode, ok: steps.every((st) => st.ok), config, steps };
}

/**
 * 우리 반 학생 실시간 현황 구독
 */
export function subscribeClassStudents(
  classCode: string,
  onUpdate: (students: StudentSession[]) => void,
  onError?: (err: Error) => void
): () => void {
  const cleanCode = classCode.trim().toUpperCase();
  if (!cleanCode) {
    onUpdate([]);
    return () => {};
  }

  let stopped = false;
  let latest: StudentSession[] = [];
  const emit = (list: StudentSession[]) => {
    latest = list;
    if (!stopped) onUpdate(sortStudentsByRank(list));
  };
  const cleanups: (() => void)[] = [];

  // 접속 상태(온라인/오프라인)는 시간이 지나면 바뀌므로 주기적으로 재계산
  const recalcInterval = window.setInterval(() => emit(latest), 15000);
  cleanups.push(() => clearInterval(recalcInterval));

  detectSyncMode().then((mode) => {
    if (stopped) return;

    if (mode === 'firebase' && db) {
      const unsub = onSnapshot(
        collection(db, 'classrooms', cleanCode, 'students'),
        (snapshot) => {
          emit(snapshot.docs.map((d) => ({ ...(d.data() as StudentSession), id: d.id })));
        },
        (err) => {
          console.warn('[Cloud] subscribeClassStudents error:', err);
          if (onError) onError(err);
        }
      );
      cleanups.push(unsub);
    } else if (mode === 'gas') {
      cleanups.push(
        startPolling(async () => {
          const data = await gasGet<{ students: StudentSession[] }>({ action: 'students', code: cleanCode });
          if (Array.isArray(data.students)) emit(data.students);
        }, 5000)
      );
    } else if (mode === 'server') {
      let eventSource: EventSource | null = null;
      try {
        eventSource = new EventSource(`/api/classrooms/${cleanCode}/stream`);
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && Array.isArray(data.students)) emit(data.students);
          } catch (e) {}
        };
      } catch (e) {}

      // SSE가 끊길 때를 대비한 보조 폴링
      const fetchLatest = async () => {
        try {
          const data = await apiJson<{ students: StudentSession[] }>(`/api/classrooms/${cleanCode}/students`);
          if (Array.isArray(data.students)) emit(data.students);
        } catch (e) {}
      };
      fetchLatest();
      const pollInterval = window.setInterval(fetchLatest, 4000);
      cleanups.push(() => {
        clearInterval(pollInterval);
        if (eventSource) eventSource.close();
      });
    } else {
      const refresh = () => emit(getLocalStudents(cleanCode));
      refresh();
      cleanups.push(listenLocalSync(refresh, STORAGE_STUDENTS_PREFIX + cleanCode));
    }
  });

  return () => {
    stopped = true;
    cleanups.forEach((fn) => fn());
  };
}

/**
 * 교사용: 수업 방 생성
 */
export async function createClassroom(
  code: string,
  title: string,
  teacherEmail: string
): Promise<{ success: boolean; error?: string }> {
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length !== 5) {
    return { success: false, error: '수업 코드는 영문/숫자 5자리여야 합니다.' };
  }

  const newClass: Classroom = {
    code: cleanCode,
    title: title.trim() || `${cleanCode} 수업`,
    teacherEmail: teacherEmail.trim(),
    createdAt: Date.now(),
    isClosed: false,
  };

  const mode = await detectSyncMode();
  try {
    if (mode === 'firebase' && db) {
      const classRef = doc(db, 'classrooms', cleanCode);
      const existing = await getDoc(classRef);
      if (existing.exists()) {
        return { success: false, error: `이미 사용 중인 수업 코드 [${cleanCode}] 입니다.` };
      }
      await setDoc(classRef, newClass);
    } else if (mode === 'gas') {
      await withTimeout(
        gasPost({ action: 'createClassroom', code: cleanCode, title: newClass.title, teacherEmail: newClass.teacherEmail }),
        20000
      );
    } else if (mode === 'server') {
      await apiJson('/api/classrooms', {
        method: 'POST',
        body: JSON.stringify({ code: cleanCode, title: newClass.title, teacherEmail: newClass.teacherEmail }),
      });
    } else {
      const classrooms = getLocalClassrooms();
      if (classrooms.some((c) => c.code === cleanCode)) {
        return { success: false, error: `이미 존재하는 학급 코드 [${cleanCode}] 입니다.` };
      }
      saveLocalClassrooms([newClass, ...classrooms]);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: mode === 'gas' ? describeSyncError(err) : err?.message || '수업 생성에 실패했습니다.' };
  }
}

/**
 * 교사의 수업 목록 실시간 구독
 */
export function subscribeTeacherClassrooms(
  teacherEmail: string,
  onUpdate: (classrooms: Classroom[]) => void
): () => void {
  const email = teacherEmail.trim().toLowerCase();

  // 본인 수업 + 학생 입장으로 자동 생성된 수업을 함께 보여줌
  const filterAndSort = (all: Classroom[]) => {
    const matching = all.filter(
      (c) =>
        !c.teacherEmail ||
        c.teacherEmail.toLowerCase() === email ||
        c.teacherEmail === 'teacher@promise.land' ||
        email === 'teacher@promise.land'
    );
    const result = matching.length > 0 ? matching : all;
    return [...result].sort((a, b) => b.createdAt - a.createdAt);
  };

  let stopped = false;
  let cleanup: (() => void) | null = null;

  detectSyncMode().then((mode) => {
    if (stopped) return;

    if (mode === 'firebase' && db) {
      cleanup = onSnapshot(
        collection(db, 'classrooms'),
        (snapshot) => onUpdate(filterAndSort(snapshot.docs.map((d) => d.data() as Classroom))),
        (err) => console.warn('[Cloud] subscribeTeacherClassrooms failed:', err)
      );
    } else if (mode === 'gas') {
      cleanup = startPolling(async () => {
        const data = await gasGet<{ classrooms: Classroom[] }>({ action: 'classrooms' });
        if (!stopped && Array.isArray(data.classrooms)) onUpdate(filterAndSort(data.classrooms));
      }, 10000);
    } else if (mode === 'server') {
      const fetchClasses = async () => {
        try {
          const data = await apiJson<{ classrooms: Classroom[] }>('/api/classrooms');
          if (!stopped && Array.isArray(data.classrooms)) onUpdate(filterAndSort(data.classrooms));
        } catch (e) {}
      };
      fetchClasses();
      const pollInterval = window.setInterval(fetchClasses, 5000);
      cleanup = () => clearInterval(pollInterval);
    } else {
      const refresh = () => onUpdate(filterAndSort(getLocalClassrooms()));
      refresh();
      cleanup = listenLocalSync(refresh, STORAGE_CLASSROOMS_KEY);
    }
  });

  return () => {
    stopped = true;
    if (cleanup) cleanup();
  };
}

/**
 * 수업 입장 마감 토글
 */
export async function setClassroomClosed(classCode: string, isClosed: boolean): Promise<void> {
  const cleanCode = classCode.trim().toUpperCase();
  const mode = await detectSyncMode();
  try {
    if (mode === 'firebase' && db) {
      await updateDoc(doc(db, 'classrooms', cleanCode), { isClosed });
    } else if (mode === 'gas') {
      await gasPost({ action: 'setClosed', classCode: cleanCode, isClosed });
    } else if (mode === 'server') {
      await apiJson(`/api/classrooms/${cleanCode}/close`, {
        method: 'POST',
        body: JSON.stringify({ isClosed }),
      });
    } else {
      saveLocalClassrooms(getLocalClassrooms().map((c) => (c.code === cleanCode ? { ...c, isClosed } : c)));
    }
  } catch (e) {
    console.warn('[Cloud] setClassroomClosed failed:', e);
  }
}

async function deleteFirestoreCollection(classCode: string, sub: 'students' | 'results') {
  if (!db) return;
  const snaps = await getDocs(collection(db, 'classrooms', classCode, sub));
  // writeBatch는 최대 500건
  for (let i = 0; i < snaps.docs.length; i += 450) {
    const batch = writeBatch(db);
    snaps.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/**
 * 학생 실시간 현황 초기화 (게임 결과 기록은 보존)
 */
export async function resetClassroomStudents(classCode: string): Promise<void> {
  const cleanCode = classCode.trim().toUpperCase();
  const mode = await detectSyncMode();
  try {
    if (mode === 'firebase' && db) {
      await deleteFirestoreCollection(cleanCode, 'students');
    } else if (mode === 'gas') {
      await gasPost({ action: 'resetStudents', classCode: cleanCode });
    } else if (mode === 'server') {
      await apiJson(`/api/classrooms/${cleanCode}/reset`, { method: 'POST' });
    } else {
      saveLocalStudents(cleanCode, []);
    }
  } catch (e) {
    console.warn('[Cloud] resetClassroomStudents failed:', e);
  }
}

/**
 * 게임 결과 기록 전체 삭제
 */
export async function clearClassResults(classCode: string): Promise<{ ok: boolean; message?: string }> {
  const cleanCode = classCode.trim().toUpperCase();
  const mode = await detectSyncMode();
  if (mode === 'gas') {
    // 스프레드시트 기록은 실수로 지워지지 않도록 앱에서 삭제하지 않음
    return {
      ok: false,
      message: "구글 스프레드시트 모드에서는 기록이 영구 보관됩니다. 지우려면 스프레드시트의 '게임기록' 탭에서 직접 행을 삭제하세요.",
    };
  }
  try {
    if (mode === 'firebase' && db) {
      await deleteFirestoreCollection(cleanCode, 'results');
    } else if (mode === 'server') {
      await apiJson(`/api/classrooms/${cleanCode}/results`, { method: 'DELETE' });
    } else {
      saveLocalResults(cleanCode, []);
    }
  } catch (e) {
    console.warn('[Cloud] clearClassResults failed:', e);
    return { ok: false, message: describeSyncError(e) };
  }
  return { ok: true };
}

/**
 * 수업 삭제 (학생 현황 + 기록 포함)
 */
export async function deleteClassroom(classCode: string): Promise<void> {
  const cleanCode = classCode.trim().toUpperCase();
  const mode = await detectSyncMode();
  try {
    if (mode === 'firebase' && db) {
      await deleteFirestoreCollection(cleanCode, 'students');
      await deleteFirestoreCollection(cleanCode, 'results');
      await deleteDoc(doc(db, 'classrooms', cleanCode));
    } else if (mode === 'gas') {
      // 학생 현황과 수업만 삭제, 게임기록 시트는 보존
      await gasPost({ action: 'deleteClassroom', classCode: cleanCode });
    } else if (mode === 'server') {
      await apiJson(`/api/classrooms/${cleanCode}`, { method: 'DELETE' });
    } else {
      saveLocalStudents(cleanCode, []);
      saveLocalResults(cleanCode, []);
      saveLocalClassrooms(getLocalClassrooms().filter((c) => c.code !== cleanCode));
    }
  } catch (e) {
    console.warn('[Cloud] deleteClassroom failed:', e);
  }
}

/**
 * 교사용 테스트 학생 시뮬레이션 추가 (실제 연동 엔진에 기록되어 모든 기기에 표시됨)
 */
export function addSimulatedStudent(classCode: string, existing: StudentSession[] = []): StudentSession {
  const cleanCode = classCode.trim().toUpperCase();

  const sampleNames = ['기드온', '바울', '베드로', '느헤미야', '바나바', '디모데', '실라', '아굴라', '브리스길라', '욥'];
  const fams: FamId[] = ['agape', 'shalom', 'wisdom'];
  const characters = ['sailor_boy', 'bible_girl', 'explorer_boy', 'adventurer_boy', 'jesus_lantern'];

  const usedNames = new Set(existing.map((s) => s.studentName));
  const availableNames = sampleNames.filter((n) => !usedNames.has(n));
  const chosenName = availableNames[0] || `용사_${existing.length + 1}`;

  const solved = Math.floor(Math.random() * 25) + 8; // 8~32 solved
  const stars = Math.min(108, solved * 3 - Math.floor(Math.random() * 4));
  const hints = Math.floor(Math.random() * 8) + 1;
  const wrongs = Math.floor(Math.random() * 6);
  const score = solved * 250 + stars * 80 + Math.floor(Math.random() * 3000);
  const now = Date.now();

  const newStudent: StudentSession = {
    id: 'sim_' + now.toString(36) + '_' + Math.random().toString(36).slice(2, 6),
    classCode: cleanCode,
    studentName: chosenName,
    famId: fams[Math.floor(Math.random() * fams.length)],
    characterId: characters[Math.floor(Math.random() * characters.length)],
    score,
    solvedCount: solved,
    solvedQuestIds: Array.from({ length: solved }, (_, i) => i + 1),
    totalStars: stars,
    hintsUsed: hints,
    wrongAnswersCount: wrongs,
    wrongQuestCounts: wrongs > 0 ? { 7: Math.ceil(wrongs / 2), 14: Math.floor(wrongs / 2) } : {},
    currentQuestId: solved < 36 ? solved + 1 : null,
    elapsedTimeMs: (solved * 18 + Math.floor(Math.random() * 60)) * 1000,
    joinedAt: now,
    lastActiveAt: now,
    isOnline: true,
    isCompleted: solved >= 36,
  };

  detectSyncMode().then(async (mode) => {
    try {
      if (mode === 'firebase' && db) {
        await setDoc(doc(db, 'classrooms', cleanCode, 'students', newStudent.id), newStudent);
      } else if (mode === 'gas') {
        await gasPost({ action: 'join', classCode: cleanCode, session: newStudent });
      } else if (mode === 'server') {
        await apiJson(`/api/classrooms/${cleanCode}/join`, {
          method: 'POST',
          body: JSON.stringify({
            studentId: newStudent.id,
            studentName: newStudent.studentName,
            famId: newStudent.famId,
            characterId: newStudent.characterId,
          }),
        });
        const { id, ...updates } = newStudent;
        await apiJson(`/api/classrooms/${cleanCode}/progress`, {
          method: 'POST',
          body: JSON.stringify({ studentId: id, updates }),
        });
      } else {
        saveLocalStudents(cleanCode, [...getLocalStudents(cleanCode), newStudent]);
      }
    } catch (e) {
      console.warn('[Cloud] addSimulatedStudent failed:', e);
    }
  });

  return newStudent;
}

// ============================================================================
// CSV EXPORT (UTF-8 BOM 포함으로 엑셀 한글 깨짐 방지)
// ============================================================================

const formatMs = (ms: number) => {
  const totalSec = Math.floor((ms || 0) / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}분 ${s}초`;
};

const formatDateTime = (ts?: number) => {
  if (!ts) return '';
  return new Date(ts).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csvContent =
    '﻿' + [headers.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportStudentsToCsv(students: StudentSession[], classCode: string): void {
  const headers = [
    '순위',
    '학생 이름',
    '종합 점수',
    '완료한 말씀(36개)',
    '획득한 별(108개)',
    '소요 시간',
    '힌트 사용',
    '오답 횟수',
    '완주 여부',
    '접속 상태',
    '최초 입장',
    '마지막 활동',
  ];

  const rows = students.map((s, idx) => [
    idx + 1,
    s.studentName,
    s.score,
    `${s.solvedCount}/36`,
    `${s.totalStars}/108`,
    formatMs(s.elapsedTimeMs),
    s.hintsUsed,
    s.wrongAnswersCount,
    s.isCompleted ? '완주' : '진행중',
    s.isOnline ? '온라인' : '오프라인',
    formatDateTime(s.joinedAt),
    formatDateTime(s.lastActiveAt),
  ]);

  downloadCsv(`믿음의항해_학급현황_${classCode}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}

export function exportResultsToCsv(results: GameResult[], classCode: string): void {
  const headers = [
    '기록 시각',
    '학생 이름',
    '결과',
    '종합 점수',
    '완료한 말씀(36개)',
    '획득한 별(108개)',
    '소요 시간',
    '힌트 사용',
    '오답 횟수',
  ];

  const rows = results.map((r) => [
    formatDateTime(r.finishedAt),
    r.studentName,
    r.isCompleted ? '완주' : '중도 종료',
    r.score,
    `${r.solvedCount}/36`,
    `${r.totalStars}/108`,
    formatMs(r.elapsedTimeMs),
    r.hintsUsed,
    r.wrongAnswersCount,
  ]);

  downloadCsv(`믿음의항해_게임기록_${classCode}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}

/**
 * 5자리 고유 수업 코드 랜덤 생성기 (혼동하기 쉬운 0, O, 1, I 제외)
 */
export function generateClassCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
