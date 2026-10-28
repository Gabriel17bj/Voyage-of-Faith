/**
 * 믿음의 항해 — 말씀 36개
 *
 * 1단계 빈칸 채우기 (1~9)  · 2단계 순서 맞추기 (10~18)
 * 3단계 빈칸 여러 개 (19~27) · 4단계 따라 쓰기 (28~35) · 5단계 외워 쓰기 (36)
 *
 * 본문은 개역개정 기준입니다.
 */

export type StageId = 1 | 2 | 3 | 4 | 5;

export interface Verse {
  id: number;
  stage: StageId;
  reference: string;
  text: string;
  /** 1단계: 빈칸 1개 */
  blank?: { answer: string; options: string[] };
  /** 2단계: 순서대로 이어 붙이면 본문이 되는 조각 */
  chunks?: string[];
  /** 3단계: 본문에 나오는 순서대로의 정답 + 보기 */
  blanks?: { answers: string[]; options: string[] };
}

export interface Stage {
  id: StageId;
  title: string;
  guide: string;
}

export const STAGES: Stage[] = [
  { id: 1, title: '빈칸 채우기', guide: '빈칸에 들어갈 낱말을 고르세요.' },
  { id: 2, title: '순서 맞추기', guide: '말씀 조각을 순서대로 누르세요.' },
  { id: 3, title: '빈칸 여러 개', guide: '빈칸에 들어갈 낱말을 차례대로 고르세요.' },
  { id: 4, title: '따라 쓰기', guide: '말씀을 보고 그대로 써 보세요.' },
  { id: 5, title: '외워 쓰기', guide: '마지막 말씀! 외워서 써 보세요.' },
];

export const VERSES: Verse[] = [
  // ───────── 1단계 빈칸 채우기 ─────────
  {
    id: 1, stage: 1, reference: '마태복음 18:20',
    text: '두세 사람이 내 이름으로 모인 곳에는 나도 그들 중에 있느니라',
    blank: { answer: '이름', options: ['이름', '능력', '집', '말씀'] },
  },
  {
    id: 2, stage: 1, reference: '마태복음 4:19',
    text: '말씀하시되 나를 따라오라 내가 너희를 사람을 낚는 어부가 되게 하리라 하시니',
    blank: { answer: '어부', options: ['어부', '목자', '제자', '농부'] },
  },
  {
    id: 3, stage: 1, reference: '로마서 3:23',
    text: '모든 사람이 죄를 범하였으매 하나님의 영광에 이르지 못하더니',
    blank: { answer: '죄', options: ['죄', '실수', '거짓', '잘못'] },
  },
  {
    id: 4, stage: 1, reference: '요한복음 1:12',
    text: '영접하는 자 곧 그 이름을 믿는 자들에게는 하나님의 자녀가 되는 권세를 주셨으니',
    blank: { answer: '자녀', options: ['자녀', '종', '친구', '일꾼'] },
  },
  {
    id: 5, stage: 1, reference: '히브리서 9:27',
    text: '한 번 죽는 것은 사람에게 정해진 것이요 그 후에는 심판이 있으리니',
    blank: { answer: '심판', options: ['심판', '부활', '구원', '영생'] },
  },
  {
    id: 6, stage: 1, reference: '고린도후서 5:17',
    text: '그런즉 누구든지 그리스도 안에 있으면 새로운 피조물이라 이전 것은 지나갔으니 보라 새 것이 되었도다',
    blank: { answer: '피조물', options: ['피조물', '사람', '생명', '자녀'] },
  },
  {
    id: 7, stage: 1, reference: '디모데후서 3:16',
    text: '모든 성경은 하나님의 감동으로 된 것으로 교훈과 책망과 바르게 함과 의로 교육하기에 유익하니',
    blank: { answer: '성경', options: ['성경', '율법', '지혜', '교훈'] },
  },
  {
    id: 8, stage: 1, reference: '요한복음 15:7',
    text: '너희가 내 안에 거하고 내 말이 너희 안에 거하면 무엇이든지 원하는 대로 구하라 그리하면 이루리라',
    blank: { answer: '말', options: ['말', '영', '빛', '힘'] },
  },
  {
    id: 9, stage: 1, reference: '로마서 6:23',
    text: '죄의 삯은 사망이요 하나님의 은사는 그리스도 예수 우리 주 안에 있는 영생이니라',
    blank: { answer: '은사', options: ['은사', '상급', '율법', '심판'] },
  },

  // ───────── 2단계 순서 맞추기 ─────────
  {
    id: 10, stage: 2, reference: '이사야 53:6',
    text: '우리는 다 양 같아서 그릇 행하여 각기 제 길로 갔거늘 여호와께서는 우리 모두의 죄악을 그에게 담당시키셨도다',
    chunks: ['우리는 다 양 같아서', '그릇 행하여', '각기 제 길로 갔거늘', '여호와께서는', '우리 모두의 죄악을', '그에게 담당시키셨도다'],
  },
  {
    id: 11, stage: 2, reference: '요한계시록 3:20',
    text: '볼지어다 내가 문 밖에 서서 두드리노니 누구든지 내 음성을 듣고 문을 열면 내가 그에게로 들어가 그와 더불어 먹고 그는 나와 더불어 먹으리라',
    chunks: ['볼지어다 내가', '문 밖에 서서 두드리노니', '누구든지 내 음성을 듣고', '문을 열면', '내가 그에게로 들어가', '그와 더불어 먹고', '그는 나와 더불어 먹으리라'],
  },
  {
    id: 12, stage: 2, reference: '요한일서 5:13',
    text: '내가 하나님의 아들의 이름을 믿는 너희에게 이것을 쓰는 것은 너희로 하여금 너희에게 영생이 있음을 알게 하려 함이라',
    chunks: ['내가 하나님의 아들의 이름을', '믿는 너희에게', '이것을 쓰는 것은', '너희로 하여금', '너희에게 영생이 있음을', '알게 하려 함이라'],
  },
  {
    id: 13, stage: 2, reference: '로마서 5:8',
    text: '우리가 아직 죄인 되었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에 대한 자기의 사랑을 확증하셨느니라',
    chunks: ['우리가 아직 죄인 되었을 때에', '그리스도께서', '우리를 위하여 죽으심으로', '하나님께서', '우리에 대한 자기의 사랑을', '확증하셨느니라'],
  },
  {
    id: 14, stage: 2, reference: '요한복음 5:24',
    text: '내가 진실로 진실로 너희에게 이르노니 내 말을 듣고 또 나 보내신 이를 믿는 자는 영생을 얻었고 심판에 이르지 아니하나니 사망에서 생명으로 옮겼느니라',
    chunks: ['내가 진실로 진실로 너희에게 이르노니', '내 말을 듣고', '또 나 보내신 이를 믿는 자는', '영생을 얻었고', '심판에 이르지 아니하나니', '사망에서 생명으로 옮겼느니라'],
  },
  {
    id: 15, stage: 2, reference: '마가복음 10:45',
    text: '인자가 온 것은 섬김을 받으려 함이 아니라 도리어 섬기려 하고 자기 목숨을 많은 사람의 대속물로 주려 함이니라',
    chunks: ['인자가 온 것은', '섬김을 받으려 함이 아니라', '도리어 섬기려 하고', '자기 목숨을', '많은 사람의 대속물로', '주려 함이니라'],
  },
  {
    id: 16, stage: 2, reference: '히브리서 12:3',
    text: '너희가 피곤하여 낙심하지 않기 위하여 죄인들이 이같이 자기에게 거역한 일을 참으신 이를 생각하라',
    chunks: ['너희가 피곤하여', '낙심하지 않기 위하여', '죄인들이 이같이', '자기에게 거역한 일을', '참으신 이를 생각하라'],
  },
  {
    id: 17, stage: 2, reference: '고린도후서 4:5',
    text: '우리는 우리를 전파하는 것이 아니라 오직 그리스도 예수의 주 되신 것과 또 예수를 위하여 우리가 너희의 종 된 것을 전파함이라',
    chunks: ['우리는 우리를 전파하는 것이 아니라', '오직 그리스도 예수의', '주 되신 것과', '또 예수를 위하여', '우리가 너희의 종 된 것을', '전파함이라'],
  },
  {
    id: 18, stage: 2, reference: '마태복음 6:33',
    text: '그런즉 너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라',
    chunks: ['그런즉 너희는', '먼저 그의 나라와', '그의 의를 구하라', '그리하면', '이 모든 것을', '너희에게 더하시리라'],
  },

  // ───────── 3단계 빈칸 여러 개 ─────────
  {
    id: 19, stage: 3, reference: '여호수아 1:8',
    text: '이 율법책을 네 입에서 떠나지 말게 하며 주야로 그것을 묵상하여 그 안에 기록된 대로 다 지켜 행하라 그리하면 네 길이 평탄하게 될 것이며 네가 형통하리라',
    blanks: { answers: ['율법책', '묵상', '형통'], options: ['율법책', '묵상', '형통', '기도', '찬양'] },
  },
  {
    id: 20, stage: 3, reference: '로마서 1:16',
    text: '내가 복음을 부끄러워하지 아니하노니 이 복음은 모든 믿는 자에게 구원을 주시는 하나님의 능력이 됨이라 먼저는 유대인에게요 그리고 헬라인에게로다',
    blanks: { answers: ['부끄러워', '구원', '능력'], options: ['부끄러워', '구원', '능력', '두려워', '영광'] },
  },
  {
    id: 21, stage: 3, reference: '베드로전서 3:18',
    text: '그리스도께서도 단번에 죄를 위하여 죽으사 의인으로서 불의한 자를 대신하셨으니 이는 우리를 하나님 앞으로 인도하려 하심이라 육체로는 죽임을 당하시고 영으로는 살리심을 받으셨으니',
    blanks: { answers: ['의인', '대신', '인도'], options: ['의인', '대신', '인도', '구원', '심판'] },
  },
  {
    id: 22, stage: 3, reference: '에베소서 2:8-9',
    text: '너희는 그 은혜에 의하여 믿음으로 말미암아 구원을 받았으니 이것은 너희에게서 난 것이 아니요 하나님의 선물이라 행위에서 난 것이 아니니 이는 누구든지 자랑하지 못하게 함이라',
    blanks: { answers: ['은혜', '믿음', '선물'], options: ['은혜', '믿음', '선물', '공로', '노력'] },
  },
  {
    id: 23, stage: 3, reference: '디도서 3:5',
    text: '우리를 구원하시되 우리가 행한 바 의로운 행위로 말미암지 아니하고 오직 그의 긍휼하심을 따라 중생의 씻음과 성령의 새롭게 하심으로 하셨나니',
    blanks: { answers: ['긍휼', '중생', '성령'], options: ['긍휼', '중생', '성령', '열심', '지식'] },
  },
  {
    id: 24, stage: 3, reference: '누가복음 9:23',
    text: '또 무리에게 이르시되 아무든지 나를 따라오려거든 자기를 부인하고 날마다 제 십자가를 지고 나를 따를 것이니라',
    blanks: { answers: ['부인', '날마다', '십자가'], options: ['부인', '날마다', '십자가', '자랑', '가끔'] },
  },
  {
    id: 25, stage: 3, reference: '고린도전서 15:58',
    text: '그러므로 내 사랑하는 형제들아 견실하며 흔들리지 말고 항상 주의 일에 더욱 힘쓰는 자들이 되라 이는 너희 수고가 주 안에서 헛되지 않은 줄 앎이라',
    blanks: { answers: ['견실', '주의 일', '수고'], options: ['견실', '주의 일', '수고', '세상 일', '자랑'] },
  },
  {
    id: 26, stage: 3, reference: '잠언 3:9-10',
    text: '네 재물과 네 소산물의 처음 익은 열매로 여호와를 공경하라 그리하면 네 창고가 가득히 차고 네 포도즙 틀에 새 포도즙이 넘치리라',
    blanks: { answers: ['열매', '공경', '창고'], options: ['열매', '공경', '창고', '씨앗', '자랑'] },
  },
  {
    id: 27, stage: 3, reference: '요한복음 14:21',
    text: '나의 계명을 지키는 자라야 나를 사랑하는 자니 나를 사랑하는 자는 내 아버지께 사랑을 받을 것이요 나도 그를 사랑하여 그에게 나를 나타내리라',
    blanks: { answers: ['계명', '아버지', '나타내리라'], options: ['계명', '아버지', '나타내리라', '율법', '숨기리라'] },
  },

  // ───────── 4단계 따라 쓰기 ─────────
  {
    id: 28, stage: 4, reference: '갈라디아서 2:20',
    text: '내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라 이제 내가 육체 가운데 사는 것은 나를 사랑하사 나를 위하여 자기 자신을 버리신 하나님의 아들을 믿는 믿음 안에서 사는 것이라',
  },
  {
    id: 29, stage: 4, reference: '로마서 12:1',
    text: '그러므로 형제들아 내가 하나님의 모든 자비하심으로 너희를 권하노니 너희 몸을 하나님이 기뻐하시는 거룩한 산 제물로 드리라 이는 너희가 드릴 영적 예배니라',
  },
  {
    id: 30, stage: 4, reference: '빌립보서 4:6-7',
    text: '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로 너희 구할 것을 감사함으로 하나님께 아뢰라 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라',
  },
  {
    id: 31, stage: 4, reference: '히브리서 10:24-25',
    text: '서로 돌아보아 사랑과 선행을 격려하며 모이기를 폐하는 어떤 사람들의 습관과 같이 하지 말고 오직 권하여 그 날이 가까움을 볼수록 더욱 그리하자',
  },
  {
    id: 32, stage: 4, reference: '요한일서 2:15-16',
    text: '이 세상이나 세상에 있는 것들을 사랑하지 말라 누구든지 세상을 사랑하면 아버지의 사랑이 그 안에 있지 아니하니 이는 세상에 있는 모든 것이 육신의 정욕과 안목의 정욕과 이생의 자랑이니 다 아버지께로부터 온 것이 아니요 세상으로부터 온 것이라',
  },
  {
    id: 33, stage: 4, reference: '로마서 12:2',
    text: '너희는 이 세대를 본받지 말고 오직 마음을 새롭게 함으로 변화를 받아 하나님의 선하시고 기뻐하시고 온전하신 뜻이 무엇인지 분별하도록 하라',
  },
  {
    id: 34, stage: 4, reference: '고린도후서 9:6-7',
    text: '이것이 곧 적게 심는 자는 적게 거두고 많이 심는 자는 많이 거둔다 하는 말이로다 각각 그 마음에 정한 대로 할 것이요 인색함으로나 억지로 하지 말지니 하나님은 즐겨 내는 자를 사랑하시느니라',
  },
  {
    id: 35, stage: 4, reference: '마태복음 28:19-20',
    text: '그러므로 너희는 가서 모든 민족을 제자로 삼아 아버지와 아들과 성령의 이름으로 세례를 베풀고 내가 너희에게 분부한 모든 것을 가르쳐 지키게 하라 볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라 하시니라',
  },

  // ───────── 5단계 외워 쓰기 ─────────
  {
    id: 36, stage: 5, reference: '사도행전 1:8',
    text: '오직 성령이 너희에게 임하시면 너희가 권능을 받고 예루살렘과 온 유대와 사마리아와 땅 끝까지 이르러 내 증인이 되리라 하시니라',
  },
];

export const TOTAL_VERSES = VERSES.length;

export function versesOfStage(stage: StageId): Verse[] {
  return VERSES.filter((v) => v.stage === stage);
}

/** 앞 단계의 말씀을 모두 마쳐야 다음 단계가 열림 */
export function isStageOpen(stage: StageId, solved: Record<number, number>): boolean {
  return VERSES.filter((v) => v.stage < stage).every((v) => solved[v.id]);
}

/** 단계 안에서는 앞 말씀을 풀어야 다음 말씀이 열림 */
export function isVerseOpen(verse: Verse, solved: Record<number, number>): boolean {
  if (!isStageOpen(verse.stage, solved)) return false;
  const list = versesOfStage(verse.stage);
  const idx = list.findIndex((v) => v.id === verse.id);
  return idx <= 0 || Boolean(solved[list[idx - 1].id]);
}

/** 다음에 풀 말씀 (모두 풀었으면 null) */
export function nextVerse(solved: Record<number, number>): Verse | null {
  return VERSES.find((v) => !solved[v.id]) || null;
}

/** 공백·문장부호를 무시하고 비교 */
export function normalizeText(s: string): string {
  return s.replace(/[\s.,·!?:;'"~()[\]“”‘’]/g, '');
}

/**
 * 3단계 빈칸 문장 만들기: 본문에서 정답 낱말을 앞에서부터 차례로 찾아 빈칸으로 바꿈
 * 반환: 글 조각과 빈칸 번호가 섞인 배열
 */
export function splitWithBlanks(text: string, answers: string[]): (string | number)[] {
  const parts: (string | number)[] = [];
  let pos = 0;
  answers.forEach((ans, i) => {
    const at = text.indexOf(ans, pos);
    if (at < 0) return;
    parts.push(text.slice(pos, at), i);
    pos = at + ans.length;
  });
  parts.push(text.slice(pos));
  return parts.filter((p) => p !== '');
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
