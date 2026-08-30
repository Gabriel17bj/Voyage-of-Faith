import React, { useState } from 'react';
import { FamId, Language, PlayerProfile } from '../types';
import { UI_TEXT } from '../data/translations';
import { HERO_CHARACTERS, MASCOT_PETS, ASSET_IMAGES, CharacterId } from '../data/characters';
import { Play, Settings, Trophy, BookOpen, Info, Sparkles, Check, Flame, Volume2, User, Compass, ShieldCheck, RotateCcw } from 'lucide-react';
import { sounds } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface StartScreenProps {
  onStartGame: (profile: PlayerProfile) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onOpenCredits: () => void;
  hasSavedProgress?: boolean;
  savedProgressStats?: { stars: number; completedCount: number };
  onResumeGame?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  language,
  onLanguageChange,
  onOpenLeaderboard,
  onOpenRules,
  onOpenSettings,
  onOpenCredits,
  hasSavedProgress = false,
  savedProgressStats,
  onResumeGame,
}) => {
  const t = UI_TEXT[language];
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>('다윗');
  const [selectedHeroId, setSelectedHeroId] = useState<CharacterId>('sailor_boy');
  const [selectedPetId, setSelectedPetId] = useState<string>('lamb');

  const handleOpenSetup = () => {
    sounds.playTap();
    setShowProfileModal(true);
  };

  const handleConfirmStart = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playTap();
    const finalName = playerName.trim() || (language === 'ko' ? '믿음의 용사' : 'Faith Warrior');
    onStartGame({
      name: finalName,
      fam: (selectedPetId === 'lamb' ? 'shalom' : selectedPetId === 'turtle' ? 'wisdom' : 'agape') as FamId,
      characterId: selectedHeroId,
      language,
    });
  };

  const currentHero = HERO_CHARACTERS.find((h) => h.id === selectedHeroId) || HERO_CHARACTERS[0];
  const currentPet = MASCOT_PETS.find((p) => p.id === selectedPetId) || MASCOT_PETS[0];

  return (
    <div className="relative w-full max-w-[1200px] max-h-[96dvh] aspect-[16/9] bg-[#071322] rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-[#8e5837] shadow-2xl overflow-hidden flex flex-col justify-between select-none">
      
      {/* ========================================================= */}
      {/* GENTLE SEA VOYAGE BACKGROUND (Matching [바다배경.png]) */}
      {/* ========================================================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft watercolor sea background image */}
        <img
          src={ASSET_IMAGES.seaBackground}
          alt="Sea Voyage Background"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-55 filter brightness-95 contrast-105"
        />

        {/* Gentle celestial azure & deep blue gradient veil for high contrast text */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08223a]/65 via-[#0b2b48]/45 to-[#051624]/80" />
        
        {/* Radial soft sunbeam */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-200/25 via-blue-500/10 to-transparent" />
        
        {/* Floating gentle light particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-200 animate-ping" />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-sky-200 animate-bounce" />
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-yellow-100 animate-pulse" />
        </div>
      </div>

      {/* ========================================================= */}
      {/* HEADER LOGO SECTION */}
      {/* ========================================================= */}
      <div className="relative z-10 pt-2 sm:pt-4 flex flex-col items-center text-center px-4">
        
        {/* Top Arc Tag: "암송아지" */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0a2742]/85 border border-sky-400/50 shadow-md backdrop-blur-sm"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span className="text-xs sm:text-sm font-black text-amber-200 tracking-wider">
            {language === 'ko' ? '암송아지' : 'Scripture Calf (암송아지)'}
          </span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </motion.div>

        {/* Main Golden Title: "PROMISE LAND : 믿음의 항해" */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative mt-1 flex items-center justify-center"
        >
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#ffea79] rpg-title-glow select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] flex items-center gap-2">
            <span className="text-white drop-shadow-[0_2px_4px_#061a2e]">PROMISE LAND</span>
            <span className="text-amber-300 drop-shadow-[0_2px_4px_#061a2e]">:</span>
            <span className="text-emerald-300 font-bold drop-shadow-[0_2px_4px_#061a2e]">
              믿음의 항해
            </span>
          </h1>

          {/* Golden Sparkle Star */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            className="absolute -top-3 -right-6 text-xl sm:text-3xl text-amber-300 pointer-events-none drop-shadow-[0_0_8px_#ffd700]"
          >
            ✨
          </motion.div>
        </motion.div>

        {/* Subtitle: "예수님과 함께하는 믿음의 항해" */}
        <p className="text-xs sm:text-base md:text-lg text-amber-100 font-bold tracking-wide drop-shadow mt-1">
          {language === 'ko' ? '예수님과 함께하는 믿음의 항해' : 'Voyage of Faith with Jesus'}
        </p>
      </div>

      {/* ========================================================= */}
      {/* CENTER STAGE: 5 HEROES -> CAMPFIRE -> 4 ANIMAL MASCOTS */}
      {/* ========================================================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-1 px-2">
        
        {/* ROW 1: 5 CHARACTERS (Left to Right: Paul, Esther, JESUS [Center], David, Joseph) */}
        <div className="relative flex items-end justify-center gap-1.5 sm:gap-3 md:gap-5 mb-1.5 sm:mb-2">
          
          {/* 1. Far Left: Explorer Paul (탐험가 바울) */}
          <div className="flex flex-col items-center z-10 transition-transform hover:scale-105">
            <div className="w-10 h-10 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-lg bg-slate-900 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
              <img
                src={HERO_CHARACTERS[2].image}
                alt="Explorer Paul"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] text-emerald-200 font-bold bg-black/85 px-1.5 py-0.5 rounded-full mt-1 z-10 border border-emerald-500/50 shadow">
              바울
            </span>
          </div>

          {/* 2. Mid Left: Bible Esther (성경 소녀 에스더) */}
          <div className="flex flex-col items-center z-15 transition-transform hover:scale-105">
            <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-pink-400/80 shadow-lg bg-slate-900 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
              <img
                src={HERO_CHARACTERS[1].image}
                alt="Bible Esther"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] text-pink-200 font-bold bg-black/85 px-1.5 py-0.5 rounded-full mt-1 z-10 border border-pink-500/50 shadow">
              에스더
            </span>
          </div>

          {/* 3. CENTER: JESUS OUR GUIDE (인도자 예수님 - Prominent & Glowing) */}
          <div className="flex flex-col items-center z-25 scale-105 sm:scale-110 transition-transform hover:scale-115">
            {/* Divine Glow Halo */}
            <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur-md animate-pulse pointer-events-none" />
            
            <div className="relative w-13 h-13 sm:w-16 sm:h-16 md:w-19 md:h-19 rounded-2xl sm:rounded-3xl overflow-hidden border-2 sm:border-3 border-amber-300 shadow-[0_0_20px_rgba(255,215,0,0.7)] bg-amber-950/60 filter drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]">
              <img
                src={HERO_CHARACTERS[4].image}
                alt="Jesus our Guide"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[9px] sm:text-[10px] md:text-[11px] text-amber-200 font-black bg-gradient-to-r from-amber-900 to-amber-950 px-2 py-0.5 rounded-full mt-1 z-10 border-2 border-amber-400/80 shadow-md flex items-center gap-1">
              <span>✝️</span>
              <span>예수님</span>
            </span>
          </div>

          {/* 4. Mid Right: Captain David (항해사 다윗) */}
          <div className="flex flex-col items-center z-15 transition-transform hover:scale-105">
            <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-blue-400/80 shadow-lg bg-slate-900 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
              <img
                src={HERO_CHARACTERS[0].image}
                alt="Captain David"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] text-sky-200 font-bold bg-black/85 px-1.5 py-0.5 rounded-full mt-1 z-10 border border-blue-500/50 shadow">
              {playerName || '다윗'}
            </span>
          </div>

          {/* 5. Far Right: Adventurer Joseph (모험가 요셉) */}
          <div className="flex flex-col items-center z-10 transition-transform hover:scale-105">
            <div className="w-10 h-10 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-lg bg-slate-900 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
              <img
                src={HERO_CHARACTERS[3].image}
                alt="Adventurer Joseph"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] text-amber-300 font-bold bg-black/85 px-1.5 py-0.5 rounded-full mt-1 z-10 border border-amber-500/50 shadow">
              요셉
            </span>
          </div>

        </div>

        {/* ROW 2: CAMPFIRE & 4 ANIMAL MASCOTS (Placed clearly below characters without obscuring names) */}
        <div className="relative flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mt-0.5 sm:mt-1">
          
          {/* Mascot 1: Lamb Shalom (어린 양 샬롬) */}
          <div 
            onClick={() => {
              sounds.playTap();
              setSelectedPetId('lamb');
            }}
            className={`flex flex-col items-center cursor-pointer transition-transform hover:scale-110 ${selectedPetId === 'lamb' ? 'scale-105' : 'opacity-85'}`}
          >
            <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl overflow-hidden border shadow bg-slate-900 ${selectedPetId === 'lamb' ? 'border-sky-300 ring-2 ring-sky-400/60' : 'border-slate-600'}`}>
              <img
                src={MASCOT_PETS[0].image}
                alt="Lamb"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[7px] sm:text-[8px] text-slate-200 font-bold bg-black/80 px-1 rounded -mt-1 z-10 border border-slate-700">
              어린양
            </span>
          </div>

          {/* Mascot 2: Sailor Seagull (선원 갈매기 요나) */}
          <div 
            onClick={() => {
              sounds.playTap();
              setSelectedPetId('seagull');
            }}
            className={`flex flex-col items-center cursor-pointer transition-transform hover:scale-110 ${selectedPetId === 'seagull' ? 'scale-105' : 'opacity-85'}`}
          >
            <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl overflow-hidden border shadow bg-slate-900 ${selectedPetId === 'seagull' ? 'border-sky-300 ring-2 ring-sky-400/60' : 'border-slate-600'}`}>
              <img
                src={MASCOT_PETS[1].image}
                alt="Seagull"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[7px] sm:text-[8px] text-sky-200 font-bold bg-black/80 px-1 rounded -mt-1 z-10 border border-slate-700">
              갈매기
            </span>
          </div>

          {/* Center Campfire */}
          <div className="flex flex-col items-center px-1 sm:px-2 z-20">
            <div className="text-xl sm:text-2xl md:text-3xl animate-campfire select-none filter drop-shadow-[0_0_12px_rgba(255,165,0,0.85)]">
              🔥
            </div>
            <div className="w-8 sm:w-10 h-1.5 sm:h-2 bg-black/70 rounded-full blur-[1.5px] -mt-0.5" />
          </div>

          {/* Mascot 3: Sailor Turtle (선원 거북이 바나바) */}
          <div 
            onClick={() => {
              sounds.playTap();
              setSelectedPetId('turtle');
            }}
            className={`flex flex-col items-center cursor-pointer transition-transform hover:scale-110 ${selectedPetId === 'turtle' ? 'scale-105' : 'opacity-85'}`}
          >
            <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl overflow-hidden border shadow bg-slate-900 ${selectedPetId === 'turtle' ? 'border-emerald-300 ring-2 ring-emerald-400/60' : 'border-slate-600'}`}>
              <img
                src={MASCOT_PETS[2].image}
                alt="Turtle"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[7px] sm:text-[8px] text-emerald-200 font-bold bg-black/80 px-1 rounded -mt-1 z-10 border border-slate-700">
              거북이
            </span>
          </div>

          {/* Mascot 4: Ark of Faith (믿음의 방주) */}
          <div 
            onClick={() => {
              sounds.playTap();
              setSelectedPetId('ark');
            }}
            className={`flex flex-col items-center cursor-pointer transition-transform hover:scale-110 ${selectedPetId === 'ark' ? 'scale-105' : 'opacity-85'}`}
          >
            <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl overflow-hidden border shadow bg-slate-900 ${selectedPetId === 'ark' ? 'border-amber-300 ring-2 ring-amber-400/60' : 'border-slate-600'}`}>
              <img
                src={MASCOT_PETS[3].image}
                alt="Ark"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[7px] sm:text-[8px] text-amber-200 font-bold bg-black/80 px-1 rounded -mt-1 z-10 border border-slate-700">
              방주
            </span>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* HORIZONTAL RPG WOODEN BOTTOM MENU BAR (Alongside Credits) */}
      {/* ========================================================= */}
      <div className="relative z-20 pb-3 sm:pb-4 px-2 sm:px-4 w-full flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap">
        
        {/* Resume Game Button (If saved progress exists) */}
        {hasSavedProgress && onResumeGame && (
          <button
            onClick={() => {
              sounds.playCorrect();
              onResumeGame();
            }}
            className="rpg-btn-wood py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 border-emerald-400/90 bg-gradient-to-b from-[#1a5c32] to-[#0c331a] animate-pulse"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="text-emerald-100">
              이어서 항해하기 ({savedProgressStats?.completedCount || 0}구절/⭐{savedProgressStats?.stars || 0})
            </span>
          </button>
        )}

        {/* Game Start Button (Primary highlighted) */}
        <button
          onClick={handleOpenSetup}
          className="rpg-btn-wood py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 border-amber-300/80 bg-gradient-to-b from-[#804218] to-[#4a240c]"
        >
          <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300 shrink-0" />
          <span className="text-amber-100">{hasSavedProgress ? '새 항해 시작' : '게임시작'}</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onOpenSettings();
          }}
          className="rpg-btn-wood py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 cursor-pointer opacity-95 hover:opacity-100 shadow active:scale-95"
        >
          <Settings className="w-3 h-3 text-amber-200 shrink-0" />
          <span>환경설정</span>
        </button>

        {/* Leaderboard Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onOpenLeaderboard();
          }}
          className="rpg-btn-wood py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 cursor-pointer opacity-95 hover:opacity-100 shadow active:scale-95"
        >
          <Trophy className="w-3 h-3 text-amber-300 shrink-0" />
          <span>믿음의 이정표</span>
        </button>

        {/* Rules Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onOpenRules();
          }}
          className="rpg-btn-wood py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 cursor-pointer opacity-95 hover:opacity-100 shadow active:scale-95"
        >
          <BookOpen className="w-3 h-3 text-blue-200 shrink-0" />
          <span>항해 규칙</span>
        </button>

        {/* Credits Button (Arranged Horizontally with the other buttons) */}
        <button
          onClick={() => {
            sounds.playTap();
            onOpenCredits();
          }}
          className="rpg-btn-wood py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-[11px] flex items-center justify-center gap-1 cursor-pointer opacity-90 hover:opacity-100 shadow active:scale-95"
        >
          <Info className="w-3 h-3 text-amber-200 shrink-0" />
          <span>크레딧</span>
        </button>

        {/* Developer Credit Note */}
        <div className="w-full text-center -mt-0.5 sm:mt-0">
          <span className="text-[9px] sm:text-[10px] text-sky-200/60 font-medium tracking-wide">
            Developed by <strong className="text-amber-200/90 font-bold">Gabriel Byeongje Jeon</strong>
          </span>
        </div>

      </div>

      {/* ========================================================= */}
      {/* CHARACTER & PROFILE SETUP MODAL (Featuring [믿음의 항해 캐릭터.png]) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0a1526] border-2 sm:border-4 border-[#8e5837] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col gap-3 text-slate-100 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-300" />
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-amber-300">용사 선택 & 항해 준비</h3>
                    <span className="text-[10px] text-slate-400">믿음의 항해를 떠날 캐릭터와 마스코트를 선택하세요</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmStart} className="flex flex-col gap-3">
                {/* Character Name Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-amber-200">
                    용사 닉네임
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="예: 다윗, 에스더, 바울, 요셉"
                    maxLength={12}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Hero Character Selection (5 Characters from [믿음의 항해 캐릭터.png]) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-amber-200">
                    플레이 캐릭터 선택
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {HERO_CHARACTERS.map((hero) => {
                      const isSel = selectedHeroId === hero.id;
                      return (
                        <button
                          key={hero.id}
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setSelectedHeroId(hero.id);
                            if (hero.id === 'sailor_boy') setPlayerName('다윗');
                            if (hero.id === 'bible_girl') setPlayerName('에스더');
                            if (hero.id === 'explorer_boy') setPlayerName('바울');
                            if (hero.id === 'adventurer_boy') setPlayerName('요셉');
                            if (hero.id === 'jesus_guide') setPlayerName('주님의 제자');
                          }}
                          className={`p-1.5 rounded-xl border flex flex-col items-center text-center transition cursor-pointer ${
                            isSel
                              ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 shadow-md scale-105'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                            <img
                              src={hero.image}
                              alt={hero.name[language]}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-200 mt-1 line-clamp-1">
                            {hero.name[language].split(' ')[1] || hero.name[language]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Selected Hero Info Banner */}
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-amber-500/30 flex items-center gap-2">
                    <span className="text-base">{currentHero.emoji}</span>
                    <div className="text-[10px]">
                      <strong className="text-amber-300">{currentHero.name[language]} ({currentHero.title[language]})</strong>
                      <p className="text-slate-300 text-[9px]">{currentHero.description[language]}</p>
                    </div>
                  </div>
                </div>

                {/* Mascot Selection (4 Mascots from [믿음의 항해 캐릭터.png]) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-amber-200">
                    함께할 동행 마스코트
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MASCOT_PETS.map((pet) => {
                      const isSel = selectedPetId === pet.id;
                      return (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setSelectedPetId(pet.id);
                          }}
                          className={`p-1.5 rounded-xl border flex flex-col items-center text-center transition cursor-pointer ${
                            isSel
                              ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-400/50 shadow-md scale-105'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                            <img
                              src={pet.image}
                              alt={pet.name[language]}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[9px] font-bold text-slate-200 mt-1 line-clamp-1">
                            {pet.name[language].split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Selected Pet Quote */}
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-sky-500/30 flex items-center gap-2 text-[10px] text-sky-200 italic">
                    <span className="text-base shrink-0">{currentPet.emoji}</span>
                    <p className="line-clamp-1">"{currentPet.quote[language]}"</p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="rpg-btn-wood w-full py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer mt-0.5 shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>믿음의 항해 출발하기</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
