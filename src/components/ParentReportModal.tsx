import React, { useMemo } from 'react';
import { Language, VerseQuest, VerseReviewRecord } from '../types';
import { X, ShieldCheck, BookOpen, Star, RefreshCw, Printer, LogOut, Lock } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ParentReportModalProps {
  onClose: () => void;
  onLogoutAdmin: () => void;
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
  onLogoutAdmin,
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
  const totalQuests = quests.length;
  const completedCount = solvedQuestIds.length;
  const completionRate = totalQuests > 0 ? Math.round((completedCount / totalQuests) * 100) : 0;

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
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-amber-300">
                  교회학교 교사 · 관리자 리포트
                </h2>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  관리자 모드
                </span>
              </div>
              <span className="text-xs text-slate-400">
                대원: <strong className="text-white">{playerName}</strong> 학생의 성경 암송 학습 통계
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                onLogoutAdmin();
              }}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
              title="관리자 로그아웃"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer active:scale-95"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AUTHENTICATED REPORT VIEW */}
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
                3성 자립 {starStats.three}개
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <span className="text-[11px] text-slate-400 font-semibold">학습 시간</span>
              <span className="text-lg font-black text-sky-300 mt-0.5 font-mono">
                {elapsedTimeFormatted}
              </span>
              <span className="text-[10px] text-slate-500">누적 항해 시간</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <span className="text-[11px] text-slate-400 font-semibold">보조 도구 활용</span>
              <span className="text-xl font-black text-purple-300 mt-0.5">
                {totalHintsUsed}회
              </span>
              <span className="text-[10px] text-slate-500">힌트 사용 횟수</span>
            </div>
          </div>

          {/* Teacher Guide Recommendation */}
          <div className="p-3.5 bg-gradient-to-r from-sky-950/40 via-slate-900 to-sky-950/40 rounded-2xl border border-sky-600/30 text-xs">
            <h4 className="font-black text-amber-300 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>선생님 지도 가이드</span>
            </h4>
            <p className="text-slate-300 leading-relaxed break-keep">
              {completionRate >= 100
                ? '🎉 축하합니다! 36개 전체 성경 구절 암송을 완주했습니다. 주기적인 복습 항해로 마음에 오래 새겨지도록 지도해 주세요.'
                : completionRate >= 50
                ? `⛵ 현재 ${completedCount}개 구절을 통과했습니다. 자립 암송(3성) 구절을 점검해 주시고, 힌트를 많이 쓴 구절을 한 번 더 암송하도록 이끌어 주세요.`
                : '🌱 성경 말씀 암송을 시작하는 단계입니다. 단어 카드를 순서대로 맞추는 과정을 칭찬해 주시고 부담 없이 완주할 수 있도록 응원해 주세요.'}
            </p>
          </div>

          {/* Verse Progress Table / List */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-black text-slate-300">
                구절별 상세 암송 현황 ({completedCount} / {totalQuests})
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

          {/* Actions: Reset progress & Print */}
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
              <span>학생 데이터 초기화</span>
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

      </div>
    </div>
  );
};
