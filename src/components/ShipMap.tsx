import React from 'react';
import { GameSector, Language, VerseQuest } from '../types';
import { SECTOR_LIST } from '../data/verses';
import { UI_TEXT } from '../data/translations';
import { CheckCircle2, Lock, Sparkles, Key, Compass, Award, ShieldCheck, Flame, BookOpen, Gift, Eye, Map as MapIcon, Users, Disc } from 'lucide-react';
import { motion } from 'motion/react';
import { sounds } from '../utils/audio';

interface ShipMapProps {
  currentSectorId: number;
  onSelectSector: (sectorId: number) => void;
  quests: VerseQuest[];
  solvedQuestIds: number[];
  activeQuestId: number;
  onOpenQuest: (questId: number) => void;
  language: Language;
}

export const ShipMap: React.FC<ShipMapProps> = ({
  currentSectorId,
  onSelectSector,
  quests,
  solvedQuestIds,
  activeQuestId,
  onOpenQuest,
  language,
}) => {
  const t = UI_TEXT[language];
  const currentSector = SECTOR_LIST.find((s) => s.id === currentSectorId) || SECTOR_LIST[0];
  const sectorQuests = quests.filter((q) => q.sectorId === currentSectorId);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Compass': return Compass;
      case 'Flame': return Flame;
      case 'BookOpen': return BookOpen;
      case 'Gift': return Gift;
      case 'Eye': return Eye;
      case 'Map': return MapIcon;
      case 'Users': return Users;
      case 'Disc': return Disc;
      default: return Sparkles;
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Sector Navigation Bento Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {SECTOR_LIST.map((sector) => {
          const isSelected = sector.id === currentSectorId;
          const [start, end] = sector.questRange;
          const sectorQuestsList = quests.filter((q) => q.id >= start && q.id <= end);
          const solvedCount = sectorQuestsList.filter((q) => solvedQuestIds.includes(q.id)).length;
          const isAllSolved = solvedCount === sectorQuestsList.length;
          const isSectorUnlocked = sector.id === 1 || quests.filter((q) => q.id < start).every((q) => solvedQuestIds.includes(q.id));

          return (
            <button
              key={sector.id}
              onClick={() => {
                sounds.playTap();
                onSelectSector(sector.id);
              }}
              className={`flex-1 min-w-[72px] sm:min-w-[80px] py-2 px-2 rounded-xl text-center text-xs font-semibold transition-all border shrink-0 flex flex-col items-center gap-0.5 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/40 scale-[1.02]'
                  : isSectorUnlocked
                  ? 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                  : 'bg-slate-950/60 text-slate-500 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-[11px]">
                {sector.id === 5 ? (
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <span>LV {sector.id}</span>
                )}
                {isAllSolved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
              <span className="truncate max-w-[70px] text-[10px] opacity-90">
                {sector.id === 5 ? '최종관문' : `${start}~${end}번`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sector Banner Bento */}
      <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3 sm:p-3.5 shadow flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {currentSector.id === 5 ? 'FINAL STAGE' : `STAGE ${currentSector.id}`}
            </span>
            <h3 className="font-bold text-xs sm:text-sm text-slate-100">{currentSector.name[language]}</h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-snug break-keep">{currentSector.description[language]}</p>
        </div>
        <div className="text-right shrink-0 pl-3">
          <div className="text-xs sm:text-sm text-blue-400 font-bold font-mono">
            {sectorQuests.filter((q) => solvedQuestIds.includes(q.id)).length} / {sectorQuests.length}
          </div>
          <span className="text-[10px] text-slate-400">{t.solved}</span>
        </div>
      </div>

      {/* Interactive Ship Deck Stage Grid */}
      <div className="relative w-full bg-slate-900/60 rounded-2xl border border-slate-700 overflow-hidden shadow-inner p-3 sm:p-4 flex flex-col justify-between gap-3">
        {/* Background Subtle Blueprint Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="gridPattern" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#38bdf8" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPattern)" />
          </svg>
        </div>

        {/* Ambient Top Indicator */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-300 px-1 font-semibold">
          <span className="flex items-center gap-1 text-blue-300">⚓ {currentSector.name[language].split('(')[0]}</span>
          <span className="text-slate-400 text-[10px]">사물을 터치하여 암송 문제 해제</span>
        </div>

        {/* Interactive Objects Bento Grid */}
        <div className="relative z-10 grid grid-cols-3 gap-2.5 sm:gap-3">
          {sectorQuests.map((quest) => {
            const isSolved = solvedQuestIds.includes(quest.id);
            const isCurrent = quest.id === activeQuestId;
            const isLocked = quest.id > 1 && !solvedQuestIds.includes(quest.id - 1);
            const IconComp = getIconComponent(quest.objectIcon);

            return (
              <motion.button
                key={quest.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (isLocked) {
                    sounds.playWrong();
                    return;
                  }
                  sounds.playTap();
                  onOpenQuest(quest.id);
                }}
                disabled={isLocked}
                className={`relative flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all aspect-square border text-center shadow ${
                  isSolved
                    ? 'bg-blue-950/40 border-blue-500/50 text-blue-200 hover:bg-blue-900/50'
                    : isCurrent
                    ? 'bg-blue-600 border-2 border-blue-300 text-white ring-4 ring-blue-500/30 shadow-lg shadow-blue-900/60 scale-[1.03]'
                    : isLocked
                    ? 'bg-slate-900/70 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-blue-400 hover:bg-slate-700/90'
                }`}
              >
                {/* Top Number & Status Badges */}
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      isSolved
                        ? 'bg-blue-900/80 text-blue-300'
                        : isCurrent
                        ? 'bg-slate-950 text-blue-300'
                        : isLocked
                        ? 'bg-slate-900 text-slate-600'
                        : 'bg-slate-900/90 text-slate-300'
                    }`}
                  >
                    #{quest.id}
                  </span>
                  {isSolved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  ) : isCurrent ? (
                    <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-blue-400/60" />
                  )}
                </div>

                {/* Object Icon */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center my-0.5 transition-transform ${
                    isSolved
                      ? 'bg-blue-900/50 text-blue-300'
                      : isCurrent
                      ? 'bg-white text-blue-600 shadow-md scale-105'
                      : isLocked
                      ? 'bg-slate-900 text-slate-700'
                      : 'bg-slate-700/60 text-amber-400'
                  }`}
                >
                  <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Object Name & Verse Ref */}
                <div className="w-full">
                  <div
                    className={`text-[11px] sm:text-xs font-bold truncate ${
                      isCurrent ? 'text-white font-black' : 'text-slate-200'
                    }`}
                  >
                    {quest.objectName[language]}
                  </div>
                  <div
                    className={`text-[9px] sm:text-[10px] truncate font-medium ${
                      isCurrent ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {quest.reference[language].split(' ')[0]} {quest.reference[language].split(' ')[1]}
                  </div>
                </div>

                {/* Active Indicator Pulse */}
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Bottom Quick Action Bar */}
        <div className="relative z-10 bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-300 text-[11px] flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            현재 해제 대상: <strong className="text-blue-300 font-bold">#{activeQuestId} {quests[activeQuestId - 1]?.objectName[language]}</strong>
          </span>
          <button
            onClick={() => {
              sounds.playTap();
              onOpenQuest(activeQuestId);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-[11px] shadow hover:bg-blue-500 transition"
          >
            해제하기 →
          </button>
        </div>
      </div>
    </div>
  );
};
