import React, { useState } from 'react';
import { teacherLogin } from '../../utils/cloud';
import { Button, Notice, TopBar } from '../ui';

export const TeacherLogin: React.FC<{ onLoggedIn: () => void }> = ({ onLoggedIn }) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return setError('비밀번호를 입력해 주세요.');
    setBusy(true);
    setError(null);
    const res = await teacherLogin(password.trim());
    setBusy(false);
    if (res.success) onLoggedIn();
    else setError(res.error || '로그인하지 못했어요.');
  };

  return (
    <div className="page bg-paper">
      <TopBar title="선생님 로그인" onBack={() => (window.location.hash = '')} />
      <main className="mx-auto max-w-lg px-5 py-8 flex flex-col gap-5">
        <form onSubmit={submit} className="rounded-2xl bg-white border border-line p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-muted">교사 비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              autoComplete="current-password"
              className="h-13 min-h-[52px] px-4 rounded-xl border border-line focus:outline-none focus:border-brand"
            />
          </label>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" block disabled={busy}>
            {busy ? '확인 중…' : '로그인'}
          </Button>
        </form>

        <div className="rounded-2xl bg-white border border-line p-5 text-[15px] leading-relaxed">
          <p className="font-bold">비밀번호는 어디서 정하나요?</p>
          <p className="mt-1 text-muted">
            기록이 저장되는 구글 스프레드시트를 열고, 위쪽 메뉴 <b className="text-ink">[믿음의 항해 → 교사 비밀번호 정하기]</b>에서 정해요.
            스프레드시트 주인(선생님)만 할 수 있어요.
          </p>
          <p className="mt-3 font-bold">수업 코드는요?</p>
          <p className="mt-1 text-muted">
            로그인한 뒤 이 화면에서 만들거나, 스프레드시트 메뉴 <b className="text-ink">[믿음의 항해 → 새 수업 만들기]</b>로 만들 수 있어요.
          </p>
        </div>
      </main>
    </div>
  );
};
