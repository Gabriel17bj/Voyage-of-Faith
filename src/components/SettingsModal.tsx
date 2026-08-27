import React from 'react';
import { FamId, Language } from '../types';
import { FAM_LIST } from '../data/verses';
import { UI_TEXT } from '../data/translations';
import { X, Settings, Volume2, VolumeX, Globe, Music, Maximize, RotateCcw, ShieldCheck, Shuffle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface SettingsModalProps {
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  selectedFam: FamId;
  onFamChange: (fam: FamId) => void;
  onResetGame?: () => void;
  onReshuffleQuests?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  language,
  onLanguageChange,
  isMuted,
  onToggleMute,
  selectedFam,
  onFamChange,
  onResetGame,
  onReshuffleQuests,
}) => {
  const t = UI_TEXT[language];

  const handleFullscreen = () => {
    sounds.playTap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-slate-900 border-2 sm:border-4 border-[#8e5837] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-amber-300">환경 설정 (Settings)</h2>
              <span className="text-[10px] text-slate-400">사운드, 언어 및 게임 옵션 조절</span>
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

        {/* Options List */}
        <div className="flex flex-col gap-3 text-xs">
          
          {/* Sound & BGM Setting */}
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <div>
                <strong className="block text-slate-200 font-bold">오디오 및 BGM 사운드</strong>
                <span className="text-[10px] text-slate-400">배경음악 및 효과음 음소거</span>
              </div>
            </div>
            <button
              onClick={() => {
                onToggleMute();
                sounds.playTap();
              }}
              className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                isMuted
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-amber-600 border-amber-400 text-white shadow'
              }`}
            >
              {isMuted ? '음소거 됨' : '사운드 켜짐'}
            </button>
          </div>

          {/* Language Switch */}
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-blue-400" />
              <div>
                <strong className="block text-slate-200 font-bold">게임 언어 (Language)</strong>
                <span className="text-[10px] text-slate-400">성경 구절 및 인터페이스 언어</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => {
                  sounds.playTap();
                  onLanguageChange('ko');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  language === 'ko' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => {
                  sounds.playTap();
                  onLanguageChange('en');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  language === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Fullscreen Mode (Mobile Landscape Ideal) */}
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Maximize className="w-4 h-4 text-emerald-400" />
              <div>
                <strong className="block text-slate-200 font-bold">전체 화면 (Fullscreen)</strong>
                <span className="text-[10px] text-slate-400">모바일 가로모드 몰입 화면</span>
              </div>
            </div>
            <button
              onClick={handleFullscreen}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-bold text-[11px]"
            >
              화면 전환
            </button>
          </div>

          {/* Mascot Fam Switch */}
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <strong className="text-slate-200 font-bold">동행 수호 팜(Fam) 변경</strong>
              <span className="text-[10px] text-amber-400">필드 펫으로 함께 이동합니다</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {FAM_LIST.map((f) => {
                const isSel = selectedFam === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      sounds.playTap();
                      onFamChange(f.id);
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                      isSel
                        ? 'bg-amber-950 border-amber-400 text-amber-300 shadow font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{f.emoji}</span>
                    <span className="text-[11px]">{f.name[language]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reshuffle Verses option */}
          {onReshuffleQuests && (
            <div className="p-3 bg-amber-950/30 rounded-2xl border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shuffle className="w-4 h-4 text-amber-400" />
                <div>
                  <strong className="block text-amber-300 font-bold">말씀 문제 랜덤 셔플 (다시 섞기)</strong>
                  <span className="text-[10px] text-amber-200/70">모든 구역의 성경 구절 문제를 새롭게 랜덤 배치</span>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playCorrect();
                  onReshuffleQuests();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 border border-amber-400 text-white font-black text-[11px] shadow cursor-pointer active:scale-95 transition"
              >
                랜덤 섞기
              </button>
            </div>
          )}

          {/* Reset Game option */}
          {onResetGame && (
            <div className="p-3 bg-red-950/30 rounded-2xl border border-red-500/30 flex items-center justify-between">
              <div>
                <strong className="block text-red-300 font-bold">게임 다시 시작 (초기화)</strong>
                <span className="text-[10px] text-red-200/70">진행도 및 타이머 초기화</span>
              </div>
              <button
                onClick={() => {
                  if (confirm(t.resetConfirm)) {
                    sounds.playTap();
                    onResetGame();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-500/60 text-red-200 font-bold text-[11px]"
              >
                초기화
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onClose();
          }}
          className="rpg-btn-wood w-full py-2.5 sm:py-3 rounded-xl font-black text-sm"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
