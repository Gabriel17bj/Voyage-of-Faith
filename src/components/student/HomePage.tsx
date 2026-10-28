import React, { useState } from 'react';
import { PlayerProgress } from '../../types';
import { TOTAL_VERSES } from '../../data/verses';
import { Notice } from '../ui';

interface HomePageProps {
  initialCode: string;
  saved: PlayerProgress | null;
  joining: boolean;
  joinError: string | null;
  onStart: (name: string, classCode: string) => void;
  onResume: () => void;
  onPractice: (name: string) => void;
  onHowTo: () => void;
  onTeacher: () => void;
  onClearError: () => void;
}

const LAST_NAME_KEY = 'PROMISE_LAND_LAST_PLAYER_NAME';
const LAST_CODE_KEY = 'PROMISE_LAND_LAST_CLASS_CODE';

function readLocal(key: string): string {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

export const HomePage: React.FC<HomePageProps> = ({
  initialCode,
  saved,
  joining,
  joinError,
  onStart,
  onResume,
  onPractice,
  onHowTo,
  onTeacher,
  onClearError,
}) => {
  const [name, setName] = useState(() => readLocal(LAST_NAME_KEY));
  const [code, setCode] = useState(() => initialCode || readLocal(LAST_CODE_KEY));
  const [formError, setFormError] = useState<string | null>(null);

  const savedCount = saved ? Object.keys(saved.solved).length : 0;
  const hasCode = code.trim().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const c = code.trim().toUpperCase();
    if (!n) return setFormError('이름을 입력해 주세요.');
    if (c && c.length !== 5) return setFormError('수업 코드는 5자리예요.');
    setFormError(null);
    try {
      localStorage.setItem(LAST_NAME_KEY, n);
      if (c) localStorage.setItem(LAST_CODE_KEY, c);
    } catch {}
    if (c) onStart(n, c);
    else onPractice(n);
  };

  return (
    <div className="page bg-voyage">
      <main className="mx-auto max-w-md px-5 pt-8 pb-10 flex flex-col gap-5">
        {/* 타이틀 */}
        <div className="relative text-center pt-4 pb-2">
          <span className="absolute right-6 top-0 text-4xl" aria-hidden>
            ☀️
          </span>
          <span className="absolute left-4 top-6 text-3xl opacity-90" aria-hidden>
            ☁️
          </span>
          <div className="text-7xl bob inline-block" aria-hidden>
            ⛵
          </div>
          <h1 className="mt-2 text-4xl font-black text-white [text-shadow:0_3px_0_#0369a1,0_6px_12px_rgba(3,105,161,0.4)]">믿음의 항해</h1>
          <p className="mt-2 font-bold text-sky-900">말씀 {TOTAL_VERSES}개를 외우며 바다를 건너요</p>
        </div>

        {saved && savedCount > 0 && (
          <section className="rounded-3xl bg-white/95 p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                🗺️
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-black truncate">{saved.profile.name}의 항해</p>
                <p className="text-sm text-muted">
                  {savedCount} / {TOTAL_VERSES} 지점 도착{saved.profile.classCode ? ` · 수업 ${saved.profile.classCode}` : ''}
                </p>
              </div>
            </div>
            <button onClick={onResume} disabled={joining} className="btn-game btn-green w-full h-14 mt-3 text-lg">
              {joining ? '연결하는 중…' : '이어서 항해하기'}
            </button>
          </section>
        )}

        <form onSubmit={submit} className="rounded-3xl bg-white p-5 shadow-xl flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-black text-sky-800">선장 이름</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, 20));
                setFormError(null);
              }}
              placeholder="예: 김요한"
              autoComplete="off"
              className="h-14 px-4 rounded-2xl border-2 border-sky-200 bg-sky-50 text-lg font-bold focus:outline-none focus:border-sky-500"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-black text-sky-800">수업 코드</span>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));
                setFormError(null);
                onClearError();
              }}
              placeholder="선생님이 알려준 5자리"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              className="h-14 px-4 rounded-2xl border-2 border-sky-200 bg-sky-50 font-mono text-2xl font-black tracking-[0.35em] text-sky-900 placeholder:tracking-normal placeholder:font-sans placeholder:text-base placeholder:font-normal focus:outline-none focus:border-sky-500"
            />
          </label>

          {formError && <Notice tone="error">{formError}</Notice>}
          {joinError && (
            <Notice tone="error">
              <p className="font-bold">수업에 들어가지 못했어요</p>
              <p className="mt-1">{joinError}</p>
              <button
                type="button"
                onClick={() => (name.trim() ? onPractice(name.trim()) : setFormError('이름을 입력해 주세요.'))}
                className="mt-2 font-bold underline underline-offset-4"
              >
                코드 없이 혼자 연습하기
              </button>
            </Notice>
          )}

          <button type="submit" disabled={joining} className="btn-game btn-gold h-16 text-xl">
            {joining ? '수업에 연결하는 중…' : hasCode ? '⚓ 출항하기' : '⚓ 혼자 연습하기'}
          </button>
          {!hasCode && <p className="-mt-1 text-center text-sm text-muted">수업 코드를 넣으면 선생님 화면에 기록돼요.</p>}
        </form>

        <div className="flex justify-center gap-6 text-sm font-bold text-white/95">
          <button onClick={onHowTo} className="underline underline-offset-4">
            게임 방법
          </button>
          <button onClick={onTeacher} className="underline underline-offset-4">
            선생님 화면
          </button>
        </div>
      </main>
    </div>
  );
};
