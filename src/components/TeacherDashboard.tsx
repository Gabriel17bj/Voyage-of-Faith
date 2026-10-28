import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Copy, Check, Download, LogOut } from 'lucide-react';
import { Classroom, GameResult, StudentSession } from '../types';
import { TOTAL_VERSES } from '../data/verses';
import {
  createClassroom,
  subscribeTeacherClassrooms,
  subscribeClassStudents,
  subscribeClassResults,
  setClassroomClosed,
  resetClassroomStudents,
  deleteClassroom,
  exportStudentsToCsv,
  exportResultsToCsv,
  generateClassCode,
  detectSyncMode,
  getGasSheetUrl,
  getTeacherKey,
  clearTeacherKey,
  isServerBuiltIn,
  SyncMode,
} from '../utils/cloud';
import { TeacherSetup } from './teacher/TeacherSetup';
import { TeacherLogin } from './teacher/TeacherLogin';
import { ConnectionCheck, buildInviteLink, copyText, getInviteUrlWarning } from './ConnectionCheck';
import { Button, Notice, ProgressBar, TopBar, formatDuration } from './ui';

const TEACHER_KEY = 'teacher@promise.land';
const LAST_CLASS_KEY = 'PROMISE_LAND_TEACHER_SELECTED_CLASS';

function readLastClass(): string {
  try {
    return localStorage.getItem(LAST_CLASS_KEY) || '';
  } catch {
    return '';
  }
}

function rememberClass(code: string) {
  try {
    if (code) localStorage.setItem(LAST_CLASS_KEY, code);
    else localStorage.removeItem(LAST_CLASS_KEY);
  } catch {}
}

export const TeacherDashboard: React.FC = () => {
  const [syncMode, setSyncMode] = useState<SyncMode | null>(null);
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getTeacherKey()));

  useEffect(() => {
    detectSyncMode().then(setSyncMode);
    // 비밀번호가 바뀌어 요청이 거절되면 로그인 화면으로
    const onSync = (e: Event) => {
      if ((e as CustomEvent).detail?.type === 'TEACHER_LOGOUT') setLoggedIn(false);
    };
    window.addEventListener('promise_land_sync', onSync);
    return () => window.removeEventListener('promise_land_sync', onSync);
  }, []);

  if (syncMode === null) {
    return <div className="page bg-paper flex items-center justify-center text-muted">불러오는 중…</div>;
  }
  if (syncMode === 'local') {
    return (
      <TeacherSetup
        onConnected={() => {
          setSyncMode(null);
          detectSyncMode().then(setSyncMode);
        }}
      />
    );
  }
  if (syncMode === 'gas' && !loggedIn) return <TeacherLogin onLoggedIn={() => setLoggedIn(true)} />;

  return (
    <TeacherHome
      syncMode={syncMode}
      onLogout={() => {
        clearTeacherKey();
        setLoggedIn(false);
      }}
    />
  );
};

const TeacherHome: React.FC<{ syncMode: SyncMode; onLogout: () => void }> = ({ syncMode, onLogout }) => {
  const [classes, setClasses] = useState<Classroom[] | null>(null);
  const [openCode, setOpenCode] = useState<string>(readLastClass);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (syncMode === 'gas') getGasSheetUrl().then(setSheetUrl);
    return subscribeTeacherClassrooms(TEACHER_KEY, setClasses);
  }, []);

  const open = (code: string) => {
    rememberClass(code);
    setOpenCode(code);
  };

  const current = classes?.find((c) => c.code === openCode);

  if (openCode && current) {
    return (
      <ClassPage
        classroom={current}
        sheetUrl={sheetUrl}
        onBack={() => open('')}
        onDeleted={() => {
          setClasses((list) => (list || []).filter((c) => c.code !== current.code));
          open('');
        }}
      />
    );
  }

  return (
    <div className="page bg-paper">
      <TopBar
        title="선생님 화면"
        onBack={() => (window.location.hash = '')}
        right={
          syncMode === 'gas' ? (
            <button onClick={onLogout} className="h-11 px-3 flex items-center gap-1.5 rounded-full text-sm text-muted active:bg-slate-100">
              <LogOut className="w-4 h-4" /> 로그아웃
            </button>
          ) : undefined
        }
      />
      <main className="mx-auto max-w-lg px-5 py-5 flex flex-col gap-5">
        <NewClassForm onCreated={open} />

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-bold text-muted">내 수업</h2>
          {classes === null ? (
            <p className="px-1 text-muted">불러오는 중…</p>
          ) : classes.length === 0 ? (
            <p className="px-1 text-muted">아직 만든 수업이 없어요.</p>
          ) : (
            <ul className="rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden">
              {classes.map((c) => (
                <li key={c.code}>
                  <button onClick={() => open(c.code)} className="w-full min-h-[64px] px-4 py-3 flex items-center gap-3 text-left active:bg-slate-50">
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold truncate">{c.title || `${c.code} 수업`}</span>
                      <span className="block text-sm text-muted">
                        코드 <span className="font-mono font-bold text-ink">{c.code}</span>
                        {c.isClosed && <span className="ml-2 text-rose-600">입장 마감</span>}
                      </span>
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {sheetUrl && (
          <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="self-center text-sm font-bold text-brand underline underline-offset-4">
            기록 스프레드시트 열기
          </a>
        )}
      </main>
    </div>
  );
};

// ───────────────────────────── 새 수업 만들기 ─────────────────────────────

const NewClassForm: React.FC<{ onCreated: (code: string) => void }> = ({ onCreated }) => {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('수업 이름을 입력해 주세요.');
    setBusy(true);
    setError(null);
    // 코드가 겹치면 새 코드로 몇 번 다시 시도
    for (let i = 0; i < 3; i++) {
      const code = generateClassCode();
      const res = await createClassroom(code, title.trim(), TEACHER_KEY);
      if (res.success) {
        setTitle('');
        setBusy(false);
        onCreated(code);
        return;
      }
      if (!res.error?.includes('이미')) {
        setError(res.error || '수업을 만들지 못했어요.');
        break;
      }
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white border border-line p-5 flex flex-col gap-3">
      <h2 className="font-bold text-lg">새 수업 만들기</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 40))}
        placeholder="예: 초등부 3반"
        className="h-13 min-h-[52px] px-4 rounded-xl border border-line focus:outline-none focus:border-brand"
      />
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" block disabled={busy}>
        {busy ? '만드는 중…' : '수업 만들기'}
      </Button>
      <p className="text-sm text-muted">학생에게 알려 줄 5자리 코드가 자동으로 만들어져요.</p>
    </form>
  );
};

// ───────────────────────────── 수업 화면 ─────────────────────────────

type Tab = 'now' | 'records' | 'manage';

const ClassPage: React.FC<{
  classroom: Classroom;
  sheetUrl: string | null;
  onBack: () => void;
  onDeleted: () => void;
}> = ({ classroom, sheetUrl, onBack, onDeleted }) => {
  const [tab, setTab] = useState<Tab>('now');
  const [students, setStudents] = useState<StudentSession[]>([]);
  const [results, setResults] = useState<GameResult[]>([]);

  useEffect(() => subscribeClassStudents(classroom.code, setStudents), [classroom.code]);
  useEffect(() => subscribeClassResults(classroom.code, setResults), [classroom.code]);

  return (
    <div className="page bg-paper">
      <TopBar title={classroom.title || `${classroom.code} 수업`} onBack={onBack} />
      <main className="mx-auto max-w-lg px-5 py-5 flex flex-col gap-4">
        <InviteCard code={classroom.code} closed={Boolean(classroom.isClosed)} />

        <nav className="grid grid-cols-3 rounded-xl bg-slate-200/70 p-1" role="tablist">
          {(
            [
              ['now', `현황 ${students.length}`],
              ['records', `기록 ${results.length}`],
              ['manage', '관리'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`h-10 rounded-lg text-[15px] font-bold ${tab === key ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === 'now' && <NowTab code={classroom.code} students={students} />}
        {tab === 'records' && <RecordsTab code={classroom.code} results={results} sheetUrl={sheetUrl} />}
        {tab === 'manage' && <ManageTab classroom={classroom} onDeleted={onDeleted} />}
      </main>
    </div>
  );
};

const InviteCard: React.FC<{ code: string; closed: boolean }> = ({ code, closed }) => {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const warning = getInviteUrlWarning();

  const copy = async (what: 'link' | 'code') => {
    await copyText(what === 'link' ? buildInviteLink(code) : code);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <section className="rounded-2xl bg-white border border-line p-5 text-center">
      <p className="text-sm text-muted">수업 코드</p>
      <p className="mt-1 font-mono text-4xl font-black tracking-[0.25em] text-brand">{code}</p>
      {closed && <p className="mt-1 text-sm font-bold text-rose-600">입장 마감됨</p>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => copy('code')} className="flex items-center justify-center gap-1.5">
          {copied === 'code' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          코드 복사
        </Button>
        <Button onClick={() => copy('link')} className="flex items-center justify-center gap-1.5">
          {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          링크 복사
        </Button>
      </div>
      {!isServerBuiltIn() && (
        <div className="mt-3 text-left">
          <Notice>
            지금은 <b>링크 복사</b>로 보낸 초대 링크로 들어와야 연결돼요. (링크로 한 번 들어온 기기는 다음부터 코드만 넣어도 돼요)
          </Notice>
        </div>
      )}
      {warning && (
        <div className="mt-3 text-left">
          <Notice tone="error">{warning}</Notice>
        </div>
      )}
    </section>
  );
};

// 현황 탭: 누가 들어왔고 어디까지 했는지
const NowTab: React.FC<{ code: string; students: StudentSession[] }> = ({ code, students }) => {
  const sorted = useMemo(
    () => [...students].sort((a, b) => b.solvedCount - a.solvedCount || b.score - a.score || (a.studentName || '').localeCompare(b.studentName || '')),
    [students]
  );
  const online = students.filter((s) => s.isOnline).length;
  const done = students.filter((s) => s.isCompleted).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Tile label="참여" value={students.length} />
        <Tile label="지금 접속" value={online} tone="text-emerald-700" />
        <Tile label="완주" value={done} tone="text-brand" />
      </div>

      {sorted.length === 0 ? (
        <p className="py-10 text-center text-muted">아직 들어온 학생이 없어요. 코드나 링크를 알려 주세요.</p>
      ) : (
        <ul className="rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden">
          {sorted.map((s) => (
            <li key={s.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} title={s.isOnline ? '접속 중' : '나감'} />
                <span className="flex-1 min-w-0 font-bold truncate">{s.studentName}</span>
                {s.isCompleted ? (
                  <span className="text-sm font-bold text-brand">완주</span>
                ) : s.currentQuestId ? (
                  <span className="text-sm text-muted">{s.currentQuestId}번 푸는 중</span>
                ) : null}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <ProgressBar value={s.solvedCount} max={TOTAL_VERSES} className="flex-1" />
                <span className="text-sm font-bold w-14 text-right">
                  {s.solvedCount}/{TOTAL_VERSES}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {s.score.toLocaleString()}점 · 틀림 {s.wrongAnswersCount} · 힌트 {s.hintsUsed}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted">몇 초마다 자동으로 새로고침돼요.</p>
        <Button variant="ghost" className="flex items-center gap-1.5 !px-2" disabled={students.length === 0} onClick={() => exportStudentsToCsv(sorted, code)}>
          <Download className="w-4 h-4" /> 엑셀(CSV)
        </Button>
      </div>
    </div>
  );
};

// 기록 탭: 완주/중도 종료 결과
const RecordsTab: React.FC<{ code: string; results: GameResult[]; sheetUrl: string | null }> = ({ code, results, sheetUrl }) => (
  <div className="flex flex-col gap-3">
    <p className="px-1 text-sm text-muted">학생이 끝까지 풀거나 중간에 그만두면 결과가 한 줄씩 남아요.</p>
    {results.length === 0 ? (
      <p className="py-10 text-center text-muted">아직 기록이 없어요.</p>
    ) : (
      <ul className="rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden">
        {results.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex-1 min-w-0 font-bold truncate">{r.studentName}</span>
              <span className={`text-sm font-bold ${r.isCompleted ? 'text-brand' : 'text-amber-600'}`}>{r.isCompleted ? '완주' : '중간 종료'}</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {r.score.toLocaleString()}점 · {r.solvedCount}/{TOTAL_VERSES} · {formatDuration(r.elapsedTimeMs)} ·{' '}
              {new Date(r.finishedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </li>
        ))}
      </ul>
    )}
    <div className="flex items-center justify-between gap-2">
      {sheetUrl ? (
        <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand underline underline-offset-4">
          스프레드시트에서 보기
        </a>
      ) : (
        <span />
      )}
      <Button variant="ghost" className="flex items-center gap-1.5 !px-2" disabled={results.length === 0} onClick={() => exportResultsToCsv(results, code)}>
        <Download className="w-4 h-4" /> 엑셀(CSV)
      </Button>
    </div>
  </div>
);

// 관리 탭
const ManageTab: React.FC<{ classroom: Classroom; onDeleted: () => void }> = ({ classroom, onDeleted }) => {
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden">
        <Row
          title={classroom.isClosed ? '입장 다시 열기' : '입장 마감하기'}
          desc={classroom.isClosed ? '새 학생이 다시 들어올 수 있어요.' : '새 학생이 들어오지 못해요. 이미 들어온 학생은 계속 풀 수 있어요.'}
          action={
            <Button variant="secondary" disabled={busy} onClick={() => run(() => setClassroomClosed(classroom.code, !classroom.isClosed))}>
              {classroom.isClosed ? '열기' : '마감'}
            </Button>
          }
        />
        <Row
          title="현황 비우기"
          desc="현황 목록만 비워요. 기록은 남아요."
          action={
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => window.confirm('현황 목록을 비울까요?') && run(() => resetClassroomStudents(classroom.code))}
            >
              비우기
            </Button>
          }
        />
        <Row
          title="수업 삭제"
          desc="수업과 현황을 지워요. 스프레드시트의 기록은 남아요."
          action={
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm(`'${classroom.title}' 수업을 삭제할까요?`)) return;
                await run(() => deleteClassroom(classroom.code));
                onDeleted();
              }}
            >
              삭제
            </Button>
          }
        />
      </section>
      <ConnectionCheck classCode={classroom.code} autoRun compact />
    </div>
  );
};

const Row: React.FC<{ title: string; desc: string; action: React.ReactNode }> = ({ title, desc, action }) => (
  <div className="p-4 flex items-center gap-3">
    <div className="flex-1 min-w-0">
      <p className="font-bold">{title}</p>
      <p className="text-sm text-muted">{desc}</p>
    </div>
    {action}
  </div>
);

const Tile: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone = 'text-ink' }) => (
  <div className="rounded-xl bg-white border border-line py-3">
    <p className={`text-2xl font-black ${tone}`}>{value}</p>
    <p className="text-sm text-muted">{label}</p>
  </div>
);
