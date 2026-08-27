import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FamInfo, Language, VerseQuest } from '../types';
import { UI_TEXT } from '../data/translations';
import { ASSET_IMAGES } from '../data/characters';
import { sounds } from '../utils/audio';
import { 
  X, CheckCircle, AlertCircle, Sparkles, HelpCircle, 
  RotateCcw, Undo2, ArrowRight, Search, Hourglass, MessageSquare,
  Key, Shield, BookOpen, Wand2, PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestModalProps {
  quest: VerseQuest;
  onClose: () => void;
  onSolve: (questId: number) => void;
  language: Language;
  fam: FamInfo;
  hints: {
    magnifier: number;
    hourglass: number;
    whisper: number;
  };
  onUseHint: (type: 'magnifier' | 'hourglass' | 'whisper') => void;
  totalQuestsCount: number;
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
}) => {
  const t = UI_TEXT[language];

  // Level 1: Single Blank state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);

  // Level 2: Word Order state
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);

  // Level 3: Multi Blank state
  const [multiSlots, setMultiSlots] = useState<{ [index: number]: string }>({});
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [multiEliminated, setMultiEliminated] = useState<string[]>([]);

  // Level 4 & Final: Typing state
  const [typedText, setTypedText] = useState<string>('');

  // General feedback state
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'hint' | 'success'; text: string } | null>(null);
  const [isSolvedAnim, setIsSolvedAnim] = useState<boolean>(false);
  const [showWhisperBubble, setShowWhisperBubble] = useState<boolean>(false);

  // Initialize quest states
  useEffect(() => {
    setStatusMessage(null);
    setIsSolvedAnim(false);
    setShowWhisperBubble(false);
    setEliminatedOptions([]);
    setMultiEliminated([]);

    if (quest.level === 1 || quest.singleBlank) {
      setSelectedOption(null);
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

  // Clean normalizer for typing verification
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

  // Verification Logic
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
      setStatusMessage({ type: 'success', text: t.correctAnswer });
      setTimeout(() => {
        onSolve(quest.id);
      }, 1100);
    } else {
      sounds.playWrong();
      setStatusMessage({ type: 'error', text: t.wrongAnswer });
    }
  };

  // Hint 1: Magnifier
  const handleUseMagnifier = () => {
    if (hints.magnifier <= 0) return;
    sounds.playHint();
    onUseHint('magnifier');
    setStatusMessage({
      type: 'hint',
      text: `🔍 [돋보기 힌트] ${quest.hintInitial[language]}`
    });
  };

  // Hint 2: Hourglass
  const handleUseHourglass = () => {
    if (hints.hourglass <= 0) return;
    sounds.playHint();
    onUseHint('hourglass');

    if ((quest.level === 1 || quest.singleBlank) && quest.singleBlank) {
      const wrong = quest.singleBlank.options[language].filter((opt) => opt !== quest.singleBlank?.answer[language]);
      const toEliminate = wrong.slice(0, 2);
      setEliminatedOptions(toEliminate);
      setStatusMessage({ type: 'hint', text: `⏳ [모래시계] 오답 2개를 제거했습니다!` });
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
      setStatusMessage({ type: 'hint', text: `⏳ [모래시계] 다음 단어를 올바르게 배치했습니다!` });
    } else if (quest.level === 3 && quest.multiBlank) {
      const answers = quest.multiBlank.answers[language];
      // Find the first unfilled or incorrect blank index
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
        setStatusMessage({ type: 'hint', text: `⏳ [모래시계] 빈칸 ${targetIdx + 1}의 정답 [${correctWord}]을(를) 입력했습니다!` });
      } else {
        setStatusMessage({ type: 'hint', text: `⏳ [모래시계] 모든 빈칸이 올바르게 입력되어 있습니다!` });
      }
    } else if ((quest.level === 4 || quest.level === 5) && quest.typingTarget) {
      const target = quest.typingTarget[language];
      const currentLen = typedText.length;
      const nextChunk = target.slice(0, Math.min(target.length, currentLen + 12));
      setTypedText(nextChunk);
      setStatusMessage({ type: 'hint', text: `⏳ [모래시계] 다음 구절을 일부 보조 입력했습니다!` });
    }
  };

  // Hint 3: Fam Whisper
  const handleUseWhisper = () => {
    if (hints.whisper <= 0) return;
    sounds.playHint();
    onUseHint('whisper');
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-[#050e1b]/95 select-none overflow-hidden">
      
      {/* Background: Faith Voyage Sea Backdrop with 40% Opacity */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={ASSET_IMAGES.seaBackground}
          alt="Voyage of Faith Background"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-40 filter brightness-90 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050e1b]/70 via-[#07172b]/50 to-[#040a14]/85" />
      </div>

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="relative w-full max-w-2xl bg-[#091526]/95 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-[#b47a3e] shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-slate-100 max-h-[96vh]"
      >
        {/* Subtle inner sea background at 40% opacity */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl sm:rounded-3xl">
          <img
            src={ASSET_IMAGES.seaBackground}
            alt="Sea"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-40 filter brightness-70"
          />
          <div className="absolute inset-0 bg-[#091526]/80 backdrop-blur-[1px]" />
        </div>

        {/* Compact Solid Stage Header */}
        <div className="relative z-10 bg-[#050f1d]/90 px-3.5 sm:px-5 py-2 sm:py-2.5 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-amber-300 font-black text-xs sm:text-sm tracking-wide">
              {quest.level === 5 ? '👑 FINAL STAGE' : `STAGE ${quest.level}`}: {quest.objectName[language]}
            </span>
            <span className="text-[10px] sm:text-xs text-sky-300 bg-sky-950 px-2 py-0.5 rounded-md border border-sky-600/50 font-bold">
              {quest.reference[language]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-mono font-bold bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
              Verse {quest.id.toString().padStart(2, '0')} / {totalQuestsCount}
            </span>
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Quest Puzzle Body */}
        <div className="relative z-10 p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 overflow-y-auto max-h-[calc(96vh-60px)]">
          
          {/* ================= LEVEL 1: Single Blank Multiple Choice ================= */}
          {(quest.level === 1 || quest.singleBlank) && quest.singleBlank && (
            <div className="flex flex-col items-center justify-center text-center gap-2.5">
              {/* Verse Display with Blank Placeholder */}
              <div className="bg-slate-900/90 p-3 sm:p-4 rounded-xl border border-slate-700 w-full">
                <p className="text-sm sm:text-base font-medium leading-relaxed px-1 text-slate-100">
                  {quest.singleBlank.maskedText[language].split('[ ??? ]').map((part, idx, arr) => (
                    <React.Fragment key={idx}>
                      "{part}
                      {idx < arr.length - 1 && (
                        <span className="inline-block min-w-[70px] px-2.5 py-0.5 bg-slate-950 border-b-2 border-amber-400 mx-1.5 align-bottom font-bold text-amber-300 text-sm sm:text-base">
                          {selectedOption || ' ? '}
                        </span>
                      )}
                      "
                    </React.Fragment>
                  ))}
                </p>
              </div>

              {/* Bento Option Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                {quest.singleBlank.options[language].map((option) => {
                  const isSelected = selectedOption === option;
                  const isEliminated = eliminatedOptions.includes(option);

                  return (
                    <button
                      key={option}
                      disabled={isEliminated}
                      onClick={() => {
                        sounds.playChip();
                        setSelectedOption(option);
                        setStatusMessage(null);
                      }}
                      className={`py-2 px-3 rounded-xl transition-all text-xs sm:text-sm font-bold shadow border cursor-pointer ${
                        isEliminated
                          ? 'opacity-25 bg-slate-950 border-slate-800 text-slate-600 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-md font-black scale-105'
                          : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 active:scale-95'
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
            <div className="flex flex-col gap-2">
              {/* Target Placed Chips Box */}
              <div className="min-h-[70px] max-h-[110px] p-2.5 rounded-xl bg-slate-900/90 border-2 border-dashed border-blue-500/50 flex flex-wrap gap-1.5 items-center content-start overflow-y-auto">
                {selectedTokens.length === 0 ? (
                  <span className="text-xs text-slate-400 w-full text-center py-3">
                    아래 단어 칩을 순서대로 터치하여 말씀을 완성하세요
                  </span>
                ) : (
                  selectedTokens.map((token, idx) => (
                    <motion.button
                      key={`sel-${token}-${idx}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleReturnToken(token, idx)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow border border-blue-400 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{token}</span>
                      <span className="text-[10px] opacity-70">✕</span>
                    </motion.button>
                  ))
                )}
              </div>

              {/* Action Controls for Level 2 */}
              <div className="flex justify-between items-center px-1 text-[11px]">
                <span className="text-slate-400">{t.tapToReturn}</span>
                <button
                  onClick={handleResetTokens}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1 text-[10px] border border-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t.clearOrder}
                </button>
              </div>

              {/* Source Available Word Chips */}
              <div className="flex flex-wrap justify-center gap-1.5 p-2 bg-slate-900/90 rounded-xl border border-slate-800 max-h-[100px] overflow-y-auto">
                {availableTokens.map((token, idx) => (
                  <motion.button
                    key={`avail-${token}-${idx}`}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleSelectToken(token, idx)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-lg border border-slate-600 shadow transition cursor-pointer"
                  >
                    {token}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* ================= LEVEL 3: Multi Blank Direct Typing ================= */}
          {quest.level === 3 && quest.multiBlank && (
            <div className="flex flex-col gap-2.5">
              {/* Scripture Template Preview with Highlighted Slots */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 shadow-inner">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-100 break-keep">
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
                            className={`inline-flex items-center px-2 py-0.5 mx-1 rounded-md text-xs sm:text-sm font-bold border transition-colors ${
                              userWord
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                                : 'bg-slate-950 text-slate-400 border-dashed border-amber-500/50'
                            }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-black mr-1">
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
              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-amber-400" />
                  <span>각 빈칸에 들어갈 단어를 직접 입력하세요 ({quest.multiBlank.answers[language].length}개)</span>
                </span>
                <button
                  onClick={handleResetMultiSlots}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-[10px] border border-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>전체 지우기</span>
                </button>
              </div>

              {/* Direct Input Fields for Each Blank */}
              <div className={`grid gap-2 w-full ${quest.multiBlank.answers[language].length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {quest.multiBlank.answers[language].map((_, idx) => (
                  <div key={idx} className="flex flex-col gap-1 bg-slate-900/80 p-2 sm:p-2.5 rounded-xl border border-slate-700">
                    <label className="text-[11px] font-bold text-amber-200 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </span>
                      <span>빈칸 {idx + 1} 단어 입력</span>
                    </label>
                    <input
                      type="text"
                      value={multiSlots[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMultiSlots((prev) => ({ ...prev, [idx]: val }));
                        setStatusMessage(null);
                      }}
                      placeholder={`예: 단어 직접 입력...`}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm font-bold focus:border-amber-400 focus:ring-1 focus:ring-amber-400 placeholder:text-slate-600 focus:outline-none transition"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= LEVEL 4 & FINAL: Sentence Typing ================= */}
          {(quest.level === 4 || quest.level === 5) && (
            <div className="flex flex-col gap-2">
              {/* Scripture Preview Reference Card */}
              <div
                className={`p-2.5 rounded-xl border ${
                  quest.level === 5
                    ? 'bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-amber-400 shadow-md'
                    : 'bg-slate-900/90 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-0.5">
                  <span>{quest.reference[language]}</span>
                  {quest.level === 5 && <span className="text-amber-400">👑 GRAND ESCAPE KEY</span>}
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-snug font-medium break-keep">
                  "{quest.text[language]}"
                </p>
              </div>

              {/* Typing Input Box */}
              <div className="flex flex-col gap-1">
                <textarea
                  value={typedText}
                  onChange={(e) => {
                    setTypedText(e.target.value);
                    setStatusMessage(null);
                  }}
                  rows={2}
                  placeholder={t.typingPlaceholder}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500 resize-none font-medium leading-snug"
                />

                {/* Match Accuracy Indicator & Quick Reset */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>
                    일치율:{' '}
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
                    onClick={() => {
                      sounds.playTap();
                      setTypedText('');
                    }}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    초기화
                  </button>
                </div>
              </div>

              {/* Quick Word Assist Chips */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 overflow-x-auto">
                <span className="text-[9px] text-slate-400 shrink-0 font-semibold flex items-center gap-0.5">
                  <Wand2 className="w-2.5 h-2.5 text-amber-400" />
                  빠른 단어:
                </span>
                <div className="flex gap-1 overflow-x-auto py-0.5">
                  {typingSuggestionWords.map((w, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickWordAdd(w)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded border border-slate-700 font-medium shrink-0 cursor-pointer"
                    >
                      +{w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback & Status Message Toast */}
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-900/95 text-emerald-200 border border-emerald-500'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-950/95 text-rose-200 border border-rose-500'
                    : 'bg-slate-800 text-amber-200 border border-amber-500/50'
                }`}
              >
                {statusMessage.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                {statusMessage.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                {statusMessage.type === 'hint' && <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <span className="leading-tight break-keep text-[11px]">{statusMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fam Mascot Whisper Quote View */}
          {showWhisperBubble && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-2 bg-slate-900 border border-amber-400/50 rounded-xl flex items-center gap-2 shadow"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center text-base shrink-0">
                {fam.emoji}
              </div>
              <div className="text-[11px]">
                <span className="font-bold text-amber-300">{fam.name[language]}의 말씀 가이드: </span>
                <span className="text-slate-200">{quest.hintWhisper[language]}</span>
              </div>
            </motion.div>
          )}

          {/* Compact 3-Item Hints Bar */}
          <div className="p-1.5 bg-[#060b13] grid grid-cols-3 gap-2 border border-slate-800 rounded-xl">
            <button
              onClick={handleUseMagnifier}
              disabled={hints.magnifier <= 0}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800/80 rounded-lg hover:bg-slate-700 transition-colors group disabled:opacity-30 cursor-pointer"
            >
              <span className="text-sm">🔍</span>
              <span className="text-[10px] text-slate-300 font-bold">빛의 돋보기 ({hints.magnifier})</span>
            </button>

            <button
              onClick={handleUseHourglass}
              disabled={hints.hourglass <= 0}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800/80 rounded-lg hover:bg-slate-700 transition-colors group disabled:opacity-30 cursor-pointer"
            >
              <span className="text-sm">⏳</span>
              <span className="text-[10px] text-slate-300 font-bold">진리의 모래시계 ({hints.hourglass})</span>
            </button>

            <button
              onClick={handleUseWhisper}
              disabled={hints.whisper <= 0}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800/80 rounded-lg hover:bg-slate-700 transition-colors group disabled:opacity-30 cursor-pointer"
            >
              <span className="text-sm">💬</span>
              <span className="text-[10px] text-slate-300 font-bold">팜의 속삭임 ({hints.whisper})</span>
            </button>
          </div>

          {/* Footer Unlock Action Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleVerify}
            disabled={isSolvedAnim}
            className={`w-full py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isSolvedAnim
                ? 'bg-emerald-500 text-white shadow-emerald-500/40'
                : quest.level === 5
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/40'
                : 'rpg-btn-wood text-amber-200'
            }`}
          >
            {isSolvedAnim ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{t.correctAnswer}</span>
              </>
            ) : quest.level === 5 ? (
              <>
                <Key className="w-4 h-4" />
                <span>성령의 황금문 열기 (대탈출 성공!)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{t.submitAnswer}</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
