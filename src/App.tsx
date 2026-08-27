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
  VerseQuest 
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
import { BgmPlayer } from './components/BgmPlayer';
import { sounds } from './utils/audio';
import { AnimatePresence } from 'motion/react';

const STORAGE_KEY_LEADERBOARD = 'VOYAGE_OF_FAITH_LEADERBOARD_V1';

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'completed'>('start');
  const [language, setLanguage] = useState<Language>('ko');
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>({
    name: '다윗',
    fam: 'agape',
    language: 'ko',
  });

  // Dynamic Randomized Quests State (Shuffled on every new game/session)
  const [quests, setQuests] = useState<VerseQuest[]>(() => getRandomizedQuests());

  // Gameplay state
  const [solvedQuestIds, setSolvedQuestIds] = useState<number[]>([]);
  const [activeModalQuestId, setActiveModalQuestId] = useState<number | null>(null);
  const [currentSectorId, setCurrentSectorId] = useState<number>(1);
  const [hints, setHints] = useState<{ magnifier: number; hourglass: number; whisper: number }>({
    magnifier: 5,
    hourglass: 5,
    whisper: 5,
  });
  const [totalHintsUsed, setTotalHintsUsed] = useState<number>(0);

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCredits, setShowCredits] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Time Attack Timer (ms)
  const [elapsedTimeMs, setElapsedTimeMs] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

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

  // Timer Tick
  useEffect(() => {
    if (gameState === 'playing') {
      startTimeRef.current = Date.now() - elapsedTimeMs;
      timerRef.current = window.setInterval(() => {
        setElapsedTimeMs(Date.now() - startTimeRef.current);
      }, 30);
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

  // Start Game Handler (Fresh Randomization)
  const handleStartGame = (profile: PlayerProfile) => {
    setQuests(getRandomizedQuests());
    setPlayerProfile(profile);
    setLanguage(profile.language);
    setSolvedQuestIds([]);
    setElapsedTimeMs(0);
    setTotalHintsUsed(0);
    setHints({ magnifier: 5, hourglass: 5, whisper: 5 });
    setCurrentSectorId(1);
    setActiveModalQuestId(null);
    setGameState('playing');
  };

  // Switch Mascot Handler
  const handleSwitchFam = (famId: FamId) => {
    sounds.playTap();
    setPlayerProfile((prev) => ({ ...prev, fam: famId }));
  };

  // Quest Solved Handler
  const handleQuestSolved = (questId: number) => {
    setSolvedQuestIds((prev) => {
      const next = prev.includes(questId) ? prev : [...prev, questId];
      if (next.length === quests.length) {
        handleFinalEscape();
      }
      return next;
    });

    setActiveModalQuestId(null);
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

  // Sound Toggle
  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const activeQuestData = quests.find((q) => q.id === activeModalQuestId);

  return (
    <div className="h-[100dvh] w-screen max-h-[100dvh] bg-[#060b13] text-slate-100 flex flex-col items-center justify-center p-1 sm:p-2 select-none font-sans overflow-hidden">
      
      {/* Global Background Music Component (YouTube ID: g0MXF-y3xos) */}
      <div className="fixed top-2 right-2 z-40">
        <BgmPlayer
          videoId="g0MXF-y3xos"
          isMuted={isMuted}
          onToggleMute={handleToggleSound}
        />
      </div>

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
            activeQuestId={activeQuestId}
            onOpenQuest={(qId) => setActiveModalQuestId(qId)}
            hints={hints}
            onUseHint={handleUseHint}
            elapsedTimeFormatted={formatTime(elapsedTimeMs)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenRules={() => setShowRules(true)}
            onOpenSettings={() => setShowSettings(true)}
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
            />
          )}
        </AnimatePresence>

        {/* Leaderboard Modal */}
        <AnimatePresence>
          {showLeaderboard && (
            <LeaderboardModal
              entries={leaderboard}
              onClose={() => setShowLeaderboard(false)}
              onClearLeaderboard={handleClearLeaderboard}
              language={language}
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
                setGameState('start');
              }}
              onReshuffleQuests={() => {
                setQuests(getRandomizedQuests());
                setSolvedQuestIds([]);
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

