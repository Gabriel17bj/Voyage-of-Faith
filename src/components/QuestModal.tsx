import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FamInfo, Language, VerseQuest } from '../types';
import { UI_TEXT } from '../data/translations';
import { ASSET_IMAGES } from '../data/characters';
import { sounds } from '../utils/audio';
import { 
  X, CheckCircle, AlertCircle, Sparkles, HelpCircle, 
  RotateCcw, Search, Hourglass, MessageSquare,
  Key, Star, BookOpen, Wand2, PenTool, PlayCircle, PauseCircle,
  Flame, Award, Compass, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestModalProps {
  quest: VerseQuest;
  onClose: () => void;
  onSolve: (questId: number, starsEarned: 1 | 2 | 3) => void;
  language: Language;
  fam: FamInfo;
  hints: {
    magnifier: number;
    hourglass: number;
    whisper: number;
  };
  onUseHint: (type: 'magnifier' | 'hourglass' | 'whisper') => void;
  totalQuestsCount: number;
  isAlreadySolved?: boolean;
  previousStars?: number;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  quest,
  onClose,
  onSolve,
  language,
  fam,
  hints,
  onUseHint,
  totalQuestsCount,
  isAlreadySolved = false,
  previousStars = 0,
}) => {
  const t = UI_TEXT[language];

  // Hint counter for star rating calculation
  const [questHintsUsed, setQuestHintsUsed] = useState<number>(0);

  // Level 1: Single Blank state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  // Level 2: Word Order state
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);

  // Level 3: Multi Blank state
  const [multiSlots, setMultiSlots] = useState<{ [index: number]: string }>({});
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  // Level 4 & Final: Typing state
  const [typedText, setTypedText] = useState<string>('');

  // General feedback state
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'hint' | 'success'; text: string } | null>(null);
  const [isSolvedAnim, setIsSolvedAnim] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<1 | 2 | 3>(3);
  const [showWhisperBubble, setShowWhisperBubble] = useState<boolean>(false);

  // Initialize quest states
  useEffect(() => {
    setStatusMessage(null);
    setIsSolvedAnim(false);
    setShowWhisperBubble(false);
    setEliminatedOptions([]);
    setQuestHintsUsed(0);

    if (quest.level === 1 || quest.singleBlank) {
      setSelectedOption(null);
      if (quest.singleBlank) {
        const originalOpts = [...quest.singleBlank.options[language]];
        const shuffled = [...originalOpts].sort(() => Math.random() - 0.5);
        setShuffledOptions(shuffled);
      }
    }
    
    if (quest.level === 2 || quest.orderTokens) {
      if (quest.orderTokens) {
        const originalTokens = [...quest.orderTokens[language]];
        const shuffled = [...originalTokens].sort(() => Math.random() - 0.5);
        if (shuffled.join(' ') === originalTokens.join(' ') && shuffled.length > 2) {
          shuffled.reverse();
        }
        setAvailableTokens(shuffled);
        setSelectedTokens([]);
      }
    } else if (quest.level === 3 && quest.multiBlank) {
      const answers = quest.multiBlank.answers[language];
      const initialSlots: { [index: number]: string } = {};
      answers.forEach((_, idx) => {
        initialSlots[idx] = '';
      });
      setMultiSlots(initialSlots);
      setActiveSlotIndex(0);
    } else if (quest.level === 4 || quest.level === 5) {
      setTypedText('');
    }
  }, [quest, language]);

  // Clean normalizer for typing and matching
  const normalize = (str: string) => {
    return str
      .replace(/[.,·!?:;'"~()[\]\s]/g, '')
      .toLowerCase();
  };

  // Level 2 Word Order Token Handlers
  const handleSelectToken = (token: string, index: number) => {
    sounds.playChip();
    setSelectedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((_, i) => i !== index));
    setStatusMessage(null);
  };

  const handleReturnToken = (token: string, index: number) => {
    sounds.playTap();
    setSelectedTokens((prev) => prev.filter((_, i) => i !== index));
    setAvailableTokens((prev) => [...prev, token]);
    setStatusMessage(null);
  };

  const handleResetTokens = () => {
    sounds.playTap();
    if (quest.orderTokens) {
      const originalTokens = [...quest.orderTokens[language]];
      setAvailableTokens(originalTokens.sort(() => Math.random() - 0.5));
      setSelectedTokens([]);
      setStatusMessage(null);
    }
  };

  // Level 3 Slot Handler & Reset
  const handleResetMultiSlots = () => {
    sounds.playTap();
    if (!quest.multiBlank) return;
    const initialSlots: { [index: number]: string } = {};
    quest.multiBlank.answers[language].forEach((_, idx) => {
      initialSlots[idx] = '';
    });
    setMultiSlots(initialSlots);
    setStatusMessage(null);
  };

  // Verification Logic with Child-Friendly Positive Feedback
  const handleVerify = () => {
    let isCorrect = false;

    if ((quest.level === 1 || quest.singleBlank) && quest.singleBlank) {
      if (selectedOption === quest.singleBlank.answer[language]) {
        isCorrect = true;
      }
    } else if ((quest.level === 2 || quest.orderTokens) && quest.orderTokens) {
      const targetStr = quest.orderTokens[language].join(' ');
      const userStr = selectedTokens.join(' ');
      if (normalize(userStr) === normalize(targetStr)) {
        isCorrect = true;
      }
    } else if (quest.level === 3 && quest.multiBlank) {
      const answers = quest.multiBlank.answers[language];
      const allCorrect = answers.every((ans, idx) => {
        const userWord = (multiSlots[idx] || '').trim();
        return normalize(userWord) === normalize(ans);
      });
      if (allCorrect) {
        isCorrect = true;
      }
    } else if ((quest.level === 4 || quest.level === 5) && quest.typingTarget) {
      const targetStr = quest.typingTarget[language];
      if (normalize(typedText) === normalize(targetStr)) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      sounds.playCorrect();
      setIsSolvedAnim(true);

      // Calculate Stars: 0 hints = 3 stars, 1 hint = 2 stars, 2+ hints = 1 star
      let stars: 1 | 2 | 3 = 3;
      if (questHintsUsed === 1) stars = 2;
      if (questHintsUsed >= 2) stars = 1;
      setEarnedStars(stars);

      const starFeedback = stars === 3
        ? '🌟 대단해요! 힌트 없이 완벽하게 성공했어요! (⭐⭐⭐)'
        : stars === 2
        ? '✨ 멋져요! 믿음으로 항해를 완수했어요! (⭐⭐)'
        : '🎉 끝까지 포기하지 않고 말씀을 마음에 새겼어요! (⭐)';

      setStatusMessage({ type: 'success', text: starFeedback });
      setTimeout(() => {
        onSolve(quest.id, stars);
      }, 1300);
    } else {
      sounds.playWrong();
      // Friendly, encouraging failure feedback (No negative punishment)
      const friendlyTips = [
        '괜찮아요! 힌트 도구를 사용하거나 다시 시도해 보세요 ⛵',
        '거의 다 왔어요! 알맞은 단어 카드를 다시 골라볼까요? ✨',
        '힌트를 사용해도 항해는 멋지게 계속할 수 있어요 🕊️',
      ];
      const randomTip = friendlyTips[Math.floor(Math.random() * friendlyTips.length)];
      setStatusMessage({ type: 'error', text: randomTip });
    }
  };

  // Hint 1: Magnifier
  const handleUseMagnifier = () => {
    if (hints.magnifier <= 0) return;
    sounds.playHint();
    onUseHint('magnifier');
    setQuestHintsUsed((prev) => prev + 1);
    setStatusMessage({
      type: 'hint',
      text: `🔍 [빛의 돋보기] ${quest.hintInitial[language]}`
    });
  };

  // Hint 2: Hourglass
  const handleUseHourglass = () => {
    if (hints.hourglass <= 0) return;
    sounds.playHint();
    onUseHint('hourglass');
    setQuestHintsUsed((prev) => prev + 1);

    if ((quest.level === 1 || quest.singleBlank) && quest.singleBlank) {
      const optsPool = shuffledOptions.length > 0 ? shuffledOptions : quest.singleBlank.options[language];
      const wrong = optsPool.filter((opt) => opt !== quest.singleBlank?.answer[language]);
      const toEliminate = wrong.slice(0, 2);
      setEliminatedOptions(toEliminate);
      setStatusMessage({ type: 'hint', text: `⏳ [진리의 모래시계] 오답 2개를 지워드렸어요! 이제 선택해 보세요.` });
    } else if ((quest.level === 2 || quest.orderTokens) && quest.orderTokens) {
      const correctTokens = quest.orderTokens[language];
      const nextIndex = selectedTokens.length;
      if (nextIndex < correctTokens.length) {
        const nextCorrectToken = correctTokens[nextIndex];
        const availIdx = availableTokens.findIndex((t) => t === nextCorrectToken);
        if (availIdx !== -1) {
          handleSelectToken(nextCorrectToken, availIdx);
        }
      }
      setStatusMessage({ type: 'hint', text: `⏳ [진리의 모래시계] 다음 단어를 올바르게 놓아드렸어요!` });
    } else if (quest.level === 3 && quest.multiBlank) {
      const answers = quest.multiBlank.answers[language];
      let targetIdx = -1;
      for (let i = 0; i < answers.length; i++) {
        if (normalize(multiSlots[i] || '') !== normalize(answers[i])) {
          targetIdx = i;
          break;
        }
      }
      if (targetIdx !== -1) {
        const correctWord = answers[targetIdx];
        setMultiSlots((prev) => ({ ...prev, [targetIdx]: correctWord }));
        setStatusMessage({ type: 'hint', text: `⏳ [진리의 모래시계] 빈칸 ${targetIdx + 1}에 [${correctWord}]을(를) 채웠어요!` });
      }
    } else if ((quest.level === 4 || quest.level === 5) && quest.typingTarget) {
      const target = quest.typingTarget[language];
      const currentLen = typedText.length;
      const nextChunk = target.slice(0, Math.min(target.length, currentLen + 14));
      setTypedText(nextChunk);
      setStatusMessage({ type: 'hint', text: `⏳ [진리의 모래시계] 다음 구절을 보조 입력해드렸어요!` });
    }
  };

  // Hint 3: Fam Whisper
  const handleUseWhisper = () => {
    if (hints.whisper <= 0) return;
    sounds.playHint();
    onUseHint('whisper');
    setQuestHintsUsed((prev) => prev + 1);
    setShowWhisperBubble(true);
    setStatusMessage({
      type: 'hint',
      text: `🕊️ [${fam.name[language]}의 속삭임] ${quest.hintWhisper[language]}`
    });
  };

  const handleQuickWordAdd = (word: string) => {
    sounds.playChip();
    setTypedText((prev) => (prev ? `${prev.trim()} ${word}` : word));
  };

  const typingSuggestionWords = useMemo(() => {
    if (quest.level !== 4 && quest.level !== 5) return [];
    const target = quest.text[language];
    return target.split(/\s+/).slice(0, 10);
  }, [quest, language]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-[#040914]/90 backdrop-blur-sm select-none overflow-hidden touch-manipulation">
      
      {/* Background Sea Texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={ASSET_IMAGES.seaBackground}
          alt="Sea"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-30 filter brightness-90 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040914]/80 via-[#07172b]/60 to-[#040a14]/90" />
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-lg md:max-w-2xl bg-[#091526] rounded-3xl border-2 sm:border-4 border-[#b47a3e] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-slate-100 max-h-[96dvh]"
      >
        {/* ========================================================= */}
        {/* 1. COMPACT HEADER (Under 56px, Thumb-friendly) */}
        {/* ========================================================= */}
        <div className="relative z-10 bg-[#050f1d] px-4 py-2.5 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-amber-300 font-black text-xs sm:text-sm tracking-wide shrink-0">
              {quest.level === 5 ? '👑 최종 관문' : `항로 ${quest.level}단계`}
            </span>
            <span className="text-[11px] sm:text-xs text-sky-300 bg-sky-950 px-2 py-0.5 rounded-lg border border-sky-600/50 font-bold truncate">
              {quest.reference[language]}
            </span>
            {isAlreadySolved && (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                복습 항해
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-300 font-mono font-bold bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
              #{quest.id.toString().padStart(2, '0')} / {totalQuestsCount}
            </span>
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700 active:scale-95 cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MAIN SCROLLABLE CONTENT BODY */}
        {/* ========================================================= */}
        <div className="relative z-10 p-3.5 sm:p-5 flex flex-col gap-3 overflow-y-auto max-h-[calc(96dvh-130px)]">
          
          {/* Objective & Mascot Dialogue Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-sky-950/80 p-3.5 border border-sky-600/30 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl shrink-0 shadow">
              {fam.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-amber-300 font-bold">
                {fam.name[language]}의 항해 안내
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-100">
                {quest.level === 1 && '빈칸에 알맞은 단어 카드를 골라보세요!'}
                {quest.level === 2 && '단어 카드를 순서대로 탭하여 문장을 완성하세요!'}
                {quest.level === 3 && '핵심 단어 빈칸을 채워 말씀을 완성해 보세요!'}
                {quest.level >= 4 && '말씀을 소리 내어 읽으며 암송을 완성해 보세요!'}
              </p>
            </div>
          </div>

          {/* ================= LEVEL 1: Single Blank Multiple Choice ================= */}
          {(quest.level === 1 || quest.singleBlank) && quest.singleBlank && (
            <div className="flex flex-col gap-3">
              {/* Verse Display with Blank Box */}
              <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-700 w-full shadow-inner">
                <p className="text-base sm:text-lg font-bold leading-relaxed text-slate-100 text-center break-keep">
                  {quest.singleBlank.maskedText[language].split('[ ??? ]').map((part, idx, arr) => (
                    <React.Fragment key={idx}>
                      "{part}
                      {idx < arr.length - 1 && (
                        <span className="inline-block min-w-[80px] px-3 py-1 bg-slate-950 border-2 border-amber-400 rounded-xl mx-1.5 align-middle font-black text-amber-300 text-base sm:text-lg shadow">
                          {selectedOption || ' ? '}
                        </span>
                      )}
                      "
                    </React.Fragment>
                  ))}
                </p>
              </div>

              {/* Bento Option Buttons (Minimum 48px height touch target) */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                {(shuffledOptions.length > 0 ? shuffledOptions : quest.singleBlank.options[language]).map((option) => {
                  const isSelected = selectedOption === option;
                  const isEliminated = eliminatedOptions.includes(option);

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={isEliminated}
                      onClick={() => {
                        sounds.playChip();
                        setSelectedOption(option);
                        setStatusMessage(null);
                      }}
                      className={`min-h-[48px] py-3 px-4 rounded-2xl transition-all text-sm sm:text-base font-extrabold shadow-md border flex items-center justify-center text-center cursor-pointer active:scale-95 ${
                        isEliminated
                          ? 'opacity-20 bg-slate-950 border-slate-800 text-slate-600 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-amber-500/30 font-black scale-[1.02] ring-2 ring-amber-300'
                          : 'bg-slate-800/95 border-slate-700 text-slate-100 hover:bg-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= LEVEL 2: Word Order Puzzle ================= */}
          {(quest.level === 2 || quest.orderTokens) && quest.orderTokens && (
            <div className="flex flex-col gap-3">
              {/* Target Placed Chips Box */}
              <div className="min-h-[90px] p-3 rounded-2xl bg-slate-900/90 border-2 border-dashed border-sky-500/50 flex flex-wrap gap-2 items-center content-start shadow-inner">
                {selectedTokens.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-400 w-full text-center py-4">
                    아래 단어 카드를 순서대로 탭하여 문장을 완성해 보세요.
                  </p>
                ) : (
                  selectedTokens.map((token, idx) => (
                    <motion.button
                      key={`sel-${token}-${idx}`}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleReturnToken(token, idx)}
                      className="min-h-[44px] px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs sm:text-sm rounded-xl shadow border border-sky-400 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{token}</span>
                      <span className="text-[11px] bg-sky-800/80 px-1 rounded-full">✕</span>
                    </motion.button>
                  ))
                )}
              </div>

              {/* Action Controls for Level 2 */}
              <div className="flex justify-between items-center px-1">
                <span className="text-xs text-slate-400 font-medium">탭하여 단어를 넣고 뺄 수 있어요</span>
                <button
                  type="button"
                  onClick={handleResetTokens}
                  className="min-h-[38px] px-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-bold border border-slate-700 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다시 놓기</span>
                </button>
              </div>

              {/* Source Available Word Chips */}
              <div className="flex flex-wrap justify-center gap-2 p-3 bg-slate-900/90 rounded-2xl border border-slate-800">
                {availableTokens.map((token, idx) => (
                  <motion.button
                    key={`avail-${token}-${idx}`}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleSelectToken(token, idx)}
                    className="min-h-[44px] px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs sm:text-sm rounded-xl border border-slate-600 shadow transition cursor-pointer active:bg-sky-900"
                  >
                    {token}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* ================= LEVEL 3: Multi Blank Direct Typing ================= */}
          {quest.level === 3 && quest.multiBlank && (
            <div className="flex flex-col gap-3">
              {/* Scripture Template Preview with Highlighted Slots */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-inner">
                <p className="text-sm sm:text-base leading-relaxed text-slate-100 break-keep">
                  {(() => {
                    const template = quest.multiBlank.template[language];
                    const parts = template.split(/(\[ __\d+__ \])/g);
                    let slotCounter = 0;

                    return parts.map((part, idx) => {
                      const match = part.match(/\[ __(\d+)__ \]/);
                      if (match) {
                        const slotIdx = slotCounter++;
                        const userWord = multiSlots[slotIdx];

                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2.5 py-1 mx-1 rounded-xl text-xs sm:text-sm font-black border transition-colors ${
                              userWord
                                ? 'bg-amber-400/20 text-amber-300 border-amber-400'
                                : 'bg-slate-950 text-slate-400 border-dashed border-amber-500/60'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black mr-1">
                              {slotIdx + 1}
                            </span>
                            <span>{userWord || `빈칸 ${slotIdx + 1}`}</span>
                          </span>
                        );
                      }
                      return <span key={idx}>{part}</span>;
                    });
                  })()}
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-amber-400" />
                  <span>빈칸에 들어갈 핵심 단어를 입력해 보세요 ({quest.multiBlank.answers[language].length}개)</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetMultiSlots}
                  className="min-h-[36px] px-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-bold border border-slate-700 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>비우기</span>
                </button>
              </div>

              {/* Direct Input Fields for Each Blank (Touch-friendly 44px+) */}
              <div className={`grid gap-2.5 w-full ${quest.multiBlank.answers[language].length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {quest.multiBlank.answers[language].map((_, idx) => (
                  <div key={idx} className="flex flex-col gap-1 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-700">
                    <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </span>
                      <span>빈칸 {idx + 1} 단어</span>
                    </label>
                    <input
                      type="text"
                      value={multiSlots[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMultiSlots((prev) => ({ ...prev, [idx]: val }));
                        setStatusMessage(null);
                      }}
                      placeholder="단어 입력..."
                      className="min-h-[44px] w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm font-extrabold focus:border-amber-400 focus:ring-1 focus:ring-amber-400 placeholder:text-slate-600 focus:outline-none transition"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= LEVEL 4 & FINAL: Sentence Typing ================= */}
          {(quest.level === 4 || quest.level === 5) && (
            <div className="flex flex-col gap-3">
              {/* Scripture Preview Reference Card */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  quest.level === 5
                    ? 'bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-amber-400 shadow-lg'
                    : 'bg-slate-900/90 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-amber-300 font-extrabold mb-1">
                  <span>{quest.reference[language]}</span>
                  {quest.level === 5 && <span className="text-amber-400">👑 GRAND ESCAPE KEY</span>}
                </div>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-semibold break-keep">
                  "{quest.text[language]}"
                </p>
              </div>

              {/* Typing Input Box (Touch-friendly, clear font) */}
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={typedText}
                  onChange={(e) => {
                    setTypedText(e.target.value);
                    setStatusMessage(null);
                  }}
                  rows={2}
                  placeholder={t.typingPlaceholder}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500 resize-none font-bold leading-relaxed"
                />

                {/* Match Accuracy Indicator & Quick Reset */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>
                    암송 일치율:{' '}
                    <strong className="text-amber-300 font-mono font-bold">
                      {Math.min(
                        100,
                        Math.round(
                          (typedText.trim().length / (quest.text[language].trim().length || 1)) * 100
                        )
                      )}
                      %
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setTypedText('');
                    }}
                    className="min-h-[36px] px-2 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    처음부터 다시 쓰기
                  </button>
                </div>
              </div>

              {/* Quick Word Assist Chips (44px touch friendly) */}
              <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 overflow-x-auto">
                <span className="text-xs text-slate-400 shrink-0 font-bold flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  단어 도우미:
                </span>
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {typingSuggestionWords.map((w, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickWordAdd(w)}
                      className="min-h-[38px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shrink-0 cursor-pointer active:scale-95"
                    >
                      +{w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback & Status Message Toast (Child Friendly) */}
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950 text-emerald-200 border-2 border-emerald-500'
                    : statusMessage.type === 'error'
                    ? 'bg-amber-950 text-amber-200 border-2 border-amber-500'
                    : 'bg-slate-800 text-sky-200 border-2 border-sky-400'
                }`}
              >
                {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
                {statusMessage.type === 'hint' && <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />}
                <span className="leading-snug break-keep">{statusMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fam Mascot Whisper Quote View */}
          {showWhisperBubble && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-slate-900 border-2 border-amber-400/60 rounded-2xl flex items-center gap-2.5 shadow-md"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-lg shrink-0">
                {fam.emoji}
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-extrabold text-amber-300">{fam.name[language]}의 가이드: </span>
                <span className="text-slate-200 font-semibold">{quest.hintWhisper[language]}</span>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 3-ITEM HINTS TOOLBELT (44px Minimum Touch Targets) */}
          {/* ========================================================= */}
          <div className="p-2 bg-[#060b13] grid grid-cols-3 gap-2 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={handleUseMagnifier}
              disabled={hints.magnifier <= 0}
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-1.5 bg-slate-800/90 rounded-xl hover:bg-slate-700 transition active:scale-95 disabled:opacity-30 cursor-pointer border border-slate-700"
            >
              <span className="text-base">🔍</span>
              <span className="text-[11px] text-slate-200 font-bold">돋보기 ({hints.magnifier})</span>
            </button>

            <button
              type="button"
              onClick={handleUseHourglass}
              disabled={hints.hourglass <= 0}
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-1.5 bg-slate-800/90 rounded-xl hover:bg-slate-700 transition active:scale-95 disabled:opacity-30 cursor-pointer border border-slate-700"
            >
              <span className="text-base">⏳</span>
              <span className="text-[11px] text-slate-200 font-bold">모래시계 ({hints.hourglass})</span>
            </button>

            <button
              type="button"
              onClick={handleUseWhisper}
              disabled={hints.whisper <= 0}
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-1.5 bg-slate-800/90 rounded-xl hover:bg-slate-700 transition active:scale-95 disabled:opacity-30 cursor-pointer border border-slate-700"
            >
              <span className="text-base">💬</span>
              <span className="text-[11px] text-slate-200 font-bold">속삭임 ({hints.whisper})</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. FIXED BOTTOM PRIMARY CTA (Safe Area Aware) */}
        {/* ========================================================= */}
        <div className="relative z-10 border-t border-slate-800 bg-[#050f1d]/95 px-4 py-3 pb-[calc(14px+env(safe-area-inset-bottom))] backdrop-blur shrink-0">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleVerify}
            disabled={isSolvedAnim}
            className={`min-h-[50px] w-full rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
              isSolvedAnim
                ? 'bg-emerald-500 text-white shadow-emerald-500/40 animate-pulse'
                : quest.level === 5
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/40'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-black shadow-sky-500/30'
            }`}
          >
            {isSolvedAnim ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>정답 확인 완료! 별 획득 중...</span>
              </>
            ) : quest.level === 5 ? (
              <>
                <Key className="w-5 h-5" />
                <span>성령의 황금문 열기 (대탈출 성공!)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>{isAlreadySolved ? '복습 항해 완료하기' : '정답 확인하고 항해 계속하기'}</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
