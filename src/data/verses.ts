import { FamInfo, GameSector, VerseQuest } from '../types';

export const FAM_LIST: FamInfo[] = [
  {
    id: 'agape',
    name: { ko: '아가페', en: 'Agape' },
    animal: { ko: '사자', en: 'Lion' },
    emoji: '🦁',
    badgeColor: 'from-amber-500 to-orange-600',
    avatarBg: 'bg-amber-100 text-amber-900 border-amber-300',
    quote: {
      ko: '용기와 사랑의 힘으로 어떤 말씀의 암호도 풀 수 있어!',
      en: 'With courage and love, no scripture cipher can stop us!'
    }
  },
  {
    id: 'shalom',
    name: { ko: '샬롬', en: 'Shalom' },
    animal: { ko: '비둘기', en: 'Dove' },
    emoji: '🕊️',
    badgeColor: 'from-sky-400 to-blue-600',
    avatarBg: 'bg-sky-100 text-sky-900 border-sky-300',
    quote: {
      ko: '평안한 마음으로 말씀을 차근차근 묵상해 봐요.',
      en: 'Let peaceful faith guide your heart through every verse.'
    }
  },
  {
    id: 'wisdom',
    name: { ko: '지혜', en: 'Wisdom' },
    animal: { ko: '올빼미', en: 'Owl' },
    emoji: '🦉',
    badgeColor: 'from-emerald-500 to-teal-700',
    avatarBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    quote: {
      ko: '진리의 빛이 어두운 함정을 밝혀줄 거예요!',
      en: 'The light of truth will illuminate every locked door!'
    }
  }
];

export const SECTOR_LIST: GameSector[] = [
  {
    id: 1,
    name: { ko: '선원 갑판 (Crew Deck)', en: 'Crew Deck (Deck of Fellowship)' },
    description: {
      ko: '선원 갑판에 숨겨진 말씀의 핵심 단어 1개를 채워 장치를 해제하세요.',
      en: 'Find the single missing key word hidden in deck instruments to unlock.'
    },
    themeBg: 'from-blue-900 via-indigo-900 to-slate-900',
    icon: 'Compass',
    questRange: [1, 9]
  },
  {
    id: 2,
    name: { ko: '항해실 (Navigation Cabin)', en: 'Navigation Cabin (Chart Room)' },
    description: {
      ko: '단어 블록을 바른 순서로 맞춰 항해실의 해도 장치를 해제하세요.',
      en: 'Assemble the word blocks in correct order to navigate the cabin charts.'
    },
    themeBg: 'from-teal-950 via-cyan-950 to-slate-900',
    icon: 'Navigation',
    questRange: [10, 18]
  },
  {
    id: 3,
    name: { ko: '선장실 (Captain’s Stateroom)', en: 'Captain’s Stateroom (Sanctuary)' },
    description: {
      ko: '고대 문서함의 빈칸 2~3곳에 맞는 말씀의 보석을 끼우세요.',
      en: 'Insert the gems of truth into multiple missing slots in the scrolls.'
    },
    themeBg: 'from-amber-950 via-yellow-950 to-stone-900',
    icon: 'Scroll',
    questRange: [19, 27]
  },
  {
    id: 4,
    name: { ko: '성물 보관소 (Relic Sanctuary)', en: 'Relic Sanctuary (Ark Chamber)' },
    description: {
      ko: '성스러운 황금 궤에 온전한 말씀을 타이핑하여 봉인을 해제하세요.',
      en: 'Type the full living word to break ancient golden seals.'
    },
    themeBg: 'from-purple-950 via-slate-900 to-stone-950',
    icon: 'Shield',
    questRange: [28, 35]
  },
  {
    id: 5,
    name: { ko: '성령의 황금문 (Grand Holy Gate)', en: 'Grand Holy Gate (Acts 1:8)' },
    description: {
      ko: '최종 탈출문! 권능의 말씀을 완벽히 선포하고 탈출하세요!',
      en: 'The Final Escape Gate! Proclaim the scripture of power to escape!'
    },
    themeBg: 'from-yellow-700 via-amber-600 to-orange-800',
    icon: 'KeyRound',
    questRange: [36, 36]
  }
];

export const VERSE_QUESTS: VerseQuest[] = [
  // ==================== LEVEL 1: Single Blank (1~9) ====================
  {
    id: 1,
    level: 1,
    sectorId: 1,
    objectName: { ko: '선원 집합 벨', en: 'Crew Assembly Bell' },
    objectIcon: 'Bell',
    x: 18,
    y: 22,
    reference: { ko: '마태복음 18:20', en: 'Matthew 18:20' },
    text: {
      ko: '두세 사람이 내 이름으로 모인 곳에는 나도 그들 중에 있느니라',
      en: 'For where two or three gather in my name, there am I with them.'
    },
    singleBlank: {
      blankIndex: 1,
      maskedText: {
        ko: '두세 사람이 내 [ ??? ]으로 모인 곳에는 나도 그들 중에 있느니라',
        en: 'For where two or three gather in my [ ??? ], there am I with them.'
      },
      answer: { ko: '이름', en: 'name' },
      options: {
        ko: ['이름', '능력', '권세', '생각'],
        en: ['name', 'power', 'spirit', 'mind']
      }
    },
    hintInitial: { ko: '예수님의 거룩한 호칭을 뜻해요 (초성: ㅇㄹ)', en: 'Jesus said in my... (starts with "n")' },
    hintElimination: { ko: '능력이나 생각은 아닙니다.', en: 'Not power or mind.' },
    hintWhisper: { ko: '함께 모여 예수님의 이름으로 기도할 때 주님이 함께하십니다.', en: 'Jesus is with us when we gather in His name.' }
  },
  {
    id: 2,
    level: 1,
    sectorId: 1,
    objectName: { ko: '황금 닻 권양기', en: 'Golden Anchor Winch' },
    objectIcon: 'Anchor',
    x: 48,
    y: 18,
    reference: { ko: '마태복음 4:19', en: 'Matthew 4:19' },
    text: {
      ko: '말씀하시되 나를 따라오라 내가 너희를 사람을 낚는 어부가 되게 하리라 하시니',
      en: 'Come, follow me, Jesus said, and I will send you out to fish for people.'
    },
    singleBlank: {
      blankIndex: 1,
      maskedText: {
        ko: '말씀하시되 나를 따라오라 내가 너희를 사람을 낚는 [ ??? ]가 되게 하리라 하시니',
        en: 'Come, follow me, Jesus said, and I will send you out to [ ??? ] for people.'
      },
      answer: { ko: '어부', en: 'fish' },
      options: {
        ko: ['어부', '목자', '선장', '의사'],
        en: ['fish', 'shepherd', 'captain', 'doctor']
      }
    },
    hintInitial: { ko: '고기를 잡는 사람을 부르는 말이에요 (초성: ㅇㅂ)', en: 'Catching or gathering people (starts with "f")' },
    hintElimination: { ko: '목자나 선장이 아닙니다.', en: 'Not shepherd or captain.' },
    hintWhisper: { ko: '예수님이 제자들에게 주신 영광스러운 사명입니다.', en: 'Jesus calls us to be fishers of people.' }
  },
  {
    id: 3,
    level: 1,
    sectorId: 1,
    objectName: { ko: '갑판 조타륜', en: 'Deck Helm' },
    objectIcon: 'Disc',
    x: 82,
    y: 25,
    reference: { ko: '로마서 3:23', en: 'Romans 3:23' },
    text: {
      ko: '모든 사람이 죄를 범하였으매 하나님의 영광에 이르지 못하더니',
      en: 'for all have sinned and fall short of the glory of God,'
    },
    singleBlank: {
      blankIndex: 1,
      maskedText: {
        ko: '모든 사람이 [ ??? ]를 범하였으매 하나님의 영광에 이르지 못하더니',
        en: 'for all have [ ??? ] and fall short of the glory of God,'
      },
      answer: { ko: '죄', en: 'sinned' },
      options: {
        ko: ['죄', '실수', '거짓', '우상'],
        en: ['sinned', 'wandered', 'failed', 'drifted']
      }
    },
    hintInitial: { ko: '하나님의 법을 어기고 빗나간 것 (초성: ㅈ)', en: 'Falling short of God (starts with "s")' },
    hintElimination: { ko: '실수나 우상이 아닙니다.', en: 'Not failed or drifted.' },
    hintWhisper: { ko: '모든 인간이 구원이 필요한 이유를 보여주는 말씀입니다.', en: 'All people have sinned and need God’s grace.' }
  },
  {
    id: 4,
    level: 1,
    sectorId: 1,
    objectName: { ko: '빛나는 항해 램프', en: 'Luminous Deck Lantern' },
    objectIcon: 'Flame',
    x: 25,
    y: 46,
    reference: { ko: '요한복음 1:12', en: 'John 1:12' },
    text: {
      ko: '영접하는 자 곧 그 이름을 믿는 자들에게는 하나님의 자녀가 되는 권세를 주셨으니',
      en: 'Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God'
    },
    singleBlank: {
      blankIndex: 1,
      maskedText: {
        ko: '영접하는 자 곧 그 이름을 믿는 자들에게는 하나님의 [ ??? ]가 되는 권세를 주셨으니',
        en: 'Yet to all who did receive him... he gave the right to become [ ??? ] of God'
      },
      answer: { ko: '자녀', en: 'children' },
      options: {
        ko: ['자녀', '종', '천사', '일꾼'],
        en: ['children', 'servants', 'angels', 'warriors']
      }
    },
    hintInitial: { ko: '하나님 아버지의 아들과 딸을 뜻해요 (초성: ㅈㄴ)', en: 'Sons and daughters of God (starts with "c")' },
    hintElimination: { ko: '종이나 천사가 아닙니다.', en: 'Not servants or angels.' },
    hintWhisper: { ko: '예수님을 믿으면 하나님의 거룩한 자녀가 됩니다.', en: 'We become children of God through faith in Jesus.' }
  },
  {
    id: 5,
    level: 1,
    sectorId: 1,
    objectName: { ko: '선원 구명 상자', en: 'Life Ring Chest' },
    objectIcon: 'Package',
    x: 62,
    y: 44,
    reference: { ko: '히브리서 9:27', en: 'Hebrews 9:27' },
    text: {
      ko: '한 번 죽는 것은 사람에게 정해진 것이요 그 후에는 심판이 있으리니',
      en: 'Just as people are destined to die once, and after that to face judgment,'
    },
    singleBlank: {
      blankIndex: 1,
      maskedText: {
        ko: '한 번 죽는 것은 사람에게 정해진 것이요 그 후에는 [ ??? ]이 있으리니',
        en: 'Just as people are destined to die once, and after that to face [ ??? ],'
      },
      answer: { ko: '심판', en: 'judgment' },
      options: {
        ko: ['심판', '환생', '축제', '평가'],
        en: ['judgment', 'reward', 'silence', 'darkness']
      }
    },
    hintInitial: { ko: '하나님 앞에서의 공의로운 판결 (초성: ㅅㅍ)', en: 'Facing God’s final verdict (starts with "j")' },
    hintElimination: { ko: '환생이나 축제가 아닙니다.', en: 'Not reward or silence.' },
    hintWhisper: { ko: '인생의 마지막 날 하나님의 심판대 앞에 서게 됩니다.', en: 'Each person will face God’s righteous judgment.' }
  },
  {
    id: 6,
    level: 1,
    sectorId: 1,
    objectName: { ko: '새 생명의 돛대 조각', en: 'New Life Mast Relief' },
    objectIcon: 'Sparkles',
    x: 88,
    y: 52,
    reference: { ko: '고린도후서 5:17', en: '2 Corinthians 5:17' },
    text: {
      ko: '그런즉 누구든지 그리스도 안에 있으면 새로운 피조물이라 이전 것은 지나갔으니 보라 새 것이 되었도다',
      en: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!'
    },
    singleBlank: {
      blankIndex: 1,
      maskedText: {
        ko: '그런즉 누구든지 그리스도 안에 있으면 새로운 [ ??? ]이라 이전 것은 지나갔으니 보라 새 것이 되었도다',
        en: 'Therefore, if anyone is in Christ, the new [ ??? ] has come: The old has gone, the new is here!'
      },
      answer: { ko: '피조물', en: 'creation' },
      options: {
        ko: ['피조물', '선장', '일꾼', '용사'],
        en: ['creation', 'creature', 'builder', 'warrior']
      }
    },
    hintInitial: { ko: '하나님이 새롭게 만드신 존재 (초성: ㅍㅈㅁ)', en: 'A brand new work made by God (starts with "c")' },
    hintElimination: { ko: '선장이나 용사가 아닙니다.', en: 'Not builder or warrior.' },
    hintWhisper: { ko: '예수님 안에서 우리는 완전히 새로운 사람으로 다시 태어났습니다.', en: 'In Christ, we are made brand new creations.' }
  },
  {
    id: 7,
    level: 1,
    sectorId: 1,
    objectName: { ko: '성경 교훈 서판', en: 'Scripture Tablet' },
    objectIcon: 'BookOpen',
    x: 20,
    y: 76,
    reference: { ko: '디모데후서 3:16', en: '2 Timothy 3:16' },
    text: {
      ko: '모든 성경은 하나님의 감동으로 된 것으로 교훈과 책망과 바르게 함과 의로 교육하기에 유익하니',
      en: 'All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness,'
    },
    singleBlank: {
      blankIndex: 1,
      maskedText: {
        ko: '모든 [ ??? ]은 하나님의 감동으로 된 것으로 교훈과 책망과 바르게 함과 의로 교육하기에 유익하니',
        en: 'All [ ??? ] is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness,'
      },
      answer: { ko: '성경', en: 'Scripture' },
      options: {
        ko: ['성경', '역사', '학문', '법전'],
        en: ['Scripture', 'history', 'law', 'wisdom']
      }
    },
    hintInitial: { ko: '하나님의 거룩한 말씀 책 (초성: ㅅㄱ)', en: 'The written word of God (starts with "S")' },
    hintElimination: { ko: '역사나 학문이 아닙니다.', en: 'Not law or history.' },
    hintWhisper: { ko: '성경 말씀은 우리 삶을 바르게 인도하는 진리의 등불입니다.', en: 'Scripture is God’s living guide for righteous living.' }
  },
  {
    id: 8,
    level: 1,
    sectorId: 1,
    objectName: { ko: '기도의 향로', en: 'Incense Altar of Prayer' },
    objectIcon: 'FlameKindling',
    x: 54,
    y: 75,
    reference: { ko: '요한복음 15:7', en: 'John 15:7' },
    text: {
      ko: '너희가 내 안에 거하고 내 말이 너희 안에 거하면 무엇이든지 원하는 대로 구하라 그리하면 이루리라',
      en: 'If you remain in me and my words remain in you, ask whatever you wish, and it will be done for you.'
    },
    singleBlank: {
      blankIndex: 1,
      maskedText: {
        ko: '너희가 내 안에 거하고 내 [ ??? ]이 너희 안에 거하면 무엇이든지 원하는 대로 구하라 그리하면 이루리라',
        en: 'If you remain in me and my [ ??? ] remain in you, ask whatever you wish, and it will be done for you.'
      },
      answer: { ko: '말', en: 'words' },
      options: {
        ko: ['말', '영', '빛', '능력'],
        en: ['words', 'spirit', 'light', 'glory']
      }
    },
    hintInitial: { ko: '주님의 가르침과 음성 (초성: ㅁ)', en: 'Jesus’ teachings and sayings (starts with "w")' },
    hintElimination: { ko: '빛이나 능력이 아닙니다.', en: 'Not light or glory.' },
    hintWhisper: { ko: '주님의 말씀 안에 머물 때 기도가 온전히 응답됩니다.', en: 'Abiding in Jesus and His words brings powerful prayer answers.' }
  },
  {
    id: 9,
    level: 1,
    sectorId: 1,
    objectName: { ko: '영생의 보물상자', en: 'Eternal Life Chest' },
    objectIcon: 'Gift',
    x: 82,
    y: 80,
    reference: { ko: '로마서 6:23', en: 'Romans 6:23' },
    text: {
      ko: '죄의 삯은 사망이요 하나님의 은사는 그리스도 예수 우리 주 안에 있는 영생이니라',
      en: 'For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.'
    },
    singleBlank: {
      blankIndex: 1,
      maskedText: {
        ko: '죄의 삯은 사망이요 하나님의 [ ??? ]는 그리스도 예수 우리 주 안에 있는 영생이니라',
        en: 'For the wages of sin is death, but the [ ??? ] of God is eternal life in Christ Jesus our Lord.'
      },
      answer: { ko: '은사', en: 'gift' },
      options: {
        ko: ['은사', '상급', '징벌', '율법'],
        en: ['gift', 'reward', 'law', 'crown']
      }
    },
    hintInitial: { ko: '값없이 주시는 하나님의 선물 (초성: ㅇㅅ)', en: 'A free gift given by grace (starts with "g")' },
    hintElimination: { ko: '징벌이나 율법이 아닙니다.', en: 'Not law or reward.' },
    hintWhisper: { ko: '갑판의 마지막 잠금장치! 영생은 값없이 주신 선물입니다.', en: 'Eternal life is God’s gift through Christ!' }
  },

  // ==================== LEVEL 2: Word Order (10~18) ====================
  {
    id: 10,
    level: 2,
    sectorId: 2,
    objectName: { ko: '항해 해도 테이블', en: 'Navigation Chart Table' },
    objectIcon: 'Map',
    x: 18,
    y: 20,
    reference: { ko: '이사야 53:6', en: 'Isaiah 53:6' },
    text: {
      ko: '우리는 다 양 같아서 그릇 행하여 각기 제 길로 갔거늘 여호와께서는 우리 모두의 죄악을 그에게 담당시키셨도다',
      en: 'We all, like sheep, have gone astray, each of us has turned to our own way; and the LORD has laid on him the iniquity of us all.'
    },
    orderTokens: {
      ko: ['우리는 다', '양 같아서', '그릇 행하여', '각기 제 길로 갔거늘', '여호와께서는', '우리 모두의 죄악을', '그에게 담당시키셨도다'],
      en: ['We all, like sheep,', 'have gone astray,', 'each of us has turned', 'to our own way;', 'and the LORD has laid on him', 'the iniquity of us all.']
    },
    hintInitial: { ko: '첫 시작: "우리는 다"', en: 'First token: "We all, like sheep,"' },
    hintElimination: { ko: '"양 같아서" 다음에 "그릇 행하여"가 옵니다.', en: '"have gone astray," follows.' },
    hintWhisper: { ko: '길을 잃은 양 같은 우리를 위해 예수님이 죄를 담당하셨습니다.', en: 'Jesus bore our iniquity on the cross.' }
  },
  {
    id: 11,
    level: 2,
    sectorId: 2,
    objectName: { ko: '항해실 참나무 문', en: 'Cabin Oak Door' },
    objectIcon: 'DoorClosed',
    x: 50,
    y: 18,
    reference: { ko: '요한계시록 3:20', en: 'Revelation 3:20' },
    text: {
      ko: '볼지어다 내가 문 밖에 서서 두드리노니 누구든지 내 음성을 듣고 문을 열면 내가 그에게로 들어가 그와 더불어 먹고 그는 나와 더불어 먹으리라',
      en: 'Here I am! I stand at the door and knock. If anyone hears my voice and opens the door, I will come in and eat with that person, and they with me.'
    },
    orderTokens: {
      ko: ['볼지어다 내가', '문 밖에 서서 두드리노니', '누구든지', '내 음성을 듣고', '문을 열면', '내가 그에게로 들어가', '그와 더불어 먹으리라'],
      en: ['Here I am!', 'I stand at the door and knock.', 'If anyone hears my voice', 'and opens the door,', 'I will come in', 'and eat with that person.']
    },
    hintInitial: { ko: '첫 시작: "볼지어다 내가"', en: 'First token: "Here I am!"' },
    hintElimination: { ko: '"문 밖에 서서 두드리노니" 다음에 "누구든지"가 옵니다.', en: '"I stand at the door and knock." follows.' },
    hintWhisper: { ko: '마음의 문을 열면 주님이 들어오셔서 동행하십니다.', en: 'Open the door of your heart to Jesus.' }
  },
  {
    id: 12,
    level: 2,
    sectorId: 2,
    objectName: { ko: '천체 관측 망원경', en: 'Celestial Telescope' },
    objectIcon: 'Eye',
    x: 82,
    y: 24,
    reference: { ko: '요한일서 5:13', en: '1 John 5:13' },
    text: {
      ko: '내가 하나님의 아들의 이름을 믿는 너희에게 이것을 쓰는 것은 너희로 하여금 너희에게 영생이 있음을 알게 하려 함이라',
      en: 'I write these things to you who believe in the name of the Son of God so that you may know that you have eternal life.'
    },
    orderTokens: {
      ko: ['내가 하나님의', '아들의 이름을', '믿는 너희에게', '이것을 쓰는 것은', '너희로 하여금', '너희에게 영생이 있음을', '알게 하려 함이라'],
      en: ['I write these things', 'to you who believe', 'in the name of', 'the Son of God', 'so that you may know', 'that you have eternal life.']
    },
    hintInitial: { ko: '첫 시작: "내가 하나님의"', en: 'First token: "I write these things"' },
    hintElimination: { ko: '"아들의 이름을" 다음에 "믿는 너희에게"가 옵니다.', en: '"to you who believe" follows.' },
    hintWhisper: { ko: '예수님을 믿는 자에게는 영생의 확신이 있습니다.', en: 'Believing gives us the certainty of eternal life.' }
  },
  {
    id: 13,
    level: 2,
    sectorId: 2,
    objectName: { ko: '십자가 나침반 함', en: 'Cross Compass Box' },
    objectIcon: 'Compass',
    x: 22,
    y: 50,
    reference: { ko: '로마서 5:8', en: 'Romans 5:8' },
    text: {
      ko: '우리가 아직 죄인 되었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에 대한 자기의 사랑을 확증하셨느니라',
      en: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.'
    },
    orderTokens: {
      ko: ['우리가 아직', '죄인 되었을 때에', '그리스도께서', '우리를 위하여 죽으심으로', '하나님께서', '우리에 대한', '자기의 사랑을 확증하셨느니라'],
      en: ['But God demonstrates', 'his own love for us in this:', 'While we were still sinners,', 'Christ died for us.']
    },
    hintInitial: { ko: '첫 시작: "우리가 아직"', en: 'First token: "But God demonstrates"' },
    hintElimination: { ko: '"죄인 되었을 때에" 다음에 "그리스도께서"가 옵니다.', en: '"his own love for us in this:" follows.' },
    hintWhisper: { ko: '우리가 죄인이었을 때 먼저 보여주신 하나님의 사랑입니다.', en: 'God demonstrated His love while we were still sinners.' }
  },
  {
    id: 14,
    level: 2,
    sectorId: 2,
    objectName: { ko: '생명의 닻줄 장치', en: 'Anchor Rope Mechanism' },
    objectIcon: 'Cable',
    x: 52,
    y: 48,
    reference: { ko: '요한복음 5:24', en: 'John 5:24' },
    text: {
      ko: '내가 진실로 진실로 너희에게 이르노니 내 말을 듣고 또 나 보내신 이를 믿는 자는 영생을 얻었고 심판에 이르지 아니하나니 사망에서 생명으로 옮겼느니라',
      en: 'Very truly I tell you, whoever hears my word and believes him who sent me has eternal life and will not be judged but has crossed over from death to life.'
    },
    orderTokens: {
      ko: ['내가 진실로 진실로', '너희에게 이르노니', '내 말을 듣고', '나 보내신 이를 믿는 자는', '영생을 얻었고', '심판에 이르지 아니하나니', '사망에서 생명으로 옮겼느니라'],
      en: ['Very truly I tell you,', 'whoever hears my word', 'and believes him who sent me', 'has eternal life', 'and will not be judged', 'but has crossed over', 'from death to life.']
    },
    hintInitial: { ko: '첫 시작: "내가 진실로 진실로"', en: 'First token: "Very truly I tell you,"' },
    hintElimination: { ko: '"너희에게 이르노니" 다음에 "내 말을 듣고"가 옵니다.', en: '"whoever hears my word" follows.' },
    hintWhisper: { ko: '예수님을 믿으면 사망에서 생명으로 옮겨집니다.', en: 'Hearing and believing brings eternal life and saves from judgment.' }
  },
  {
    id: 15,
    level: 2,
    sectorId: 2,
    objectName: { ko: '섬김의 구리 세숫대야', en: 'Bronze Basin of Service' },
    objectIcon: 'Waves',
    x: 82,
    y: 52,
    reference: { ko: '마가복음 10:45', en: 'Mark 10:45' },
    text: {
      ko: '인자가 온 것은 섬김을 받으려 함이 아니라 도리어 섬기려 하고 자기 목숨을 많은 사람의 대속물로 주려 함이니라',
      en: 'For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.'
    },
    orderTokens: {
      ko: ['인자가 온 것은', '섬김을 받으려 함이 아니라', '도리어 섬기려 하고', '자기 목숨을', '많은 사람의', '대속물로 주려 함이니라'],
      en: ['For even the Son of Man', 'did not come to be served,', 'but to serve,', 'and to give his life', 'as a ransom for many.']
    },
    hintInitial: { ko: '첫 시작: "인자가 온 것은"', en: 'First token: "For even the Son of Man"' },
    hintElimination: { ko: '"섬김을 받으려 함이 아니라" 다음에 "도리어 섬기려 하고"가 옵니다.', en: '"did not come to be served," follows.' },
    hintWhisper: { ko: '예수님은 섬김과 희생의 본을 보여주셨습니다.', en: 'Jesus came to serve and give His life as a ransom.' }
  },
  {
    id: 16,
    level: 2,
    sectorId: 2,
    objectName: { ko: '인내의 모래시계', en: 'Hourglass of Endurance' },
    objectIcon: 'Hourglass',
    x: 20,
    y: 78,
    reference: { ko: '히브리서 12:3', en: 'Hebrews 12:3' },
    text: {
      ko: '너희가 피곤하여 낙심하지 않기 위하여 죄인들이 이같이 자기에게 거역한 일을 참으신 이를 생각하라',
      en: 'Consider him who endured such opposition from sinners, so that you will not grow weary and lose heart.'
    },
    orderTokens: {
      ko: ['너희가 피곤하여', '낙심하지 않기 위하여', '죄인들이 이같이', '자기에게 거역한 일을', '참으신 이를 생각하라'],
      en: ['Consider him', 'who endured such opposition', 'from sinners,', 'so that you will not grow weary', 'and lose heart.']
    },
    hintInitial: { ko: '첫 시작: "너희가 피곤하여"', en: 'First token: "Consider him"' },
    hintElimination: { ko: '"낙심하지 않기 위하여" 다음에 "죄인들이 이같이"가 옵니다.', en: '"who endured such opposition" follows.' },
    hintWhisper: { ko: '지치고 낙심될 때 십자가를 참으신 예수님을 바라보세요.', en: 'Consider Jesus so you will not grow weary.' }
  },
  {
    id: 17,
    level: 2,
    sectorId: 2,
    objectName: { ko: '종의 충성 문서함', en: 'Loyalty Chest of Servants' },
    objectIcon: 'Folder',
    x: 52,
    y: 78,
    reference: { ko: '고린도후서 4:5', en: '2 Corinthians 4:5' },
    text: {
      ko: '우리는 우리를 전파하는 것이 아니라 오직 그리스도 예수의 주 되신 것과 또 예수를 위하여 우리가 너희의 종된 것을 전파함이라',
      en: 'For what we preach is not ourselves, but Jesus Christ as Lord, and ourselves as your servants for Jesus’ sake.'
    },
    orderTokens: {
      ko: ['우리는 우리를', '전파하는 것이 아니라', '오직 그리스도 예수의', '주 되신 것과', '예수를 위하여', '우리가 너희의 종된 것을', '전파함이라'],
      en: ['For what we preach', 'is not ourselves,', 'but Jesus Christ as Lord,', 'and ourselves as your servants', 'for Jesus’ sake.']
    },
    hintInitial: { ko: '첫 시작: "우리는 우리를"', en: 'First token: "For what we preach"' },
    hintElimination: { ko: '"전파하는 것이 아니라" 다음에 "오직 그리스도 예수의"가 옵니다.', en: '"is not ourselves," follows.' },
    hintWhisper: { ko: '우리가 전할 유일한 복음은 주 되신 예수 그리스도입니다.', en: 'We preach Jesus Christ as Lord.' }
  },
  {
    id: 18,
    level: 2,
    sectorId: 2,
    objectName: { ko: '우선순위 황금 나침반', en: 'Golden Priority Compass' },
    objectIcon: 'Compass',
    x: 82,
    y: 80,
    reference: { ko: '마태복음 6:33', en: 'Matthew 6:33' },
    text: {
      ko: '그런즉 너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라',
      en: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.'
    },
    orderTokens: {
      ko: ['그런즉 너희는', '먼저 그의 나라와', '그의 의를 구하라', '그리하면', '이 모든 것을', '너희에게 더하시리라'],
      en: ['But seek first', 'his kingdom', 'and his righteousness,', 'and all these things', 'will be given to you as well.']
    },
    hintInitial: { ko: '첫 시작: "그런즉 너희는"', en: 'First token: "But seek first"' },
    hintElimination: { ko: '"먼저 그의 나라와" 다음에 "그의 의를 구하라"가 옵니다.', en: '"his kingdom" follows "But seek first".' },
    hintWhisper: { ko: '항해실 해제 완료! 하나님 나라를 가장 앞세울 때 모든 것을 채워주십니다.', en: 'Seek His kingdom first, and all essentials will follow!' }
  },

  // ==================== LEVEL 3: Multi Blank (19~27) ====================
  {
    id: 19,
    level: 3,
    sectorId: 3,
    objectName: { ko: '선장실 율법 서책대', en: 'Law Scroll Lectern' },
    objectIcon: 'BookMarked',
    x: 18,
    y: 20,
    reference: { ko: '여호수아 1:8', en: 'Joshua 1:8' },
    text: {
      ko: '이 율법책을 네 입에서 떠나지 말게 하며 주야로 그것을 묵상하여 그 안에 기록된 대로 다 지켜 행하라 그리하면 네 길이 평탄하게 될 것이며 네가 형통하리라',
      en: 'Keep this Book of the Law always on your lips; meditate on it day and night, so that you may be careful to do everything written in it. Then you will be prosperous and successful.'
    },
    multiBlank: {
      template: {
        ko: '이 율법책을 네 입에서 떠나지 말게 하며 주야로 그것을 [ __1__ ]하여 그 안에 기록된 대로 다 지켜 행하라 그리하면 네 길이 [ __2__ ]하게 될 것이며 네가 형통하리라',
        en: '...[ __1__ ] on it day and night, so that you may do everything... Then you will be prosperous and [ __2__ ].'
      },
      answers: {
        ko: ['묵상', '평탄'],
        en: ['meditate', 'successful']
      },
      options: {
        ko: ['묵상', '평탄', '암송', '형통', '기도'],
        en: ['meditate', 'successful', 'prosperous', 'read', 'pray']
      }
    },
    hintInitial: { ko: '1번: 깊이 생각하는 것(ㅁㅅ), 2번: 길이 순탄함(ㅍㅌ)', en: '1: meditate, 2: successful' },
    hintElimination: { ko: '선택지 중 "암송"과 "기도"는 들어가지 않습니다.', en: '"read" and "pray" are not in the blanks.' },
    hintWhisper: { ko: '말씀을 묵상하고 지켜 행할 때 형통의 길이 열립니다.', en: 'Meditating on God’s law brings true success and peace.' }
  },
  {
    id: 20,
    level: 3,
    sectorId: 3,
    objectName: { ko: '복음의 붉은 깃발함', en: 'Gospel Banner Box' },
    objectIcon: 'Flag',
    x: 52,
    y: 18,
    reference: { ko: '로마서 1:16', en: 'Romans 1:16' },
    text: {
      ko: '내가 복음을 부끄러워하지 아니하노니 이 복음은 모든 믿는 자에게 구원을 주시는 하나님의 능력이 됨이라 먼저는 유대인에게요 그리고 헬라인에게로다',
      en: 'For I am not ashamed of the gospel, because it is the power of God that brings salvation to everyone who believes: first to the Jew, then to the Gentile.'
    },
    multiBlank: {
      template: {
        ko: '내가 복음을 [ __1__ ]하지 아니하노니 이 복음은 모든 믿는 자에게 구원을 주시는 하나님의 [ __2__ ]이 됨이라',
        en: 'For I am not [ __1__ ] of the gospel, because it is the [ __2__ ] of God that brings salvation...'
      },
      answers: {
        ko: ['부끄러워', '능력'],
        en: ['ashamed', 'power']
      },
      options: {
        ko: ['부끄러워', '능력', '두려워', '지혜', '영광'],
        en: ['ashamed', 'power', 'afraid', 'wisdom', 'glory']
      }
    },
    hintInitial: { ko: '1번: 창피해하지 않음(ㅂㄲㄹㅇ), 2번: 힘과 권능(ㄴㄹ)', en: '1: ashamed, 2: power' },
    hintElimination: { ko: '"두려워"와 "지혜"는 오답입니다.', en: '"afraid" and "wisdom" are distractors.' },
    hintWhisper: { ko: '복음은 세상을 구원하는 하나님의 가장 강력한 능력입니다!', en: 'The gospel is the ultimate power of God for salvation.' }
  },
  {
    id: 21,
    level: 3,
    sectorId: 3,
    objectName: { ko: '의인의 십자가 제단', en: 'Righteous Altar' },
    objectIcon: 'ShieldAlert',
    x: 82,
    y: 22,
    reference: { ko: '베드로전서 3:18', en: '1 Peter 3:18' },
    text: {
      ko: '그리스도께서도 단번에 죄를 위하여 죽으사 의인으로서 불의한 자를 대신하셨으니 이는 우리를 하나님 앞으로 인도하려 하심이라 육체로는 죽임을 당하시고 영으로는 살리심을 받았으니',
      en: 'For Christ also suffered once for sins, the righteous for the unrighteous, to bring you to God. He was put to death in the body but made alive in the Spirit.'
    },
    multiBlank: {
      template: {
        ko: '그리스도께서도 단번에 죄를 위하여 죽으사 [ __1__ ]으로서 불의한 자를 [ __2__ ]하셨으니 이는 우리를 하나님 앞으로 [ __3__ ]하려 하심이라',
        en: '...the [ __1__ ] for the unrighteous, to [ __2__ ] you to [ __3__ ]...'
      },
      answers: {
        ko: ['의인', '대신', '인도'],
        en: ['righteous', 'bring', 'God']
      },
      options: {
        ko: ['의인', '대신', '인도', '구원', '심판'],
        en: ['righteous', 'bring', 'God', 'save', 'judge']
      }
    },
    hintInitial: { ko: '1번: 의로운 분(ㅇㅇ), 2번: 대리함(ㄷㅅ), 3번: 이끌어감(ㅇㄷ)', en: '1: righteous, 2: bring, 3: God' },
    hintElimination: { ko: '"구원"과 "심판"은 선택지에 속지 마세요.', en: '"save" and "judge" are not needed.' },
    hintWhisper: { ko: '죄 없으신 예수님이 우리를 위해 대신 십자가를 지셨습니다.', en: 'The sinless Christ substituted Himself to reconcile us to God.' }
  },
  {
    id: 22,
    level: 3,
    sectorId: 3,
    objectName: { ko: '은혜의 선물 보물궤', en: 'Grace Gift Ark' },
    objectIcon: 'Gift',
    x: 22,
    y: 50,
    reference: { ko: '에베소서 2:8-9', en: 'Ephesians 2:8-9' },
    text: {
      ko: '너희는 그 은혜에 의하여 믿음으로 말미암아 구원을 받았으니 이것은 너희에게서 난 것이 아니요 하나님의 선물이라 행위에서 난 것이 아니니 이는 누구든지 자랑하지 못하게 함이라',
      en: 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast.'
    },
    multiBlank: {
      template: {
        ko: '너희는 그 [ __1__ ]에 의하여 [ __2__ ]으로 말미암아 구원을 받았으니 이것은... 하나님의 [ __3__ ]이라',
        en: 'For it is by [ __1__ ] you have been saved, through [ __2__ ]... it is the [ __3__ ] of God'
      },
      answers: {
        ko: ['은혜', '믿음', '선물'],
        en: ['grace', 'faith', 'gift']
      },
      options: {
        ko: ['은혜', '믿음', '선물', '행위', '공로'],
        en: ['grace', 'faith', 'gift', 'works', 'merit']
      }
    },
    hintInitial: { ko: '1: 은혜(ㅇㅎ), 2: 믿음(ㅁㅇ), 3: 선물(ㅅㅁ)', en: '1: grace, 2: faith, 3: gift' },
    hintElimination: { ko: '"행위"나 "공로"로 얻은 것이 아닙니다.', en: 'Not by works or merit!' },
    hintWhisper: { ko: '구원은 우리의 행위가 아닌 하나님의 은혜이자 선물입니다!', en: 'Salvation is entirely by grace through faith, a gift from God.' }
  },
  {
    id: 23,
    level: 3,
    sectorId: 3,
    objectName: { ko: '긍휼의 세례 성수병', en: 'Cruet of Mercy' },
    objectIcon: 'Droplet',
    x: 52,
    y: 48,
    reference: { ko: '디도서 3:5', en: 'Titus 3:5' },
    text: {
      ko: '우리를 구원하시되 우리가 행한 바 의로운 행위로 말미암아 아니하고 오직 그의 긍휼하심을 따라 중생의 씻음과 성령의 새롭게 하심으로 하셨나니',
      en: 'he saved us, not because of righteous things we had done, but because of his mercy. He saved us through the washing of rebirth and renewal by the Holy Spirit,'
    },
    multiBlank: {
      template: {
        ko: '우리를 구원하시되... 오직 그의 [ __1__ ]하심을 따라 [ __2__ ]의 씻음과 [ __3__ ]의 새롭게 하심으로 하셨나니',
        en: '...because of his [ __1__ ]. He saved us through the washing of [ __2__ ] and renewal by the [ __3__ ],'
      },
      answers: {
        ko: ['긍휼', '중생', '성령'],
        en: ['mercy', 'rebirth', 'Holy Spirit']
      },
      options: {
        ko: ['긍휼', '중생', '성령', '열심', '지식'],
        en: ['mercy', 'rebirth', 'Holy Spirit', 'zeal', 'knowledge']
      }
    },
    hintInitial: { ko: '1: 불쌍히 여기심(ㄱㅎ), 2: 거듭남(ㅈㅅ), 3: 보혜사(ㅅㄹ)', en: '1: mercy, 2: rebirth, 3: Holy Spirit' },
    hintElimination: { ko: '"열심"과 "지식"은 정답이 아닙니다.', en: '"zeal" and "knowledge" are not answers.' },
    hintWhisper: { ko: '성령님의 새롭게 하심으로 우리는 날마다 새로워집니다.', en: 'Reborn and renewed through the Holy Spirit’s mercy.' }
  },
  {
    id: 24,
    level: 3,
    sectorId: 3,
    objectName: { ko: '제자의 십자가 조각상', en: 'Disciple’s Cross Icon' },
    objectIcon: 'Cross',
    x: 82,
    y: 52,
    reference: { ko: '누가복음 9:23', en: 'Luke 9:23' },
    text: {
      ko: '또 무리에게 이르시되 아무든지 나를 따라오려거든 자기를 부인하고 날마다 제 십자가를 지고 나를 따를 것이니라',
      en: 'Then he said to them all: Whoever wants to be my disciple must deny themselves and take up their cross daily and follow me.'
    },
    multiBlank: {
      template: {
        ko: '아무든지 나를 따라오려거든 자기를 [ __1__ ]하고 [ __2__ ]마다 제 [ __3__ ]를 지고 나를 따를 것이니라',
        en: 'Whoever wants to be my disciple must [ __1__ ] themselves and take up their [ __2__ ] [ __3__ ] and follow me.'
      },
      answers: {
        ko: ['부인', '날', '십자가'],
        en: ['deny', 'cross', 'daily']
      },
      options: {
        ko: ['부인', '날', '십자가', '자랑', '면류관'],
        en: ['deny', 'cross', 'daily', 'boast', 'crown']
      }
    },
    hintInitial: { ko: '1: 자기를 버림(ㅂㅇ), 2: 매일(ㄴ), 3: 고난의 상징(ㅅㅈㄱ)', en: '1: deny, 2: cross, 3: daily' },
    hintElimination: { ko: '"자랑"이나 "면류관"은 오답입니다.', en: '"boast" and "crown" are wrong options.' },
    hintWhisper: { ko: '매일 자기를 내려놓고 주님을 따르는 것이 참된 제자의 길입니다.', en: 'True disciples take up their cross daily to follow Christ.' }
  },
  {
    id: 25,
    level: 3,
    sectorId: 3,
    objectName: { ko: '견실한 닻기둥', en: 'Steadfast Anchor Post' },
    objectIcon: 'Columns',
    x: 20,
    y: 78,
    reference: { ko: '고린도전서 15:58', en: '1 Corinthians 15:58' },
    text: {
      ko: '그러므로 내 사랑하는 형제들아 견실하며 흔들리지 말고 항상 주의 일에 더욱 힘쓰는 자들이 되라 이는 너희 수고가 주 안에서 헛되지 않은 줄 앎이라',
      en: 'Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain.'
    },
    multiBlank: {
      template: {
        ko: '내 사랑하는 형제들아 [ __1__ ]하며 흔들리지 말고 항상 주의 일에 더욱 [ __2__ ]는 자들이 되라 이는 너희 수고가 주 안에서 [ __3__ ]되지 않은 줄 앎이라',
        en: '...stand [ __1__ ]. Let nothing move you. Always give yourselves fully to the [ __2__ ] of the Lord, because your labor is not in [ __3__ ].'
      },
      answers: {
        ko: ['견실', '힘쓰', '헛'],
        en: ['firm', 'work', 'vain']
      },
      options: {
        ko: ['견실', '힘쓰', '헛', '방황', '게으름'],
        en: ['firm', 'work', 'vain', 'lazy', 'doubt']
      }
    },
    hintInitial: { ko: '1: 굳세고 단단함(ㄱㅅ), 2: 노력함(ㅎㅆ), 3: 보람 없음(ㅎ)', en: '1: firm, 2: work, 3: vain' },
    hintElimination: { ko: '"방황"과 "게으름"은 제외하세요.', en: 'Exclude "lazy" and "doubt".' },
    hintWhisper: { ko: '주님을 위한 우리의 모든 수고는 결코 헛되지 않습니다!', en: 'Our labor in Christ will never be in vain.' }
  },
  {
    id: 26,
    level: 3,
    sectorId: 3,
    objectName: { ko: '첫 열매 곡물 창고함', en: 'Firstfruit Granary' },
    objectIcon: 'Wheat',
    x: 52,
    y: 78,
    reference: { ko: '잠언 3:9-10', en: 'Proverbs 3:9-10' },
    text: {
      ko: '네 재물과 네 소산물의 처음 익은 열매로 여호와를 공경하라 그리하면 네 창고가 가득히 차고 네 포도즙 틀에 새 포도즙이 넘치리라',
      en: 'Honor the LORD with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing, and your vats will brim over with new wine.'
    },
    multiBlank: {
      template: {
        ko: '네 재물과 네 소산물의 처음 익은 [ __1__ ]로 여호와를 [ __2__ ]하라 그리하면 네 창고가 [ __3__ ]히 차고...',
        en: 'Honor the LORD with your [ __1__ ]... then your barns will be [ __2__ ] to [ __3__ ]...'
      },
      answers: {
        ko: ['열매', '공경', '가득'],
        en: ['firstfruits', 'filled', 'overflowing']
      },
      options: {
        ko: ['열매', '공경', '가득', '숨겨', '낭비'],
        en: ['firstfruits', 'filled', 'overflowing', 'waste', 'hide']
      }
    },
    hintInitial: { ko: '1: 수확물(ㅇㅁ), 2: 높여 섬김(ㄱㄱ), 3: 꽉 차는 모양(ㄱㄷ)', en: '1: firstfruits, 2: filled, 3: overflowing' },
    hintElimination: { ko: '"낭비"나 "숨김"은 아닙니다.', en: 'Not waste or hide.' },
    hintWhisper: { ko: '가장 귀한 첫 것을 하나님께 드릴 때 넘치는 복을 주십니다.', en: 'Giving God our firstfruits fills our barns with abundance.' }
  },
  {
    id: 27,
    level: 3,
    sectorId: 3,
    objectName: { ko: '사랑과 계명의 황금 촛대', en: 'Candlestick of Commandments' },
    objectIcon: 'CandlestickChart',
    x: 82,
    y: 80,
    reference: { ko: '요한복음 14:21', en: 'John 14:21' },
    text: {
      ko: '나의 계명을 지키는 자라야 나를 사랑하는 자니 나를 사랑하는 자는 내 아버지께 사랑을 받을 것이요 나도 그를 사랑하여 그에게 나를 나타내리라',
      en: 'Whoever has my commands and keeps them is the one who loves me. The one who loves me will be loved by my Father, and I too will love them and show myself to them.'
    },
    multiBlank: {
      template: {
        ko: '나의 [ __1__ ]을 지키는 자라야 나를 [ __2__ ]하는 자니... 나도 그를 사랑하여 그에게 나를 [ __3__ ]내리라',
        en: 'Whoever has my [ __1__ ] and keeps them is the one who [ __2__ ] me... and I too will love them and [ __3__ ] myself to them.'
      },
      answers: {
        ko: ['계명', '사랑', '나타'],
        en: ['commands', 'loves', 'show']
      },
      options: {
        ko: ['계명', '사랑', '나타', '지식', '숨겨'],
        en: ['commands', 'loves', 'show', 'hide', 'rules']
      }
    },
    hintInitial: { ko: '1: 말씀의 명령(ㄱㅁ), 2: 아끼는 마음(ㅅㄹ), 3: 드러냄(ㄴㅌ)', en: '1: commands, 2: loves, 3: show' },
    hintElimination: { ko: '선장실 클리어! "숨겨"는 틀린 보기입니다.', en: 'Captain room clear! "hide" is wrong.' },
    hintWhisper: { ko: '말씀을 순종하여 지키는 것이 진정한 사랑의 증거입니다!', en: 'Obedience to His commands is the true expression of love.' }
  },

  // ==================== LEVEL 4: Full Typing & Sentence (28~35) ====================
  {
    id: 28,
    level: 4,
    sectorId: 4,
    objectName: { ko: '갈라디아 십자가 비석', en: 'Galatian Cross Monument' },
    objectIcon: 'Milestone',
    x: 18,
    y: 20,
    reference: { ko: '갈라디아서 2:20', en: 'Galatians 2:20' },
    text: {
      ko: '내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라 이제 내가 육체 가운데 사는 것은 나를 사랑하사 나를 위하여 자기 자신을 버리신 하나님의 아들을 믿는 믿음 안에서 사는 것이라',
      en: 'I have been crucified with Christ and I no longer live, but Christ lives in me. The life I now live in the body, I live by faith in the Son of God, who loved me and gave himself for me.'
    },
    typingTarget: {
      ko: '내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라 이제 내가 육체 가운데 사는 것은 나를 사랑하사 나를 위하여 자기 자신을 버리신 하나님의 아들을 믿는 믿음 안에서 사는 것이라',
      en: 'I have been crucified with Christ and I no longer live, but Christ lives in me. The life I now live in the body, I live by faith in the Son of God, who loved me and gave himself for me.'
    },
    hintInitial: { ko: '첫 문장: "내가 그리스도와 함께 십자가에 못 박혔나니..."', en: 'Starts with: "I have been crucified with Christ..."' },
    hintElimination: { ko: '중간: "오직 내 안에 그리스도께서 사시는 것이라"', en: 'Middle: "...but Christ lives in me."' },
    hintWhisper: { ko: '내가 죽고 내 안에 예수님이 사시는 가장 위대한 신앙고백입니다!', en: 'The ultimate confession of our new life in Christ!' }
  },
  {
    id: 29,
    level: 4,
    sectorId: 4,
    objectName: { ko: '산 제물 제단 솥', en: 'Living Sacrifice Altar' },
    objectIcon: 'Flame',
    x: 52,
    y: 18,
    reference: { ko: '로마서 12:1', en: 'Romans 12:1' },
    text: {
      ko: '그러므로 형제들아 내가 하나님의 모든 자비하심으로 너희를 권하노니 너희 몸을 하나님이 기뻐하시는 거룩한 산 제물로 드리라 이는 너희가 드릴 영적 예배니라',
      en: 'Therefore, I urge you, brothers and sisters, in view of God’s mercy, to offer your bodies as a living sacrifice, holy and pleasing to God—this is your true and proper worship.'
    },
    typingTarget: {
      ko: '그러므로 형제들아 내가 하나님의 모든 자비하심으로 너희를 권하노니 너희 몸을 하나님이 기뻐하시는 거룩한 산 제물로 드리라 이는 너희가 드릴 영적 예배니라',
      en: 'Therefore, I urge you, brothers and sisters, in view of God’s mercy, to offer your bodies as a living sacrifice, holy and pleasing to God—this is your true and proper worship.'
    },
    hintInitial: { ko: '시작: "그러므로 형제들아 내가 하나님의 모든 자비하심으로..."', en: 'Starts with: "Therefore, I urge you, brothers and sisters..."' },
    hintElimination: { ko: '핵심 단어: "거룩한 산 제물", "영적 예배니라"', en: 'Key terms: "living sacrifice", "proper worship"' },
    hintWhisper: { ko: '우리의 삶 전체가 하나님이 기뻐하시는 거룩한 예배입니다.', en: 'Offering our daily lives is our true worship.' }
  },
  {
    id: 30,
    level: 4,
    sectorId: 4,
    objectName: { ko: '평강의 은 방울', en: 'Silver Bell of Peace' },
    objectIcon: 'BellRing',
    x: 82,
    y: 22,
    reference: { ko: '빌립보서 4:6-7', en: 'Philippians 4:6-7' },
    text: {
      ko: '아무것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라',
      en: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.'
    },
    typingTarget: {
      ko: '아무것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라',
      en: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.'
    },
    hintInitial: { ko: '시작: "아무것도 염려하지 말고 다만 모든 일에 기도와 간구로..."', en: 'Starts with: "Do not be anxious about anything..."' },
    hintElimination: { ko: '후반부: "...하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라"', en: 'Ending: "...will guard your hearts and your minds in Christ Jesus."' },
    hintWhisper: { ko: '염려 대신 감사함으로 기도할 때 주님의 평강이 마음을 지켜주십니다.', en: 'Turn anxiety into prayer with thanksgiving, and God’s peace will guard you.' }
  },
  {
    id: 31,
    level: 4,
    sectorId: 4,
    objectName: { ko: '격려와 사랑의 모임 탁자', en: 'Fellowship Communion Table' },
    objectIcon: 'Users',
    x: 20,
    y: 50,
    reference: { ko: '히브리서 10:24-25', en: 'Hebrews 10:24-25' },
    text: {
      ko: '서로 돌아보아 사랑과 선행을 격려하며 모이기를 폐하는 어떤 사람들의 습관과 같이 하지 말고 오직 권하여 그 날이 가까움을 볼수록 더욱 그리하자',
      en: 'And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together, as some are in the habit of doing, but encouraging one another—and all the more as you see the Day approaching.'
    },
    typingTarget: {
      ko: '서로 돌아보아 사랑과 선행을 격려하며 모이기를 폐하는 어떤 사람들의 습관과 같이 하지 말고 오직 권하여 그 날이 가까움을 볼수록 더욱 그리하자',
      en: 'And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together, as some are in the habit of doing, but encouraging one another—and all the more as you see the Day approaching.'
    },
    hintInitial: { ko: '시작: "서로 돌아보아 사랑과 선행을 격려하며..."', en: 'Starts with: "And let us consider how we may spur one another..."' },
    hintElimination: { ko: '후반: "...오직 권하여 그 날이 가까움을 볼수록 더욱 그리하자"', en: 'Ending: "...all the more as you see the Day approaching."' },
    hintWhisper: { ko: '함께 모여 격려하고 사랑을 나누는 공동체가 아름답습니다.', en: 'Encouraging one another and gathering together strengthens faith.' }
  },
  {
    id: 32,
    level: 4,
    sectorId: 4,
    objectName: { ko: '정결한 금 세공 상자', en: 'Pure Gold Ingot Chest' },
    objectIcon: 'Boxes',
    x: 52,
    y: 48,
    reference: { ko: '요한일서 2:15-16', en: '1 John 2:15-16' },
    text: {
      ko: '이 세상이나 세상에 있는 것들을 사랑하지 말라 누구든지 세상을 사랑하면 아버지의 사랑이 그 안에 있지 아니하니 이는 세상에 있는 모든 것이 육신의 정욕과 안목의 정욕과 이생의 자랑이니 다 아버지로부터 온 것이 아니요 세상으로부터 온 것이라',
      en: 'Do not love the world or anything in the world. If anyone loves the world, love for the Father is not in them. For everything in the world—the lust of the flesh, the lust of the eyes, and the pride of life—comes not from the Father but from the world.'
    },
    typingTarget: {
      ko: '이 세상이나 세상에 있는 것들을 사랑하지 말라 누구든지 세상을 사랑하면 아버지의 사랑이 그 안에 있지 아니하니 이는 세상에 있는 모든 것이 육신의 정욕과 안목의 정욕과 이생의 자랑이니 다 아버지로부터 온 것이 아니요 세상으로부터 온 것이라',
      en: 'Do not love the world or anything in the world. If anyone loves the world, love for the Father is not in them. For everything in the world—the lust of the flesh, the lust of the eyes, and the pride of life—comes not from the Father but from the world.'
    },
    hintInitial: { ko: '시작: "이 세상이나 세상에 있는 것들을 사랑하지 말라..."', en: 'Starts with: "Do not love the world..."' },
    hintElimination: { ko: '세 가지: "육신의 정욕과 안목의 정욕과 이생의 자랑"', en: 'Three snares: "lust of the flesh, lust of the eyes, pride of life"' },
    hintWhisper: { ko: '세상의 헛된 욕심을 버리고 오직 하나님만을 사랑합시다!', en: 'Overcome worldly desires through pure love for the Father.' }
  },
  {
    id: 33,
    level: 4,
    sectorId: 4,
    objectName: { ko: '변화의 거울함', en: 'Mirror of Renewal' },
    objectIcon: 'Sparkles',
    x: 82,
    y: 52,
    reference: { ko: '로마서 12:2', en: 'Romans 12:2' },
    text: {
      ko: '너희는 이 세대를 본받지 말고 오직 마음을 새롭게 함으로 변화를 받아 하나님의 선하시고 기뻐하시고 온전하신 뜻이 무엇인지 분별하도록 하라',
      en: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God’s will is—his good, pleasing and perfect will.'
    },
    typingTarget: {
      ko: '너희는 이 세대를 본받지 말고 오직 마음을 새롭게 함으로 변화를 받아 하나님의 선하시고 기뻐하시고 온전하신 뜻이 무엇인지 분별하도록 하라',
      en: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God’s will is—his good, pleasing and perfect will.'
    },
    hintInitial: { ko: '시작: "너희는 이 세대를 본받지 말고 오직 마음을 새롭게 함으로..."', en: 'Starts with: "Do not conform to the pattern of this world..."' },
    hintElimination: { ko: '후반: "...하나님의 선하시고 기뻐하시고 온전하신 뜻이 무엇인지 분별하도록 하라"', en: 'Ending: "...his good, pleasing and perfect will."' },
    hintWhisper: { ko: '마음을 새롭게 하여 하나님의 뜻을 분별하는 지혜로운 항해자가 됩시다!', en: 'Renew your mind to discern God’s good, pleasing, and perfect will.' }
  },
  {
    id: 34,
    level: 4,
    sectorId: 4,
    objectName: { ko: '기쁨의 씨앗 자루', en: 'Joyful Harvest Pouch' },
    objectIcon: 'Coins',
    x: 22,
    y: 78,
    reference: { ko: '고린도후서 9:6-7', en: '2 Corinthians 9:6-7' },
    text: {
      ko: '이것이 곧 적게 심는 자는 적게 거두고 많이 심는 자는 많이 거둔다 하는 말이로다 각각 그 마음에 정한 대로 할 것이요 인색함으로나 억지로 하지 말지니 하나님은 즐겨 내는 자를 사랑하시느니라',
      en: 'Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously. Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.'
    },
    typingTarget: {
      ko: '이것이 곧 적게 심는 자는 적게 거두고 많이 심는 자는 많이 거둔다 하는 말이로다 각각 그 마음에 정한 대로 할 것이요 인색함으로나 억지로 하지 말지니 하나님은 즐겨 내는 자를 사랑하시느니라',
      en: 'Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously. Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.'
    },
    hintInitial: { ko: '시작: "이것이 곧 적게 심는 자는 적게 거두고 많이 심는 자는 많이 거둔다..."', en: 'Starts with: "Whoever sows sparingly will also reap sparingly..."' },
    hintElimination: { ko: '마무리: "...하나님은 즐겨 내는 자를 사랑하시느니라"', en: 'Ending: "...for God loves a cheerful giver."' },
    hintWhisper: { ko: '하나님은 인색함이 아니라 기쁜 마음으로 드리는 헌신을 사랑하십니다.', en: 'God cherishes cheerful, generous devotion from the heart.' }
  },
  {
    id: 35,
    level: 4,
    sectorId: 4,
    objectName: { ko: '지상 대위임령 황금비', en: 'Great Commission Obelisk' },
    objectIcon: 'Globe',
    x: 65,
    y: 78,
    reference: { ko: '마태복음 28:19-20', en: 'Matthew 28:19-20' },
    text: {
      ko: '그러므로 너희는 가서 모든 민족을 제자로 삼아 아버지와 아들과 성령의 이름으로 세례를 베풀고 내가 너희에게 분부한 모든 것을 가르쳐 지키게 하라 볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라 하시니라',
      en: 'Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.'
    },
    typingTarget: {
      ko: '그러므로 너희는 가서 모든 민족을 제자로 삼아 아버지와 아들과 성령의 이름으로 세례를 베풀고 내가 너희에게 분부한 모든 것을 가르쳐 지키게 하라 볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라 하시니라',
      en: 'Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.'
    },
    hintInitial: { ko: '시작: "그러므로 너희는 가서 모든 민족을 제자로 삼아..."', en: 'Starts with: "Therefore go and make disciples of all nations..."' },
    hintElimination: { ko: '마지막 약속: "볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라 하시니라"', en: 'Final promise: "And surely I am with you always, to the very end of the age."' },
    hintWhisper: { ko: '모든 민족에게 복음을 전하라는 주님의 위대한 지상 명령입니다!', en: 'The Great Commission to make disciples of all nations!' }
  },

  // ==================== FINAL GRAND ESCAPE GATE (36) ====================
  {
    id: 36,
    level: 5,
    sectorId: 5,
    objectName: { ko: '성령의 황금 탈출문', en: 'Golden Holy Spirit Escape Gate' },
    objectIcon: 'DoorOpen',
    x: 50,
    y: 50,
    reference: { ko: '사도행전 1:8', en: 'Acts 1:8' },
    text: {
      ko: '오직 성령이 너희에게 임하시면 너희가 권능을 받고 예루살렘과 온 유대와 사마리아와 땅 끝까지 이르러 내 증인이 되리라 하시니라',
      en: 'But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.'
    },
    typingTarget: {
      ko: '오직 성령이 너희에게 임하시면 너희가 권능을 받고 예루살렘과 온 유대와 사마리아와 땅 끝까지 이르러 내 증인이 되리라 하시니라',
      en: 'But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.'
    },
    hintInitial: { ko: '시작: "오직 성령이 너희에게 임하시면 너희가 권능을 받고..."', en: 'Starts with: "But you will receive power when the Holy Spirit comes..."' },
    hintElimination: { ko: '지역 순서: "예루살렘과 온 유대와 사마리아와 땅 끝까지"', en: 'Regions: "in Jerusalem, and in all Judea and Samaria, and to the ends of the earth."' },
    hintWhisper: { ko: '최종 관문! 성령의 능력으로 땅끝까지 예수님의 증인이 됩시다! 할렐루야!', en: 'Final Key! Empowered by the Holy Spirit to witness to the ends of the earth!' }
  }
];
