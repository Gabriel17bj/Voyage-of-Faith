import React, { useEffect } from 'react';
import { TOTAL_VERSES } from '../../data/verses';
import { sounds } from '../../utils/audio';
import { formatDuration } from '../ui';

interface DonePageProps {
  name: string;
  score: number;
  totalStars: number;
  elapsedMs: number;
  hintsUsed: number;
  wrongCount: number;
  classCode?: string;
  onHome: () => void;
  onReview: () => void;
}

export const DonePage: React.FC<DonePageProps> = ({ name, score, totalStars, elapsedMs, hintsUsed, wrongCount, classCode, onHome, onReview }) => {
  useEffect(() => {
    sounds.playVictory();
  }, []);

  return (
    <div className="page bg-voyage">
      <main className="mx-auto max-w-md px-5 pt-12 pb-8 flex flex-col items-center text-center gap-5">
        <div className="text-7xl pop" aria-hidden>
          👑
        </div>
        <div>
          <h1 className="text-3xl font-black text-white [text-shadow:0_3px_0_#0369a1]">약속의 땅 도착!</h1>
          <p className="mt-2 font-bold text-sky-900">
            {name} 선장님, 말씀 {TOTAL_VERSES}개를 모두 외웠어요.
          </p>
        </div>

        <dl className="w-full grid grid-cols-2 gap-3">
          <Stat label="점수" value={score.toLocaleString()} big />
          <Stat label="별" value={`★ ${totalStars}`} big tone="text-amber-500" />
          <Stat label="걸린 시간" value={formatDuration(elapsedMs)} />
          <Stat label="힌트 · 틀림" value={`${hintsUsed} · ${wrongCount}`} />
        </dl>

        {classCode && <p className="font-bold text-white">✔ 결과가 선생님께 전달되었어요</p>}

        <div className="w-full flex flex-col gap-3">
          <button onClick={onReview} className="btn-game btn-gold h-16 text-xl">
            🗺️ 지도 다시 보기
          </button>
          <button onClick={onHome} className="font-bold text-white underline underline-offset-4">
            처음 화면으로
          </button>
        </div>
      </main>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; big?: boolean; tone?: string }> = ({ label, value, big, tone = 'text-sky-900' }) => (
  <div className="rounded-2xl bg-white p-4 border-b-4 border-sky-200">
    <dt className="text-sm font-bold text-muted">{label}</dt>
    <dd className={`mt-1 font-black ${big ? 'text-2xl' : 'text-xl'} ${tone}`}>{value}</dd>
  </div>
);
