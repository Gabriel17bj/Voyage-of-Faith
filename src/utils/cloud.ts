import { GAS_WEB_APP_URL } from '../config';
import { StudentSession, Classroom, PlayerProfile, GameResult } from '../types';

/**
 * 구글 스프레드시트(Apps Script 웹 앱)와 주고받는 모듈
 *
 * 웹 앱 주소를 찾는 순서
 *  1) Vercel 환경변수 VITE_GAS_URL
 *  2) src/config.ts 의 GAS_WEB_APP_URL
 *  3) 선생님이 '선생님 화면'에 붙여넣은 주소 / 초대 링크(?s=...)로 받은 주소 (이 기기에 기억)
 *
 * 'gas'   : 연결됨
 * 'local' : 주소가 없음 (혼자 연습만 가능)
 */
export type SyncMode = 'gas' | 'local';

/** 이 시간 안에 신호가 있으면 '접속 중'으로 표시 (학생 기기는 60초마다 신호) */
const ONLINE_THRESHOLD_MS = 150 * 1000;
const SERVER_STORAGE_KEY = 'PROMISE_LAND_GAS_SERVER';
const STUDENT_DEVICE_KEY = 'PROMISE_LAND_STUDENT_UID_V1';
const TEACHER_KEY_STORAGE = 'PROMISE_LAND_TEACHER_KEY';

// ============================================================================
// 웹 앱 주소
// ============================================================================

/** https://script.google.com/macros/s/<배포ID>/exec 에서 배포 ID만 추출 */
export function extractDeploymentId(input: string): string | null {
  const s = (input || '').trim();
  const m = s.match(/script\.google(?:usercontent)?\.com\/(?:a\/[^/]+\/)?macros\/s\/([A-Za-z0-9_-]{20,})/);
  if (m) return m[1];
  return /^AKfy[A-Za-z0-9_-]{20,}$/.test(s) ? s : null;
}

function urlFromId(id: string): string {
  return `https://script.google.com/macros/s/${id}/exec`;
}

function readStoredServerId(): string | null {
  try {
    return localStorage.getItem(SERVER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function configuredUrl(): string {
  const env = String(import.meta.env.VITE_GAS_URL || '').trim();
  const id = extractDeploymentId(env) || extractDeploymentId(GAS_WEB_APP_URL);
  return id ? urlFromId(id) : '';
}

/** 초대 링크의 ?s=배포ID 를 이 기기에 기억 (다음부터는 코드만 입력해도 연결됨) */
function adoptServerFromLink() {
  try {
    const id = new URLSearchParams(window.location.search).get('s');
    if (id && extractDeploymentId(id) && !configuredUrl()) localStorage.setItem(SERVER_STORAGE_KEY, id);
  } catch {}
}
adoptServerFromLink();

function gasUrl(): string {
  const configured = configuredUrl();
  if (configured) return configured;
  const stored = readStoredServerId();
  return stored ? urlFromId(stored) : '';
}

export function isGasConfigured(): boolean {
  return Boolean(gasUrl());
}

/** 코드(config.ts / 환경변수)에 주소가 들어 있는지 (= 모든 학생 기기에서 자동 연결) */
export function isServerBuiltIn(): boolean {
  return Boolean(configuredUrl());
}

/** 초대 링크에 붙일 배포 ID (코드에 주소가 없을 때만 필요) */
export function getServerIdForLink(): string | null {
  if (isServerBuiltIn()) return null;
  return readStoredServerId();
}

/** 선생님이 붙여넣은 웹 앱 주소를 확인하고 이 기기에 저장 */
export async function connectServer(input: string): Promise<{ success: boolean; error?: string }> {
  const id = extractDeploymentId(input);
  if (!id) {
    return { success: false, error: "주소 모양이 달라요. 'https://script.google.com/macros/s/…/exec' 전체를 붙여넣어 주세요." };
  }
  try {
    const res = await withTimeout(fetch(`${urlFromId(id)}?action=health&_=${Date.now()}`, { redirect: 'follow', cache: 'no-store' }), 20000);
    const data = await res.json();
    if (!data?.ok) throw new Error('bad');
  } catch {
    return {
      success: false,
      error: '이 주소로 연결할 수 없어요. Apps Script에서 [배포 → 새 배포 → 웹 앱], 액세스 권한 "모든 사용자"로 배포했는지 확인해 주세요.',
    };
  }
  try {
    localStorage.setItem(SERVER_STORAGE_KEY, id);
  } catch {}
  syncModePromise = null;
  return { success: true };
}

// ============================================================================
// 연결 상태
// ============================================================================

let syncModePromise: Promise<SyncMode> | null = null;
let resolvedSyncMode: SyncMode | null = null;

export function detectSyncMode(): Promise<SyncMode> {
  if (!syncModePromise) {
    const mode: SyncMode = isGasConfigured() ? 'gas' : 'local';
    resolvedSyncMode = mode;
    syncModePromise = Promise.resolve(mode);
  }
  return syncModePromise;
}

export function getResolvedSyncMode(): SyncMode | null {
  return resolvedSyncMode;
}

/** 학생 기기의 접속 신호 간격 */
export function getHeartbeatIntervalMs(): number {
  return 60000;
}

// ============================================================================
// 요청 도우미
// ============================================================================

function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
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
  let res: Response;
  try {
    res = await fetch(`${gasUrl()}?${new URLSearchParams({ ...params, _: String(Date.now()) })}`, {
      redirect: 'follow',
      cache: 'no-store',
    });
  } catch {
    throw Object.assign(new Error('unreachable'), { code: 'gas-unreachable' });
  }
  return gasParse<T>(res);
}

/** text/plain 으로 보내야 브라우저 사전요청(CORS) 없이 Apps Script에 전달됨 */
async function gasPost<T = any>(body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(gasUrl(), {
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

/** 오류를 학생·선생님이 이해할 수 있는 문장으로 */
export function describeSyncError(err: any): string {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');
  if (['class-not-found', 'closed', 'exists', 'unauthorized', 'no-password', 'bad-request'].includes(code)) return msg;
  if (code === 'busy') return '접속하는 학생이 많아 잠시 밀렸어요. 몇 초 뒤 다시 시도해 주세요.';
  if (code === 'timeout') return '기록 서버의 응답이 늦어요. 인터넷 연결을 확인하고 다시 시도해 주세요.';
  if (code === 'gas-unreachable' || code === 'gas-not-json') {
    return '구글 시트에 연결할 수 없어요. (선생님: Apps Script 웹 앱의 액세스 권한이 "모든 사용자"인지 확인해 주세요)';
  }
  return `기록 서버 오류: ${msg || code || '알 수 없는 오류'}`;
}

export const LOCAL_MODE_JOIN_ERROR =
  '아직 선생님이 구글 시트를 연결하지 않았어요. 선생님께 받은 초대 링크로 들어오거나, 혼자 연습하기를 눌러 주세요.';

// ============================================================================
// 선생님 비밀번호
// ============================================================================

function notify(type: string) {
  try {
    window.dispatchEvent(new CustomEvent('promise_land_sync', { detail: { type } }));
  } catch {}
}

export function getTeacherKey(): string {
  try {
    return localStorage.getItem(TEACHER_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function clearTeacherKey() {
  try {
    localStorage.removeItem(TEACHER_KEY_STORAGE);
  } catch {}
  notify('TEACHER_LOGOUT');
}

export async function teacherLogin(password: string): Promise<{ success: boolean; error?: string; sheetUrl?: string }> {
  try {
    const data = await withTimeout(gasPost<{ sheetUrl?: string }>({ action: 'teacherLogin', key: password }), 20000);
    try {
      localStorage.setItem(TEACHER_KEY_STORAGE, password);
    } catch {}
    return { success: true, sheetUrl: data.sheetUrl };
  } catch (err) {
    return { success: false, error: describeSyncError(err) };
  }
}

/** 선생님 전용 요청 (비밀번호가 틀리면 로그아웃) */
async function gasTeacher<T = any>(body: Record<string, unknown>): Promise<T> {
  try {
    return await gasPost<T>({ ...body, key: getTeacherKey() });
  } catch (err: any) {
    if (err?.code === 'unauthorized' || err?.code === 'no-password') clearTeacherKey();
    throw err;
  }
}

export async function getGasSheetUrl(): Promise<string | null> {
  if (!getTeacherKey()) return null;
  try {
    const data = await withTimeout(gasTeacher<{ sheetUrl?: string }>({ action: 'teacherLogin' }), 20000);
    return data.sheetUrl || null;
  } catch {
    return null;
  }
}

/** 화면이 보일 때만 일정 간격으로 불러오기 (Apps Script 사용량 절약) */
function startPolling(fn: () => Promise<void>, intervalMs: number): () => void {
  let stopped = false;
  let timer: number | undefined;
  const tick = async () => {
    if (stopped) return;
    if (document.visibilityState === 'visible') {
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
// 학생
// ============================================================================

function deviceId(): string {
  try {
    const existing = localStorage.getItem(STUDENT_DEVICE_KEY);
    if (existing) return existing;
    const id = 'st_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(STUDENT_DEVICE_KEY, id);
    return id;
  } catch {
    return 'st_' + Math.random().toString(36).slice(2, 9);
  }
}

/** 기기 ID + 이름 → 학생 ID (한 기기를 여러 학생이 번갈아 써도 기록이 분리됨) */
function buildStudentId(name: string): string {
  let hash = 0;
  for (const ch of name.trim()) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return `${deviceId()}_${Math.abs(hash).toString(36)}`;
}

let activeStudentId: string | null = null;
let activeClassCode: string | null = null;
let activeIdentity: Partial<StudentSession> | null = null;

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out as T;
}

function newStudentSession(id: string, classCode: string, profile: PlayerProfile): StudentSession {
  const now = Date.now();
  return {
    id,
    classCode,
    studentName: profile.name,
    famId: profile.fam,
    characterId: profile.characterId,
    score: 0,
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

export async function joinClassroom(
  rawClassCode: string,
  profile: PlayerProfile,
  _initialScore = 0
): Promise<{ success: boolean; error?: string; session?: StudentSession }> {
  const classCode = rawClassCode.trim().toUpperCase();
  if (!classCode) return { success: false, error: '수업 코드를 입력해 주세요.' };
  if (!isGasConfigured()) return { success: false, error: LOCAL_MODE_JOIN_ERROR };

  const studentId = buildStudentId(profile.name);
  try {
    const data = await withTimeout(
      gasPost<{ session: StudentSession }>({
        action: 'join',
        classCode,
        session: stripUndefined(newStudentSession(studentId, classCode, profile)),
      }),
      20000
    );
    activeStudentId = studentId;
    activeClassCode = classCode;
    activeIdentity = stripUndefined({
      id: studentId,
      classCode,
      studentName: data.session.studentName,
      famId: data.session.famId,
      characterId: data.session.characterId,
    });
    return { success: true, session: data.session };
  } catch (err) {
    return { success: false, error: describeSyncError(err) };
  }
}

export async function updateStudentProgress(classCode: string, updates: Partial<StudentSession>): Promise<void> {
  const code = classCode.trim().toUpperCase();
  if (!code || !activeStudentId || !isGasConfigured()) return;
  try {
    await gasPost({
      action: 'progress',
      classCode: code,
      studentId: activeStudentId,
      updates: stripUndefined({ ...updates, lastActiveAt: Date.now(), isOnline: true }),
      identity: activeIdentity?.classCode === code ? activeIdentity : {},
    });
  } catch (err) {
    console.warn('[기록] 진행 상황 저장 실패:', err);
  }
}

export async function sendHeartbeat(classCode: string): Promise<void> {
  const code = classCode.trim().toUpperCase();
  if (!code || !activeStudentId || !isGasConfigured()) return;
  try {
    await gasPost({ action: 'heartbeat', classCode: code, studentId: activeStudentId });
  } catch {}
}

/** 앱을 닫거나 다른 앱으로 전환하면 '나감'으로 표시 (가능한 경우만) */
export function markStudentOffline(classCode?: string): void {
  const code = (classCode || activeClassCode || '').trim().toUpperCase();
  if (!code || !activeStudentId || !isGasConfigured() || !navigator.sendBeacon) return;
  try {
    navigator.sendBeacon(
      gasUrl(),
      new Blob([JSON.stringify({ action: 'offline', classCode: code, studentId: activeStudentId })], { type: 'text/plain;charset=utf-8' })
    );
  } catch {}
}

/** 게임 결과(완주 / 중간 종료)를 '게임기록' 탭에 한 줄 추가 */
export async function recordGameResult(
  classCode: string,
  result: Omit<GameResult, 'id' | 'classCode' | 'studentId' | 'finishedAt'> & { finishedAt?: number }
): Promise<void> {
  const code = classCode.trim().toUpperCase();
  if (!code || !activeStudentId || !isGasConfigured()) return;
  const finishedAt = result.finishedAt || Date.now();
  const record: GameResult = stripUndefined({
    ...result,
    id: `${activeStudentId}_${finishedAt}`,
    classCode: code,
    studentId: activeStudentId,
    finishedAt,
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await gasPost({ action: 'result', classCode: code, record });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

// ============================================================================
// 선생님
// ============================================================================

function withOnline(list: StudentSession[]): StudentSession[] {
  const now = Date.now();
  return list.map((st) => ({
    ...st,
    isOnline: st.isOnline !== false && now - (st.lastActiveAt || 0) < ONLINE_THRESHOLD_MS,
  }));
}

export function subscribeTeacherClassrooms(_teacher: string, onUpdate: (classrooms: Classroom[]) => void): () => void {
  return startPolling(async () => {
    const data = await gasTeacher<{ classrooms: Classroom[] }>({ action: 'classrooms' });
    onUpdate([...(data.classrooms || [])].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }, 10000);
}

export function subscribeClassStudents(classCode: string, onUpdate: (students: StudentSession[]) => void): () => void {
  const code = classCode.trim().toUpperCase();
  let latest: StudentSession[] = [];
  const stop = startPolling(async () => {
    const data = await gasTeacher<{ students: StudentSession[] }>({ action: 'students', classCode: code });
    latest = data.students || [];
    onUpdate(withOnline(latest));
  }, 5000);
  // 접속 표시는 시간이 지나면 바뀌므로 다시 계산
  const recalc = window.setInterval(() => onUpdate(withOnline(latest)), 15000);
  return () => {
    stop();
    clearInterval(recalc);
  };
}

export function subscribeClassResults(classCode: string, onUpdate: (results: GameResult[]) => void): () => void {
  const code = classCode.trim().toUpperCase();
  return startPolling(async () => {
    const data = await gasTeacher<{ results: GameResult[] }>({ action: 'results', classCode: code });
    onUpdate([...(data.results || [])].sort((a, b) => b.finishedAt - a.finishedAt));
  }, 15000);
}

export async function createClassroom(code: string, title: string, teacher: string): Promise<{ success: boolean; error?: string }> {
  try {
    await withTimeout(
      gasTeacher({ action: 'createClassroom', code: code.trim().toUpperCase(), title: title.trim(), teacherEmail: teacher }),
      20000
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: describeSyncError(err) };
  }
}

export async function setClassroomClosed(classCode: string, isClosed: boolean): Promise<void> {
  try {
    await gasTeacher({ action: 'setClosed', classCode: classCode.trim().toUpperCase(), isClosed });
  } catch (err) {
    window.alert(describeSyncError(err));
  }
}

export async function resetClassroomStudents(classCode: string): Promise<void> {
  try {
    await gasTeacher({ action: 'resetStudents', classCode: classCode.trim().toUpperCase() });
  } catch (err) {
    window.alert(describeSyncError(err));
  }
}

/** 수업과 학생현황 삭제 (게임기록 탭은 남김) */
export async function deleteClassroom(classCode: string): Promise<void> {
  try {
    await gasTeacher({ action: 'deleteClassroom', classCode: classCode.trim().toUpperCase() });
  } catch (err) {
    window.alert(describeSyncError(err));
  }
}

export interface SyncDiagnosis {
  mode: SyncMode;
  ok: boolean;
  steps: { label: string; ok: boolean; detail: string }[];
  sheetUrl?: string;
}

export async function diagnoseConnection(classCode?: string): Promise<SyncDiagnosis> {
  const mode = await detectSyncMode();
  const steps: SyncDiagnosis['steps'] = [];
  if (mode === 'local') {
    steps.push({ label: '구글 시트 연결', ok: false, detail: '웹 앱 주소가 없어요. 선생님 화면의 연결 안내를 따라 주세요.' });
    return { mode, ok: false, steps };
  }
  try {
    await withTimeout(gasGet({ action: 'health' }), 20000);
    steps.push({ label: '구글 시트 연결', ok: true, detail: '기록이 시트에 저장되고 있어요.' });
  } catch (err) {
    steps.push({ label: '구글 시트 연결', ok: false, detail: describeSyncError(err) });
    return { mode, ok: false, steps };
  }
  steps.push(
    isServerBuiltIn()
      ? { label: '학생 자동 연결', ok: true, detail: '학생은 이름과 수업 코드만 넣으면 바로 들어와요.' }
      : {
          label: '학생 자동 연결',
          ok: false,
          detail: '지금은 선생님이 보낸 초대 링크로 들어온 학생만 연결돼요. 코드만으로 들어오게 하려면 웹 앱 주소를 src/config.ts 에 넣어 주세요.',
        }
  );
  const code = (classCode || '').trim().toUpperCase();
  if (code) {
    try {
      const data = await withTimeout(gasTeacher<{ classrooms: Classroom[] }>({ action: 'classrooms' }), 20000);
      const exists = (data.classrooms || []).some((c) => c.code === code);
      steps.push(
        exists
          ? { label: `수업 ${code}`, ok: true, detail: "시트의 '수업' 탭에 있어요." }
          : { label: `수업 ${code}`, ok: false, detail: "시트의 '수업' 탭에 이 코드가 없어요." }
      );
    } catch (err) {
      steps.push({ label: `수업 ${code}`, ok: false, detail: describeSyncError(err) });
    }
  }
  return { mode, ok: steps.every((s) => s.ok), steps, sheetUrl: (await getGasSheetUrl()) || undefined };
}

// ============================================================================
// 엑셀(CSV) 저장 — UTF-8 BOM 포함 (엑셀 한글 깨짐 방지)
// ============================================================================

const formatMs = (ms: number) => {
  const sec = Math.floor((ms || 0) / 1000);
  return `${Math.floor(sec / 60)}분 ${sec % 60}초`;
};

const formatDateTime = (ts?: number) =>
  ts ? new Date(ts).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = '﻿' + [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

export function exportStudentsToCsv(students: StudentSession[], classCode: string): void {
  downloadCsv(
    `믿음의항해_현황_${classCode}_${today()}.csv`,
    ['이름', '점수', '푼 말씀(36)', '별(108)', '걸린 시간', '힌트', '틀린 횟수', '완주', '접속', '처음 들어온 시각', '마지막 활동'],
    students.map((s) => [
      s.studentName,
      s.score,
      s.solvedCount,
      s.totalStars,
      formatMs(s.elapsedTimeMs),
      s.hintsUsed,
      s.wrongAnswersCount,
      s.isCompleted ? '완주' : '진행 중',
      s.isOnline ? '접속 중' : '나감',
      formatDateTime(s.joinedAt),
      formatDateTime(s.lastActiveAt),
    ])
  );
}

export function exportResultsToCsv(results: GameResult[], classCode: string): void {
  downloadCsv(
    `믿음의항해_기록_${classCode}_${today()}.csv`,
    ['기록 시각', '이름', '결과', '점수', '푼 말씀(36)', '별(108)', '걸린 시간', '힌트', '틀린 횟수'],
    results.map((r) => [
      formatDateTime(r.finishedAt),
      r.studentName,
      r.isCompleted ? '완주' : '중간 종료',
      r.score,
      r.solvedCount,
      r.totalStars,
      formatMs(r.elapsedTimeMs),
      r.hintsUsed,
      r.wrongAnswersCount,
    ])
  );
}

/** 헷갈리는 0·O·1·I 를 뺀 5자리 수업 코드 */
export function generateClassCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
