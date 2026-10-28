import React from 'react';
import { Lock } from 'lucide-react';
import { STAGES, StageId, isVerseOpen, versesOfStage } from '../../data/verses';
import { Stars, TopBar } from '../ui';

interface StagePageProps {
  stage: StageId;
  solved: Record<number, number>;
  onBack: () => void;
  onOpenVerse: (id: number) => void;
}

export const StagePage: React.FC<StagePageProps> = ({ stage, solved, onBack, onOpenVerse }) => {
  const info = STAGES.find((s) => s.id === stage)!;
  const list = versesOfStage(stage);

  return (
    <div className="page bg-paper">
      <TopBar title={`${stage}단계 · ${info.title}`} onBack={onBack} />
      <main className="mx-auto max-w-lg px-5 py-5 flex flex-col gap-3">
        <p className="px-1 text-muted">{info.guide}</p>
        <ul className="rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden">
          {list.map((v) => {
            const stars = solved[v.id] || 0;
            const open = isVerseOpen(v, solved);
            return (
              <li key={v.id}>
                <button
                  onClick={() => open && onOpenVerse(v.id)}
                  disabled={!open}
                  className="w-full min-h-[60px] px-4 py-3 flex items-center gap-3 text-left active:bg-slate-50 disabled:active:bg-white"
                >
                  <span
                    className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-black ${
                      stars ? 'bg-emerald-100 text-emerald-700' : open ? 'bg-brand text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {v.id}
                  </span>
                  <span className={`flex-1 font-bold ${open ? '' : 'text-slate-400'}`}>{v.reference}</span>
                  {stars ? <Stars count={stars} /> : open ? <span className="text-sm font-bold text-brand">풀기</span> : <Lock className="w-4 h-4 text-slate-300" />}
                </button>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
};
