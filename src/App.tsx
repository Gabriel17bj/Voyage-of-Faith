/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FamId, 
  FamInfo, 
  Language, 
  LeaderboardEntry, 
  PlayerProfile, 
  VerseQuest,
  VerseReviewRecord,
  PlayerProgress 
} from './types';
import { FAM_LIST, SECTOR_LIST, VERSE_QUESTS, getRandomizedQuests } from './data/verses';
import { UI_TEXT } from './data/translations';
import { StartScreen } from './components/StartScreen';
import { RpgWorld } from './components/RpgWorld';
import { QuestModal } from './components/QuestModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CertificateModal } from './components/CertificateModal';
import { RulesModal } from './components/RulesModal';
import { SettingsModal } from './components/SettingsModal';
import { CreditsModal } from './components/CreditsModal';
import { ParentReportModal } from './components/ParentReportModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { BgmPlayer } from './components/BgmPlayer';
import { sounds } from './utils/audio';
import { calculateScore, getRankTier } from './utils/score';
import {
  joinClassroom,
  updateStudentProgress,
  sendHeartbeat,
  markStudentOffline,
  recordGameResult,
} from './utils/cloud';
import { 
  loadSavedProgress, 
  saveSavedProgress, 
  clearSavedProgress 
} from './utils/storage';
import { AnimatePresence, motion } from 'motion/react';
import { Trophy, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY_LEADERBOARD = 'VOYAGE_OF_FAITH_LEADERBOARD_V1';

export default function App() {
  // Routing State (#/teacher for Teacher Dashboard)
  const [route, setRoute] = useState<'game' | 'teacher'>(() => {
    return window.location.hash.startsWith('#/teacher') ? 'teacher' : 'game';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith('#/teacher')) {
        setRoute('teacher');
      } else {
        setRoute('game');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Extract initial class code from URL if present (?code=FAITH or ?class=FAITH or #code=FAITH)
  const initialClassCode = useMemo(() => {
    try {
      if (typeof window === 'undefined') return '';
      const searchParams = new URLSearchParams(window.location.search);
      const paramCode = searchParams.get('code') || searchParams.get('class');
      if (paramCode) return paramCode.trim().toUpperCase().slice(0, 5);

      const hash = window.location.hash;
      const match = hash.match(/[?&#]code=([a-zA-Z0-9]+)/i) || hash.match(/[?&#]class=([a-zA-Z0-9]+)/i);
      if (match && match[1]) {
        return match[1].trim().toUpperCase().slice(0, 5);
      }
    } catch (e) {}
    return '';
  }, []);

  const [gameState, setGameState] = useState<'start' | 'playing' | 'completed'>('start');
  const [language, setLanguage] = useState<Language>('ko');
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => ({
    name: '다윗',
    fam: 'agape',
    language: 'ko',
    classCode: initialClassCode || undefined,
  }));

  // Dynamic Randomized Quests State (Shuffled on every new game/session)
  const [quests, setQuests] = useState<VerseQuest[]>(() => getRandomizedQuests());

  // Gameplay state
  const [solvedQuestIds, setSolvedQuestIds] = useState<number[]>([]);
  const [questStars, setQuestStars] = useState<{ [questId: number]: number }>({});
  const [activeModalQuestId, setActiveModalQuestId] = useState<number | null>(null);
  const [currentSectorId, setCurrentSectorId] = useState<number>(1);
  const [hints, setHints] = useState<{ magnifier: number; hourglass: number; whisper: number }>({
    magnifier: 5,
    hourglass: 5,
    whisper: 5,
  });
  const [totalHintsUsed, setTotalHintsUsed] = useState<number>(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState<number>(0);
  const [wrongQuestCounts, setWrongQuestCounts] = useState<{ [questId: string]: number }>({});
  const [verseReviewHistory, setVerseReviewHistory] = useState<{ [questId: number]: VerseReviewRecord }>({});

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCredits, setShowCredits] = useState<boolean>(false);
  const [showParentReport, setShowParentReport] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isClassConnected, setIsClassConnected] = useState<boolean>(false);
  const [classroomToast, setClassroomToast] = useState<{ code: string; name: string } | null>(null);
  const [classroomError, setClassroomError] = useState<string | null>(null);
  const gameStartedAtRef = useRef<number>(Date.now());
  const resultRecordedRef = useRef<boolean>(false);

  // Auto-dismiss classroom error after 6s
  useEffect(() => {
    if (classroomError) {
      const timer = window.setTimeout(() => setClassroomError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [classroomError]);

  // Auto-dismiss classroom toast after 5s
  useEffect(() => {
    if (classroomToast) {
      const timer = window.setTimeout(() => setClassroomToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [classroomToast]);

  // Time Attack Timer (ms)
  const [elapsedTimeMs, setElapsedTimeMs] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Saved Progress check for Start Screen
  const [savedProgress, setSavedProgress] = useState<PlayerProgress | null>(() => loadSavedProgress());

  // Leaderboard data (Starts empty, records saved upon completing game)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const t = UI_TEXT[language];

  const currentFamInfo = useMemo(() => {
    return FAM_LIST.find((f) => f.id === playerProfile.fam) || FAM_LIST[0];
  }, [playerProfile.fam]);

  // Total stars earned across all quests
  const totalStars = useMemo(() => {
    return Object.values(questStars).reduce<number>((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);
  }, [questStars]);

  // Realtime Calculated Score
  const currentScore = useMemo(() => {
    return calculateScore({
      solvedCount: solvedQuestIds.length,
      totalStars,
      hintsUsed: totalHintsUsed,
      wrongAnswersCount,
      elapsedTimeMs,
      isCompleted: gameState === 'completed',
    });
  }, [
    solvedQuestIds.length,
    totalStars,
    totalHintsUsed,
    wrongAnswersCount,
    elapsedTimeMs,
    gameState,
  ]);

  // Determine active/next recommended quest
  const activeQuestId = useMemo(() => {
    for (let i = 1; i <= quests.length; i++) {
      if (!solvedQuestIds.includes(i)) {
        return i;
      }
    }
    return quests.length;
  }, [quests, solvedQuestIds]);

  // Sync sector view with active quest on progress
  useEffect(() => {
    const quest = quests.find((q) => q.id === activeQuestId);
    if (quest) {
      setCurrentSectorId(quest.sectorId);
    }
  }, [quests, activeQuestId]);

  // Auto-Save progress to localStorage when playing
  useEffect(() => {
    if (gameState === 'playing' && (solvedQuestIds.length > 0 || totalHintsUsed > 0)) {
      const currentProgress: PlayerProgress = {
        playerProfile,
        quests,
        solvedQuestIds,
        questStars,
        hints,
        totalHintsUsed,
        elapsedTimeMs,
        currentSectorId,
        verseReviewHistory,
        updatedAt: new Date().toISOString(),
      };
      saveSavedProgress(currentProgress);
      setSavedProgress(currentProgress);
    }
  }, [
    gameState,
    playerProfile,
    quests,
    solvedQuestIds,
    questStars,
    hints,
    totalHintsUsed,
    elapsedTimeMs,
    currentSectorId,
    verseReviewHistory,
  ]);

  // Timer Tick
  useEffect(() => {
    if (gameState === 'playing') {
      startTimeRef.current = Date.now() - elapsedTimeMs;
      timerRef.current = window.setInterval(() => {
        setElapsedTimeMs(Date.now() - startTimeRef.current);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  // 30-Second Heartbeat to Cloud if in class (+ 앱 전환/종료 시 오프라인 표시)
  useEffect(() => {
    if (gameState === 'start' || !playerProfile.classCode || !isClassConnected) return;
    const code = playerProfile.classCode;

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') sendHeartbeat(code);
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat(code);
      } else {
        markStudentOffline(code);
      }
    };
    const handlePageHide = () => markStudentOffline(code);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [gameState, playerProfile.classCode, isClassConnected]);

  // 게임 결과를 수업 기록(히스토리)에 영구 저장
  const saveResultToClass = (isCompleted: boolean) => {
    if (!playerProfile.classCode || !isClassConnected || resultRecordedRef.current) return;
    if (!isCompleted && solvedQuestIds.length === 0) return;
    resultRecordedRef.current = true;
    recordGameResult(playerProfile.classCode, {
      studentName: playerProfile.name,
      famId: playerProfile.fam,
      characterId: playerProfile.characterId,
      score: currentScore,
      solvedCount: solvedQuestIds.length,
      totalStars,
      hintsUsed: totalHintsUsed,
      wrongAnswersCount,
      elapsedTimeMs,
      isCompleted,
      reason: isCompleted ? 'completed' : 'quit',
      startedAt: gameStartedAtRef.current,
    });
  };

  // 완주 시점의 최신 상태로 결과 기록
  useEffect(() => {
    if (gameState === 'completed') {
      saveResultToClass(true);
    }
  }, [gameState]);

  // Debounced Cloud Sync on progress updates
  useEffect(() => {
    if (gameState === 'start' || !playerProfile.classCode || !isClassConnected) return;

    const timeout = setTimeout(() => {
      updateStudentProgress(playerProfile.classCode!, {
        score: currentScore,
        solvedCount: solvedQuestIds.length,
        solvedQuestIds,
        totalStars,
        hintsUsed: totalHintsUsed,
        wrongAnswersCount,
        wrongQuestCounts,
        currentQuestId: activeModalQuestId,
        elapsedTimeMs,
        isCompleted: gameState === 'completed',
        completedAt: gameState === 'completed' ? Date.now() : undefined,
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    playerProfile.classCode,
    isClassConnected,
    gameState,
    currentScore,
    solvedQuestIds.length,
    totalStars,
    totalHintsUsed,
    wrongAnswersCount,
    activeModalQuestId,
  ]);

  // Format Milliseconds as MM:SS.SS
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);

    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0');
    const hStr = hundredths.toString().padStart(2, '0');

    return `${mStr}:${sStr}.${hStr}`;
  };

  // Start Game Handler (Fresh Randomization & Cloud Classroom Join)
  const handleStartGame = async (profile: PlayerProfile) => {
    const freshQuests = getRandomizedQuests();
    setQuests(freshQuests);
    setPlayerProfile(profile);
    setLanguage(profile.language);
    setSolvedQuestIds([]);
    setQuestStars({});
    setElapsedTimeMs(0);
    setTotalHintsUsed(0);
    setWrongAnswersCount(0);
    setWrongQuestCounts({});
    setHints({ magnifier: 5, hourglass: 5, whisper: 5 });
    setVerseReviewHistory({});
    setCurrentSectorId(1);
    setActiveModalQuestId(null);
    setIsClassConnected(false);
    gameStartedAtRef.current = Date.now();
    resultRecordedRef.current = false;
    setGameState('playing');

    // If student entered a classCode, register into classroom immediately
    if (profile.classCode) {
      await connectToClass(profile, 0);
    }
  };

  const connectToClass = async (profile: PlayerProfile, initialScore: number) => {
    if (!profile.classCode) return;
    try {
      const res = await joinClassroom(profile.classCode, profile, initialScore);
      if (res.success) {
        setIsClassConnected(true);
        setClassroomError(null);
        setClassroomToast({ code: profile.classCode, name: profile.name });
      } else {
        setIsClassConnected(false);
        setClassroomError(res.error || '수업에 연결하지 못했습니다.');
      }
    } catch (err) {
      console.warn('[Classroom Join Error]', err);
      setIsClassConnected(false);
      setClassroomError('수업에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
    }
  };

  // Resume Saved Game Handler
  const handleResumeGame = async () => {
    if (!savedProgress) return;
    setPlayerProfile(savedProgress.playerProfile);
    setLanguage(savedProgress.playerProfile.language || 'ko');
    if (savedProgress.quests && savedProgress.quests.length > 0) {
      setQuests(savedProgress.quests);
    }
    setSolvedQuestIds(savedProgress.solvedQuestIds || []);
    setQuestStars(savedProgress.questStars || {});
    setHints(savedProgress.hints || { magnifier: 5, hourglass: 5, whisper: 5 });
    setTotalHintsUsed(savedProgress.totalHintsUsed || 0);
    setElapsedTimeMs(savedProgress.elapsedTimeMs || 0);
    setCurrentSectorId(savedProgress.currentSectorId || 1);
    setVerseReviewHistory(savedProgress.verseReviewHistory || {});
    setActiveModalQuestId(null);
    setIsClassConnected(false);
    resultRecordedRef.current = false;
    setGameState('playing');

    // Re-verify classroom presence on resume
    if (savedProgress.playerProfile.classCode) {
      await connectToClass(savedProgress.playerProfile, 0);
    }
  };

  // Switch Mascot Handler
  const handleSwitchFam = (famId: FamId) => {
    sounds.playTap();
    setPlayerProfile((prev) => ({ ...prev, fam: famId }));
  };

  // Quest Solved Handler with 3-Star Rating and Review History Tracking
  const handleQuestSolved = (questId: number, starsEarned: 1 | 2 | 3) => {
    setQuestStars((prev) => ({
      ...prev,
      [questId]: Math.max(prev[questId] || 0, starsEarned),
    }));

    // Update Spaced Repetition History
    setVerseReviewHistory((prev) => {
      const existing = prev[questId];
      return {
        ...prev,
        [questId]: {
          lastReviewedAt: new Date().toISOString(),
          attemptCount: (existing?.attemptCount || 0) + 1,
          correctCount: (existing?.correctCount || 0) + 1,
          bestStars: Math.max(existing?.bestStars || 0, starsEarned),
        },
      };
    });

    setSolvedQuestIds((prev) => {
      const next = prev.includes(questId) ? prev : [...prev, questId];
      if (next.length === quests.length) {
        handleFinalEscape();
      }
      return next;
    });

    setActiveModalQuestId(null);
  };

  // Wrong Answer Handler (Recorded for teacher dashboard & review)
  const handleWrongAnswer = (questId: number) => {
    setWrongAnswersCount((prev) => prev + 1);
    setWrongQuestCounts((prev) => {
      const qKey = String(questId);
      return {
        ...prev,
        [qKey]: (prev[qKey] || 0) + 1,
      };
    });
  };

  // Final Escape Victory & Leaderboard Save
  const handleFinalEscape = () => {
    setGameState('completed');
    const formatted = formatTime(elapsedTimeMs);
    const dateStr = new Date().toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newEntry: LeaderboardEntry = {
      id: `${Date.now()}-${Math.random()}`,
      playerName: playerProfile.name,
      famId: playerProfile.fam,
      language: language,
      timeMs: elapsedTimeMs,
      formattedTime: formatted,
      completedAt: dateStr,
      hintsUsed: totalHintsUsed,
    };

    setLeaderboard((prev) => {
      const updated = [...prev, newEntry].sort((a, b) => a.timeMs - b.timeMs);
      try {
        localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    // 수업 서버 최종 반영은 gameState 변경에 따른 동기화 effect와 결과 기록 effect가 처리
  };

  // Hint Deduction
  const handleUseHint = (type: 'magnifier' | 'hourglass' | 'whisper') => {
    setHints((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1),
    }));
    setTotalHintsUsed((prev) => prev + 1);
  };

  // Clear Leaderboard
  const handleClearLeaderboard = () => {
    setLeaderboard([]);
    try {
      localStorage.removeItem(STORAGE_KEY_LEADERBOARD);
    } catch {}
  };

  // Reset all progress
  const handleResetProgressData = () => {
    clearSavedProgress();
    setSavedProgress(null);
    setSolvedQuestIds([]);
    setQuestStars({});
    setVerseReviewHistory({});
    setElapsedTimeMs(0);
    setTotalHintsUsed(0);
    setWrongAnswersCount(0);
    setWrongQuestCounts({});
    setGameState('start');
  };

  // Sound Toggle
  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // ROUTE: TEACHER DASHBOARD (주소 뒤 /#/teacher)
  if (route === 'teacher') {
    return <TeacherDashboard />;
  }

  const activeQuestData = quests.find((q) => q.id === activeModalQuestId);

  return (
    <div className="game-viewport h-[100dvh] w-full max-h-[100dvh] bg-[#060b13] text-slate-100 flex flex-col items-center justify-center select-none font-sans overflow-hidden">
      
      {/* Global Background Music Component (YouTube ID: g0MXF-y3xos) */}
      <div
        className={`fixed z-40 ${
          gameState === 'playing' ? 'top-0 right-0 [&_button]:hidden' : 'top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))]'
        }`}
      >
        <BgmPlayer
          videoId="g0MXF-y3xos"
          isMuted={isMuted}
          onToggleMute={handleToggleSound}
        />
      </div>

      {/* Realtime Classroom Connection Alert Toast */}
      <AnimatePresence>
        {classroomToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="fixed top-[max(1rem,env(safe-area-inset-top))] inset-x-3 mx-auto z-50 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-900/95 via-slate-900/95 to-teal-900/95 border-2 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] backdrop-blur-md flex items-center gap-3 max-w-md pointer-events-auto select-none"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-left text-xs">
              <div className="font-black text-emerald-300 flex items-center gap-1.5">
                <span>🏫 [{classroomToast.code}] 수업 실시간 접속 완료!</span>
              </div>
              <div className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                <strong>{classroomToast.name}</strong> 학생의 풀이 활동과 점수가 선생님 대시보드에 실시간으로 기록됩니다.
              </div>
            </div>
            <button
              onClick={() => setClassroomToast(null)}
              className="ml-auto p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classroom connection error toast */}
      <AnimatePresence>
        {classroomError && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-[max(1rem,env(safe-area-inset-top))] inset-x-3 mx-auto z-50 max-w-md px-4 py-3 rounded-2xl bg-red-950/95 border-2 border-red-400 text-white shadow-2xl flex items-start gap-3"
          >
            <span className="text-lg leading-none">⚠️</span>
            <div className="text-xs leading-snug flex-1">
              <div className="font-black text-red-200">수업 연결 실패</div>
              <div className="text-slate-100 mt-0.5">{classroomError}</div>
              {gameState === 'playing' && playerProfile.classCode && (
                <button
                  onClick={() => connectToClass(playerProfile, currentScore)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold text-xs active:scale-95"
                >
                  다시 연결하기
                </button>
              )}
            </div>
            <button onClick={() => setClassroomError(null)} className="p-1 text-slate-300" aria-label="닫기">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container - Fixed Scale Gameplay Viewport */}
      <div className="w-full max-w-[1240px] h-full max-h-full flex flex-col items-center justify-center overflow-hidden">
        
        {/* START SCREEN MODE */}
        {gameState === 'start' && (
          <div className="w-full h-full max-h-full flex items-center justify-center py-1">
            <StartScreen
              onStartGame={handleStartGame}
              language={language}
              onLanguageChange={(lang) => {
                setLanguage(lang);
                setPlayerProfile((prev) => ({ ...prev, language: lang }));
              }}
              onOpenLeaderboard={() => setShowLeaderboard(true)}
              onOpenRules={() => setShowRules(true)}
              onOpenSettings={() => setShowSettings(true)}
              onOpenCredits={() => setShowCredits(true)}
              hasSavedProgress={Boolean(savedProgress && savedProgress.solvedQuestIds.length > 0)}
              savedProgressStats={
                savedProgress
                  ? {
                      stars: Object.values(savedProgress.questStars || {}).reduce<number>(
                        (a, b) => a + (typeof b === 'number' ? b : 0),
                        0
                      ),
                      completedCount: savedProgress.solvedQuestIds.length,
                    }
                  : undefined
              }
              onResumeGame={handleResumeGame}
              initialClassCode={initialClassCode}
            />
          </div>
        )}

        {/* 2D CONTROLLABLE RPG WORLD EXPLORATION (Playing Mode) */}
        {gameState === 'playing' && (
          <RpgWorld
            playerProfile={playerProfile}
            fam={currentFamInfo}
            language={language}
            currentSectorId={currentSectorId}
            onSelectSector={(secId) => setCurrentSectorId(secId)}
            quests={quests}
            solvedQuestIds={solvedQuestIds}
            questStars={questStars}
            totalStars={totalStars}
            activeQuestId={activeQuestId}
            onOpenQuest={(qId) => setActiveModalQuestId(qId)}
            hints={hints}
            onUseHint={handleUseHint}
            elapsedTimeFormatted={formatTime(elapsedTimeMs)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenRules={() => setShowRules(true)}
            onOpenSettings={() => setShowSettings(true)}
            score={currentScore}
            classCode={playerProfile.classCode}
            isClassConnected={isClassConnected}
          />
        )}

        {/* ========================================================= */}
        {/* MODALS */}
        {/* ========================================================= */}

        {/* Quest Solving Encounter Modal */}
        <AnimatePresence>
          {activeQuestData && (
            <QuestModal
              quest={activeQuestData}
              onClose={() => setActiveModalQuestId(null)}
              onSolve={handleQuestSolved}
              language={language}
              fam={currentFamInfo}
              hints={hints}
              onUseHint={handleUseHint}
              totalQuestsCount={quests.length}
              isAlreadySolved={solvedQuestIds.includes(activeQuestData.id)}
              previousStars={questStars[activeQuestData.id] || 0}
              onWrongAnswer={handleWrongAnswer}
            />
          )}
        </AnimatePresence>

        {/* Leaderboard Modal (Supports Our Class & Hall of Fame) */}
        <AnimatePresence>
          {showLeaderboard && (
            <LeaderboardModal
              entries={leaderboard}
              onClose={() => setShowLeaderboard(false)}
              onClearLeaderboard={handleClearLeaderboard}
              language={language}
              classCode={playerProfile.classCode}
              currentStudentName={playerProfile.name}
            />
          )}
        </AnimatePresence>

        {/* Rules & Guide Modal */}
        <AnimatePresence>
          {showRules && (
            <RulesModal
              onClose={() => setShowRules(false)}
              language={language}
            />
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <SettingsModal
              onClose={() => setShowSettings(false)}
              language={language}
              onLanguageChange={(lang) => {
                setLanguage(lang);
                setPlayerProfile((prev) => ({ ...prev, language: lang }));
              }}
              isMuted={isMuted}
              onToggleMute={handleToggleSound}
              selectedFam={playerProfile.fam}
              onFamChange={handleSwitchFam}
              onResetGame={() => {
                if (gameState === 'playing') saveResultToClass(false);
                setGameState('start');
              }}
              onReshuffleQuests={() => {
                setQuests(getRandomizedQuests());
                setSolvedQuestIds([]);
              }}
              isAdminMode={isAdminMode}
              onOpenAdminLogin={() => setShowAdminLogin(true)}
              onOpenParentReport={() => setShowParentReport(true)}
              onLogoutAdmin={() => setIsAdminMode(false)}
            />
          )}
        </AnimatePresence>

        {/* Admin Login Modal (Secure Teacher / Guardian Gate) */}
        <AnimatePresence>
          {showAdminLogin && (
            <AdminLoginModal
              onClose={() => setShowAdminLogin(false)}
              onLoginSuccess={() => {
                setIsAdminMode(true);
                setShowAdminLogin(false);
                setShowParentReport(true);
              }}
            />
          )}
        </AnimatePresence>

        {/* Credits Modal */}
        <AnimatePresence>
          {showCredits && (
            <CreditsModal
              onClose={() => setShowCredits(false)}
              language={language}
            />
          )}
        </AnimatePresence>

        {/* Parent & Teacher Report Modal (Admin Mode Only) */}
        <AnimatePresence>
          {showParentReport && (
            <ParentReportModal
              onClose={() => setShowParentReport(false)}
              onLogoutAdmin={() => {
                setIsAdminMode(false);
                setShowParentReport(false);
              }}
              language={language}
              playerName={playerProfile.name}
              quests={quests}
              solvedQuestIds={solvedQuestIds}
              questStars={questStars}
              totalHintsUsed={totalHintsUsed}
              elapsedTimeFormatted={formatTime(elapsedTimeMs)}
              verseReviewHistory={verseReviewHistory}
              onResetProgress={handleResetProgressData}
            />
          )}
        </AnimatePresence>

        {/* Grand Escape Victory Celebration & Certificate Modal */}
        <AnimatePresence>
          {gameState === 'completed' && (
            <CertificateModal
              playerName={playerProfile.name}
              fam={currentFamInfo}
              language={language}
              finalTimeFormatted={formatTime(elapsedTimeMs)}
              totalHintsUsed={totalHintsUsed}
              onPlayAgain={() => {
                setGameState('start');
              }}
              onViewLeaderboard={() => {
                setShowLeaderboard(true);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
