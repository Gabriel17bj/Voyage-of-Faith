import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlayerProfile, PlayerProgress } from './types';
import { StageId, TOTAL_VERSES, VERSES, nextVerse, versesOfStage } from './data/verses';
import { calculateScore } from './utils/score';
import { sounds } from './utils/audio';
import { clearSavedProgress, loadSavedProgress, saveSavedProgress } from './utils/storage';
import {
  joinClassroom,
  updateStudentProgress,
  sendHeartbeat,
  markStudentOffline,
  recordGameResult,
  getHeartbeatIntervalMs,
  getResolvedSyncMode,
} from './utils/cloud';
import { HomePage } from './components/student/HomePage';
import { HowToPage } from './components/student/HowToPage';
import { MapPage } from './components/student/MapPage';
import { VersePage } from './components/student/VersePage';
import { StageClearPage } from './components/student/StageClearPage';
import { DonePage } from './components/student/DonePage';
import { TeacherDashboard } from './components/TeacherDashboard';

type Page =
  | { name: 'home' }
  | { name: 'howto' }
  | { name: 'map' }
  | { name: 'verse'; id: number }
  | { name: 'stageClear'; stage: StageId }
  | { name: 'done' };

const PLAYING_PAGES: Page['name'][] = ['map', 'verse', 'stageClear'];

/** 모든 말씀을 푼 단계 목록 */
function clearedStages(solved: Record<number, number>): Set<number> {
  const set = new Set<number>();
  for (let s = 1; s <= 5; s++) {
    if (versesOfStage(s as StageId).every((v) => solved[v.id])) set.add(s);
  }
  return set;
}

/** 링크의 ?code=ABCDE 읽기 */
function readCodeFromUrl(): string {
  try {
    const p = new URLSearchParams(window.location.search);
    const c = p.get('code') || p.get('class') || '';
    return c.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  } catch {
    return '';
  }
}

export default function App() {
  const [isTeacher, setIsTeacher] = useState(() => window.location.hash.startsWith('#/teacher'));
  useEffect(() => {
    const onHash = () => setIsTeacher(window.location.hash.startsWith('#/teacher'));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (isTeacher) return <TeacherDashboard />;
  return <StudentApp />;
}

function StudentApp() {
  const initialCode = useMemo(readCodeFromUrl, []);
  const [page, setPage] = useState<Page>({ name: 'home' });
  const [saved, setSaved] = useState<PlayerProgress | null>(() => loadSavedProgress());

  // 진행 상황
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [solved, setSolved] = useState<Record<number, number>>({});
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongByVerse, setWrongByVerse] = useState<Record<string, number>>({});
  const startedAtRef = useRef<number>(Date.now());

  // 수업 연결
  const [classConnected, setClassConnected] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [muted, setMuted] = useState(() => sounds.getMuted());

  // ── 걸린 시간: 문제를 푸는 화면이 보이는 동안만 잼 ──
  const elapsedAccRef = useRef(0);
  const runningSinceRef = useRef<number | null>(null);
  const getElapsed = useCallback(
    () => elapsedAccRef.current + (runningSinceRef.current ? Date.now() - runningSinceRef.current : 0),
    []
  );
  const isPlaying = PLAYING_PAGES.includes(page.name);
  useEffect(() => {
    const update = () => {
      const shouldRun = isPlaying && document.visibilityState === 'visible';
      if (shouldRun && runningSinceRef.current === null) runningSinceRef.current = Date.now();
      if (!shouldRun && runningSinceRef.current !== null) {
        elapsedAccRef.current += Date.now() - runningSinceRef.current;
        runningSinceRef.current = null;
      }
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [isPlaying]);

  const solvedCount = Object.keys(solved).length;
  const totalStars = Object.values(solved).reduce<number>((a, b) => a + Number(b || 0), 0);
  const isCompleted = solvedCount >= TOTAL_VERSES;
  const score = calculateScore({
    solvedCount,
    totalStars,
    hintsUsed,
    wrongAnswersCount: wrongCount,
    elapsedTimeMs: isCompleted ? getElapsed() : 0,
    isCompleted,
  });

  // ── 이 기기에 저장 (이어하기) ──
  useEffect(() => {
    if (!profile) return;
    const progress: PlayerProgress = {
      profile,
      solved,
      hintsUsed,
      wrongCount,
      wrongByVerse,
      elapsedMs: getElapsed(),
      startedAt: startedAtRef.current,
      updatedAt: Date.now(),
    };
    saveSavedProgress(progress);
    setSaved(progress);
  }, [profile, solved, hintsUsed, wrongCount, wrongByVerse, page]);

  // ── 선생님 화면으로 진행 상황 보내기 ──
  const classCode = profile?.classCode;
  const currentVerseId = page.name === 'verse' ? page.id : null;
  useEffect(() => {
    if (!classCode || !classConnected) return;
    const timer = setTimeout(
      () => {
        updateStudentProgress(classCode, {
          score,
          solvedCount,
          solvedQuestIds: Object.keys(solved).map(Number),
          totalStars,
          hintsUsed,
          wrongAnswersCount: wrongCount,
          wrongQuestCounts: wrongByVerse,
          currentQuestId: currentVerseId,
          elapsedTimeMs: getElapsed(),
          isCompleted,
          completedAt: isCompleted ? Date.now() : undefined,
        });
      },
      getResolvedSyncMode() === 'gas' ? 1500 : 400
    );
    return () => clearTimeout(timer);
  }, [classCode, classConnected, solved, hintsUsed, wrongCount, currentVerseId]);

  // ── 접속 신호 + 앱을 닫으면 '오프라인' ──
  useEffect(() => {
    if (!classCode || !classConnected || !isPlaying) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') sendHeartbeat(classCode);
    }, getHeartbeatIntervalMs());
    const onVisibility = () => (document.visibilityState === 'visible' ? sendHeartbeat(classCode) : markStudentOffline(classCode));
    const onPageHide = () => markStudentOffline(classCode);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [classCode, classConnected, isPlaying]);

  // ── 게임 기록 (완주 / 중도 종료) ──
  const lastRecordedRef = useRef<number>(-1);
  const recordResult = (completed: boolean) => {
    if (!profile?.classCode || !classConnected) return;
    if (solvedCount === 0 || lastRecordedRef.current === solvedCount) return;
    lastRecordedRef.current = solvedCount;
    recordGameResult(profile.classCode, {
      studentName: profile.name,
      famId: profile.fam,
      score,
      solvedCount,
      totalStars,
      hintsUsed,
      wrongAnswersCount: wrongCount,
      elapsedTimeMs: getElapsed(),
      isCompleted: completed,
      reason: completed ? 'completed' : 'quit',
      startedAt: startedAtRef.current,
    });
  };
  useEffect(() => {
    if (isCompleted) recordResult(true);
  }, [isCompleted]);

  // ── 시작 / 이어하기 ──
  const resetProgress = (p: PlayerProfile) => {
    setProfile(p);
    setSolved({});
    setHintsUsed(0);
    setWrongCount(0);
    setWrongByVerse({});
    elapsedAccRef.current = 0;
    runningSinceRef.current = null;
    startedAtRef.current = Date.now();
    lastRecordedRef.current = -1;
    celebratedRef.current = new Set();
  };

  const confirmOverwrite = () => {
    if (!saved || Object.keys(saved.solved).length === 0) return true;
    return window.confirm(`이 기기에 저장된 ${saved.profile.name}의 기록(${Object.keys(saved.solved).length}개)이 지워져요. 새로 시작할까요?`);
  };

  const connect = async (p: PlayerProfile): Promise<boolean> => {
    if (!p.classCode) return false;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await joinClassroom(p.classCode, p, 0);
      if (!res.success) setJoinError(res.error || '수업에 연결하지 못했어요.');
      setClassConnected(res.success);
      return res.success;
    } catch {
      setJoinError('수업에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.');
      setClassConnected(false);
      return false;
    } finally {
      setJoining(false);
    }
  };

  const handleStart = async (name: string, code: string) => {
    if (!confirmOverwrite()) return;
    const p: PlayerProfile = { name, classCode: code, fam: 'agape' };
    if (await connect(p)) {
      clearSavedProgress();
      resetProgress(p);
      setPage({ name: 'map' });
    }
  };

  const handlePractice = (name: string) => {
    if (!confirmOverwrite()) return;
    clearSavedProgress();
    setJoinError(null);
    setClassConnected(false);
    resetProgress({ name, fam: 'agape' });
    setPage({ name: 'map' });
  };

  const handleResume = async () => {
    if (!saved) return;
    setProfile(saved.profile);
    setSolved(saved.solved);
    setHintsUsed(saved.hintsUsed);
    setWrongCount(saved.wrongCount);
    setWrongByVerse(saved.wrongByVerse || {});
    elapsedAccRef.current = saved.elapsedMs;
    runningSinceRef.current = null;
    startedAtRef.current = saved.startedAt || Date.now();
    lastRecordedRef.current = -1;
    celebratedRef.current = clearedStages(saved.solved);
    setClassConnected(false);
    if (saved.profile.classCode) await connect(saved.profile);
    setPage({ name: 'map' });
  };

  const handleQuit = () => {
    recordResult(isCompleted);
    setPage({ name: 'home' });
  };

  // ── 말씀 풀이 ──
  /** 이미 축하 화면을 보여 준 단계 */
  const celebratedRef = useRef<Set<number>>(new Set());
  const openVerse = (id: number) => setPage({ name: 'verse', id });

  const onSolved = (id: number, stars: number) => {
    setSolved((prev) => ({ ...prev, [id]: Math.max(prev[id] || 0, stars) }));
  };

  const onWrong = (id: number) => {
    setWrongCount((n) => n + 1);
    setWrongByVerse((prev) => ({ ...prev, [id]: (prev[String(id)] || 0) + 1 }));
  };

  const goNext = () => {
    const next = nextVerse(solved);
    if (!next) return setPage({ name: 'done' });
    // 방금 한 단계를 모두 마쳤으면 축하 화면
    const newlyCleared = [...clearedStages(solved)].find((s) => !celebratedRef.current.has(s));
    if (newlyCleared) {
      celebratedRef.current.add(newlyCleared);
      return setPage({ name: 'stageClear', stage: newlyCleared as StageId });
    }
    openVerse(next.id);
  };

  // ── 화면 ──
  switch (page.name) {
    case 'howto':
      return <HowToPage onBack={() => setPage({ name: 'home' })} />;

    case 'map':
      return (
        <MapPage
          name={profile?.name || ''}
          classCode={profile?.classCode}
          classConnected={classConnected}
          solved={solved}
          score={score}
          muted={muted}
          onToggleMute={() => setMuted(sounds.toggleMute())}
          onOpenVerse={openVerse}
          onQuit={handleQuit}
          onReconnect={() => profile && connect(profile)}
        />
      );

    case 'verse': {
      const verse = VERSES.find((v) => v.id === page.id)!;
      const stageList = versesOfStage(verse.stage);
      return (
        <VersePage
          verse={verse}
          alreadyStars={solved[verse.id] || 0}
          stageDone={stageList.filter((v) => solved[v.id]).length}
          stageTotal={stageList.length}
          onBack={() => setPage({ name: 'map' })}
          onHint={() => setHintsUsed((n) => n + 1)}
          onWrong={() => onWrong(verse.id)}
          onSolved={(stars) => onSolved(verse.id, stars)}
          onNext={goNext}
        />
      );
    }

    case 'stageClear':
      return (
        <StageClearPage
          stage={page.stage}
          solved={solved}
          onContinue={() => {
            const next = nextVerse(solved);
            if (next) openVerse(next.id);
            else setPage({ name: 'done' });
          }}
          onMap={() => setPage({ name: 'map' })}
        />
      );

    case 'done':
      return (
        <DonePage
          name={profile?.name || ''}
          score={score}
          totalStars={totalStars}
          elapsedMs={getElapsed()}
          hintsUsed={hintsUsed}
          wrongCount={wrongCount}
          classCode={classConnected ? classCode : undefined}
          onHome={() => setPage({ name: 'home' })}
          onReview={() => setPage({ name: 'map' })}
        />
      );

    default:
      return (
        <HomePage
          initialCode={initialCode}
          saved={saved}
          joining={joining}
          joinError={joinError}
          onStart={handleStart}
          onResume={handleResume}
          onPractice={handlePractice}
          onHowTo={() => setPage({ name: 'howto' })}
          onTeacher={() => (window.location.hash = '#/teacher')}
          onClearError={() => setJoinError(null)}
        />
      );
  }
}
