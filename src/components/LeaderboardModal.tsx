import React from 'react';
import { LeaderboardEntry, Language } from '../types';
import { FAM_LIST } from '../data/verses';
import { UI_TEXT } from '../data/translations';
import { Trophy, Medal, X, Timer, Sparkles, Trash2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
  onClearLeaderboard?: () => void;
  language: Language;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  onClose,
  onClearLeaderboard,
  language,
}) => {
  const t = UI_TEXT[language];

  // Top records sorted by lowest timeMs
  const sortedEntries = [...entries].sort((a, b) => a.timeMs - b.timeMs).slice(0, 10);

  const getRankPill = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-amber-400 text-slate-950 font-black';
      case 1:
        return 'bg-slate-300 text-slate-950 font-black';
      case 2:
        return 'bg-amber-700 text-amber-100 font-black';
      default:
        return 'bg-slate-800 text-slate-400 font-bold';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 sm:border-4 border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-100">{t.leaderboard}</h2>
              <span className="text-[10px] text-slate-400">믿음의 이정표 Top 10 순위</span>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Bento Ranking Rows */}
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
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

        {/* Clear Data & Close */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {onClearLeaderboard && sortedEntries.length > 0 ? (
            <button
              onClick={() => {
                if (window.confirm('명예의 전당 기록을 초기화하시겠습니까?')) {
                  onClearLeaderboard();
                }
              }}
              className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1"
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
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
