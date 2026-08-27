import React, { useEffect } from 'react';
import { FamInfo, Language } from '../types';
import { UI_TEXT } from '../data/translations';
import { Trophy, Award, Timer, Sparkles, RefreshCw, Share2, Crown, CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';

interface CertificateModalProps {
  playerName: string;
  fam: FamInfo;
  language: Language;
  finalTimeFormatted: string;
  totalHintsUsed: number;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  playerName,
  fam,
  language,
  finalTimeFormatted,
  totalHintsUsed,
  onPlayAgain,
  onViewLeaderboard,
}) => {
  const t = UI_TEXT[language];

  useEffect(() => {
    sounds.playVictory();
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
        });
      }, 400);
    } catch {}
  }, []);

  const handleShare = () => {
    sounds.playTap();
    const text = `⚓ [믿음의 항해] 36구절 말씀 방탈출 대탈출 성공!\n👑 용사: ${playerName} (팜: ${fam.name[language]})\n⏱️ 기록: ${finalTimeFormatted}\n✨ "오직 성령이 너희에게 임하시면 너희가 권능을 받고... (행 1:8)"`;
    if (navigator.share) {
      navigator.share({
        title: '믿음의 항해 탈출 성공',
        text: text,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      alert('탈출 결과가 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-lg overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 sm:border-4 border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 text-slate-100 my-auto">
        
        {/* Top Floating Crown Icon */}
        <div className="w-16 h-16 mx-auto -mt-11 rounded-2xl bg-amber-400 border-2 border-amber-200 shadow-xl flex items-center justify-center text-slate-950">
          <Crown className="w-8 h-8 text-slate-950 animate-bounce" />
        </div>

        {/* Title Header */}
        <div className="text-center">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs font-black uppercase tracking-wider">
            🎉 MISSION COMPLETED
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-2">
            {t.escapeSuccess}
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-snug break-keep">
            {t.escapeSuccessDesc}
          </p>
        </div>

        {/* Certificate Bento Frame */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 relative shadow-inner">
          <div className="text-center border-b border-slate-700 pb-2">
            <h3 className="text-sm font-extrabold text-blue-300 tracking-wide flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4 text-blue-400" />
              {t.certificateTitle}
            </h3>
          </div>

          <div className="text-center my-1">
            <span className="text-xs text-slate-400">말씀 용사</span>
            <div className="text-xl font-black text-slate-100 flex items-center justify-center gap-2 mt-0.5">
              <span>{playerName}</span>
              <span className="text-2xl" role="img" aria-label={fam.name[language]}>
                {fam.emoji}
              </span>
            </div>
            <span className="text-[11px] text-amber-400 font-semibold">
              함께한 마스코트: 팜({fam.name[language]})
            </span>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/90 rounded-xl p-3 border border-slate-700 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">{t.finalTime}</span>
              <div className="text-base font-mono font-black text-blue-400 flex items-center justify-center gap-1 mt-0.5">
                <Timer className="w-4 h-4" />
                <span>{finalTimeFormatted}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">{t.totalHintsUsed}</span>
              <div className="text-base font-black text-amber-300 mt-0.5">
                {totalHintsUsed} 회
              </div>
            </div>
          </div>

          {/* Verses Cleared Badge */}
          <div className="flex items-center justify-center gap-2 bg-blue-950/40 border border-blue-500/40 rounded-xl py-2 px-3 text-blue-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>총 36구절 암송 완전 정복!</span>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-tight">
            {t.certifyText}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleShare}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareResult}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sounds.playTap();
                onViewLeaderboard();
              }}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.viewLeaderboard}</span>
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                onPlayAgain();
              }}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.playAgain}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
