import React from 'react';
import { Language } from '../types';
import { UI_TEXT } from '../data/translations';
import { X, Sparkles, Heart, Music, BookOpen, Code2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface CreditsModalProps {
  onClose: () => void;
  language: Language;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ onClose, language }) => {
  const t = UI_TEXT[language];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-slate-900 border-2 sm:border-4 border-[#8e5837] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-amber-300">게임 제작 크레딧 (Credits)</h2>
              <span className="text-[10px] text-slate-400">PROMISE LAND : 믿음의 항해</span>
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

        {/* Content */}
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
          
          {/* Developer Card */}
          <div className="p-3 bg-gradient-to-r from-amber-950/40 via-slate-800/80 to-slate-800/50 rounded-2xl border border-amber-400/50 flex flex-col gap-1 shadow-md">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>개발자 (Developer)</span>
            </div>
            <p className="text-sm text-amber-100 font-extrabold tracking-wide">
              Gabriel Byeongje Jeon
            </p>
            <p className="text-[10px] text-slate-400">
              PROMISE LAND : 믿음의 항해 성경 암송 방탈출 게임 시스템 기획 및 개발
            </p>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <BookOpen className="w-4 h-4" />
              <span>성경 말씀 감수</span>
            </div>
            <p className="text-[11px] text-slate-300">
              초등부 성경 암송 필수 36구절 및 최종 탈출 성구(사도행전 1:8) 개역개정 / NIV 표준 성경 원문 수록.
            </p>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-blue-300 font-bold">
              <Music className="w-4 h-4" />
              <span>배경 음악 (BGM Soundtrack)</span>
            </div>
            <p className="text-[11px] text-slate-200 font-semibold">
              공식 테마곡: 믿음의 항해 (작사: 총회교육개발원)
            </p>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <Heart className="w-4 h-4" />
              <span>기획 & 캐릭터 디자인</span>
            </div>
            <p className="text-[11px] text-slate-300">
              초등 고학년 학생들의 흥미로운 말씀 암송을 돕기 위해 2D RPG 탐험과 방탈출 퍼즐 시스템을 융합하여 기획되었습니다.
            </p>
          </div>

        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onClose();
          }}
          className="rpg-btn-wood w-full py-2.5 sm:py-3 rounded-xl font-black text-sm cursor-pointer"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
