// Character and asset image references matching [믿음의 항해 캐릭터.png] & [바다배경.png]
import bgSeaVoyage from '../assets/images/sea_voyage_bg_1787666414152.jpg';
import charSailorBoy from '../assets/images/char_sailor_boy_1787666438229.jpg';
import charBibleGirl from '../assets/images/char_bible_girl_1787666459525.jpg';
import charExplorerBoy from '../assets/images/char_explorer_boy_1787666479360.jpg';
import charAdventurerBoy from '../assets/images/char_adventurer_boy_1787666631143.jpg';
import charJesusLantern from '../assets/images/char_jesus_lantern_1787666501031.jpg';

import petWhiteLamb from '../assets/images/pet_white_lamb_1787666520925.jpg';
import petFaithArk from '../assets/images/pet_faith_ark_1787666542832.jpg';
import petSailorTurtle from '../assets/images/pet_sailor_turtle_1787666608047.jpg';
import petSailorSeagull from '../assets/images/pet_sailor_seagull_1787666650556.jpg';

export const ASSET_IMAGES = {
  seaBackground: bgSeaVoyage,
};

export type CharacterId = 'sailor_boy' | 'bible_girl' | 'explorer_boy' | 'adventurer_boy' | 'jesus_guide';

export interface CharacterHero {
  id: CharacterId;
  name: { ko: string; en: string };
  title: { ko: string; en: string };
  image: string;
  emoji: string;
  description: { ko: string; en: string };
  color: string;
}

export const HERO_CHARACTERS: CharacterHero[] = [
  {
    id: 'sailor_boy',
    name: { ko: '항해사 다윗', en: 'Captain David' },
    title: { ko: '믿음의 조타수', en: 'Helmsman of Faith' },
    image: charSailorBoy,
    emoji: '🧭',
    description: { ko: '키를 잡고 거친 바다를 뚫고 나아가는 용기 있는 꼬마 선장', en: 'Brave captain navigating through the stormy seas' },
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'bible_girl',
    name: { ko: '성경 소녀 에스더', en: 'Bible Esther' },
    title: { ko: '말씀의 수호자', en: 'Guardian of the Word' },
    image: charBibleGirl,
    emoji: '📖',
    description: { ko: '언제나 거룩한 성경 말씀을 품고 길을 밝히는 소녀', en: 'Holding the Holy Bible with a bright cheerful heart' },
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'explorer_boy',
    name: { ko: '탐험가 바울', en: 'Explorer Paul' },
    title: { ko: '약속의 탐험가', en: 'Promise Explorer' },
    image: charExplorerBoy,
    emoji: '🔭',
    description: { ko: '망원경과 성경 지도로 숨겨진 비밀을 밝히는 스카우트', en: 'Curious scout with telescope and ancient scroll maps' },
    color: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'adventurer_boy',
    name: { ko: '모험가 요셉', en: 'Adventurer Joseph' },
    title: { ko: '희망의 모험가', en: 'Hope Adventurer' },
    image: charAdventurerBoy,
    emoji: '🤿',
    description: { ko: '물안경을 쓰고 거친 파도 속으로 뛰어드는 열정의 소년', en: 'Energetic adventurer ready to leap over high waves' },
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'jesus_guide',
    name: { ko: '인도자 예수님', en: 'Jesus our Guide' },
    title: { ko: '생명의 참 빛', en: 'Light of the World' },
    image: charJesusLantern,
    emoji: '✝️',
    description: { ko: '따스한 등불을 들고 언제나 우리 곁에서 동행하시는 주님', en: 'Loving Savior holding a warm lantern guiding our path' },
    color: 'from-yellow-500 to-amber-600',
  },
];

export interface MascotPet {
  id: string;
  name: { ko: string; en: string };
  animal: { ko: string; en: string };
  image: string;
  emoji: string;
  quote: { ko: string; en: string };
}

export const MASCOT_PETS: MascotPet[] = [
  {
    id: 'lamb',
    name: { ko: '어린 양 샬롬', en: 'Lamb Shalom' },
    animal: { ko: '순결한 양', en: 'Pure Lamb' },
    image: petWhiteLamb,
    emoji: '🐑',
    quote: {
      ko: '선한 목자 예수님을 따라가면 길을 잃지 않아요!',
      en: 'Following Jesus our Good Shepherd keeps us safe!'
    }
  },
  {
    id: 'seagull',
    name: { ko: '선원 갈매기 요나', en: 'Sailor Seagull' },
    animal: { ko: '항해 갈매기', en: 'Voyage Seagull' },
    image: petSailorSeagull,
    emoji: '🕊️',
    quote: {
      ko: '하늘 높이 날아올라 성경 구절의 비밀을 알려줄게!',
      en: 'Soaring high in the sky to scout holy verses for you!'
    }
  },
  {
    id: 'turtle',
    name: { ko: '선원 거북이 바나바', en: 'Sailor Turtle' },
    animal: { ko: '바다 거북', en: 'Sea Turtle' },
    image: petSailorTurtle,
    emoji: '🐢',
    quote: {
      ko: '느려도 차근차근 암송하면 모든 방을 탈출할 수 있어요!',
      en: 'Steady faith and patient recitation solves every puzzle!'
    }
  },
  {
    id: 'ark',
    name: { ko: '믿음의 방주', en: 'Ark of Faith' },
    animal: { ko: '구원의 방주', en: 'Ark of Salvation' },
    image: petFaithArk,
    emoji: '⛵',
    quote: {
      ko: '말씀의 돛을 올리고 약속의 땅으로 힘차게 출항해요!',
      en: 'Raise the sails of faith and head to the Promised Land!'
    }
  }
];
