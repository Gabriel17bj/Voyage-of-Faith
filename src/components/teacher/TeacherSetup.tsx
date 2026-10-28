import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import gasCode from '../../../gas/Code.gs?raw';
import { copyText } from '../ConnectionCheck';
import { Button, TopBar } from '../ui';

/** 구글 시트가 아직 연결되지 않았을 때 보여 주는 설치 안내 */
export const TeacherSetup: React.FC = () => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="page bg-paper">
      <TopBar title="구글 시트 연결하기" onBack={() => (window.location.hash = '')} />
      <main className="mx-auto max-w-lg px-5 py-5 flex flex-col gap-4">
        <p className="px-1 leading-relaxed text-muted">
          학생 기록은 선생님의 <strong className="text-ink">구글 스프레드시트</strong>에 저장돼요. 처음 한 번만 아래 순서대로 연결해 주세요. (약 5분)
        </p>

        <Step n={1} title="스프레드시트 만들기">
          <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4">
            sheets.new
          </a>
          에서 새 시트를 만들고, 위쪽 메뉴 <b>확장 프로그램 → Apps Script</b>를 여세요.
        </Step>

        <Step n={2} title="코드 붙여넣기">
          <p>원래 있던 내용을 모두 지우고 아래 코드를 붙여넣은 뒤 저장(💾)하세요.</p>
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

        <Step n={3} title="웹 앱으로 배포하기">
          <p>
            오른쪽 위 <b>배포 → 새 배포 → ⚙️ → 웹 앱</b>
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed">
            <li>
              다음 사용자 인증 정보로 실행: <b>나</b>
            </li>
            <li>
              액세스 권한이 있는 사용자: <b>모든 사용자</b>
            </li>
          </ul>
          <p className="mt-2 text-sm text-muted">권한 승인 화면이 나오면 계정 선택 → 고급 → 이동 → 허용을 누르세요.</p>
        </Step>

        <Step n={4} title="비밀번호와 수업 코드 만들기">
          <p>
            스프레드시트 화면을 새로고침하면 위쪽에 <b>[믿음의 항해]</b> 메뉴가 생겨요.
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed">
            <li>
              <b>교사 비밀번호 정하기</b> → 이 선생님 화면 로그인에 사용
            </li>
            <li>
              <b>새 수업 만들기</b> → 학생에게 알려 줄 5자리 수업 코드
            </li>
          </ul>
        </Step>

        <Step n={5} title="게임에 주소 넣기">
          <p>
            메뉴 <b>[믿음의 항해 → 웹 앱 주소 보기]</b>의 주소(…/exec)를 복사해서 게임 코드의 <code className="px-1 rounded bg-slate-100">src/config.ts</code> 따옴표 안에 붙여넣고 다시 배포하세요.
          </p>
          <pre className="mt-2 rounded-lg bg-slate-900 text-slate-100 p-3 text-xs overflow-x-auto">
            {`export const GAS_WEB_APP_URL =\n  'https://script.google.com/macros/s/…/exec';`}
          </pre>
          <p className="mt-2 text-sm text-muted">Vercel 환경변수 VITE_GAS_URL 로 넣어도 돼요. 넣은 뒤에는 꼭 다시 배포(Redeploy)하세요.</p>
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
