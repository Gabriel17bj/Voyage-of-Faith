import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, Language, StudentSession } from '../types';
import { FAM_LIST } from '../data/verses';
import { HERO_CHARACTERS } from '../data/characters';
import { UI_TEXT } from '../data/translations';
import { Trophy, Users, X, Timer, Sparkles, Trash2, Clock, Star, Shield } from 'lucide-react';
import { sounds } from '../utils/audio';
import { subscribeClassStudents } from '../utils/cloud';
import { isFirebaseConfigured } from '../utils/firebase';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
  onClearLeaderboard?: () => void;
  language: Language;
  classCode?: string;
  currentStudentName?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  onClose,
  onClearLeaderboard,
  language,
  classCode,
  currentStudentName,
}) => {
  const t = UI_TEXT[language];
  const [activeTab, setActiveTab] = useState<'hall_of_fame' | 'classroom'>(
    classCode ? 'classroom' : 'hall_of_fame'
  );
  const [classStudents, setClassStudents] = useState<StudentSession[]>([]);
  const [isLoadingClass, setIsLoadingClass] = useState<boolean>(Boolean(classCode));

  // Top records for Hall of Fame
  const sortedEntries = [...entries].sort((a, b) => a.timeMs - b.timeMs).slice(0, 10);

  // Subscribe to classroom real-time ranking when class tab is active or classCode is provided
  useEffect(() => {
    if (!classCode) {
      setIsLoadingClass(false);
      return;
    }

    setIsLoadingClass(true);
    const unsub = subscribeClassStudents(classCode, (students) => {
      setClassStudents(students);
      setIsLoadingClass(false);
    });

    return () => unsub();
  }, [classCode]);

  const getRankPill = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-amber-400 text-slate-950 font-black shadow';
      case 1:
        return 'bg-slate-300 text-slate-950 font-black shadow';
      case 2:
        return 'bg-amber-700 text-amber-100 font-black shadow';
      default:
        return 'bg-slate-800 text-slate-400 font-bold';
    }
  };

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}분 ${s}초`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 sm:border-4 border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 text-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-100">{t.leaderboard}</h2>
              <span className="text-[10px] text-slate-400">
                {activeTab === 'classroom' && classCode
                  ? `[${classCode}] 우리 반 실시간 순위표`
                  : '믿음의 이정표 명예의 전당'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Hall of Fame vs Classroom */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('classroom');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'classroom'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>우리 반 순위 {classCode ? `(${classCode})` : ''}</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('hall_of_fame');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'hall_of_fame'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>개인 명예의 전당</span>
          </button>
        </div>

        {/* TAB 1: CLASSROOM REAL-TIME RANKING */}
        {activeTab === 'classroom' && (
          <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto scrollbar-thin pr-1">
            {!classCode ? (
              <div className="text-center py-8 px-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col items-center gap-2">
                <Users className="w-8 h-8 text-amber-400/50" />
                <h4 className="text-xs font-black text-amber-300">현재 단독 항해 중입니다</h4>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  선생님이 알려주신 5자리 수업 코드를 시작 화면의 [수업 코드]에 입력하고 출발하면, 우리 반 친구들의 실시간 순위와 점수를 함께 볼 수 있습니다.
                </p>
              </div>
            ) : classStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                {isLoadingClass ? '우리 반 순위 불러오는 중...' : '아직 참여한 학생 기록이 없습니다.'}
              </div>
            ) : (
              classStudents.map((st, idx) => {
                const isMe = currentStudentName && st.studentName.trim() === currentStudentName.trim();
                const fam = FAM_LIST.find((f) => f.id === st.famId) || FAM_LIST[0];
                const hero = HERO_CHARACTERS.find((h) => h.id === st.characterId) || HERO_CHARACTERS[0];

                return (
                  <div
                    key={st.id || idx}
                    className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between transition ${
                      isMe
                        ? 'bg-gradient-to-r from-amber-950/50 via-slate-800 to-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/80'
                        : idx === 0
                        ? 'bg-slate-800/80 border-amber-400/50'
                        : 'bg-slate-800/40 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${getRankPill(idx)}`}>
                        {idx + 1}
                      </span>

                      <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                        <img
                          src={hero.image}
                          alt={st.studentName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black text-xs sm:text-sm ${isMe ? 'text-amber-200' : 'text-slate-100'}`}>
                            {st.studentName}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                              나
                            </span>
                          )}
                          {st.isOnline && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="접속중" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>{st.solvedCount}/36개</span>
                          <span>•</span>
                          <span className="text-amber-300 font-bold">⭐ {st.totalStars}</span>
                          <span>•</span>
                          <span>{formatMs(st.elapsedTimeMs)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-amber-300 text-sm sm:text-base">
                        {st.score.toLocaleString()}점
                      </div>
                      <span className="text-[9px] text-slate-500">
                        힌트 {st.hintsUsed} / 오답 {st.wrongAnswersCount}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: HALL OF FAME (Local Top 10) */}
        {activeTab === 'hall_of_fame' && (
          <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto scrollbar-thin pr-1">
            {sortedEntries.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs leading-relaxed px-4">
                <Sparkles className="w-8 h-8 mx-auto text-amber-400/40 mb-2" />
                <p>{t.noRankData}</p>
              </div>
            ) : (
              sortedEntries.map((entry, index) => {
                const fam = FAM_LIST.find((f) => f.id === entry.famId) || FAM_LIST[0];
                const isFirst = index === 0;

                return (
                  <div
                    key={entry.id || index}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                      isFirst
                        ? 'bg-slate-800/80 border-amber-400/60 shadow-lg'
                        : 'bg-slate-800/40 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getRankPill(index)}`}>
                        {index + 1}
                      </span>

                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg shadow-inner">
                          {fam.emoji}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-100">{entry.playerName}</span>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>{fam.name[language]}</span>
                            <span>•</span>
                            <span>힌트 {entry.hintsUsed || 0}회</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-blue-400 font-mono font-bold text-sm">
                        <Timer className="w-3.5 h-3.5" />
                        <span>{entry.formattedTime}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block font-mono">
                        {entry.completedAt || '최근 완주'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Clear Data & Close */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {activeTab === 'hall_of_fame' && onClearLeaderboard && sortedEntries.length > 0 ? (
            <button
              onClick={() => {
                if (window.confirm('명예의 전당 기록을 초기화하시겠습니까?')) {
                  onClearLeaderboard();
                }
              }}
              className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              기록 삭제
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
