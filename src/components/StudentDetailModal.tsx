import React, { useState } from 'react';
import { StudentSession } from '../types';
import { VERSE_QUESTS, SECTOR_LIST, FAM_LIST } from '../data/verses';
import { HERO_CHARACTERS, MASCOT_PETS } from '../data/characters';
import { getRankTier } from '../utils/score';
import {
  X,
  Trophy,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Share2,
  Copy,
  Check,
  Flame,
  Award,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface StudentDetailModalProps {
  student: StudentSession;
  rank: number;
  totalStudents: number;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  rank,
  totalStudents,
  onClose,
}) => {
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(
    student.currentQuestId || (student.solvedQuestIds.length > 0 ? student.solvedQuestIds[student.solvedQuestIds.length - 1] : 1)
  );

  const hero = HERO_CHARACTERS.find((h) => h.id === student.characterId) || HERO_CHARACTERS[0];
  const pet = MASCOT_PETS.find((p) => p.id === student.famId) || MASCOT_PETS[0];
  const fam = FAM_LIST.find((f) => f.id === student.famId) || FAM_LIST[0];
  const tier = getRankTier(student.score, student.solvedCount);

  // Time format
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}분 ${s}초`;
  };

  // Wrong verses list
  const wrongVerses = Object.entries(student.wrongQuestCounts || {})
    .filter(([_, count]) => Number(count) > 0)
    .map(([qIdStr, count]) => {
      const qId = Number(qIdStr);
      const quest = VERSE_QUESTS.find((q) => q.id === qId);
      const numCount = Number(count);
      return {
        questId: qId,
        count: numCount,
        quest,
        isSolved: student.solvedQuestIds.includes(qId),
      };
    })
    .sort((a, b) => b.count - a.count);

  const selectedQuest = VERSE_QUESTS.find((q) => q.id === selectedQuestId);

  // Copy KakaoTalk / Parent report
  const handleCopyReport = () => {
    sounds.playTap();
    const reportText = `[PROMISE LAND : 믿음의 항해 활동 보고서]
━━━━━━━━━━━━━━━━━━━━
■ 학생: ${student.studentName} (${hero.name.ko})
■ 수업 코드: ${student.classCode}
■ 최종 순위: ${rank}위 / 총 ${totalStudents}명
■ 종합 점수: ${student.score.toLocaleString()}점 (${tier.badge} ${tier.tier})
■ 말씀 완주: ${student.solvedCount} / 36개 (${Math.round((student.solvedCount / 36) * 100)}%)
■ 획득한 별: ⭐ ${student.totalStars}개
■ 총 소요 시간: ${formatTime(student.elapsedTimeMs)}
■ 힌트 사용: ${student.hintsUsed}회 / 오답: ${student.wrongAnswersCount}회
${wrongVerses.length > 0 ? `■ 보충 권장 구절:\n${wrongVerses.map(v => ` - [${v.quest?.reference.ko}] (${v.count}회 오답)`).join('\n')}` : '■ 모든 암송 퀴즈를 뛰어난 실력으로 통과하였습니다!'}
━━━━━━━━━━━━━━━━━━━━
예수님과 함께하는 믿음의 항해에 동참해 주셔서 감사합니다!`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-[#091527] border-2 sm:border-4 border-[#8e5837] rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[92dvh] overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#06101e]">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-900 shadow-md shrink-0">
              <img
                src={hero.image}
                alt={student.studentName}
                className="w-full h-full object-cover"
              />
              {student.isOnline && (
                <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  {student.studentName}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-400/40 flex items-center gap-1">
                  <span>{tier.badge}</span>
                  <span>{tier.tier}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-400/30">
                  #{rank}위 / {totalStudents}명
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{hero.name.ko}</span>
                <span>•</span>
                <span>{fam.emoji} {fam.name.ko} 팸</span>
                <span>•</span>
                <span>수업 [{student.classCode}]</span>
                <span>•</span>
                <span className={student.isOnline ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {student.isOnline ? '현재 접속 중' : '접속 종료'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
              title="학부모/카톡 전송용 활동 보고서 복사"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReport ? '복사 완료!' : '결과 복사'}</span>
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
          
          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-[#0e213b] border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-bold">종합 점수</span>
              <div className="text-lg sm:text-xl font-black text-amber-300 font-mono mt-0.5">
                {student.score.toLocaleString()}점
              </div>
              <span className="text-[10px] text-slate-400">정답 속도+별점 반영</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0e213b] border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-bold">말씀 완주 진도</span>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
                {student.solvedCount} / 36개
              </div>
              <span className="text-[10px] text-slate-400">
                달성률 {Math.round((student.solvedCount / 36) * 100)}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0e213b] border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-bold">획득한 별</span>
              <div className="text-lg sm:text-xl font-black text-yellow-300 font-mono mt-0.5 flex items-center gap-1">
                <span>⭐</span>
                <span>{student.totalStars}개</span>
              </div>
              <span className="text-[10px] text-slate-400">최대 108개 만점</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0e213b] border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-bold">소요 시간 & 오답</span>
              <div className="text-lg sm:text-xl font-black text-slate-200 font-mono mt-0.5">
                {formatTime(student.elapsedTimeMs)}
              </div>
              <span className="text-[10px] text-slate-400">
                힌트 {student.hintsUsed}회 • <span className={student.wrongAnswersCount >= 3 ? 'text-rose-400 font-bold' : ''}>오답 {student.wrongAnswersCount}회</span>
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-3.5 rounded-xl bg-[#0c1e36] border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <span>항해 달성률</span>
                {student.isCompleted && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-black">
                    🎉 전 과정 완주!
                  </span>
                )}
              </span>
              <span className="font-mono text-amber-300 font-bold">
                {student.solvedCount} / 36 구절 완주
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (student.solvedCount / 36) * 100)}%` }}
              />
            </div>
          </div>

          {/* Struggled Verses (오답 및 주의 필요 구절 분석) */}
          <div className="p-4 rounded-xl bg-[#0c1e36] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4 className="font-black text-xs sm:text-sm text-amber-200">
                  보충 및 복습 추천 구절 ({wrongVerses.length}개)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                오답을 기록한 구절로, 1:1 맞춤 피드백에 활용하세요.
              </span>
            </div>

            {wrongVerses.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>놀랍습니다! 오답 없이 모든 암송 퀴즈를 훌륭하게 통과하고 있습니다.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {wrongVerses.map((item) => (
                  <button
                    key={item.questId}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setSelectedQuestId(item.questId);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                      selectedQuestId === item.questId
                        ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold text-[10px]">
                          #{item.questId}
                        </span>
                        <span className="font-bold text-xs text-white">
                          {item.quest?.reference.ko}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 line-clamp-1 mt-1">
                        {item.quest?.text.ko}
                      </p>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="text-xs font-black text-rose-400 block">
                        {item.count}회 오답
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {item.isSolved ? '해결 완료' : '진행 중'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 36 Verse Progress Matrix Grid */}
          <div className="p-4 rounded-xl bg-[#0c1e36] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <h4 className="font-black text-xs sm:text-sm text-sky-200">
                  36개 말씀 암송 이행 매트릭스
                </h4>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> 완료
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" /> 오답 발생
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-700" /> 미도달
                </span>
              </div>
            </div>

            {/* Matrix Grid (6 Sectors) */}
            <div className="space-y-2">
              {SECTOR_LIST.map((sector) => {
                const sectorQuests = VERSE_QUESTS.filter((q) => q.sectorId === sector.id);
                return (
                  <div key={sector.id} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <div className="text-[10px] font-bold text-amber-300/80 mb-1 flex items-center justify-between">
                      <span>{sector.name.ko} (구절 #{sector.questRange[0]}~#{sector.questRange[1]})</span>
                      <span className="text-slate-500">
                        {sectorQuests.filter(q => student.solvedQuestIds.includes(q.id)).length} / {sectorQuests.length} 완료
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {sectorQuests.map((q) => {
                        const isSolved = student.solvedQuestIds.includes(q.id);
                        const wrongCount = student.wrongQuestCounts?.[String(q.id)] || 0;
                        const isSelected = selectedQuestId === q.id;

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              sounds.playTap();
                              setSelectedQuestId(q.id);
                            }}
                            className={`p-1.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                              isSelected
                                ? 'ring-2 ring-amber-400 scale-105 z-10'
                                : ''
                            } ${
                              isSolved
                                ? wrongCount > 0
                                  ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                                  : 'bg-emerald-900/50 border-emerald-400/80 text-emerald-200'
                                : wrongCount > 0
                                ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700'
                            }`}
                            title={`#${q.id} ${q.reference.ko}`}
                          >
                            <span className="font-mono text-[11px] font-black">#{q.id}</span>
                            <span className="text-[8px] font-medium line-clamp-1 w-full text-center">
                              {q.reference.ko.split(' ')[0]}
                            </span>
                            {wrongCount > 0 && (
                              <span className="text-[8px] text-rose-400 font-bold">
                                {wrongCount}x
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Verse Detail Viewer */}
            {selectedQuest && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
                      구절 #{selectedQuest.id}
                    </span>
                    <strong className="text-amber-300">{selectedQuest.reference.ko}</strong>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {student.solvedQuestIds.includes(selectedQuest.id) ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 통과 완료
                      </span>
                    ) : (
                      <span className="text-slate-500">아직 미완료</span>
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium mt-1">
                  "{selectedQuest.text.ko}"
                </p>
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>탐색 단서: <strong className="text-amber-200">{selectedQuest.objectIcon} {selectedQuest.objectName.ko}</strong></span>
                  <span>
                    오답 기록: <strong className="text-rose-400 font-bold">{student.wrongQuestCounts?.[String(selectedQuest.id)] || 0}회</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#06101e] flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            * 카카오톡이나 문자 메시지로 학부모님께 결과를 바로 전송할 수 있습니다.
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
