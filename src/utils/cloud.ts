import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { StudentSession, Classroom, PlayerProfile, FamId } from '../types';

// ============================================================================
// CONSTANTS & STORAGE KEYS FOR LOCAL / OFFLINE FALLBACK
// ============================================================================
const STORAGE_CLASSROOMS_KEY = 'PROMISE_LAND_LOCAL_CLASSROOMS_V1';
const STORAGE_STUDENTS_PREFIX = 'PROMISE_LAND_LOCAL_STUDENTS_';
const STORAGE_STUDENT_ID_KEY = 'PROMISE_LAND_STUDENT_UID_V1';
const STORAGE_TEACHER_SESSION_KEY = 'PROMISE_LAND_TEACHER_AUTH_V1';
const SYNC_CHANNEL_NAME = 'PROMISE_LAND_BROADCAST_SYNC_V1';

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

// Local Student ID Generator/Getter
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
  // Default fallback classrooms
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

  // If first time loading FAITH classroom, seed with demo students
  if (code === 'FAITH') {
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

// ============================================================================
// PUBLIC SYNC & DASHBOARD APIS (DUAL ENGINE: FIREBASE & LOCAL/OFFLINE)
// ============================================================================

/**
 * 학생용 익명 인증 (Anonymous Sign-In)
 */
export async function ensureStudentAuth(): Promise<User | null> {
  if (isFirebaseConfigured() && auth) {
    if (auth.currentUser) return auth.currentUser;
    try {
      const cred = await signInAnonymously(auth);
      return cred.user;
    } catch (err) {
      console.warn('[Cloud] Anonymous Firebase login failed, using local auth:', err);
    }
  }
  return null;
}

/**
 * 학생이 수업 코드로 반에 입장 (서버 실시간 API + Firebase + Local Tri-Engine)
 */
export async function joinClassroom(
  rawClassCode: string,
  profile: PlayerProfile,
  initialScore: number = 0
): Promise<{ success: boolean; error?: string; session?: StudentSession }> {
  const classCode = rawClassCode.trim().toUpperCase();
  if (!classCode) {
    return { success: false, error: '수업 코드를 입력해주세요.' };
  }

  const studentId = auth?.currentUser?.uid || getOrCreateLocalStudentId();
  let serverSession: StudentSession | null = null;

  // 1. First: Try Backend Server API (Works across all devices/networks via SSE)
  try {
    const res = await fetch(`/api/classrooms/${classCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        studentName: profile.name,
        famId: profile.fam,
        characterId: profile.characterId || 'sailor_boy',
        initialScore,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.session) {
        serverSession = data.session;
        mirrorLocalStudent(classCode, data.session);
        notifySyncEvent('STUDENT_JOIN', { classCode, student: data.session });
      } else if (data.error) {
        return { success: false, error: data.error };
      }
    }
  } catch (apiErr) {
    console.warn('[Cloud] Backend API joinClassroom skipped/fallback:', apiErr);
  }

  // 2. Firebase Cloud Mode (if configured)
  if (isFirebaseConfigured() && db && auth) {
    try {
      const user = await ensureStudentAuth();
      if (user) {
        const classRef = doc(db, 'classrooms', classCode);
        const classSnap = await getDoc(classRef);

        if (classSnap.exists()) {
          const classData = classSnap.data() as Classroom;
          if (classData.isClosed) {
            return { success: false, error: '해당 수업은 입장이 마감되었습니다.' };
          }

          const studentRef = doc(db, 'classrooms', classCode, 'students', user.uid);
          const existingSnap = await getDoc(studentRef);

          const now = Date.now();
          let sessionData: StudentSession;

          if (existingSnap.exists()) {
            sessionData = {
              ...(existingSnap.data() as StudentSession),
              studentName: profile.name,
              famId: profile.fam,
              characterId: profile.characterId || 'sailor_boy',
              lastActiveAt: now,
              isOnline: true,
            };
            await updateDoc(studentRef, {
              studentName: profile.name,
              famId: profile.fam,
              characterId: profile.characterId || 'sailor_boy',
              lastActiveAt: now,
              isOnline: true,
            });
          } else {
            sessionData = {
              id: user.uid,
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
            await setDoc(studentRef, sessionData);
          }

          mirrorLocalStudent(classCode, sessionData);
          return { success: true, session: sessionData };
        }
      }
    } catch (err: any) {
      console.warn('[Cloud] Firebase join failed, falling back to local mode:', err);
    }
  }

  if (serverSession) {
    return { success: true, session: serverSession };
  }

  // 3. Local Classroom Mode (Cross-Tab / Browser Synced)
  const classrooms = getLocalClassrooms();
  let targetClass = classrooms.find((c) => c.code === classCode);

  if (!targetClass) {
    targetClass = {
      code: classCode,
      title: `${classCode} 성경탐험대`,
      teacherEmail: 'teacher@promise.land',
      createdAt: Date.now(),
      isClosed: false,
    };
    saveLocalClassrooms([...classrooms, targetClass]);
  }

  if (targetClass.isClosed) {
    return { success: false, error: '해당 수업은 현재 입장이 마감되었습니다.' };
  }

  const students = getLocalStudents(classCode);
  const existingIdx = students.findIndex((s) => s.id === studentId || s.studentName === profile.name);

  const now = Date.now();
  let sessionData: StudentSession;

  if (existingIdx >= 0) {
    sessionData = {
      ...students[existingIdx],
      studentName: profile.name,
      famId: profile.fam,
      characterId: profile.characterId || 'sailor_boy',
      lastActiveAt: now,
      isOnline: true,
    };
    students[existingIdx] = sessionData;
  } else {
    sessionData = {
      id: studentId,
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
    students.push(sessionData);
  }

  saveLocalStudents(classCode, students);
  notifySyncEvent('STUDENT_JOIN', { classCode, student: sessionData });

  return { success: true, session: sessionData };
}

function mirrorLocalStudent(classCode: string, student: StudentSession) {
  try {
    const list = getLocalStudents(classCode);
    const idx = list.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...student };
    } else {
      list.push(student);
    }
    saveLocalStudents(classCode, list);
  } catch (e) {}
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

  const now = Date.now();
  const studentId = auth?.currentUser?.uid || getOrCreateLocalStudentId();

  // 1. Backend Server API Sync
  try {
    fetch(`/api/classrooms/${cleanCode}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        updates,
      }),
    }).catch(() => {});
  } catch (e) {}

  // 2. Firebase Sync if available
  if (isFirebaseConfigured() && db && auth && auth.currentUser) {
    try {
      const studentRef = doc(db, 'classrooms', cleanCode, 'students', auth.currentUser.uid);
      await setDoc(
        studentRef,
        {
          ...updates,
          lastActiveAt: now,
          isOnline: true,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[Cloud] Firebase updateStudentProgress failed:', err);
    }
  }

  // 3. Local Storage Sync (Cross-Tab)
  const students = getLocalStudents(cleanCode);
  const idx = students.findIndex((s) => s.id === studentId);

  if (idx >= 0) {
    students[idx] = {
      ...students[idx],
      ...updates,
      lastActiveAt: now,
      isOnline: true,
    };
    saveLocalStudents(cleanCode, students);
    notifySyncEvent('STUDENT_PROGRESS', { classCode: cleanCode, studentId, updates });
  }
}

/**
 * 30초마다 보내는 접속 신호 (Heartbeat)
 */
export async function sendHeartbeat(classCode: string): Promise<void> {
  const cleanCode = classCode.trim().toUpperCase();
  if (!cleanCode) return;

  const now = Date.now();
  const studentId = auth?.currentUser?.uid || getOrCreateLocalStudentId();

  // Backend Heartbeat
  try {
    fetch(`/api/classrooms/${cleanCode}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    }).catch(() => {});
  } catch (e) {}

  // Firebase Heartbeat
  if (isFirebaseConfigured() && db && auth && auth.currentUser) {
    try {
      const studentRef = doc(db, 'classrooms', cleanCode, 'students', auth.currentUser.uid);
      await updateDoc(studentRef, {
        lastActiveAt: now,
        isOnline: true,
      });
    } catch (err) {}
  }

  // Local heartbeat
  const students = getLocalStudents(cleanCode);
  const idx = students.findIndex((s) => s.id === studentId);
  if (idx >= 0) {
    students[idx].lastActiveAt = now;
    students[idx].isOnline = true;
    saveLocalStudents(cleanCode, students);
  }
}

/**
 * 우리 반 학생 실시간 순위 구독 (SSE + REST Polling + Firebase + Local Sync)
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

  // Helper to sort students
  const sortStudents = (list: StudentSession[]) => {
    const now = Date.now();
    return [...list]
      .map((st) => ({
        ...st,
        isOnline: now - (st.lastActiveAt || 0) < 90 * 1000,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
        return a.elapsedTimeMs - b.elapsedTimeMs;
      });
  };

  // 1. Immediate initial load from local store
  const initialLocal = getLocalStudents(cleanCode);
  onUpdate(sortStudents(initialLocal));

  // 2. Real-time Server-Sent Events (SSE) Stream
  let eventSource: EventSource | null = null;
  try {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      eventSource = new EventSource(`/api/classrooms/${cleanCode}/stream`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && Array.isArray(data.students)) {
            const sorted = sortStudents(data.students);
            saveLocalStudents(cleanCode, sorted);
            onUpdate(sorted);
          }
        } catch (e) {}
      };
      eventSource.onerror = () => {
        // SSE reconnects automatically, fallback poll ensures continuity
      };
    }
  } catch (e) {
    console.warn('[Cloud] SSE not available:', e);
  }

  // 3. Fallback Periodic Polling (every 2.5s) to guarantee zero desync
  const pollInterval = window.setInterval(async () => {
    try {
      const res = await fetch(`/api/classrooms/${cleanCode}/students`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.students)) {
          const sorted = sortStudents(data.students);
          saveLocalStudents(cleanCode, sorted);
          onUpdate(sorted);
        }
      }
    } catch (e) {}
  }, 2500);

  // 4. Firebase listener
  let fbUnsubscribe: (() => void) | null = null;
  if (isFirebaseConfigured() && db) {
    try {
      const studentsColl = collection(db, 'classrooms', cleanCode, 'students');
      fbUnsubscribe = onSnapshot(
        studentsColl,
        (snapshot) => {
          const cloudStudents: StudentSession[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as StudentSession;
            return {
              ...data,
              id: docSnap.id,
            };
          });
          if (cloudStudents.length > 0) {
            onUpdate(sortStudents(cloudStudents));
          }
        },
        (err) => {
          console.warn('[Cloud] Firebase subscribeClassStudents error:', err);
          if (onError) onError(err);
        }
      );
    } catch (e) {
      console.warn('[Cloud] Failed to set up Firestore onSnapshot:', e);
    }
  }

  // 5. Local Cross-Tab event listeners
  const handleLocalSync = (_e: any) => {
    const fresh = getLocalStudents(cleanCode);
    onUpdate(sortStudents(fresh));
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_STUDENTS_PREFIX + cleanCode) {
      const fresh = getLocalStudents(cleanCode);
      onUpdate(sortStudents(fresh));
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleLocalSync);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('promise_land_sync', handleLocalSync);
  }

  return () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    clearInterval(pollInterval);
    if (fbUnsubscribe) fbUnsubscribe();
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleLocalSync);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('promise_land_sync', handleLocalSync);
    }
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

  // 1. Backend API
  try {
    const res = await fetch('/api/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleanCode,
        title: newClass.title,
        teacherEmail: newClass.teacherEmail,
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) return { success: false, error: errData.error };
    }
  } catch (e) {}

  // 2. Firebase save
  if (isFirebaseConfigured() && db) {
    try {
      const classRef = doc(db, 'classrooms', cleanCode);
      const existing = await getDoc(classRef);
      if (existing.exists()) {
        return { success: false, error: `이미 사용 중인 수업 코드 [${cleanCode}] 입니다.` };
      }
      await setDoc(classRef, newClass);
    } catch (err: any) {
      console.warn('[Cloud] Firebase createClassroom note:', err);
    }
  }

  // 3. Local save
  const classrooms = getLocalClassrooms();
  if (classrooms.some((c) => c.code === cleanCode)) {
    return { success: false, error: `이미 존재하는 학급 코드 [${cleanCode}] 입니다.` };
  }
  saveLocalClassrooms([newClass, ...classrooms]);

  return { success: true };
}

/**
 * 교사의 수업 목록 실시간 구독
 */
export function subscribeTeacherClassrooms(
  teacherEmail: string,
  onUpdate: (classrooms: Classroom[]) => void
): () => void {
  const email = teacherEmail.trim().toLowerCase();

  const filterAndSort = (all: Classroom[]) => {
    const matching = all.filter(
      (c) => !c.teacherEmail || c.teacherEmail.toLowerCase() === email || email === 'teacher@promise.land'
    );
    const result = matching.length > 0 ? matching : all;
    return [...result].sort((a, b) => b.createdAt - a.createdAt);
  };

  // Initial local
  onUpdate(filterAndSort(getLocalClassrooms()));

  // Fetch from server
  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classrooms');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.classrooms)) {
          saveLocalClassrooms(data.classrooms);
          onUpdate(filterAndSort(data.classrooms));
        }
      }
    } catch (e) {}
  };
  fetchClasses();
  const pollInterval = window.setInterval(fetchClasses, 5000);

  let fbUnsubscribe: (() => void) | null = null;
  if (isFirebaseConfigured() && db) {
    try {
      const classColl = collection(db, 'classrooms');
      const q = query(classColl, where('teacherEmail', '==', teacherEmail.trim()));
      fbUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const classes: Classroom[] = snapshot.docs.map((d) => d.data() as Classroom);
          classes.sort((a, b) => b.createdAt - a.createdAt);
          if (classes.length > 0) {
            onUpdate(classes);
          }
        },
        (err) => {
          console.warn('[Cloud] Firebase subscribeTeacherClassrooms failed:', err);
        }
      );
    } catch (e) {}
  }

  const handleSync = () => {
    onUpdate(filterAndSort(getLocalClassrooms()));
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_CLASSROOMS_KEY) {
      onUpdate(filterAndSort(getLocalClassrooms()));
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleSync);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener('promise_land_sync', handleSync);
  }

  return () => {
    clearInterval(pollInterval);
    if (fbUnsubscribe) fbUnsubscribe();
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleSync);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('promise_land_sync', handleSync);
    }
  };
}

/**
 * 수업 입장 마감 토글
 */
export async function setClassroomClosed(classCode: string, isClosed: boolean): Promise<void> {
  const cleanCode = classCode.trim().toUpperCase();

  // Backend
  try {
    fetch(`/api/classrooms/${cleanCode}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isClosed }),
    }).catch(() => {});
  } catch (e) {}

  // Firebase
  if (isFirebaseConfigured() && db) {
    try {
      const classRef = doc(db, 'classrooms', cleanCode);
      await updateDoc(classRef, { isClosed });
    } catch (e) {}
  }

  // Local
  const classrooms = getLocalClassrooms().map((c) =>
    c.code === cleanCode ? { ...c, isClosed } : c
  );
  saveLocalClassrooms(classrooms);
}

/**
 * 학생 기록 초기화 (수업 내 모든 학생 기록 삭제)
 */
export async function resetClassroomStudents(classCode: string): Promise<void> {
  const cleanCode = classCode.trim().toUpperCase();

  // Backend
  try {
    fetch(`/api/classrooms/${cleanCode}/reset`, { method: 'POST' }).catch(() => {});
  } catch (e) {}

  // Firebase
  if (isFirebaseConfigured() && db) {
    try {
      const studentsColl = collection(db, 'classrooms', cleanCode, 'students');
      const snaps = await getDocs(studentsColl);
      const batch = writeBatch(db);
      snaps.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    } catch (e) {}
  }

  // Local
  saveLocalStudents(cleanCode, []);
}

/**
 * 수업 삭제
 */
export async function deleteClassroom(classCode: string): Promise<void> {
  const cleanCode = classCode.trim().toUpperCase();

  // Backend
  try {
    fetch(`/api/classrooms/${cleanCode}`, { method: 'DELETE' }).catch(() => {});
  } catch (e) {}

  // Firebase
  if (isFirebaseConfigured() && db) {
    try {
      await resetClassroomStudents(cleanCode);
      const classRef = doc(db, 'classrooms', cleanCode);
      await deleteDoc(classRef);
    } catch (e) {}
  }

  // Local
  saveLocalStudents(cleanCode, []);
  const remaining = getLocalClassrooms().filter((c) => c.code !== cleanCode);
  saveLocalClassrooms(remaining);
}

/**
 * 교사용 테스트 학생 시뮬레이션 추가 유틸리티
 */
export function addSimulatedStudent(classCode: string): StudentSession {
  const cleanCode = classCode.trim().toUpperCase();
  const students = getLocalStudents(cleanCode);

  const sampleNames = ['기드온', '바울', '베드로', '느헤미야', '바나바', '디모데', '실라', '아굴라', '브리스길라', '욥'];
  const fams: FamId[] = ['agape', 'shalom', 'wisdom'];
  const characters = ['sailor_boy', 'bible_girl', 'explorer_boy', 'adventurer_boy', 'jesus_lantern'];

  const usedNames = new Set(students.map((s) => s.studentName));
  const availableNames = sampleNames.filter((n) => !usedNames.has(n));
  const chosenName = availableNames[0] || `용사_${students.length + 1}`;

  const solved = Math.floor(Math.random() * 25) + 8; // 8~32 solved
  const stars = Math.min(108, solved * 3 - Math.floor(Math.random() * 4));
  const hints = Math.floor(Math.random() * 8) + 1;
  const wrongs = Math.floor(Math.random() * 6);
  const score = solved * 250 + stars * 80 + Math.floor(Math.random() * 3000);

  const newStudent: StudentSession = {
    id: 'sim_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
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
    lastActiveAt: Date.now(),
    isOnline: true,
    isCompleted: solved >= 36,
  };

  students.push(newStudent);
  saveLocalStudents(cleanCode, students);
  notifySyncEvent('STUDENT_SIMULATED', { classCode: cleanCode, student: newStudent });

  return newStudent;
}

/**
 * CSV 다운로드 유틸리티 (UTF-8 BOM 포함으로 엑셀 한글 깨짐 방지)
 */
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
  ];

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}분 ${s}초`;
  };

  const rows = students.map((s, idx) => [
    idx + 1,
    `"${s.studentName.replace(/"/g, '""')}"`,
    s.score,
    `${s.solvedCount}/36`,
    `${s.totalStars}/108`,
    `"${formatMs(s.elapsedTimeMs)}"`,
    s.hintsUsed,
    s.wrongAnswersCount,
    s.isCompleted ? '완주' : '진행중',
    s.isOnline ? '온라인' : '오프라인',
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `믿음의항해_학급결과_${classCode}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
