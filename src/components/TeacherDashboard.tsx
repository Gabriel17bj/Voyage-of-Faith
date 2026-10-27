import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../utils/firebase';
import {
  createClassroom,
  subscribeTeacherClassrooms,
  subscribeClassStudents,
  setClassroomClosed,
  resetClassroomStudents,
  deleteClassroom,
  exportStudentsToCsv,
  generateClassCode,
  saveLocalTeacherSession,
  getLocalTeacherSession,
  clearLocalTeacherSession,
  addSimulatedStudent,
  subscribeClassResults,
  exportResultsToCsv,
  clearClassResults,
  detectSyncMode,
  SyncMode,
  DEFAULT_DEMO_CLASSROOMS,
  DEFAULT_DEMO_STUDENTS,
} from '../utils/cloud';
import { Classroom, StudentSession, GameResult } from '../types';
import { VERSE_QUESTS, FAM_LIST } from '../data/verses';
import { HERO_CHARACTERS } from '../data/characters';
import { getRankTier } from '../utils/score';
import { StudentDetailModal } from './StudentDetailModal';
import {
  Users,
  Trophy,
  BarChart3,
  Tv,
  Download,
  Lock,
  Unlock,
  RotateCcw,
  Trash2,
  Plus,
  LogOut,
  LogIn,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  Flame,
  HelpCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  UserPlus,
  Share2,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { sounds } from '../utils/audio';

const DEMO_CLASSROOMS = DEFAULT_DEMO_CLASSROOMS;
const DEMO_STUDENTS = DEFAULT_DEMO_STUDENTS;

export const TeacherDashboard: React.FC = () => {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [emailInput, setEmailInput] = useState<string>('teacher@church.org');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  // Classroom state
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassCode, setSelectedClassCode] = useState<string>('FAITH');
  const [students, setStudents] = useState<StudentSession[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'results' | 'verses' | 'settings'>('overview');
  const [results, setResults] = useState<GameResult[]>([]);
  const [syncMode, setSyncMode] = useState<SyncMode | null>(null);

  useEffect(() => {
    detectSyncMode().then(setSyncMode);
  }, []);

  // Student Detail Modal
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentSession | null>(null);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState<boolean>(false);
  const [copiedCodeOnly, setCopiedCodeOnly] = useState<boolean>(false);

  // New Class Modal
  const [showNewClassModal, setShowNewClassModal] = useState<boolean>(false);
  const [newClassTitle, setNewClassTitle] = useState<string>('');
  const [newClassCode, setNewClassCode] = useState<string>(() => generateClassCode());

  // Projector Mode
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time student join alert
  const [newStudentToast, setNewStudentToast] = useState<{ name: string; time: number } | null>(null);
  const prevStudentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (newStudentToast) {
      const t = window.setTimeout(() => setNewStudentToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [newStudentToast]);

  // 1. Check existing local teacher session on mount
  useEffect(() => {
    const local = getLocalTeacherSession();
    if (local && !currentUser) {
      setCurrentUser({
        email: local.email,
        uid: local.uid,
      } as User);
    }
    setAuthLoading(false);
  }, []);

  // 2. Firebase Auth listener (if configured)
  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        setCurrentUser(user);
        setIsDemoMode(false);
      }
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  // 3. Classrooms listener for logged-in teacher
  useEffect(() => {
    if (isDemoMode) {
      setClassrooms(DEMO_CLASSROOMS);
      if (!selectedClassCode) {
        setSelectedClassCode('FAITH');
      }
      return;
    }

    if (!currentUser || !currentUser.email) {
      setClassrooms([]);
      return;
    }

    const unsub = subscribeTeacherClassrooms(currentUser.email, (classes) => {
      setClassrooms(classes);
      setSelectedClassCode((prev) => {
        if (prev) return prev;
        return classes.length > 0 ? classes[0].code : 'FAITH';
      });
    });

    return () => unsub();
  }, [currentUser, isDemoMode]);

  // 4. Students listener for selected class (Always active in real-time)
  useEffect(() => {
    if (!selectedClassCode) {
      setStudents([]);
      return;
    }

    prevStudentIdsRef.current = new Set();
    const unsub = subscribeClassStudents(selectedClassCode, (stList) => {
      // If demo mode on default FAITH and no server students joined yet, show demo students
      if (isDemoMode && selectedClassCode === 'FAITH' && stList.length === 0) {
        setStudents(DEMO_STUDENTS);
        return;
      }

      if (prevStudentIdsRef.current.size > 0 && stList.length > prevStudentIdsRef.current.size) {
        const newlyJoined = stList.find((s) => !prevStudentIdsRef.current.has(s.id));
        if (newlyJoined) {
          sounds.playCorrect();
          setNewStudentToast({ name: newlyJoined.studentName, time: Date.now() });
        }
      }
      prevStudentIdsRef.current = new Set(stList.map((s) => s.id));
      setStudents(stList);
    });

    return () => unsub();
  }, [selectedClassCode, isDemoMode]);

  // 5. Game results history listener for selected class
  useEffect(() => {
    if (!selectedClassCode || isDemoMode) {
      setResults([]);
      return;
    }
    const unsub = subscribeClassResults(selectedClassCode, setResults);
    return () => unsub();
  }, [selectedClassCode, isDemoMode]);

  // Handle Demo Mode Enter
  const handleEnterDemoMode = () => {
    sounds.playCorrect();
    setIsDemoMode(true);
    setCurrentUser({
      email: 'teacher@promise.land',
      uid: 'demo-teacher-uid',
    } as User);
    setClassrooms(DEMO_CLASSROOMS);
    setSelectedClassCode('FAITH');
    setStudents(DEMO_STUDENTS);
  };

  // Handle Quick 1-Click Login
  const handleQuickLogin = (email: string = 'teacher@church.org') => {
    sounds.playCorrect();
    saveLocalTeacherSession(email);
    setCurrentUser({
      email,
      uid: 'teacher_quick_' + Date.now().toString(36),
    } as User);
    setIsDemoMode(false);
  };

  // Handle Teacher Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmittingAuth(true);

    const email = emailInput.trim() || 'teacher@church.org';

    // 1. Try Firebase Auth if configured
    if (isFirebaseConfigured() && auth) {
      try {
        await signInWithEmailAndPassword(auth, email, passwordInput);
        saveLocalTeacherSession(email);
        setIsDemoMode(false);
        sounds.playCorrect();
        setIsSubmittingAuth(false);
        return;
      } catch (err: any) {
        console.warn('[TeacherDashboard] Firebase login failed, switching to local teacher session:', err);
      }
    }

    // 2. Direct Local Teacher Mode (Always grants access!)
    saveLocalTeacherSession(email);
    setCurrentUser({
      email,
      uid: 'teacher_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16),
    } as User);
    setIsDemoMode(false);
    sounds.playCorrect();
    setIsSubmittingAuth(false);
  };

  // Handle Teacher Logout
  const handleLogout = async () => {
    sounds.playTap();
    clearLocalTeacherSession();
    setIsDemoMode(false);
    if (auth && isFirebaseConfigured()) {
      try {
        await signOut(auth);
      } catch (e) {}
    }
    setCurrentUser(null);
  };

  // Handle Add Simulated Test Student (for live teacher demonstration)
  const handleAddSimulatedStudent = () => {
    sounds.playCorrect();
    if (!selectedClassCode) return;
    const newStudent = addSimulatedStudent(selectedClassCode, students);
    if (isDemoMode) {
      setStudents((prev) => [newStudent, ...prev]);
    }
  };

  // Handle Create Classroom (Persists to server and sets as current active class)
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherEmail = currentUser?.email || 'teacher@church.org';

    sounds.playTap();

    const res = await createClassroom(newClassCode, newClassTitle, teacherEmail);
    if (res.success) {
      sounds.playCorrect();
      const newClass: Classroom = {
        code: newClassCode,
        title: newClassTitle.trim() || `${newClassCode} 수업`,
        teacherEmail,
        createdAt: Date.now(),
        isClosed: false,
      };
      setClassrooms((prev) => [newClass, ...prev.filter((c) => c.code !== newClassCode)]);
      setSelectedClassCode(newClassCode);
      setStudents([]);
      setShowNewClassModal(false);
      setNewClassTitle('');
      setNewClassCode(generateClassCode());
    } else {
      sounds.playWrong();
      alert(res.error || '수업 생성 실패');
    }
  };

  // Current selected class object
  const selectedClass = useMemo(() => {
    return classrooms.find((c) => c.code === selectedClassCode);
  }, [classrooms, selectedClassCode]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) {
      return {
        totalStudents: 0,
        onlineCount: 0,
        completedCount: 0,
        avgScore: 0,
        avgSolved: 0,
        avgStars: 0,
      };
    }
    const online = students.filter((s) => s.isOnline).length;
    const completed = students.filter((s) => s.isCompleted || s.solvedCount >= 36).length;
    const sumScore = students.reduce((acc, s) => acc + (s.score || 0), 0);
    const sumSolved = students.reduce((acc, s) => acc + (s.solvedCount || 0), 0);
    const sumStars = students.reduce((acc, s) => acc + (s.totalStars || 0), 0);

    return {
      totalStudents: total,
      onlineCount: online,
      completedCount: completed,
      avgScore: Math.round(sumScore / total),
      avgSolved: (sumSolved / total).toFixed(1),
      avgStars: (sumStars / total).toFixed(1),
    };
  }, [students]);

  // Filter students with "Help Needed" (오답 3회 이상 또는 특정 퀘스트에서 오래 멈춤)
  const helpNeededStudents = useMemo(() => {
    return students.filter((s) => !s.isCompleted && (s.wrongAnswersCount >= 3 || (s.hintsUsed >= 4 && s.solvedCount < 10)));
  }, [students]);

  // Verse-by-verse statistics (말씀별 오답 통계)
  const verseStats = useMemo(() => {
    const counts: { [questId: number]: { wrong: number; solved: number } } = {};
    for (let i = 1; i <= 36; i++) {
      counts[i] = { wrong: 0, solved: 0 };
    }

    students.forEach((s) => {
      (s.solvedQuestIds || []).forEach((qId) => {
        if (counts[qId]) counts[qId].solved += 1;
      });
      if (s.wrongQuestCounts) {
        Object.entries(s.wrongQuestCounts).forEach(([qIdStr, count]) => {
          const qId = Number(qIdStr);
          if (counts[qId]) counts[qId].wrong += Number(count || 0);
        });
      }
    });

    return VERSE_QUESTS.map((q) => {
      const stat = counts[q.id] || { wrong: 0, solved: 0 };
      return {
        quest: q,
        wrongCount: stat.wrong,
        solvedCount: stat.solved,
      };
    }).sort((a, b) => b.wrongCount - a.wrongCount);
  }, [students]);

  // Filtered students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    return students.filter((s) => (s.studentName || "").toLowerCase().includes(searchQuery.trim().toLowerCase()));
  }, [students, searchQuery]);

  // Time format helper
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}분 ${s}초`;
  };

  // =========================================================================
  // VIEW: PROJECTOR MODE (Beam Projector / Big Screen Mode)
  // =========================================================================
  if (isProjectorMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#06101e] text-white flex flex-col p-4 sm:p-8 overflow-hidden select-none">
        {/* Top Big Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-500/40 pb-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsProjectorMode(false)}
              className="p-2 sm:p-3 rounded-2xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              title="프로젝터 모드 닫기 (ESC)"
            >
              <Minimize2 className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-amber-300 tracking-wide">
                  PROMISE LAND : 믿음의 항해
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-xs font-bold border border-blue-400/40">
                  실시간 순위표
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {selectedClass?.title || '수업'} • 총 {students.length}명 항해 중 ({stats.onlineCount}명 접속)
              </p>
            </div>
          </div>

          {/* Huge Class Code Badge */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.5)] border-2 border-yellow-200">
            <div className="text-right">
              <div className="text-[11px] sm:text-xs font-black text-amber-950 uppercase tracking-widest">
                수업 입장 코드
              </div>
              <div className="text-3xl sm:text-5xl font-black text-slate-950 font-mono tracking-wider">
                {selectedClassCode}
              </div>
            </div>
          </div>
        </div>

        {/* Big Ranking Board */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pr-2 scrollbar-thin">
          {students.slice(0, 12).map((s, idx) => {
            const isTop3 = idx < 3;
            const hero = HERO_CHARACTERS.find((h) => h.id === s.characterId) || HERO_CHARACTERS[0];
            const tier = getRankTier(s.score, s.solvedCount);

            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition ${
                  idx === 0
                    ? 'bg-gradient-to-r from-amber-900/60 to-yellow-900/40 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : idx === 1
                    ? 'bg-gradient-to-r from-slate-800/80 to-slate-700/60 border-slate-300'
                    : idx === 2
                    ? 'bg-gradient-to-r from-amber-950/60 to-orange-950/40 border-amber-600'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Rank number */}
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-black ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950 shadow-lg'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {idx === 0 ? '👑' : idx + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
                    <img
                      src={hero.image}
                      alt={s.studentName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Name & details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-xl font-black text-white">{s.studentName}</span>
                      {s.isOnline && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      {s.isCompleted && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/40">
                          완주!
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>말씀 {s.solvedCount}/36</span>
                      <span>•</span>
                      <span className="text-amber-300 font-bold">⭐ {s.totalStars}</span>
                      <span>•</span>
                      <span>{formatTime(s.elapsedTimeMs)}</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight">
                    {s.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400">{tier.tier}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: TEACHER LOGIN (If not logged in)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#071322] flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="w-full max-w-md bg-[#0c1c30] border-2 border-[#8e5837] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-4">
          {/* Back button */}
          <button
            onClick={() => {
              window.location.hash = '';
            }}
            className="self-start flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 cursor-pointer font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>게임으로 돌아가기</span>
          </button>

          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto mb-2 border border-amber-500/40 shadow-inner">
              <Users className="w-7 h-7 text-amber-300" />
            </div>
            <h1 className="text-2xl font-black text-amber-300">교사 대시보드</h1>
            <p className="text-xs text-slate-400 mt-1">
              수업 코드 발급 및 접속한 학생들의 실시간 활동 결과 모니터링
            </p>
          </div>

          {/* Primary Action: 1-Click Quick Direct Access */}
          <button
            type="button"
            onClick={() => handleQuickLogin(emailInput.trim() || 'teacher@church.org')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-95 transition"
          >
            <Sparkles className="w-5 h-5 text-slate-950 fill-current animate-bounce" />
            <span>선생님 바로 입장 (원클릭 간편 로그인)</span>
          </button>

          {/* Status Note */}
          <div className="p-3 rounded-2xl bg-sky-950/50 border border-sky-500/40 text-sky-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-white">학급 실시간 모드 준비 완료:</span>
              <p className="text-sky-300/80 mt-0.5">
                복잡한 계정 설정 없이도 바로 입장하여 접속한 학생들의 실시간 문제 풀이 현황, 별점, 소요 시간, 오답 통계를 즉시 확인하실 수 있습니다.
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs">
              {authError}
            </div>
          )}

          {/* Divider */}
          <div className="relative flex py-0.5 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-bold">또는 교사 이메일로 로그인</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 block">교사 이메일</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="teacher@church.org"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">비밀번호</label>
                <span className="text-[10px] text-slate-500">(선택 사항)</span>
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="mt-1 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50 hover:border-amber-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95 disabled:opacity-50 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isSubmittingAuth ? '입장 중...' : '이메일로 로그인하기'}</span>
            </button>
          </form>

          {/* Sample Demo Data Preview Button */}
          <button
            type="button"
            onClick={handleEnterDemoMode}
            className="w-full py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
          >
            <span>가상 학생 10명 샘플 데이터로 둘러보기</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN TEACHER DASHBOARD (Logged In)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#071322] text-slate-100 flex flex-col">
      {/* Real-time Student Arrival Alert Toast */}
      {newStudentToast && (
        <div className="fixed top-4 right-3 left-3 sm:left-auto sm:right-4 z-50 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-900/95 to-slate-900/95 border-2 border-emerald-400 text-white shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <div className="text-xs">
            <span className="font-black text-emerald-300">🎉 새 학생 실시간 접속!</span>
            <p className="text-slate-200 text-[11px]">
              <strong>{newStudentToast.name}</strong> 학생이 방금 수업에 접속하여 활동이 기록되고 있습니다.
            </p>
          </div>
          <button
            onClick={() => setNewStudentToast(null)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Demo Banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/70 to-slate-900 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>체험용 가상 데이터 모드:</strong> 10명의 가상 학생 데이터로 실시간 순위, 프로젝터 모드, 오답 분석, 엑셀 내보내기를 즉시 확인하실 수 있습니다.
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-[11px] font-bold border border-amber-400/40 cursor-pointer shrink-0 ml-2"
          >
            로그인 화면으로
          </button>
        </div>
      )}

      {/* Sync engine status banner */}
      {!isDemoMode && syncMode === 'local' && (
        <div className="bg-red-950/80 border-b border-red-500/40 px-4 py-2 text-[11px] sm:text-xs text-red-200 leading-relaxed">
          <strong>⚠️ 로컬 모드:</strong> Firebase 설정(VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID)이 없어
          이 브라우저 안에서만 기록됩니다. 다른 기기의 학생은 보이지 않습니다. README의 배포 안내를 확인해 주세요.
        </div>
      )}
      {!isDemoMode && syncMode === 'server' && (
        <div className="bg-blue-950/70 border-b border-blue-500/30 px-4 py-1.5 text-[11px] text-blue-200">
          🖥️ 서버 모드(AI Studio 미리보기/자체 서버): 서버가 재시작되면 기록이 초기화될 수 있습니다. 영구 기록은 Firebase 연결을 권장합니다.
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-[#0b1c32] border-b border-slate-800 px-4 sm:px-6 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between sticky top-0 z-40 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.location.hash = '';
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="게임 화면으로 돌아가기"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">게임 화면</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-sm sm:text-base text-amber-300 leading-none">
                  교사 대시보드
                </h1>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {syncMode === 'firebase' ? '클라우드 실시간' : syncMode === 'server' ? '서버 실시간' : '실시간 동기화'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Class Select Dropdown */}
          <select
            value={selectedClassCode}
            onChange={(e) => {
              sounds.playTap();
              setSelectedClassCode(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-amber-200 cursor-pointer focus:outline-none focus:border-amber-400"
          >
            {classrooms.map((c) => (
              <option key={c.code} value={c.code}>
                [{c.code}] {c.title}
              </option>
            ))}
          </select>

          {/* Quick Add Simulated Student (Live verification) */}
          <button
            onClick={handleAddSimulatedStudent}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition active:scale-95"
            title="실시간 테스트 학생 1명을 추가하여 순위표와 점수 갱신을 확인합니다."
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">테스트 학생 추가</span>
          </button>

          {/* CSV Download Button in Header */}
          <button
            onClick={() => {
              sounds.playTap();
              exportStudentsToCsv(students, selectedClassCode);
            }}
            disabled={students.length === 0}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="학생 활동 결과 엑셀(CSV) 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">엑셀 다운로드</span>
          </button>

          {/* Invite / Share Class Button */}
          <button
            onClick={() => {
              sounds.playTap();
              setShowInviteModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1 cursor-pointer transition active:scale-95"
            title="학생 초대 코드 및 참여 링크 복사/안내"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">학생 초대</span>
          </button>

          {/* New Class Button */}
          <button
            onClick={() => {
              sounds.playTap();
              setNewClassCode(generateClassCode());
              setShowNewClassModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">수업 추가</span>
          </button>

          {/* Projector Mode Button */}
          <button
            onClick={() => {
              sounds.playTap();
              setIsProjectorMode(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-1 shadow cursor-pointer active:scale-95 transition"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">프로젝터 순위</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-4 sm:gap-5">
        {/* If no classrooms created yet */}
        {classrooms.length === 0 ? (
          <div className="bg-[#0b1c32] border-2 border-dashed border-slate-700 rounded-3xl p-8 text-center flex flex-col items-center gap-3 my-auto">
            <Users className="w-12 h-12 text-amber-400/40" />
            <h2 className="text-lg font-black text-amber-300">생성된 수업이 없습니다</h2>
            <p className="text-xs text-slate-400 max-w-sm">
              새로운 수업을 만들면 5자리 입장 코드가 생성되며, 학생들은 시작 화면에서 해당 코드를 입력해 실시간으로 참여할 수 있습니다.
            </p>
            <button
              onClick={() => {
                sounds.playTap();
                setNewClassCode(generateClassCode());
                setShowNewClassModal(true);
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>첫 번째 수업 만들기</span>
            </button>
          </div>
        ) : (
          <>
            {/* Top Stat Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Students */}
              <div className="p-4 rounded-2xl bg-[#0c1e36] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">참여 학생</span>
                  <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    {stats.totalStudents}명
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {stats.onlineCount}명 접속 중
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Completed */}
              <div className="p-4 rounded-2xl bg-[#0c1e36] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">완주 학생</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">
                    {stats.completedCount}명
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    평균 진도: {stats.avgSolved} / 36개
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Avg Score */}
              <div className="p-4 rounded-2xl bg-[#0c1e36] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">반 평균 점수</span>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5 font-mono">
                    {stats.avgScore.toLocaleString()}점
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    평균 별: ⭐ {stats.avgStars}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: Class Code Info & Lock */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1e36] to-amber-950/30 border border-amber-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-300/80 font-bold block">수업 입장 코드</span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-wider mt-0.5">
                    {selectedClassCode}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    {selectedClass?.isClosed ? (
                      <span className="text-rose-400 font-bold flex items-center gap-0.5">
                        <Lock className="w-3 h-3" /> 입장 마감됨
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <Unlock className="w-3 h-3" /> 입장 가능
                      </span>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => {
                    sounds.playTap();
                    setClassroomClosed(selectedClassCode, !selectedClass?.isClosed);
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                  title={selectedClass?.isClosed ? '입장 재개' : '입장 마감'}
                >
                  {selectedClass?.isClosed ? (
                    <Unlock className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Live Activity Ticker Banner */}
            <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0c1e36] via-[#102747] to-[#0c1e36] border border-sky-500/30 flex items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2 shrink-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="font-black text-sky-300 flex items-center gap-1">
                  <span>⚡ 실시간 활동 현황</span>
                </span>
              </div>
              <div className="flex-1 text-slate-300 text-[11px] truncate flex items-center gap-2">
                {stats.completedCount > 0 ? (
                  <span className="text-emerald-300 font-bold">
                    🏆 {stats.completedCount}명 완주 달성!
                  </span>
                ) : (
                  <span className="text-sky-200">
                    ⚓ {stats.onlineCount}명 실시간 항해 중
                  </span>
                )}
                <span className="text-slate-600">•</span>
                <span className="text-amber-200/90 truncate">
                  {students.slice(0, 4).map((st) => `${st.studentName}(${st.solvedCount}/36)`).join(' • ')}
                </span>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowInviteModal(true);
                }}
                className="text-[11px] text-amber-300 hover:text-amber-200 font-bold shrink-0 flex items-center gap-1 underline cursor-pointer"
              >
                <span>초대 코드 [{selectedClassCode}]</span>
                <Share2 className="w-3 h-3" />
              </button>
            </div>

            {/* Help Needed Alert (If any) */}
            {helpNeededStudents.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30 shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-rose-200">
                      🚨 도움이 필요한 학생이 {helpNeededStudents.length}명 있습니다!
                    </h3>
                    <p className="text-xs text-rose-300/80">
                      오답 횟수가 누적되었거나 문제 풀이에 정체를 겪고 있는 학생입니다. 이름을 클릭하면 취약 구절을 확인하고 맞춤 지도를 할 수 있습니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {helpNeededStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setSelectedStudentForDetail(s);
                      }}
                      className="px-2.5 py-1 rounded-full bg-rose-900/80 hover:bg-rose-800 border border-rose-500/80 text-xs font-bold text-rose-100 flex items-center gap-1 shadow cursor-pointer transition active:scale-95"
                      title="클릭하여 학생 상세 분석 보기"
                    >
                      <span>{s.studentName}</span>
                      <span className="text-[10px] text-rose-300">(오답 {s.wrongAnswersCount}회)</span>
                      <span className="text-[9px] text-amber-300 ml-0.5">🔍</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 [&>button]:shrink-0 [&>button]:whitespace-nowrap">
                <button
                  onClick={() => {
                    sounds.playTap();
                    setActiveTab('overview');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>실시간 학생 목록 ({students.length})</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playTap();
                    setActiveTab('leaderboard');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'leaderboard'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>종합 순위표</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playTap();
                    setActiveTab('results');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'results'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>게임 기록 ({results.length})</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playTap();
                    setActiveTab('verses');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'verses'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>말씀별 오답 통계</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playTap();
                    setActiveTab('settings');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>수업 관리</span>
                </button>
              </div>

              {/* CSV Export Button */}
              <button
                onClick={() => {
                  sounds.playTap();
                  exportStudentsToCsv(students, selectedClassCode);
                }}
                disabled={students.length === 0}
                className="hidden sm:flex shrink-0 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV 저장</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & STUDENTS LIST */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="학생 이름 검색..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs bg-[#0c1e36] rounded-2xl border border-slate-800">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    참여 중인 학생이 없습니다. 학생들에게 수업 코드 [<strong>{selectedClassCode}</strong>]를 알려주세요.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredStudents.map((s, idx) => {
                      const hero = HERO_CHARACTERS.find((h) => h.id === s.characterId) || HERO_CHARACTERS[0];
                      const fam = FAM_LIST.find((f) => f.id === s.famId) || FAM_LIST[0];
                      const isNeedsHelp = !s.isCompleted && (s.wrongAnswersCount >= 3 || (s.hintsUsed >= 4 && s.solvedCount < 10));

                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            sounds.playTap();
                            setSelectedStudentForDetail(s);
                          }}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between transition cursor-pointer hover:border-amber-400 hover:shadow-xl hover:scale-[1.01] ${
                            isNeedsHelp
                              ? 'bg-rose-950/20 border-rose-500/60 shadow'
                              : 'bg-[#0c1e36] border-slate-800'
                          }`}
                        >
                          {/* Student Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                                <img
                                  src={hero.image}
                                  alt={s.studentName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-sm text-white">{s.studentName}</span>
                                  {s.isOnline ? (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="온라인" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-slate-600" title="오프라인" />
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <span>{fam.emoji} {fam.name.ko}</span>
                                </span>
                              </div>
                            </div>

                            {/* Score badge */}
                            <div className="text-right">
                              <div className="text-sm font-black text-amber-300 font-mono">
                                {s.score.toLocaleString()}점
                              </div>
                              <span className="text-[9px] text-slate-400">순위 #{idx + 1}</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span>진행도 ({s.solvedCount}/36)</span>
                              <span className="text-amber-300 font-bold">⭐ {s.totalStars}개</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (s.solvedCount / 36) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer details */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {formatTime(s.elapsedTimeMs)}
                            </span>
                            <span>힌트 {s.hintsUsed}회</span>
                            <span className={s.wrongAnswersCount >= 3 ? 'text-rose-400 font-bold' : ''}>
                              오답 {s.wrongAnswersCount}회
                            </span>
                          </div>

                          {/* Quick Inspect Button */}
                          <div className="mt-2 py-1 px-2 rounded-lg bg-slate-900 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 flex items-center justify-center gap-1 text-[10px] text-amber-300 font-bold transition">
                            <span>활동 상세 보고서 보기</span>
                            <span className="text-amber-400">→</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LEADERBOARD */}
            {activeTab === 'leaderboard' && (
              <div className="bg-[#0c1e36] border border-slate-800 rounded-2xl overflow-hidden shadow">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 text-[11px] border-b border-slate-800 uppercase">
                    <tr>
                      <th className="py-3 px-4">순위</th>
                      <th className="py-3 px-4">학생 이름</th>
                      <th className="py-3 px-4">종합 점수</th>
                      <th className="py-3 px-4">진행도</th>
                      <th className="py-3 px-4">획득 별</th>
                      <th className="py-3 px-4">소요 시간</th>
                      <th className="py-3 px-4">힌트/오답</th>
                      <th className="py-3 px-4">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {students.map((s, idx) => {
                      const tier = getRankTier(s.score, s.solvedCount);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => {
                            sounds.playTap();
                            setSelectedStudentForDetail(s);
                          }}
                          className="hover:bg-slate-800/80 transition cursor-pointer group"
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                                idx === 0
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-950'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'text-slate-400'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm group-hover:text-amber-300 transition">{s.studentName}</span>
                              <span className="text-[10px] text-slate-400">({tier.badge} {tier.tier.split(' ')[0]})</span>
                              <span className="text-[10px] text-amber-300 opacity-0 group-hover:opacity-100 transition">🔍 상세</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-300 text-sm">
                            {s.score.toLocaleString()}점
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-200">{s.solvedCount}</span>
                            <span className="text-slate-500"> / 36</span>
                          </td>
                          <td className="py-3 px-4 text-amber-300 font-bold">
                            ⭐ {s.totalStars}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono">
                            {formatTime(s.elapsedTimeMs)}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            힌트 {s.hintsUsed} / <span className={s.wrongAnswersCount >= 3 ? 'text-rose-400 font-bold' : ''}>오답 {s.wrongAnswersCount}</span>
                          </td>
                          <td className="py-3 px-4">
                            {s.isCompleted ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/40">
                                완주
                              </span>
                            ) : s.isOnline ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/40">
                                항해 중
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">오프라인</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: VERSE-BY-VERSE STATS */}
            {activeTab === 'verses' && (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs">
                  <span className="font-bold">📖 말씀 복습 지도 가이드:</span>
                  <p className="mt-1 text-slate-300 leading-relaxed">
                    학생들이 퀴즈에서 가장 많이 오답을 낸 말씀 구절 순서대로 정렬되어 있습니다. 오답률이 높은 말씀들을 수업 마무리에 함께 복습하고 암송해보세요!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {verseStats.map((item, idx) => (
                    <div
                      key={item.quest.id}
                      className="p-3.5 rounded-2xl bg-[#0c1e36] border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-bold text-[10px] border border-slate-700">
                            #{item.quest.id} {item.quest.reference.ko}
                          </span>
                          {idx < 3 && item.wrongCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/40">
                              복습 권장!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                          {item.quest.text.ko}
                        </p>

                        {/* Students who made errors on this verse */}
                        {(() => {
                          const wrongStudents = students.filter(
                            (s) => s.wrongQuestCounts && (s.wrongQuestCounts[String(item.quest.id)] || 0) > 0
                          );
                          if (wrongStudents.length === 0) return null;
                          return (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-bold">오답 학생:</span>
                              {wrongStudents.map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sounds.playTap();
                                    setSelectedStudentForDetail(st);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-[10px] text-rose-200 cursor-pointer flex items-center gap-1 transition active:scale-95"
                                  title="클릭하여 학생 상세 분석 보기"
                                >
                                  <span>{st.studentName}</span>
                                  <span className="text-rose-400 font-bold">({st.wrongQuestCounts?.[String(item.quest.id)]}회)</span>
                                  <span className="text-[9px] text-amber-300">🔍</span>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-rose-400">
                          오답 {item.wrongCount}회
                        </div>
                        <span className="text-[10px] text-slate-400">
                          해결 {item.solvedCount}명
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: CLASSROOM SETTINGS */}
            {/* TAB: GAME RESULTS HISTORY (영구 기록) */}
            {activeTab === 'results' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    학생이 게임을 <strong className="text-emerald-300">완주</strong>하거나 설정에서
                    <strong className="text-amber-300"> 게임 초기화(중도 종료)</strong>를 하면 결과가 자동으로 기록됩니다.
                    학생 현황을 초기화해도 이 기록은 남습니다.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        sounds.playTap();
                        exportResultsToCsv(results, selectedClassCode);
                      }}
                      disabled={results.length === 0}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>기록 CSV 저장</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`[${selectedClassCode}] 수업의 게임 기록 ${results.length}건을 모두 삭제할까요? 되돌릴 수 없습니다.`)) return;
                        sounds.playTap();
                        await clearClassResults(selectedClassCode);
                      }}
                      disabled={results.length === 0}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>기록 삭제</span>
                    </button>
                  </div>
                </div>

                {results.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs bg-[#0c1e36] rounded-2xl border border-slate-800">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    아직 저장된 게임 기록이 없습니다.
                  </div>
                ) : (
                  <div className="bg-[#0c1e36] border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[640px]">
                        <thead className="bg-slate-900/80 text-slate-400">
                          <tr>
                            <th className="text-left px-3 py-2 font-bold">기록 시각</th>
                            <th className="text-left px-3 py-2 font-bold">학생</th>
                            <th className="text-center px-3 py-2 font-bold">결과</th>
                            <th className="text-right px-3 py-2 font-bold">점수</th>
                            <th className="text-center px-3 py-2 font-bold">말씀</th>
                            <th className="text-center px-3 py-2 font-bold">별</th>
                            <th className="text-center px-3 py-2 font-bold">소요 시간</th>
                            <th className="text-center px-3 py-2 font-bold">힌트/오답</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r) => (
                            <tr key={r.id} className="border-t border-slate-800/80">
                              <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                                {new Date(r.finishedAt).toLocaleString('ko-KR', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="px-3 py-2 font-bold text-white whitespace-nowrap">{r.studentName}</td>
                              <td className="px-3 py-2 text-center">
                                {r.isCompleted ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">완주</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold">중도 종료</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-black text-amber-300">
                                {(r.score || 0).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-center text-slate-300">{r.solvedCount}/36</td>
                              <td className="px-3 py-2 text-center text-slate-300">⭐ {r.totalStars}</td>
                              <td className="px-3 py-2 text-center text-slate-300 whitespace-nowrap">{formatTime(r.elapsedTimeMs)}</td>
                              <td className="px-3 py-2 text-center text-slate-400">
                                {r.hintsUsed} / {r.wrongAnswersCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-[#0c1e36] border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="font-black text-sm text-white">수업 운영 및 관리</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    수업 코드 [{selectedClassCode}]에 대한 설정을 변경할 수 있습니다.
                  </p>
                </div>

                {/* Admission Lock */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">새 학생 입장 마감</span>
                    <span className="text-[11px] text-slate-400">
                      활성화하면 새로운 학생이 이 코드로 입장할 수 없습니다 (기존 참여 학생은 계속 플레이 가능).
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      sounds.playTap();
                      if (isDemoMode) {
                        setClassrooms((prev) =>
                          prev.map((c) =>
                            c.code === selectedClassCode ? { ...c, isClosed: !c.isClosed } : c
                          )
                        );
                        return;
                      }
                      await setClassroomClosed(selectedClassCode, !selectedClass?.isClosed);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                      selectedClass?.isClosed
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {selectedClass?.isClosed ? '마감 해제하기' : '지금 마감하기'}
                  </button>
                </div>
                {/* Add Test Student */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">실시간 테스트 학생 추가 (+1명)</span>
                    <span className="text-[11px] text-slate-400">
                      가상의 학생을 참여시켜 점수, 별점, 말씀 풀이 현황이 실시간으로 집계되는 과정을 테스트합니다.
                    </span>
                  </div>
                  <button
                    onClick={handleAddSimulatedStudent}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold cursor-pointer transition active:scale-95 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>학생 1명 추가</span>
                  </button>
                </div>

                {/* Reset Students */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">학생 기록 전체 초기화</span>
                    <span className="text-[11px] text-slate-400">
                      수업 내 모든 학생의 진행도와 점수를 삭제하여 새 게임을 준비합니다.
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm(`정말로 수업 [${selectedClassCode}]의 모든 학생 기록을 초기화하시겠습니까?`)) {
                        sounds.playTap();
                        if (isDemoMode) {
                          setStudents([]);
                          alert('학생 기록이 초기화되었습니다.');
                          return;
                        }
                        await resetClassroomStudents(selectedClassCode);
                        alert('학생 기록이 초기화되었습니다.');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer"
                  >
                    기록 초기화
                  </button>
                </div>

                {/* Delete Class */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-rose-950/20 border border-rose-500/40">
                  <div>
                    <span className="text-xs font-bold text-rose-300 block">수업 삭제</span>
                    <span className="text-[11px] text-rose-300/70">
                      이 수업 방과 관련된 모든 학생 데이터를 완전히 삭제합니다.
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm(`정말로 수업 [${selectedClassCode}]을 완전히 삭제하시겠습니까?`)) {
                        sounds.playTap();
                        if (isDemoMode) {
                          setClassrooms((prev) => prev.filter((c) => c.code !== selectedClassCode));
                          setSelectedClassCode('');
                          setStudents([]);
                          alert('수업이 삭제되었습니다.');
                          return;
                        }
                        await deleteClassroom(selectedClassCode);
                        alert('수업이 삭제되었습니다.');
                        setSelectedClassCode('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                  >
                    수업 삭제
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* New Classroom Creation Modal */}
      {showNewClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1c30] border-2 border-[#8e5837] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-black text-base text-amber-300">새로운 수업 개설</h3>
              <button
                onClick={() => setShowNewClassModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">수업 명칭</label>
                <input
                  type="text"
                  value={newClassTitle}
                  onChange={(e) => setNewClassTitle(e.target.value)}
                  placeholder="예: 초등부 5학년 1반 말씀 암송대회"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">수업 입장 코드 (5자리)</label>
                  <button
                    type="button"
                    onClick={() => setNewClassCode(generateClassCode())}
                    className="text-[10px] text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> 코드 새로고침
                  </button>
                </div>
                <input
                  type="text"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value.toUpperCase().slice(0, 5))}
                  maxLength={5}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-black text-xl tracking-widest text-center focus:outline-none focus:border-amber-400 uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer shadow"
                >
                  수업 개설하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Activity Detail Modal */}
      {selectedStudentForDetail && (
        <StudentDetailModal
          student={selectedStudentForDetail}
          rank={
            students.findIndex((s) => s.id === selectedStudentForDetail.id) + 1 || 1
          }
          totalStudents={students.length}
          onClose={() => setSelectedStudentForDetail(null)}
        />
      )}

      {/* Classroom Invite & Share Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm select-none">
          <div className="relative w-full max-w-lg bg-[#0c1c32] border-2 sm:border-4 border-[#8e5837] rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col gap-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-amber-300">
                    학생 초대 & 접속 안내
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    수업: {selectedClass?.title || selectedClassCode}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Giant Code Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#081729] to-[#050e1a] border-2 border-amber-500/50 text-center flex flex-col items-center gap-2 shadow-inner">
              <span className="text-xs font-bold text-amber-200/80 uppercase tracking-widest">
                수업 입장 코드 (5자리)
              </span>
              <div className="text-4xl sm:text-5xl font-black text-amber-300 font-mono tracking-widest select-all my-1">
                {selectedClassCode}
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  navigator.clipboard.writeText(selectedClassCode).then(() => {
                    setCopiedCodeOnly(true);
                    setTimeout(() => setCopiedCodeOnly(false), 2000);
                  });
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                {copiedCodeOnly ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeOnly ? '코드 복사 완료!' : '코드만 복사하기'}</span>
              </button>
            </div>

            {/* Direct Participation Link */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>원클릭 학생 자동 접속 링크</span>
                <span className="text-[10px] text-sky-300 font-normal">코드가 자동 입력됩니다</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== 'undefined'
                      ? `${window.location.href.split('#')[0].split('?')[0]}?code=${selectedClassCode}`
                      : `?code=${selectedClassCode}`
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 select-all"
                />
                <button
                  onClick={() => {
                    sounds.playTap();
                    const cleanBase = window.location.href.split('#')[0].split('?')[0];
                    const link = `${cleanBase}?code=${selectedClassCode}`;
                    navigator.clipboard.writeText(link).then(() => {
                      setCopiedInviteLink(true);
                      setTimeout(() => setCopiedInviteLink(false), 2000);
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition active:scale-95 shadow"
                >
                  {copiedInviteLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInviteLink ? '복사됨!' : '링크 복사'}</span>
                </button>
              </div>

              {/* Direct Open in New Tab for instant teacher testing */}
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  const cleanBase = window.location.href.split('#')[0].split('?')[0];
                  const link = `${cleanBase}?code=${selectedClassCode}`;
                  window.open(link, '_blank');
                }}
                className="w-full py-2 rounded-xl bg-sky-900/40 hover:bg-sky-800/60 border border-sky-400/50 text-sky-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 mt-1"
              >
                <span>🚀 새 탭에서 학생으로 바로 접속 테스트해보기</span>
              </button>
            </div>

            {/* Step-by-Step Instructions for Teachers */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-amber-300 block">💡 학생 참여 진행 가이드:</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>학생들에게 위의 링크를 카카오톡 또는 문자로 보내거나, 5자리 코드를 화면에 띄워주세요.</li>
                <li>학생이 시작 화면에서 수업 코드를 입력하고 출발하면 자동으로 연결됩니다.</li>
                <li>학생의 점수, 별점, 퀴즈 정답/오답이 이 대시보드에 실시간으로 집계됩니다!</li>
              </ol>
            </div>

            {/* Test Simulation Button */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  handleAddSimulatedStudent();
                  setShowInviteModal(false);
                }}
                className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>테스트용 학생 1명 즉시 참여시키기</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
