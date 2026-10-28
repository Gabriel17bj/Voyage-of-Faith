import React, { useState } from 'react';
import { PlayerProgress } from '../../types';
import { TOTAL_VERSES } from '../../data/verses';
import { Button, Notice, ProgressBar } from '../ui';

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

  const hasCode = code.trim().length > 0;

  return (
    <div className="page bg-paper">
      <main className="mx-auto max-w-lg px-5 pt-10 pb-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-5xl" aria-hidden>
            ⛵
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">믿음의 항해</h1>
          <p className="mt-2 text-muted">성경 말씀 {TOTAL_VERSES}개를 외워 보아요</p>
        </div>

        {saved && savedCount > 0 && (
          <section className="rounded-2xl bg-white border border-line p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-bold">{saved.profile.name}의 항해</span>
              <span className="text-sm text-muted">
                {savedCount} / {TOTAL_VERSES}
              </span>
            </div>
            <ProgressBar value={savedCount} max={TOTAL_VERSES} className="mt-3" />
            {saved.profile.classCode && <p className="mt-2 text-sm text-muted">수업 코드 {saved.profile.classCode}</p>}
            <Button block className="mt-4" onClick={onResume} disabled={joining}>
              {joining ? '수업에 연결하는 중…' : '이어하기'}
            </Button>
          </section>
        )}

        <form onSubmit={submit} className="rounded-2xl bg-white border border-line p-5 flex flex-col gap-4">
          <h2 className="font-bold text-lg">{saved && savedCount > 0 ? '새로 시작하기' : '시작하기'}</h2>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-muted">이름</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, 20));
                setFormError(null);
              }}
              placeholder="예: 김요한"
              autoComplete="off"
              className="h-13 min-h-[52px] px-4 rounded-xl border border-line bg-white focus:outline-none focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-muted">수업 코드 (선생님이 알려준 5자리)</span>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));
                setFormError(null);
                onClearError();
              }}
              placeholder="없으면 비워 두세요"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              className="h-13 min-h-[52px] px-4 rounded-xl border border-line bg-white font-mono text-lg tracking-[0.3em] placeholder:tracking-normal placeholder:font-sans placeholder:text-base focus:outline-none focus:border-brand"
            />
          </label>

          {formError && <Notice tone="error">{formError}</Notice>}
          {joinError && (
            <Notice tone="error">
              <p className="font-bold">수업에 들어가지 못했어요</p>
              <p className="mt-1">{joinError}</p>
              <button
                type="button"
                onClick={() => name.trim() && onPractice(name.trim())}
                className="mt-2 font-bold underline underline-offset-4"
              >
                코드 없이 혼자 연습하기
              </button>
            </Notice>
          )}

          <Button type="submit" block disabled={joining}>
            {joining ? '수업에 연결하는 중…' : hasCode ? '수업에 들어가기' : '혼자 연습하기'}
          </Button>
        </form>

        <div className="flex justify-center gap-6 text-sm">
          <button onClick={onHowTo} className="text-muted underline underline-offset-4">
            게임 방법
          </button>
          <button onClick={onTeacher} className="text-muted underline underline-offset-4">
            선생님 화면
          </button>
        </div>
      </main>
    </div>
  );
};
