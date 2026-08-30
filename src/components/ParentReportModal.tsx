import React, { useState, useMemo } from 'react';
import { Language, VerseQuest, VerseReviewRecord } from '../types';
import { X, ShieldCheck, Award, BookOpen, Star, CheckCircle2, AlertCircle, RefreshCw, Printer } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ParentReportModalProps {
  onClose: () => void;
  language: Language;
  playerName: string;
  quests: VerseQuest[];
  solvedQuestIds: number[];
  questStars: { [questId: number]: number };
  totalHintsUsed: number;
  elapsedTimeFormatted: string;
  verseReviewHistory: { [questId: number]: VerseReviewRecord };
  onResetProgress: () => void;
}

export const ParentReportModal: React.FC<ParentReportModalProps> = ({
  onClose,
  language,
  playerName,
  quests,
  solvedQuestIds,
  questStars,
  totalHintsUsed,
  elapsedTimeFormatted,
  verseReviewHistory,
  onResetProgress,
}) => {
  // Guardian Gate (Simple math question to prevent accidental child access)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [mathAnswer, setMathAnswer] = useState<string>('');
  const [mathError, setMathError] = useState<boolean>(false);

  const num1 = 14;
  const num2 = 18;
  const expectedSum = 32;

  const handleVerifyGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(mathAnswer.trim(), 10) === expectedSum) {
      sounds.playCorrect();
      setIsUnlocked(true);
      setMathError(false);
    } else {
      sounds.playWrong();
      setMathError(true);
    }
  };

  const totalQuests = quests.length;
  const completedCount = solvedQuestIds.length;
  const completionRate = Math.round((completedCount / totalQuests) * 100);

  const starStats = useMemo(() => {
    let three = 0;
    let two = 0;
    let one = 0;
    Object.values(questStars).forEach((st) => {
      if (st === 3) three++;
      else if (st === 2) two++;
      else if (st === 1) one++;
    });
    return { three, two, one, total: three * 3 + two * 2 + one * 1 };
  }, [questStars]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 sm:border-4 border-[#b48149] rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[92dvh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-amber-300">
                보호자 · 교회학교 교사 리포트
              </h2>
              <span className="text-xs text-slate-400">
                {playerName} 대원의 성경 암송 학습 진행 현황
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer active:scale-95"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GUARDIAN GATE STEP */}
        {!isUnlocked ? (
          <form onSubmit={handleVerifyGate} className="flex flex-col items-center gap-4 py-8 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-950 text-sky-400 border border-sky-600/40 flex items-center justify-center text-xl font-bold">
              🔒
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-1">
                보호자 확인 질문
              </h3>
              <p className="text-xs text-slate-400">
                어린이 대원의 실수 진입을 방지하기 위해 간단한 확인 계산을 진행합니다.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
              <span className="font-mono font-black text-amber-300 text-base">
                {num1} + {num2} = ?
              </span>
              <input
                type="number"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                placeholder="답 입력"
                className="w-24 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-center font-bold text-white text-base focus:border-amber-400 focus:outline-none"
                autoFocus
              />
            </div>

            {mathError && (
              <span className="text-xs text-red-400 font-bold">
                정답이 일치하지 않습니다. 다시 계산해 주세요.
              </span>
            )}

            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md transition cursor-pointer active:scale-95"
            >
              보호자 인증 및 리포트 보기
            </button>
          </form>
        ) : (
          /* UNLOCKED REPORT VIEW */
          <div className="flex flex-col gap-4">
            
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                <span className="text-[11px] text-slate-400 font-semibold">암송 달성률</span>
                <span className="text-xl font-black text-emerald-400 mt-0.5">
                  {completionRate}%
                </span>
                <span className="text-[10px] text-slate-500">
                  {completedCount} / {totalQuests} 구절
                </span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                <span className="text-[11px] text-slate-400 font-semibold">누적 획득 별</span>
                <span className="text-xl font-black text-amber-300 mt-0.5 flex items-center gap-1">
                  ⭐ {starStats.total}
                </span>
                <span className="text-[10px] text-amber-400/70">
                  3성 {starStats.three}개
                </span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                <span className="text-[11px] text-slate-400 font-semibold">항해 시간</span>
                <span className="text-lg font-black text-sky-300 mt-0.5 font-mono">
                  {elapsedTimeFormatted}
                </span>
                <span className="text-[10px] text-slate-500">집중 학습 시간</span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                <span className="text-[11px] text-slate-400 font-semibold">사용한 힌트</span>
                <span className="text-xl font-black text-purple-300 mt-0.5">
                  {totalHintsUsed}회
                </span>
                <span className="text-[10px] text-slate-500">보조 도구 활용</span>
              </div>
            </div>

            {/* Evaluation Summary */}
            <div className="p-3.5 bg-gradient-to-r from-sky-950/40 via-slate-900 to-sky-950/40 rounded-2xl border border-sky-600/30 text-xs">
              <h4 className="font-black text-amber-300 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>선생님 지도 가이드</span>
              </h4>
              <p className="text-slate-300 leading-relaxed break-keep">
                {completionRate >= 100
                  ? '🎉 축하합니다! 36개 전체 성경 구절 암송 항해를 마쳤습니다. 주기적으로 복습 항해를 통해 마음 판에 새겨지도록 격려해 주세요.'
                  : completionRate >= 50
                  ? `⛵ ${completedCount}개 구절을 멋지게 통과했습니다! 3단계 빈칸 채우기와 4단계 문장 암송에 도달할 때 아이가 소리 내어 읽도록 지도해 주시면 암송 효과가 극대화됩니다.`
                  : '🌱 성경 암송의 첫걸음을 떼고 있습니다. 단어 카드를 순서대로 맞추며 말씀의 구조와 의미를 재미있게 익힐 수 있도록 칭찬해 주세요.'}
              </p>
            </div>

            {/* Verse Progress Table / List */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-xs font-black text-slate-300">
                  구절별 암송 달성 목록 ({completedCount} / {totalQuests})
                </h4>
                <span className="text-[10px] text-slate-500">
                  ⭐ 별 3개: 자립 암송
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 divide-y divide-slate-900 p-1">
                {quests.map((q) => {
                  const isDone = solvedQuestIds.includes(q.id);
                  const stars = questStars[q.id] || 0;
                  const rev = verseReviewHistory[q.id];

                  return (
                    <div key={q.id} className="p-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isDone ? '✓' : q.id}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-200 truncate">
                            {q.reference[language]}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {q.text[language]}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDone ? (
                          <div className="flex items-center text-amber-300 text-xs font-black bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                            {'⭐'.repeat(stars)}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-0.5 rounded-md">
                            미완료
                          </span>
                        )}
                        {rev && (
                          <span className="text-[9px] text-sky-400 bg-sky-950 px-1 py-0.5 rounded">
                            복습 {rev.attemptCount}회
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions: Reset progress */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('대원의 모든 학습 진행 기록(별, 완료 구절)을 초기화하시겠습니까?')) {
                    sounds.playTap();
                    onResetProgress();
                    onClose();
                  }
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>데이터 초기화</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  window.print();
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>리포트 인쇄 / PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
