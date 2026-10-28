import React, { useEffect } from 'react';
import { STAGES, StageId, versesOfStage } from '../../data/verses';
import { sounds } from '../../utils/audio';

interface StageClearPageProps {
  stage: StageId;
  solved: Record<number, number>;
  onContinue: () => void;
  onMap: () => void;
}

export const StageClearPage: React.FC<StageClearPageProps> = ({ stage, solved, onContinue, onMap }) => {
  const info = STAGES.find((s) => s.id === stage)!;
  const nextInfo = STAGES.find((s) => s.id === stage + 1);
  const list = versesOfStage(stage);
  const stars = list.reduce((a, v) => a + (solved[v.id] || 0), 0);

  useEffect(() => {
    sounds.playVictory();
  }, []);

  return (
    <div className="page bg-voyage flex flex-col">
      <main className="mx-auto w-full max-w-md px-5 pt-14 pb-8 flex-1 flex flex-col items-center text-center gap-5">
        <div className="text-7xl pop" aria-hidden>
          🏝️
        </div>
        <div>
          <p className="text-white font-black text-lg [text-shadow:0_2px_0_rgba(3,105,161,0.6)]">{stage}단계 성공!</p>
          <h1 className="mt-1 text-3xl font-black text-white [text-shadow:0_3px_0_#0369a1]">{info.title} 바다를 건넜어요</h1>
        </div>

        <div className="w-full rounded-3xl bg-white p-5 shadow-xl">
          <p className="text-sm font-bold text-muted">이번 단계에서 모은 별</p>
          <p className="mt-1 text-4xl font-black text-amber-500">
            ★ {stars} <span className="text-xl text-slate-400">/ {list.length * 3}</span>
          </p>
          {nextInfo && (
            <div className="mt-4 rounded-2xl bg-sky-50 border-2 border-sky-200 p-3">
              <p className="text-sm font-bold text-sky-700">새 바다가 열렸어요</p>
              <p className="text-lg font-black text-sky-900">
                {nextInfo.id}단계 · {nextInfo.title}
              </p>
              <p className="text-sm text-sky-800">{nextInfo.guide}</p>
            </div>
          )}
        </div>

        <div className="mt-auto w-full flex flex-col gap-3">
          <button onClick={onContinue} className="btn-game btn-gold h-16 text-xl">
            다음 바다로 출발 ⛵
          </button>
          <button onClick={onMap} className="font-bold text-white underline underline-offset-4">
            지도 보기
          </button>
        </div>
      </main>
    </div>
  );
};
