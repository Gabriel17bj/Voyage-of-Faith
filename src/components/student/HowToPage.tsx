import React from 'react';
import { STAGES, versesOfStage } from '../../data/verses';
import { TopBar } from '../ui';

export const HowToPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="page bg-paper">
    <TopBar title="게임 방법" onBack={onBack} />
    <main className="mx-auto max-w-lg px-5 py-5 flex flex-col gap-5">
      <section className="rounded-2xl bg-white border border-line p-5 leading-relaxed">
        <p>
          말씀을 하나씩 풀면서 <strong>5단계</strong>를 차례로 지나가요. 앞 말씀을 풀어야 다음 말씀이 열려요.
        </p>
      </section>

      <ol className="rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden">
        {STAGES.map((s) => (
          <li key={s.id} className="p-4 flex gap-3">
            <span className="w-8 h-8 shrink-0 rounded-full bg-blue-100 text-brand font-black flex items-center justify-center">{s.id}</span>
            <div>
              <p className="font-bold">
                {s.title} <span className="font-normal text-muted">· {versesOfStage(s.id).length}개</span>
              </p>
              <p className="text-sm text-muted">{s.guide}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="rounded-2xl bg-white border border-line p-5 flex flex-col gap-2 leading-relaxed">
        <p className="font-bold">별과 점수</p>
        <p>
          한 번에 맞히면 <span className="text-amber-400">★★★</span>, 힌트를 쓰거나 틀리면 별이 줄어요.
        </p>
        <p>막히면 <strong>힌트</strong>를 누르세요. 세 번 틀리면 <strong>정답 보기</strong>도 할 수 있어요.</p>
        <p>수업 코드로 들어오면 내 진행 상황이 선생님 화면에 기록돼요.</p>
      </section>
    </main>
  </div>
);
