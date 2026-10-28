import React from 'react';
import { TOTAL_VERSES } from '../../data/verses';
import { Button, formatDuration } from '../ui';

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

export const DonePage: React.FC<DonePageProps> = ({ name, score, totalStars, elapsedMs, hintsUsed, wrongCount, classCode, onHome, onReview }) => (
  <div className="page bg-paper">
    <main className="mx-auto max-w-lg px-5 pt-12 pb-8 flex flex-col gap-6">
      <div className="text-center">
        <div className="text-5xl" aria-hidden>
          🎉
        </div>
        <h1 className="mt-3 text-2xl font-black">항해를 마쳤어요!</h1>
        <p className="mt-2 text-muted">
          {name}님, 말씀 {TOTAL_VERSES}개를 모두 외웠어요.
        </p>
      </div>

      <dl className="rounded-2xl bg-white border border-line grid grid-cols-2 divide-x divide-y divide-line overflow-hidden">
        <Item label="점수" value={`${score.toLocaleString()}점`} strong />
        <Item label="별" value={`${totalStars} / ${TOTAL_VERSES * 3}`} />
        <Item label="걸린 시간" value={formatDuration(elapsedMs)} />
        <Item label="힌트 · 틀린 횟수" value={`${hintsUsed} · ${wrongCount}`} />
      </dl>

      {classCode && <p className="text-center text-sm text-emerald-700">결과가 선생님께 전달되었어요.</p>}

      <div className="flex flex-col gap-2">
        <Button block onClick={onReview}>
          말씀 다시 보기
        </Button>
        <Button block variant="ghost" onClick={onHome}>
          처음 화면으로
        </Button>
      </div>
    </main>
  </div>
);

const Item: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="p-4">
    <dt className="text-sm text-muted">{label}</dt>
    <dd className={`mt-1 font-black ${strong ? 'text-2xl text-brand' : 'text-xl'}`}>{value}</dd>
  </div>
);
