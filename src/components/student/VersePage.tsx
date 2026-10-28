import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { STAGES, TOTAL_VERSES, Verse, normalizeText, shuffle, splitWithBlanks } from '../../data/verses';
import { sounds } from '../../utils/audio';

interface VersePageProps {
  verse: Verse;
  alreadyStars: number;
  stageDone: number;
  stageTotal: number;
  onBack: () => void;
  onHint: () => void;
  onWrong: () => void;
  onSolved: (stars: number) => void;
  onNext: () => void;
}

type Feedback = { tone: 'error' | 'info'; text: string } | null;

/** 힌트·오답 횟수로 별 계산: 0번 → 3개, 1번 → 2개, 2번 이상 → 1개 */
function starsFor(misses: number): number {
  return misses === 0 ? 3 : misses === 1 ? 2 : 1;
}

export const VersePage: React.FC<VersePageProps> = ({
  verse,
  alreadyStars,
  stageDone,
  stageTotal,
  onBack,
  onHint,
  onWrong,
  onSolved,
  onNext,
}) => {
  const stage = STAGES.find((s) => s.id === verse.stage)!;
  const [misses, setMisses] = useState(0);
  const [wrongTries, setWrongTries] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [result, setResult] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [revealRequest, setRevealRequest] = useState(false);
  const solvedRef = useRef(false);

  // 말씀이 바뀌면 상태 초기화
  useEffect(() => {
    setMisses(0);
    setWrongTries(0);
    setFeedback(null);
    setResult(null);
    setHintStep(0);
    setRevealRequest(false);
    solvedRef.current = false;
    window.scrollTo(0, 0);
  }, [verse.id]);

  const solved = result !== null;

  const handleWrong = (text: string) => {
    sounds.playWrong();
    onWrong();
    setMisses((m) => m + 1);
    setWrongTries((w) => w + 1);
    setFeedback({ tone: 'error', text });
    setShaking(true);
  };

  const handleCorrect = (forcedStars?: number) => {
    if (solvedRef.current) return;
    solvedRef.current = true;
    const stars = forcedStars ?? starsFor(misses);
    sounds.playCorrect();
    setResult(stars);
    setFeedback(null);
    onSolved(stars);
  };

  const useHint = (text?: string) => {
    sounds.playHint();
    onHint();
    setMisses((m) => m + 1);
    setHintStep((h) => h + 1);
    if (text) setFeedback({ tone: 'info', text });
  };

  const isLast = verse.id === TOTAL_VERSES;
  const shownDone = Math.min(stageTotal, stageDone);

  return (
    <div className="page bg-sea flex flex-col">
      {/* 상단: 닫기 + 이번 단계 진행 */}
      <header className="sticky top-0 z-10 pt-[env(safe-area-inset-top)] bg-sky-700/95 border-b-4 border-sky-900/40">
        <div className="mx-auto max-w-md h-14 px-3 flex items-center gap-3">
          <button onClick={onBack} className="w-11 h-11 -ml-1 flex items-center justify-center rounded-full text-white active:bg-white/10" aria-label="지도로 돌아가기">
            <X className="w-7 h-7" />
          </button>
          <div className="flex-1 h-4 rounded-full bg-sky-950/40 overflow-hidden">
            <div className="h-full rounded-full bg-amber-400 transition-[width] duration-300" style={{ width: `${(shownDone / stageTotal) * 100}%` }} />
          </div>
          <span className="text-sm font-black text-white whitespace-nowrap">
            {shownDone}/{stageTotal}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-4 pb-6 flex-1 flex flex-col gap-4">
        <div className="text-white">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-black">
            {stage.id}단계 · {stage.title} · {verse.id}번
          </span>
          <p className="mt-2 text-2xl font-black [text-shadow:0_2px_0_rgba(3,105,161,0.6)]">{verse.reference}</p>
          <p className="mt-0.5 font-bold text-sky-100">{stage.guide}</p>
        </div>

        <div className={shaking ? 'shake' : ''} onAnimationEnd={() => setShaking(false)}>
          {verse.blank && <BlankQuiz verse={verse} hintStep={hintStep} reveal={revealRequest} onCorrect={handleCorrect} onWrong={handleWrong} />}
          {verse.chunks && <OrderQuiz verse={verse} hintStep={hintStep} reveal={revealRequest} onCorrect={handleCorrect} onWrong={handleWrong} />}
          {verse.blanks && <BlanksQuiz verse={verse} hintStep={hintStep} reveal={revealRequest} onCorrect={handleCorrect} onWrong={handleWrong} />}
          {verse.stage >= 4 && (
            <TypingQuiz verse={verse} hidden={verse.stage === 5} hintStep={hintStep} reveal={revealRequest} onCorrect={handleCorrect} onWrong={handleWrong} />
          )}
        </div>

        {feedback && (
          <div
            role={feedback.tone === 'error' ? 'alert' : undefined}
            className={`rounded-2xl px-4 py-3 font-bold border-b-4 ${
              feedback.tone === 'error' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            {feedback.tone === 'error' ? '앗! ' : '💡 '}
            {feedback.text}
          </div>
        )}

        {!solved && (
          <div className="mt-auto pt-2 flex gap-3">
            <button className="btn-game btn-white flex-1 h-14 text-lg" onClick={() => useHint(hintText(verse, hintStep))}>
              💡 힌트
            </button>
            {wrongTries >= 3 && (
              <button
                className="btn-game btn-white flex-1 h-14 text-lg"
                onClick={() => {
                  setRevealRequest(true);
                  setTimeout(() => handleCorrect(1), 600);
                }}
              >
                🔑 정답 보기
              </button>
            )}
          </div>
        )}
        {!solved && <p className="text-center text-xs font-bold text-sky-100">힌트를 쓰거나 틀리면 별이 줄어요</p>}
      </main>

      {solved && <ResultSheet verse={verse} stars={result!} alreadyStars={alreadyStars} isLast={isLast} onNext={onNext} onBack={onBack} />}
    </div>
  );
};

/** 힌트 문구 (빈칸형은 첫 글자 → 보기 줄이기 순서, 나머지는 각 퀴즈가 직접 도와줌) */
function hintText(verse: Verse, step: number): string | undefined {
  if (verse.blank) {
    return step === 0 ? `정답은 '${verse.blank.answer[0]}'(으)로 시작해요.` : '틀린 보기 하나를 지웠어요.';
  }
  if (verse.chunks) return '다음 조각을 놓아 드렸어요.';
  if (verse.blanks) return '빈칸 하나를 채워 드렸어요.';
  return verse.stage === 5 ? '말씀을 잠깐 보여 드려요.' : '다음 낱말을 넣어 드렸어요.';
}

// ───────────────────────────── 정답 패널 ─────────────────────────────

const PRAISE = ['', '해냈어요!', '잘했어요!', '완벽해요!'];

const ResultSheet: React.FC<{
  verse: Verse;
  stars: number;
  alreadyStars: number;
  isLast: boolean;
  onNext: () => void;
  onBack: () => void;
}> = ({ verse, stars, alreadyStars, isLast, onNext, onBack }) => (
  <div className="fixed inset-0 z-30 flex flex-col justify-end bg-sky-950/40">
    <div className="sheet-up bg-emerald-50 border-t-4 border-emerald-400 rounded-t-3xl px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md flex flex-col gap-4">
        <div className="text-center">
          <p className="text-2xl font-black text-emerald-700">🎉 {PRAISE[stars]}</p>
          <div className="mt-1 text-5xl tracking-wide">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`pop inline-block ${i <= stars ? 'text-amber-400' : 'text-slate-300'}`} style={{ animationDelay: `${i * 120}ms` }}>
                ★
              </span>
            ))}
          </div>
          {alreadyStars > stars && <p className="text-sm font-bold text-emerald-800">전에 받은 별 {alreadyStars}개가 유지돼요.</p>}
        </div>
        <blockquote className="scroll-card p-4 text-[17px] leading-[1.8] max-h-[34vh] overflow-y-auto">
          {verse.text}
          <footer className="mt-2 text-sm font-bold text-amber-800">— {verse.reference}</footer>
        </blockquote>
        <button onClick={onNext} className="btn-game btn-green h-16 text-xl">
          {isLast ? '👑 약속의 땅 도착!' : '계속 항해하기 ⛵'}
        </button>
        <button onClick={onBack} className="text-sm font-bold text-emerald-800 underline underline-offset-4">
          지도 보기
        </button>
      </div>
    </div>
  </div>
);

interface QuizProps {
  verse: Verse;
  hintStep: number;
  reveal: boolean;
  onCorrect: () => void;
  onWrong: (message: string) => void;
}

const verseBox = 'scroll-card p-5 text-[19px] leading-[2.1] text-ink';

// ───────────────────────────── 1단계: 빈칸 1개 ─────────────────────────────

const BlankQuiz: React.FC<QuizProps> = ({ verse, hintStep, reveal, onCorrect, onWrong }) => {
  const { answer, options } = verse.blank!;
  const shuffled = useMemo(() => shuffle(options), [verse.id]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [before, after] = useMemo(() => {
    const at = verse.text.indexOf(answer);
    return [verse.text.slice(0, at), verse.text.slice(at + answer.length)];
  }, [verse.id]);

  // 두 번째 힌트부터 틀린 보기를 하나씩 지움
  useEffect(() => {
    if (hintStep >= 2) {
      const wrong = shuffled.filter((o) => o !== answer && !removed.includes(o));
      if (wrong.length > 1) setRemoved((r) => [...r, wrong[0]]);
    }
  }, [hintStep]);

  useEffect(() => {
    if (reveal) setChosen(answer);
  }, [reveal]);

  const pick = (opt: string) => {
    if (opt === answer) {
      setChosen(opt);
      setTimeout(onCorrect, 350);
    } else {
      setRemoved((r) => [...r, opt]);
      onWrong(`'${opt}'${josa(opt, '은', '는')} 아니에요. 다시 골라 보세요.`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className={verseBox}>
        {before}
        <span
          className={`inline-block min-w-[4.5em] mx-1 px-2 rounded-lg border-2 text-center font-bold ${
            chosen ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-dashed border-brand text-brand'
          }`}
        >
          {chosen || '?'}
        </span>
        {after}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {shuffled.map((opt) => {
          const gone = removed.includes(opt);
          return (
            <button
              key={opt}
              disabled={gone || Boolean(chosen)}
              onClick={() => pick(opt)}
              className={`btn-game btn-white min-h-[64px] text-xl ${gone ? 'is-wrong line-through' : ''} ${chosen === opt ? 'is-right' : ''}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ───────────────────────────── 2단계: 순서 맞추기 ─────────────────────────────

const OrderQuiz: React.FC<QuizProps> = ({ verse, hintStep, reveal, onCorrect, onWrong }) => {
  const chunks = verse.chunks!;
  // 같은 글자의 조각이 있어도 구분되도록 번호로 관리
  const [pool, setPool] = useState<number[]>(() => shuffleNotSorted(chunks.length));
  const [placed, setPlaced] = useState<number[]>([]);

  useEffect(() => {
    setPool(shuffleNotSorted(chunks.length));
    setPlaced([]);
  }, [verse.id]);

  const correctPrefix = (list: number[]) => {
    let n = 0;
    while (n < list.length && chunks[list[n]] === chunks[n]) n++;
    return n;
  };

  // 힌트: 맞게 놓인 부분 뒤에 다음 조각을 놓아 줌
  useEffect(() => {
    if (hintStep === 0) return;
    const keep = placed.slice(0, correctPrefix(placed));
    if (keep.length >= chunks.length) return;
    const next = [...keep, keep.length];
    setPlaced(next);
    setPool(shuffleNotSorted(chunks.length).filter((i) => !next.includes(i)));
    if (next.length === chunks.length) setTimeout(onCorrect, 350);
  }, [hintStep]);

  useEffect(() => {
    if (reveal) {
      setPlaced(chunks.map((_, i) => i));
      setPool([]);
    }
  }, [reveal]);

  const place = (idx: number) => {
    const next = [...placed, idx];
    setPlaced(next);
    setPool((p) => p.filter((i) => i !== idx));
    sounds.playChip();
    if (next.length === chunks.length) {
      const ok = next.every((i, n) => chunks[i] === chunks[n]);
      if (ok) {
        setTimeout(onCorrect, 350);
      } else {
        // 맞은 앞부분은 남기고 나머지는 되돌림
        const keep = next.slice(0, correctPrefix(next));
        setTimeout(() => {
          setPlaced(keep);
          setPool(shuffleNotSorted(chunks.length).filter((i) => !keep.includes(i)));
        }, 500);
        onWrong(keep.length ? `앞의 ${keep.length}조각은 맞았어요. 나머지를 다시 맞춰 보세요.` : '순서가 달라요. 처음부터 다시 해 보세요.');
      }
    }
  };

  const unplace = (pos: number) => {
    const idx = placed[pos];
    setPlaced((p) => p.filter((_, i) => i !== pos));
    setPool((p) => [...p, idx]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className={`${verseBox} min-h-[140px]`}>
        {placed.length === 0 ? (
          <span className="text-amber-800/60 text-base font-bold">아래 조각을 순서대로 누르세요 👇</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {placed.map((idx, pos) => (
              <button
                key={`${idx}-${pos}`}
                onClick={() => unplace(pos)}
                className="px-3 py-1.5 rounded-lg bg-white border-2 border-amber-300 text-[17px] text-ink leading-snug text-left"
              >
                {chunks[idx]}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map((idx) => (
          <button
            key={idx}
            onClick={() => place(idx)}
            className="btn-game btn-white min-h-[52px] px-4 py-2 text-[17px] leading-snug text-left"
          >
            {chunks[idx]}
          </button>
        ))}
      </div>
      {placed.length > 0 && <p className="text-xs font-bold text-sky-100">놓은 조각을 누르면 되돌릴 수 있어요.</p>}
    </div>
  );
};

/** 받침 유무에 따라 조사 고르기 (은/는, 이/가) */
function josa(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return withoutFinal;
  return code % 28 ? withFinal : withoutFinal;
}

function shuffleNotSorted(n: number): number[] {
  const base = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return base;
  let s = shuffle(base);
  while (s.every((v, i) => v === i)) s = shuffle(base);
  return s;
}

// ───────────────────────────── 3단계: 빈칸 여러 개 ─────────────────────────────

const BlanksQuiz: React.FC<QuizProps> = ({ verse, hintStep, reveal, onCorrect, onWrong }) => {
  const { answers, options } = verse.blanks!;
  const parts = useMemo(() => splitWithBlanks(verse.text, answers), [verse.id]);
  const shuffled = useMemo(() => shuffle(options), [verse.id]);
  const [filled, setFilled] = useState<(string | null)[]>(() => answers.map(() => null));
  const [wrongSlots, setWrongSlots] = useState<number[]>([]);

  useEffect(() => {
    setFilled(answers.map(() => null));
    setWrongSlots([]);
  }, [verse.id]);

  const active = filled.findIndex((f) => f === null);

  const check = (next: (string | null)[]) => {
    if (next.some((f) => f === null)) return;
    const wrong = next.map((f, i) => (f === answers[i] ? -1 : i)).filter((i) => i >= 0);
    if (wrong.length === 0) {
      setTimeout(onCorrect, 350);
    } else {
      setWrongSlots(wrong);
      onWrong(`빈칸 ${wrong.map((i) => i + 1).join(', ')}번이 틀렸어요. 다시 골라 보세요.`);
      setTimeout(() => {
        setFilled((cur) => cur.map((f, i) => (wrong.includes(i) ? null : f)));
        setWrongSlots([]);
      }, 700);
    }
  };

  const choose = (word: string) => {
    if (active < 0) return;
    sounds.playChip();
    const next = filled.map((f, i) => (i === active ? word : f));
    setFilled(next);
    check(next);
  };

  // 힌트: 다음 빈칸을 정답으로 채움
  useEffect(() => {
    if (hintStep === 0) return;
    const target = filled.findIndex((f, i) => f !== answers[i]);
    if (target < 0) return;
    // 같은 낱말이 다른 빈칸에 잘못 들어가 있으면 비워서 중복을 막음
    const next = filled.map((f, i) => (i === target ? answers[i] : f === answers[target] ? null : f));
    setFilled(next);
    check(next);
  }, [hintStep]);

  useEffect(() => {
    if (reveal) setFilled([...answers]);
  }, [reveal]);

  const used = filled.filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-4">
      <p className={verseBox}>
        {parts.map((p, i) =>
          typeof p === 'number' ? (
            <button
              key={i}
              onClick={() => filled[p] && setFilled((cur) => cur.map((f, j) => (j === p ? null : f)))}
              className={`inline-block min-w-[4.5em] mx-1 px-2 rounded-lg border-2 font-bold align-baseline leading-[1.7] ${
                wrongSlots.includes(p)
                  ? 'border-rose-400 bg-rose-50 text-rose-700'
                  : filled[p]
                  ? 'border-blue-300 bg-blue-50 text-ink'
                  : p === active
                  ? 'border-brand border-dashed text-brand'
                  : 'border-dashed border-slate-300 text-slate-400'
              }`}
            >
              {filled[p] || `빈칸 ${p + 1}`}
            </button>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {shuffled.map((opt) => (
          <button
            key={opt}
            disabled={used.includes(opt) || active < 0}
            onClick={() => choose(opt)}
            className="btn-game btn-white min-h-[56px] px-5 text-lg"
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="text-xs font-bold text-sky-100">채운 빈칸을 누르면 지울 수 있어요.</p>
    </div>
  );
};

// ───────────────────────────── 4·5단계: 쓰기 ─────────────────────────────

const TypingQuiz: React.FC<QuizProps & { hidden: boolean }> = ({ verse, hidden, hintStep, reveal, onCorrect, onWrong }) => {
  const [typed, setTyped] = useState('');
  const [peek, setPeek] = useState(false);
  const doneRef = useRef(false);
  const target = normalizeText(verse.text);
  const words = useMemo(() => verse.text.split(/\s+/), [verse.id]);

  useEffect(() => {
    setTyped('');
    setPeek(false);
    doneRef.current = false;
  }, [verse.id]);

  // 맞게 쓴 글자 수 (공백·문장부호 제외)
  const matched = useMemo(() => {
    const t = normalizeText(typed);
    let n = 0;
    while (n < t.length && t[n] === target[n]) n++;
    return n;
  }, [typed, target]);
  const percent = Math.round((matched / target.length) * 100);
  const hasMistake = normalizeText(typed).length > matched;

  useEffect(() => {
    if (!doneRef.current && normalizeText(typed) === target) {
      doneRef.current = true;
      setTimeout(onCorrect, 300);
    }
  }, [typed]);

  // 힌트: 다음 낱말 넣기 (외워 쓰기는 말씀을 3초간 보여 줌)
  useEffect(() => {
    if (hintStep === 0) return;
    if (hidden) {
      setPeek(true);
      const t = setTimeout(() => setPeek(false), 3000);
      return () => clearTimeout(t);
    }
    // 맞게 쓴 부분까지의 낱말 수를 세어 다음 낱말을 붙임
    let count = 0;
    let len = 0;
    while (count < words.length && len + normalizeText(words[count]).length <= matched) {
      len += normalizeText(words[count]).length;
      count++;
    }
    setTyped(words.slice(0, Math.min(words.length, count + 1)).join(' ') + ' ');
  }, [hintStep]);

  useEffect(() => {
    if (reveal) setTyped(verse.text);
  }, [reveal]);

  const submit = () => {
    if (normalizeText(typed) === target) return onCorrect();
    const nextWord = (() => {
      let len = 0;
      for (const w of words) {
        const n = normalizeText(w).length;
        if (len + n > matched) return w;
        len += n;
      }
      return '';
    })();
    onWrong(
      matched === 0
        ? '처음부터 다시 확인해 보세요.'
        : `${percent}%까지 맞았어요. '${nextWord}' 부분을 확인해 보세요.`
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {(!hidden || peek) && <p className={`${verseBox} ${hidden ? 'bg-amber-50 border-amber-200' : ''}`}>{verse.text}</p>}
      {hidden && !peek && (
        <div className="scroll-card p-5 text-center font-bold text-amber-900">
          📜 말씀이 가려져 있어요. 외워서 써 보세요!
        </div>
      )}
      <textarea
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        rows={5}
        placeholder="여기에 말씀을 써 보세요"
        className={`w-full rounded-2xl border-4 bg-white p-4 text-[17px] leading-relaxed focus:outline-none ${
          hasMistake ? 'border-rose-400' : 'border-sky-300 focus:border-amber-400'
        }`}
      />
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 rounded-full bg-sky-950/40 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-sm font-black text-white w-12 text-right">{percent}%</span>
      </div>
      {hasMistake && <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-bold text-rose-700">틀린 글자가 있어요. 빨간 테두리가 사라질 때까지 고쳐 보세요.</p>}
      <button className="btn-game btn-green h-14 text-lg" onClick={submit} disabled={!typed.trim()}>
        다 썼어요
      </button>
    </div>
  );
};
