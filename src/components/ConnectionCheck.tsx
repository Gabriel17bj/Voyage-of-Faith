import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { diagnoseConnection, SyncDiagnosis } from '../utils/cloud';

/** 학생에게 보낼 초대 링크의 기본 주소 (VITE_PUBLIC_APP_URL이 있으면 우선 사용) */
export function getInviteBaseUrl(): string {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL || '').trim();
  if (configured) return configured.replace(/[?#].*$/, '').replace(/\/+$/, '') + '/';
  if (typeof window === 'undefined') return '/';
  return window.location.origin + window.location.pathname;
}

export function buildInviteLink(classCode: string): string {
  return `${getInviteBaseUrl()}?code=${encodeURIComponent(classCode)}`;
}

/** 다른 휴대폰에서 열 수 없는 주소인지 검사 */
export function getInviteUrlWarning(): string | null {
  let host = '';
  try {
    host = new URL(getInviteBaseUrl()).hostname;
  } catch {
    return null;
  }
  if (host === 'localhost' || host.startsWith('127.') || host.startsWith('192.168.') || host.startsWith('10.')) {
    return '이 주소는 학생 휴대폰에서 열리지 않아요. 배포한 사이트 주소(예: https://프로젝트이름.vercel.app)에서 링크를 복사하세요.';
  }
  if (host.startsWith('ais-dev-') || host.includes('aistudio') || host.endsWith('.googleusercontent.com')) {
    return 'AI Studio 미리보기 주소는 학생이 열 수 없어요. 배포한 사이트 주소(예: https://프로젝트이름.vercel.app)에서 링크를 복사하세요.';
  }
  if (host.endsWith('.vercel.app') && (host.includes('-git-') || /-[a-z0-9]{9}-/.test(host))) {
    return 'Vercel 미리보기 주소는 학생이 열 수 없을 수 있어요. https://프로젝트이름.vercel.app 주소에서 링크를 복사하세요.';
  }
  return null;
}

interface ConnectionCheckProps {
  classCode?: string;
  autoRun?: boolean;
  compact?: boolean;
}

export const ConnectionCheck: React.FC<ConnectionCheckProps> = ({ classCode, autoRun = false, compact = false }) => {
  const [result, setResult] = useState<SyncDiagnosis | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      setResult(await diagnoseConnection(classCode));
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (autoRun) run();
  }, [autoRun, classCode]);

  const modeLabel =
    result?.mode === 'gas'
      ? '구글 스프레드시트'
      : result?.mode === 'firebase'
      ? 'Firebase'
      : result?.mode === 'server'
      ? '자체 서버'
      : result?.mode === 'local'
      ? '저장소 없음'
      : '';

  return (
    <div className="rounded-2xl bg-white border border-line p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-bold">연결 확인</p>
          {modeLabel && <p className="text-sm text-muted">저장 위치: {modeLabel}</p>}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="h-10 px-3 rounded-lg border border-line text-sm font-bold flex items-center gap-1.5 active:bg-slate-50 disabled:text-slate-400"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? '확인 중' : '다시 확인'}
        </button>
      </div>

      {result && (
        <ul className="flex flex-col gap-2">
          {result.steps.map((st, i) => (
            <li key={i} className="flex items-start gap-2 text-[15px]">
              {st.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-bold">{st.label}</p>
                {(!compact || !st.ok) && <p className="text-sm text-muted break-words">{st.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {result?.ok && <p className="text-sm font-bold text-emerald-700">학생들이 다른 휴대폰에서 들어올 수 있어요.</p>}

      {result?.sheetUrl && (
        <a href={result.sheetUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand underline underline-offset-4">
          기록 스프레드시트 열기
        </a>
      )}
    </div>
  );
};

/** 클립보드 복사 (카카오톡 등 인앱 브라우저처럼 clipboard API가 막힌 환경 대비) */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) return true;
  } catch {}
  window.prompt('아래 내용을 길게 눌러 복사하세요', text);
  return false;
}
