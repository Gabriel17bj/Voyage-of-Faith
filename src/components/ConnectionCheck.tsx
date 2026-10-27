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
    return '지금 주소는 이 컴퓨터에서만 열리는 주소입니다. 학생 휴대폰에서는 접속할 수 없습니다. Vercel 배포 주소에서 교사 대시보드를 열어 링크를 복사하세요.';
  }
  if (host.startsWith('ais-dev-') || host.includes('aistudio') || host.endsWith('.googleusercontent.com')) {
    return '지금 주소는 Google AI Studio 미리보기 주소라 본인만 열 수 있습니다. 학생에게는 Vercel 배포 주소(예: https://프로젝트이름.vercel.app)의 링크를 보내세요.';
  }
  if (host.endsWith('.vercel.app') && (host.includes('-git-') || /-[a-z0-9]{9}-/.test(host))) {
    return '지금 주소는 Vercel "미리보기 배포" 주소입니다. 미리보기 주소는 Vercel 로그인이 필요해 학생이 열 수 없을 수 있습니다. Production 주소(https://프로젝트이름.vercel.app)를 사용하세요.';
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

  const urlWarning = getInviteUrlWarning();
  const modeLabel =
    result?.mode === 'gas' ? '구글 스프레드시트' : result?.mode === 'firebase' ? 'Firebase 클라우드' : result?.mode === 'server' ? '자체 서버(server.ts)' : result?.mode === 'local' ? '로컬(이 기기만)' : '확인 중';

  return (
    <div className={`rounded-xl border ${result && !result.ok ? 'border-red-500/60 bg-red-950/30' : 'border-slate-700 bg-slate-900/80'} p-3 text-xs flex flex-col gap-2`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-slate-100">
          📡 다른 기기 접속 진단 <span className="font-normal text-slate-400">({modeLabel})</span>
        </span>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 font-bold flex items-center gap-1 disabled:opacity-60 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          {running ? '진단 중' : '진단하기'}
        </button>
      </div>

      {result && (
        <ul className="flex flex-col gap-1.5">
          {result.steps.map((st, i) => (
            <li key={i} className="flex items-start gap-2">
              {st.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-px" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-px" />
              )}
              <div className="min-w-0">
                <div className={`font-bold ${st.ok ? 'text-emerald-200' : 'text-red-200'}`}>{st.label}</div>
                {!compact || !st.ok ? <div className="text-slate-300 break-words">{st.detail}</div> : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {result?.ok && (
        <div className="text-emerald-300 font-bold">✅ 다른 휴대폰에서 이 수업 코드로 접속할 수 있는 상태입니다.</div>
      )}

      {result?.sheetUrl && (
        <a
          href={result.sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
        >
          📊 기록 스프레드시트 열기
        </a>
      )}

      {urlWarning && (
        <div className="rounded-lg border border-amber-400/60 bg-amber-950/50 p-2 text-amber-100 leading-relaxed">
          ⚠️ {urlWarning}
        </div>
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
