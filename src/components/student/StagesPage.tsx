import React from 'react';
import { Check, ChevronRight, Lock, Volume2, VolumeX } from 'lucide-react';
import { STAGES, StageId, TOTAL_VERSES, isStageOpen, nextVerse, versesOfStage } from '../../data/verses';
import { Button, ProgressBar, TopBar } from '../ui';

interface StagesPageProps {
  name: string;
  classCode?: string;
  classConnected: boolean;
  solved: Record<number, number>;
  score: number;
  muted: boolean;
  onToggleMute: () => void;
  onOpenStage: (stage: StageId) => void;
  onOpenVerse: (id: number) => void;
  onQuit: () => void;
  onReconnect: () => void;
}

export const StagesPage: React.FC<StagesPageProps> = ({
  name,
  classCode,
  classConnected,
  solved,
  score,
  muted,
  onToggleMute,
  onOpenStage,
  onOpenVerse,
  onQuit,
  onReconnect,
}) => {
  const solvedCount = Object.keys(solved).length;
  const next = nextVerse(solved);

  return (
    <div className="page bg-paper">
      <TopBar
        title="믿음의 항해"
        right={
          <button
            onClick={onToggleMute}
            className="w-11 h-11 flex items-center justify-center rounded-full text-muted active:bg-slate-100"
            aria-label={muted ? '소리 켜기' : '소리 끄기'}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        }
      />

      <main className="mx-auto max-w-lg px-5 py-5 flex flex-col gap-5">
        <section className="rounded-2xl bg-white border border-line p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold truncate">{name}</p>
              {classCode ? (
                classConnected ? (
                  <p className="text-sm text-emerald-700">● 수업 {classCode} 기록 중</p>
                ) : (
                  <button onClick={onReconnect} className="text-sm text-rose-600 underline underline-offset-4">
                    ● 수업 {classCode} 연결 끊김 · 다시 연결
                  </button>
                )
              ) : (
                <p className="text-sm text-muted">혼자 연습 중</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted">점수</p>
              <p className="text-2xl font-black text-brand">{score.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <ProgressBar value={solvedCount} max={TOTAL_VERSES} className="flex-1" />
            <span className="text-sm font-bold whitespace-nowrap">
              {solvedCount} / {TOTAL_VERSES}
            </span>
          </div>
          {next && (
            <Button block className="mt-5" onClick={() => onOpenVerse(next.id)}>
              {solvedCount === 0 ? '첫 말씀 시작하기' : `다음 말씀 (${next.id}번)`}
            </Button>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-bold text-muted">단계</h2>
          <ul className="rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden">
            {STAGES.map((stage) => {
              const list = versesOfStage(stage.id);
              const done = list.filter((v) => solved[v.id]).length;
              const open = isStageOpen(stage.id, solved);
              const complete = done === list.length;
              return (
                <li key={stage.id}>
                  <button
                    onClick={() => open && onOpenStage(stage.id)}
                    disabled={!open}
                    className="w-full min-h-[64px] px-4 py-3 flex items-center gap-3 text-left active:bg-slate-50 disabled:active:bg-white"
                  >
                    <span
                      className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-black ${
                        complete ? 'bg-emerald-100 text-emerald-700' : open ? 'bg-blue-100 text-brand' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {complete ? <Check className="w-5 h-5" /> : stage.id}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block font-bold ${open ? '' : 'text-slate-400'}`}>
                        {stage.id}단계 · {stage.title}
                      </span>
                      <span className="block text-sm text-muted">
                        {open ? `${done} / ${list.length}` : '앞 단계를 마치면 열려요'}
                      </span>
                    </span>
                    {open ? <ChevronRight className="w-5 h-5 text-slate-400" /> : <Lock className="w-4 h-4 text-slate-300" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <button onClick={onQuit} className="self-center text-sm text-muted underline underline-offset-4 py-2">
          그만하고 처음 화면으로
        </button>
      </main>
    </div>
  );
};
