import React from 'react';
import { Language } from '../types';
import { UI_TEXT } from '../data/translations';
import { X, BookOpen, Key, Sparkles, HelpCircle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface RulesModalProps {
  onClose: () => void;
  language: Language;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose, language }) => {
  const t = UI_TEXT[language];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 sm:border-4 border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-100">{t.howToPlay}</h2>
              <span className="text-[10px] text-slate-400">믿음의 항해 규칙 가이드</span>
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

        {/* Bento Rule Cards */}
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-200">
          <div className="p-3.5 bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col gap-2">
            <h4 className="font-bold text-blue-400 flex items-center gap-1.5 text-xs">
              <span>⚓ 1. 4단계 암송 난이도 & 구역 잠금</span>
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px] pl-1">
              <li><strong>LV 1</strong>: 핵심 단어 1개 빈칸 채우기 (객관식)</li>
              <li><strong>LV 2</strong>: 단어 순서 맞추기 (단어 칩 터치)</li>
              <li><strong>LV 3</strong>: 다중 빈칸 단어 직접 입력 (키보드 타이핑)</li>
              <li><strong>LV 4</strong>: 전체 말씀 암송 직접 입력 & 단어 보조</li>
              <li><strong>구역 이동</strong>: 각 구역의 모든 문제를 풀어야 다음 구역이 잠금 해제됩니다.</li>
            </ul>
          </div>

          <div className="p-3.5 bg-indigo-950/40 rounded-2xl border border-indigo-500/40 flex flex-col gap-1.5">
            <h4 className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
              <Key className="w-4 h-4 text-amber-400" />
              <span>2. 최종 황금문 (사도행전 1:8)</span>
            </h4>
            <p className="text-[11px] text-indigo-100 leading-snug">
              36개 구절을 모두 풀면 거대한 황금 탈출문이 열립니다. 사도행전 1:8 구절을 선포하여 온전한 탈출에 성공하세요!
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col gap-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>3. 3가지 특수 힌트 아이템</span>
            </h4>
            <ul className="text-slate-300 text-[11px] space-y-1.5">
              <li>🔍 <strong>빛의 돋보기</strong>: 첫 글자/초성 및 구절 시작 단서 제공</li>
              <li>⏳ <strong>진리의 모래시계</strong>: 오답 보기 제거 또는 다음 단어 배치</li>
              <li>💬 <strong>팜의 속삭임</strong>: 마스코트의 말씀 묵상 가이드와 해설</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playTap();
            onClose();
          }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
