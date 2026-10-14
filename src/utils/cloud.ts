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
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { StudentSession, Classroom, PlayerProfile } from '../types';

/**
 * 학생용 익명 인증 (Anonymous Sign-In)
 */
export async function ensureStudentAuth(): Promise<User | null> {
  if (!isFirebaseConfigured() || !auth) return null;
  if (auth.currentUser) return auth.currentUser;

  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('[Cloud] Anonymous login failed:', err);
    return null;
  }
}

/**
 * 학생이 수업 코드로 반에 입장
 */
export async function joinClassroom(
  rawClassCode: string,
  profile: PlayerProfile,
  initialScore: number = 0
): Promise<{ success: boolean; error?: string; session?: StudentSession }> {
  if (!isFirebaseConfigured() || !db || !auth) {
    return { success: false, error: 'Firebase 설정이 되어있지 않아 오프라인 모드로 진행됩니다.' };
  }

  const classCode = rawClassCode.trim().toUpperCase();
  if (!classCode) {
    return { success: false, error: '수업 코드를 입력해주세요.' };
  }

  try {
    const user = await ensureStudentAuth();
    if (!user) {
      return { success: false, error: '학생 접속 인증에 실패했습니다.' };
    }

    const classRef = doc(db, 'classrooms', classCode);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      return { success: false, error: `수업 코드 [${classCode}]에 해당하는 반을 찾을 수 없습니다.` };
    }

    const classData = classSnap.data() as Classroom;
    if (classData.isClosed) {
      return { success: false, error: '해당 수업은 입장이 마감되었습니다.' };
    }

    const studentRef = doc(db, 'classrooms', classCode, 'students', user.uid);
    const existingSnap = await getDoc(studentRef);

    const now = Date.now();
    let sessionData: StudentSession;

    if (existingSnap.exists()) {
      // 기존 세션 갱신
      sessionData = {
        ...(existingSnap.data() as StudentSession),
        studentName: profile.name,
        famId: profile.fam,
        characterId: profile.characterId,
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
      // 신규 학생 등록
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
        lastActiveAt: now,
        isOnline: true,
        isCompleted: false,
      };
      await setDoc(studentRef, sessionData);
    }

    return { success: true, session: sessionData };
  } catch (err: any) {
    console.error('[Cloud] joinClassroom error:', err);
    return { success: false, error: err.message || '수업 입장 중 오류가 발생했습니다.' };
  }
}

/**
 * 학생 진행도 실시간 동기화
 */
export async function updateStudentProgress(
  classCode: string,
  updates: Partial<StudentSession>
): Promise<void> {
  if (!isFirebaseConfigured() || !db || !auth || !auth.currentUser) return;
  const cleanCode = classCode.trim().toUpperCase();
  if (!cleanCode) return;

  try {
    const studentRef = doc(db, 'classrooms', cleanCode, 'students', auth.currentUser.uid);
    await setDoc(
      studentRef,
      {
        ...updates,
        lastActiveAt: Date.now(),
        isOnline: true,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Cloud] updateStudentProgress failed:', err);
  }
}

/**
 * 30초마다 보내는 접속 신호 (Heartbeat)
 */
export async function sendHeartbeat(classCode: string): Promise<void> {
  if (!isFirebaseConfigured() || !db || !auth || !auth.currentUser) return;
  const cleanCode = classCode.trim().toUpperCase();
  if (!cleanCode) return;

  try {
    const studentRef = doc(db, 'classrooms', cleanCode, 'students', auth.currentUser.uid);
    await updateDoc(studentRef, {
      lastActiveAt: Date.now(),
      isOnline: true,
    });
  } catch (err) {
    // Silent fail for heartbeats
  }
}

/**
 * 우리 반 학생 실시간 순위 구독 (학생 & 교사용)
 */
export function subscribeClassStudents(
  classCode: string,
  onUpdate: (students: StudentSession[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isFirebaseConfigured() || !db) {
    onUpdate([]);
    return () => {};
  }

  const cleanCode = classCode.trim().toUpperCase();
  if (!cleanCode) {
    onUpdate([]);
    return () => {};
  }

  const studentsColl = collection(db, 'classrooms', cleanCode, 'students');

  return onSnapshot(
    studentsColl,
    (snapshot) => {
      const now = Date.now();
      const students: StudentSession[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as StudentSession;
        // 90초 이상 하트비트가 없으면 오프라인 간주
        const isOnline = now - (data.lastActiveAt || 0) < 90 * 1000;
        return {
          ...data,
          id: docSnap.id,
          isOnline,
        };
      });

      // 점수 내림차순, 소요시간 오름차순 정렬
      students.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
        return a.elapsedTimeMs - b.elapsedTimeMs;
      });

      onUpdate(students);
    },
    (err) => {
      console.warn('[Cloud] subscribeClassStudents failed:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * 교사용: 수업 방 생성
 */
export async function createClassroom(
  code: string,
  title: string,
  teacherEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { success: false, error: 'Firebase 설정이 필요합니다.' };
  }

  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length !== 5) {
    return { success: false, error: '수업 코드는 영문/숫자 5자리여야 합니다.' };
  }

  try {
    const classRef = doc(db, 'classrooms', cleanCode);
    const existing = await getDoc(classRef);
    if (existing.exists()) {
      return { success: false, error: `이미 사용 중인 수업 코드 [${cleanCode}] 입니다. 다른 코드를 사용하세요.` };
    }

    const newClass: Classroom = {
      code: cleanCode,
      title: title.trim() || `${cleanCode} 수업`,
      teacherEmail: teacherEmail.trim(),
      createdAt: Date.now(),
      isClosed: false,
    };

    await setDoc(classRef, newClass);
    return { success: true };
  } catch (err: any) {
    console.error('[Cloud] createClassroom error:', err);
    return { success: false, error: err.message || '수업 방 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 교사의 수업 목록 실시간 구독
 */
export function subscribeTeacherClassrooms(
  teacherEmail: string,
  onUpdate: (classrooms: Classroom[]) => void
): () => void {
  if (!isFirebaseConfigured() || !db) {
    onUpdate([]);
    return () => {};
  }

  const classColl = collection(db, 'classrooms');
  const q = query(classColl, where('teacherEmail', '==', teacherEmail.trim()));

  return onSnapshot(
    q,
    (snapshot) => {
      const classes: Classroom[] = snapshot.docs.map((d) => d.data() as Classroom);
      classes.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(classes);
    },
    (err) => {
      console.warn('[Cloud] subscribeTeacherClassrooms failed:', err);
    }
  );
}

/**
 * 수업 입장 마감 토글
 */
export async function setClassroomClosed(classCode: string, isClosed: boolean): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  const classRef = doc(db, 'classrooms', classCode.trim().toUpperCase());
  await updateDoc(classRef, { isClosed });
}

/**
 * 학생 기록 초기화 (수업 내 모든 학생 기록 삭제)
 */
export async function resetClassroomStudents(classCode: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  const cleanCode = classCode.trim().toUpperCase();
  const studentsColl = collection(db, 'classrooms', cleanCode, 'students');
  const snaps = await getDocs(studentsColl);

  const batch = writeBatch(db);
  snaps.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}

/**
 * 수업 삭제
 */
export async function deleteClassroom(classCode: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  const cleanCode = classCode.trim().toUpperCase();
  await resetClassroomStudents(cleanCode);
  const classRef = doc(db, 'classrooms', cleanCode);
  await deleteDoc(classRef);
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
    `믿음의항해_수업결과_${classCode}_${new Date().toISOString().slice(0, 10)}.csv`
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
