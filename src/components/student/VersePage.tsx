import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { STAGES, TOTAL_VERSES, Verse, normalizeText, shuffle, splitWithBlanks } from '../../data/verses';
import { sounds } from '../../utils/audio';
import { Button, Notice, Stars, TopBar } from '../ui';

interface VersePageProps {
  verse: Verse;
  alreadyStars: number;
  onBack: () => void;
  onHint: () => void;
  onWrong: () => void;
  onSolved: (stars: number) => void;
  onNext: () => void;
}

type Feedback = { tone: 'error' | 'info' | 'success'; text: string } | null;

/** 힌트·오답 횟수로 별 계산: 0번 → 3개, 1번 → 2개, 2번 이상 → 1개 */
function starsFor(misses: number): number {
  return misses === 0 ? 3 : misses === 1 ? 2 : 1;
}

export const VersePage: React.FC<VersePageProps> = ({ verse, alreadyStars, onBack, onHint, onWrong, onSolved, onNext }) => {
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

  return (
    <div className="page bg-paper flex flex-col">
      <TopBar title={`${verse.id}번 말씀`} onBack={onBack} right={<span className="pr-3 text-sm text-muted">{stage.id}단계</span>} />

      <main className="mx-auto w-full max-w-lg px-5 py-5 flex-1 flex flex-col gap-4">
        <div>
          <p className="text-sm font-bold text-brand">{verse.reference}</p>
          <p className="mt-1 text-muted">{stage.guide}</p>
        </div>

        {solved ? (
          <SolvedPanel verse={verse} stars={result!} alreadyStars={alreadyStars} isLast={isLast} onNext={onNext} onBack={onBack} />
        ) : (
          <>
            <div className={shaking ? 'shake' : ''} onAnimationEnd={() => setShaking(false)}>
              {verse.blank && <BlankQuiz verse={verse} hintStep={hintStep} reveal={revealRequest} onCorrect={handleCorrect} onWrong={handleWrong} />}
              {verse.chunks && <OrderQuiz verse={verse} hintStep={hintStep} reveal={revealRequest} onCorrect={handleCorrect} onWrong={handleWrong} />}
              {verse.blanks && <BlanksQuiz verse={verse} hintStep={hintStep} reveal={revealRequest} onCorrect={handleCorrect} onWrong={handleWrong} />}
              {verse.stage >= 4 && (
                <TypingQuiz verse={verse} hidden={verse.stage === 5} hintStep={hintStep} reveal={revealRequest} onCorrect={handleCorrect} onWrong={handleWrong} />
              )}
            </div>

            {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}

            <div className="mt-auto lg:mt-2 pt-2 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => useHint(hintText(verse, hintStep))}
              >
                <Lightbulb className="w-5 h-5 text-amber-500" />
                힌트
              </Button>
              {wrongTries >= 3 && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setRevealRequest(true);
                    setTimeout(() => handleCorrect(1), 600);
                  }}
                >
                  정답 보기
                </Button>
              )}
            </div>
            <p className="text-center text-xs text-muted">힌트를 쓰거나 틀리면 별이 줄어요</p>
          </>
        )}
      </main>
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

// ───────────────────────────── 성공 화면 ─────────────────────────────

const SolvedPanel: React.FC<{
  verse: Verse;
  stars: number;
  alreadyStars: number;
  isLast: boolean;
  onNext: () => void;
  onBack: () => void;
}> = ({ verse, stars, alreadyStars, isLast, onNext, onBack }) => (
  <div className="flex-1 flex flex-col gap-4">
    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center">
      <p className="text-xl font-black text-emerald-800">정답이에요!</p>
      <div className="mt-2">
        <Stars count={stars} size="text-3xl" />
      </div>
      {alreadyStars > stars && <p className="mt-1 text-sm text-emerald-800">이전 기록(별 {alreadyStars}개)이 유지돼요.</p>}
    </div>
    <blockquote className="rounded-2xl bg-white border border-line p-5 text-[19px] leading-[1.9]">
      {verse.text}
      <footer className="mt-3 text-sm font-bold text-muted">— {verse.reference}</footer>
    </blockquote>
    <div className="mt-auto flex flex-col gap-2">
      <Button block onClick={onNext}>
        {isLast ? '결과 보기' : '다음 말씀'}
      </Button>
      <Button block variant="ghost" onClick={onBack}>
        목록으로
      </Button>
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

const verseBox = 'rounded-2xl bg-white border border-line p-5 text-[19px] leading-[2.1]';

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
              className={`min-h-[60px] rounded-xl border text-lg font-bold transition-colors ${
                gone ? 'bg-slate-50 border-line text-slate-300 line-through' : 'bg-white border-line active:bg-blue-50 active:border-brand'
              }`}
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
          <span className="text-slate-400 text-base">아래 조각을 순서대로 누르세요</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {placed.map((idx, pos) => (
              <button
                key={`${idx}-${pos}`}
                onClick={() => unplace(pos)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[17px] text-ink leading-snug text-left"
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
            className="min-h-[48px] px-4 py-2 rounded-xl bg-white border border-line text-[17px] font-bold leading-snug text-left active:bg-blue-50 active:border-brand"
          >
            {chunks[idx]}
          </button>
        ))}
      </div>
      {placed.length > 0 && <p className="text-xs text-muted">놓은 조각을 누르면 되돌릴 수 있어요.</p>}
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
            className="min-h-[52px] px-5 rounded-xl bg-white border border-line text-lg font-bold active:bg-blue-50 active:border-brand disabled:text-slate-300 disabled:bg-slate-50"
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">채운 빈칸을 누르면 지울 수 있어요.</p>
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
        <div className="rounded-2xl bg-white border border-dashed border-line p-5 text-center text-muted">
          말씀이 가려져 있어요. 외워서 써 보세요.
        </div>
      )}
      <textarea
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        rows={5}
        placeholder="여기에 말씀을 써 보세요"
        className={`w-full rounded-2xl border bg-white p-4 text-[17px] leading-relaxed focus:outline-none ${
          hasMistake ? 'border-rose-300 focus:border-rose-400' : 'border-line focus:border-brand'
        }`}
      />
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-sm font-bold w-12 text-right">{percent}%</span>
      </div>
      {hasMistake && <p className="text-sm text-rose-600">틀린 글자가 있어요. 빨간 테두리가 사라질 때까지 고쳐 보세요.</p>}
      <Button block variant="secondary" onClick={submit} disabled={!typed.trim()}>
        다 썼어요
      </Button>
    </div>
  );
};
