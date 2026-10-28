import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { STAGES, TOTAL_VERSES, Verse, isStageOpen, isVerseOpen, nextVerse, versesOfStage } from '../../data/verses';

interface MapPageProps {
  name: string;
  classCode?: string;
  classConnected: boolean;
  solved: Record<number, number>;
  score: number;
  muted: boolean;
  onToggleMute: () => void;
  onOpenVerse: (id: number) => void;
  onQuit: () => void;
  onReconnect: () => void;
}

/** 지그재그 항로 (px) */
const ZIGZAG = [0, 56, 84, 56, 0, -56, -84, -56];

const SEA_ICONS: Record<number, string> = { 1: '🐚', 2: '🧭', 3: '📜', 4: '✍️', 5: '🏝️' };

export const MapPage: React.FC<MapPageProps> = ({
  name,
  classCode,
  classConnected,
  solved,
  score,
  muted,
  onToggleMute,
  onOpenVerse,
  onQuit,
  onReconnect,
}) => {
  const solvedCount = Object.keys(solved).length;
  const totalStars = Object.values(solved).reduce<number>((a, b) => a + Number(b || 0), 0);
  const next = nextVerse(solved);
  const currentRef = useRef<HTMLDivElement | null>(null);

  // 지도를 열면 현재 위치로 스크롤
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  let index = 0;

  return (
    <div className="page bg-sea pb-28">
      {/* 상단 상태 표시 */}
      <header className="sticky top-0 z-20 bg-white/95 border-b-4 border-sky-200 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-md h-16 px-3 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-black truncate">⛵ {name} 선장</p>
            {classCode ? (
              classConnected ? (
                <p className="text-xs font-bold text-emerald-600">● 수업 {classCode} 기록 중</p>
              ) : (
                <button onClick={onReconnect} className="text-xs font-bold text-rose-600 underline underline-offset-2">
                  ● 연결 끊김 · 다시 연결
                </button>
              )
            ) : (
              <p className="text-xs text-muted">혼자 연습 중</p>
            )}
          </div>
          <span className="h-9 px-3 rounded-full bg-amber-100 text-amber-800 font-black flex items-center gap-1 text-sm">★ {totalStars}</span>
          <span className="h-9 px-3 rounded-full bg-sky-100 text-sky-800 font-black flex items-center text-sm">{score.toLocaleString()}점</span>
          <button
            onClick={onToggleMute}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 active:bg-slate-100"
            aria-label={muted ? '소리 켜기' : '소리 끄기'}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
        <div className="h-2 bg-sky-100">
          <div className="h-full bg-amber-400 transition-[width] duration-300" style={{ width: `${(solvedCount / TOTAL_VERSES) * 100}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6 flex flex-col items-center">
        {STAGES.map((stage) => {
          const list = versesOfStage(stage.id);
          const open = isStageOpen(stage.id, solved);
          const done = list.filter((v) => solved[v.id]).length;
          return (
            <section key={stage.id} className="w-full flex flex-col items-center mb-6">
              {/* 바다 이름표 */}
              <div
                className={`w-full rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 border-b-4 ${
                  open ? 'bg-amber-50 border-amber-300' : 'bg-slate-200/90 border-slate-400'
                }`}
              >
                <span className="text-3xl" aria-hidden>
                  {open ? SEA_ICONS[stage.id] : '🔒'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-black ${open ? 'text-amber-900' : 'text-slate-500'}`}>
                    {stage.id}단계 · {stage.title}
                  </p>
                  <p className={`text-sm ${open ? 'text-amber-800' : 'text-slate-500'}`}>{open ? stage.guide : '앞 단계를 마치면 열려요'}</p>
                </div>
                <span className={`text-sm font-black ${open ? 'text-amber-900' : 'text-slate-500'}`}>
                  {done}/{list.length}
                </span>
              </div>

              {list.map((v) => {
                const offset = ZIGZAG[index++ % ZIGZAG.length];
                const isCurrent = next?.id === v.id;
                return (
                  <div
                    key={v.id}
                    ref={isCurrent ? currentRef : undefined}
                    className="relative my-2.5"
                    style={{ transform: `translateX(${offset}px)` }}
                  >
                    <MapNode verse={v} stars={solved[v.id] || 0} open={isVerseOpen(v, solved)} current={isCurrent} onOpen={() => onOpenVerse(v.id)} />
                    {isCurrent && (
                      <span className={`absolute top-1/2 -translate-y-1/2 text-4xl ${offset > 0 ? '-left-14' : '-right-14'}`} aria-hidden>
                        <span className="bob inline-block">⛵</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}

        <div className="text-center text-white font-black text-lg mb-6" aria-hidden>
          👑 약속의 땅
        </div>

        <button onClick={onQuit} className="text-sm font-bold text-white/90 underline underline-offset-4 py-2">
          그만하고 처음 화면으로
        </button>
      </main>

      {/* 다음 말씀 버튼 */}
      {next && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-sky-900/60 to-transparent">
          <div className="mx-auto max-w-md">
            <button onClick={() => onOpenVerse(next.id)} className="btn-game btn-gold w-full h-16 text-xl">
              {solvedCount === 0 ? '⚓ 첫 말씀으로 출발!' : `⚓ ${next.id}번 말씀으로 출발!`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MapNode: React.FC<{ verse: Verse; stars: number; open: boolean; current: boolean; onOpen: () => void }> = ({
  verse,
  stars,
  open,
  current,
  onOpen,
}) => {
  const isFinal = verse.stage === 5;
  const size = current || isFinal ? 'w-20 h-20 text-2xl' : 'w-16 h-16 text-xl';
  const color = stars ? 'btn-gold' : current ? 'btn-blue' : open ? 'btn-white' : '';

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {current && <span className="ring-pulse" aria-hidden />}
        <button
          onClick={onOpen}
          disabled={!open}
          aria-label={`${verse.id}번 말씀 ${verse.reference}${stars ? ` 별 ${stars}개` : open ? '' : ' 잠김'}`}
          className={`btn-game rounded-full! ${size} ${color} ${
            !open ? 'bg-slate-300 border-slate-400 text-slate-500 opacity-100! grayscale-0!' : ''
          } flex items-center justify-center`}
        >
          {isFinal ? '👑' : open || stars ? verse.id : '🔒'}
        </button>
      </div>
      <span className={`mt-1 h-5 text-sm leading-5 ${stars ? '' : 'invisible'}`} aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= stars ? 'text-amber-300' : 'text-sky-200/60'}>
            ★
          </span>
        ))}
      </span>
    </div>
  );
};
