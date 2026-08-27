export type Language = 'ko' | 'en';

export type FamId = 'agape' | 'shalom' | 'wisdom';

export interface FamInfo {
  id: FamId;
  name: { ko: string; en: string };
  animal: { ko: string; en: string };
  emoji: string;
  badgeColor: string;
  quote: { ko: string; en: string };
  avatarBg: string;
}

export type QuestType = 'order' | 'single_blank' | 'multi_blank' | 'typing' | 'final_gate';

export interface VerseQuest {
  id: number; // 1 to 36
  level: 1 | 2 | 3 | 4 | 5; // 1: Single Blank, 2: Word Order, 3: Multi Blank, 4: Typing, 5: Final
  reference: { ko: string; en: string };
  text: { ko: string; en: string };
  objectName: { ko: string; en: string };
  objectIcon: string;
  sectorId: number; // 1: Crew Deck, 2: Nav Cabin, 3: Captain Room, 4: Relic Sanctuary, 5: Holy Gate
  x: number; // percentage on map (0-100)
  y: number; // percentage on map (0-100)
  
  // Level 1: Single Blank
  singleBlank?: {
    blankIndex: number;
    options: { ko: string[]; en: string[] };
    answer: { ko: string; en: string };
    maskedText: { ko: string; en: string };
  };

  // Level 2: Word Order tokens
  orderTokens?: {
    ko: string[];
    en: string[];
  };

  // Level 3: Multi Blank
  multiBlank?: {
    answers: { ko: string[]; en: string[] };
    options: { ko: string[]; en: string[] };
    template: { ko: string; en: string }; // contains __1__, __2__, __3__
  };

  // Level 4 & Final: Typing
  typingTarget?: {
    ko: string;
    en: string;
  };

  // Hints
  hintInitial: { ko: string; en: string }; // Light Magnifier
  hintElimination: { ko: string; en: string }; // Truth Hourglass
  hintWhisper: { ko: string; en: string }; // Fam Whisper
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  famId: FamId;
  language: Language;
  timeMs: number;
  formattedTime: string;
  completedAt: string;
  hintsUsed: number;
}

export interface PlayerProfile {
  name: string;
  fam: FamId;
  characterId?: string;
  language: Language;
}

export interface GameSector {
  id: number;
  name: { ko: string; en: string };
  description: { ko: string; en: string };
  themeBg: string;
  icon: string;
  questRange: [number, number]; // [startId, endId]
}
