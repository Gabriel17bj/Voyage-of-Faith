import React, { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import gasCode from '../../../gas/Code.gs?raw';
import { SHEET_URL } from '../../config';
import { connectServer } from '../../utils/cloud';
import { copyText } from '../ConnectionCheck';
import { Button, Notice, TopBar } from '../ui';

/** 구글 시트가 아직 연결되지 않았을 때: 3단계 연결 안내 */
export const TeacherSetup: React.FC<{ onConnected: () => void }> = ({ onConnected }) => {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await connectServer(url);
    setBusy(false);
    if (res.success) onConnected();
    else setError(res.error || '연결하지 못했어요.');
  };

  return (
    <div className="page bg-paper">
      <TopBar title="구글 시트 연결하기" onBack={() => (window.location.hash = '')} />
      <main className="mx-auto max-w-lg px-5 py-5 flex flex-col gap-4">
        <p className="px-1 leading-relaxed text-muted">
          학생 기록은 선생님의 <strong className="text-ink">구글 스프레드시트</strong>에 저장돼요. 처음 한 번만 연결하면 돼요.
        </p>

        <Step n={1} title="시트에 코드 붙여넣기">
          <ol className="list-decimal pl-5 leading-relaxed">
            <li>
              <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4 inline-flex items-center gap-1">
                내 스프레드시트 열기 <ExternalLink className="w-4 h-4" />
              </a>
            </li>
            <li>
              위쪽 메뉴 <b>확장 프로그램 → Apps Script</b>
            </li>
            <li>원래 있던 내용을 모두 지우고, 아래 버튼으로 복사한 코드를 붙여넣고 저장(💾)</li>
          </ol>
          <Button
            variant="secondary"
            block
            className="mt-3 flex items-center justify-center gap-2"
            onClick={async () => {
              await copyText(gasCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            {copied ? '복사했어요' : '코드 복사하기'}
          </Button>
        </Step>

        <Step n={2} title="웹 앱으로 배포하기">
          <p>
            Apps Script 오른쪽 위 <b>배포 → 새 배포 → ⚙️ → 웹 앱</b>
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed">
            <li>
              다음 사용자 인증 정보로 실행: <b>나</b>
            </li>
            <li>
              액세스 권한이 있는 사용자: <b>모든 사용자</b>
            </li>
          </ul>
          <p className="mt-2 text-sm text-muted">
            [배포]를 누르고 권한 승인 화면이 나오면 계정 선택 → <b>고급</b> → <b>이동</b> → <b>허용</b>. 마지막 화면의 <b>웹 앱 URL</b>을 복사하세요.
          </p>
        </Step>

        <Step n={3} title="웹 앱 주소 붙여넣기">
          <form onSubmit={connect} className="flex flex-col gap-3">
            <input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://script.google.com/macros/s/…/exec"
              autoComplete="off"
              spellCheck={false}
              className="h-13 min-h-[52px] px-4 rounded-xl border border-line text-sm focus:outline-none focus:border-brand"
            />
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" block disabled={busy || !url.trim()}>
              {busy ? '확인 중…' : '연결하기'}
            </Button>
          </form>
          <p className="mt-3 text-sm text-muted">
            다음은 시트를 새로고침해서 생긴 <b>[믿음의 항해]</b> 메뉴에서 <b>교사 비밀번호 정하기</b>를 하면 끝이에요.
          </p>
        </Step>
      </main>
    </div>
  );
};

const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="rounded-2xl bg-white border border-line p-5 flex gap-3">
    <span className="w-8 h-8 shrink-0 rounded-full bg-brand text-white font-black flex items-center justify-center">{n}</span>
    <div className="min-w-0 flex-1 leading-relaxed">
      <p className="font-bold text-lg">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  </section>
);
