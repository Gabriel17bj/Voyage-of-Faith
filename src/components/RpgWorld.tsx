import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FamId, FamInfo, Language, PlayerProfile, VerseQuest } from '../types';
import { FAM_LIST, SECTOR_LIST, VERSE_QUESTS } from '../data/verses';
import { HERO_CHARACTERS, MASCOT_PETS, ASSET_IMAGES } from '../data/characters';
import { UI_TEXT } from '../data/translations';
import { sounds } from '../utils/audio';
import { 
  Rigidbody2D, 
  BoxCollider2D, 
  Physics2DLayer, 
  PhysicsParticle,
  Vector2 
} from '../utils/physics2d';
import { 
  Compass, Sparkles, CheckCircle2, Lock, Key, Flame, BookOpen, 
  ShieldCheck, Award, Eye, Users, ChevronRight, Zap, MapPin, 
  Volume2, VolumeX, Trophy, Settings, HelpCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RpgWorldProps {
  playerProfile: PlayerProfile;
  fam: FamInfo;
  language: Language;
  currentSectorId: number;
  onSelectSector: (sectorId: number) => void;
  quests: VerseQuest[];
  solvedQuestIds: number[];
  activeQuestId: number;
  onOpenQuest: (questId: number) => void;
  hints: { magnifier: number; hourglass: number; whisper: number };
  onUseHint: (type: 'magnifier' | 'hourglass' | 'whisper') => void;
  elapsedTimeFormatted: string;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
}

interface WorldObject {
  questId: number;
  x: number; // 0 - 1000 world coordinate
  y: number; // 0 - 600 world coordinate
  name: { ko: string; en: string };
  icon: string;
  type: 'chest' | 'altar' | 'npc' | 'gate' | 'stone' | 'lantern';
}

export const RpgWorld: React.FC<RpgWorldProps> = ({
  playerProfile,
  fam,
  language,
  currentSectorId,
  onSelectSector,
  quests,
  solvedQuestIds,
  activeQuestId,
  onOpenQuest,
  hints,
  onUseHint,
  elapsedTimeFormatted,
  onOpenLeaderboard,
  onOpenRules,
  onOpenSettings,
}) => {
  const t = UI_TEXT[language];
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Physics Engine: Rigidbody2D for the player
  const rbRef = useRef<Rigidbody2D>(new Rigidbody2D({ x: 500, y: 300 }));
  const [playerPos, setPlayerPos] = useState<Vector2>({ x: 500, y: 300 });
  const [playerFacing, setPlayerFacing] = useState<'down' | 'up' | 'left' | 'right'>('down');
  const [playerVelocity, setPlayerVelocity] = useState<Vector2>({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isDashing, setIsDashing] = useState<boolean>(false);
  const isDashingRef = useRef<boolean>(false);
  const [walkPhase, setWalkPhase] = useState<number>(0);
  const [isColliding, setIsColliding] = useState<boolean>(false);

  // Particles for footstep ripples and dash dust
  const [particles, setParticles] = useState<PhysicsParticle[]>([]);
  const nextParticleId = useRef<number>(1);
  const particleTimer = useRef<number>(0);

  // Pet companion follower with spring-damper physics
  const [petPos, setPetPos] = useState<Vector2>({ x: 460, y: 310 });
  const petVelRef = useRef<Vector2>({ x: 0, y: 0 });

  // Joystick & touch control state (Ref for zero-latency 60FPS loop + state for visual knob)
  const joystickVectorRef = useRef<Vector2>({ x: 0, y: 0 });
  const [joystickVisual, setJoystickVisual] = useState<Vector2>({ x: 0, y: 0 });
  const joystickCenterRef = useRef<Vector2 | null>(null);
  const isJoystickActiveRef = useRef<boolean>(false);

  // Keyboard active keys
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Target click pathing
  const targetWalkPos = useRef<Vector2 | null>(null);

  // Sector Locked / Alert Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentSector = SECTOR_LIST.find((s) => s.id === currentSectorId) || SECTOR_LIST[0];
  const sectorQuests = quests.filter((q) => q.sectorId === currentSectorId);

  // Progression lock logic: A sector N requires all quests in preceding sectors (1 .. N-1) to be solved
  const isSectorUnlocked = useCallback((sectorId: number): boolean => {
    if (sectorId <= 1) return true;
    const requiredQuests = quests.filter((q) => q.sectorId < sectorId);
    return requiredQuests.every((q) => solvedQuestIds.includes(q.id));
  }, [quests, solvedQuestIds]);

  const currentSectorUnsolvedCount = useMemo(() => {
    return sectorQuests.filter((q) => !solvedQuestIds.includes(q.id)).length;
  }, [sectorQuests, solvedQuestIds]);

  // Map coordinates of quest objects per sector (Generously spaced across 1000x600 canvas without any overlapping)
  const sectorObjects: WorldObject[] = useMemo(() => {
    type CoordItem = { q: number; x: number; y: number; type: WorldObject['type'] };

    // Custom generous layout per sector
    const coordsSector1: CoordItem[] = [
      { q: 1, x: 130, y: 140, type: 'stone' },
      { q: 2, x: 380, y: 140, type: 'lantern' },
      { q: 3, x: 620, y: 140, type: 'chest' },
      { q: 4, x: 870, y: 140, type: 'npc' },
      { q: 5, x: 140, y: 460, type: 'chest' },
      { q: 6, x: 380, y: 460, type: 'altar' },
      { q: 7, x: 500, y: 300, type: 'stone' },
      { q: 8, x: 620, y: 460, type: 'lantern' },
      { q: 9, x: 860, y: 460, type: 'chest' },
    ];

    const coordsSector2: CoordItem[] = [
      { q: 10, x: 140, y: 140, type: 'altar' },
      { q: 11, x: 380, y: 140, type: 'stone' },
      { q: 12, x: 620, y: 140, type: 'chest' },
      { q: 13, x: 860, y: 140, type: 'lantern' },
      { q: 14, x: 140, y: 460, type: 'lantern' },
      { q: 15, x: 380, y: 460, type: 'npc' },
      { q: 16, x: 500, y: 300, type: 'altar' },
      { q: 17, x: 620, y: 460, type: 'chest' },
      { q: 18, x: 860, y: 460, type: 'gate' },
    ];

    const coordsSector3: CoordItem[] = [
      { q: 19, x: 140, y: 140, type: 'npc' },
      { q: 20, x: 380, y: 140, type: 'chest' },
      { q: 21, x: 620, y: 140, type: 'altar' },
      { q: 22, x: 860, y: 140, type: 'stone' },
      { q: 23, x: 140, y: 460, type: 'chest' },
      { q: 24, x: 380, y: 460, type: 'lantern' },
      { q: 25, x: 500, y: 300, type: 'altar' },
      { q: 26, x: 620, y: 460, type: 'lantern' },
      { q: 27, x: 860, y: 460, type: 'gate' },
    ];

    const coordsSector4: CoordItem[] = [
      { q: 28, x: 150, y: 140, type: 'altar' },
      { q: 29, x: 400, y: 140, type: 'npc' },
      { q: 30, x: 650, y: 140, type: 'stone' },
      { q: 31, x: 860, y: 140, type: 'chest' },
      { q: 32, x: 180, y: 450, type: 'lantern' },
      { q: 33, x: 400, y: 460, type: 'chest' },
      { q: 34, x: 650, y: 460, type: 'altar' },
      { q: 35, x: 850, y: 450, type: 'gate' },
    ];

    const coordsSector5: CoordItem[] = [
      { q: 36, x: 500, y: 300, type: 'gate' },
    ];

    let source: CoordItem[] = coordsSector1;
    if (currentSectorId === 2) source = coordsSector2;
    if (currentSectorId === 3) source = coordsSector3;
    if (currentSectorId === 4) source = coordsSector4;
    if (currentSectorId === 5) source = coordsSector5;

    return source.map((item) => {
      const qData = quests.find((q) => q.id === item.q) || quests[0];
      return {
        questId: item.q,
        x: item.x,
        y: item.y,
        name: qData.objectName,
        icon: qData.objectIcon,
        type: item.type,
      };
    });
  }, [currentSectorId, quests]);

  // BoxCollider2D definitions for static obstacles and triggers
  const physicsColliders = useMemo(() => {
    const list: { collider: BoxCollider2D; position: Vector2 }[] = [];

    sectorObjects.forEach((obj) => {
      // 1. Solid Obstacle BoxCollider2D (Blocks movement, enables vector sliding)
      let w = 40;
      let h = 32;
      if (obj.type === 'chest') { w = 38; h = 28; }
      else if (obj.type === 'altar') { w = 44; h = 36; }
      else if (obj.type === 'stone') { w = 42; h = 32; }
      else if (obj.type === 'gate') { w = 54; h = 40; }
      else if (obj.type === 'lantern') { w = 28; h = 28; }
      else if (obj.type === 'npc') { w = 32; h = 30; }

      const solidCollider = new BoxCollider2D({
        id: `obstacle_${obj.questId}`,
        offsetX: 0,
        offsetY: 6,
        width: w,
        height: h,
        layer: Physics2DLayer.Obstacle,
        isTrigger: false,
        tag: `quest_${obj.questId}`,
      });
      list.push({ collider: solidCollider, position: { x: obj.x, y: obj.y } });

      // 2. Interaction Trigger Zone BoxCollider2D (Proximity detection)
      const triggerCollider = new BoxCollider2D({
        id: `trigger_${obj.questId}`,
        offsetX: 0,
        offsetY: 0,
        width: 100,
        height: 90,
        layer: Physics2DLayer.Trigger,
        isTrigger: true,
        tag: `trigger_quest_${obj.questId}`,
        customData: { questId: obj.questId },
      });
      list.push({ collider: triggerCollider, position: { x: obj.x, y: obj.y } });
    });

    return list;
  }, [sectorObjects]);

  // Find nearest interactive object within distance
  const nearestObject = useMemo(() => {
    let closest: WorldObject | null = null;
    let minDistance = 90; // Interaction radius (pixels)

    sectorObjects.forEach((obj) => {
      const dx = obj.x - playerPos.x;
      const dy = obj.y - playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closest = obj;
      }
    });

    return closest;
  }, [playerPos, sectorObjects]);

  // Reset player to safe center when changing sector
  useEffect(() => {
    rbRef.current.teleport({ x: 500, y: 300 });
    setPlayerPos({ x: 500, y: 300 });
    setPetPos({ x: 460, y: 310 });
    setPlayerVelocity({ x: 0, y: 0 });
    targetWalkPos.current = null;
  }, [currentSectorId]);

  // Main 60FPS Physics Game Loop (Rigidbody2D + BoxCollider2D Collision Resolution)
  useEffect(() => {
    let animFrame: number;
    const worldBounds = { minX: 60, maxX: 940, minY: 80, maxY: 550 };

    const gameLoop = () => {
      let inputVx = 0;
      let inputVy = 0;

      // 1. Check Keyboard Input
      const keys = keysPressedRef.current;
      if (keys['ArrowUp'] || keys['KeyW']) inputVy -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) inputVy += 1;
      if (keys['ArrowLeft'] || keys['KeyA']) inputVx -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) inputVx += 1;

      // 2. Check Joystick Input via zero-latency ref
      if (joystickVectorRef.current.x !== 0 || joystickVectorRef.current.y !== 0) {
        inputVx = joystickVectorRef.current.x;
        inputVy = joystickVectorRef.current.y;
      }

      // 3. Check Target Click Walking
      if (targetWalkPos.current) {
        const dx = targetWalkPos.current.x - rbRef.current.position.x;
        const dy = targetWalkPos.current.y - rbRef.current.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 12) {
          targetWalkPos.current = null;
        } else {
          inputVx = dx / dist;
          inputVy = dy / dist;
        }
      }

      const isDash = isDashingRef.current || keys['ShiftLeft'] || keys['KeyX'];
      const rb = rbRef.current;

      // Apply input movement through Rigidbody2D
      rb.addInputMovement({ x: inputVx, y: inputVy }, isDash);

      // Execute integrated physics step with BoxCollider2D obstacle collision & slide
      const { newPos, hasCollided } = rb.updatePhysics(physicsColliders, worldBounds);

      const currentSpeed = Math.sqrt(rb.velocity.x * rb.velocity.x + rb.velocity.y * rb.velocity.y);
      const moving = currentSpeed > 0.15;
      setIsMoving(moving);
      setIsColliding(hasCollided);
      setPlayerVelocity({ x: rb.velocity.x, y: rb.velocity.y });
      setPlayerPos(newPos);

      // Determine facing direction from movement velocity
      if (moving) {
        if (Math.abs(rb.velocity.x) > Math.abs(rb.velocity.y) * 0.8) {
          setPlayerFacing(rb.velocity.x > 0 ? 'right' : 'left');
        } else {
          setPlayerFacing(rb.velocity.y > 0 ? 'down' : 'up');
        }

        // Natural walk cycle animation phase
        setWalkPhase((prev) => prev + currentSpeed * 0.12);

        // Footstep / Ripple Particles Generation
        particleTimer.current += 1;
        if (particleTimer.current % (isDash ? 4 : 7) === 0) {
          const pId = nextParticleId.current++;
          const newParticle: PhysicsParticle = {
            id: pId,
            x: newPos.x + (Math.random() * 8 - 4),
            y: newPos.y + 12 + (Math.random() * 4 - 2),
            vx: -rb.velocity.x * 0.15 + (Math.random() * 0.4 - 0.2),
            vy: -rb.velocity.y * 0.15 + (Math.random() * 0.4 - 0.2),
            alpha: isDash ? 0.7 : 0.45,
            scale: isDash ? 1.2 : 0.8,
            type: isDash ? 'dash' : 'ripple',
          };
          setParticles((prev) => [...prev.slice(-15), newParticle]);
        }
      }

      // Update active particles (decay alpha & position)
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.04,
            scale: p.scale * 1.03,
          }))
          .filter((p) => p.alpha > 0.05)
      );

      // Companion Pet soft spring-damper follower physics
      const petTargetOffsetX = playerFacing === 'right' ? -38 : playerFacing === 'left' ? 38 : -20;
      const petTargetOffsetY = playerFacing === 'down' ? -26 : playerFacing === 'up' ? 26 : -16;
      const petTargetX = newPos.x + petTargetOffsetX;
      const petTargetY = newPos.y + petTargetOffsetY;

      const springK = 0.08;
      const petDamping = 0.82;
      const petDx = petTargetX - petPos.x;
      const petDy = petTargetY - petPos.y;

      petVelRef.current.x = (petVelRef.current.x + petDx * springK) * petDamping;
      petVelRef.current.y = (petVelRef.current.y + petDy * springK) * petDamping;

      setPetPos((prev) => ({
        x: prev.x + petVelRef.current.x,
        y: prev.y + petVelRef.current.y,
      }));

      animFrame = requestAnimationFrame(gameLoop);
    };

    animFrame = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrame);
  }, [physicsColliders, playerFacing, petPos]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      keysPressedRef.current[e.code] = true;

      if (e.code === 'ShiftLeft' || e.code === 'KeyX') {
        isDashingRef.current = true;
        setIsDashing(true);
      }

      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
        e.preventDefault();
        handleInteractAction();
      }

      // Quick Hints
      if (e.code === 'Digit1') onUseHint('magnifier');
      if (e.code === 'Digit2') onUseHint('hourglass');
      if (e.code === 'Digit3') onUseHint('whisper');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'KeyX') {
        isDashingRef.current = false;
        setIsDashing(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearestObject, activeQuestId]);

  // Handle Interaction Button (A / Space / Tap Object)
  const handleInteractAction = useCallback(() => {
    if (nearestObject) {
      const q = quests.find((item) => item.id === nearestObject.questId);
      if (!q) return;

      const isLocked = q.id > 1 && !solvedQuestIds.includes(q.id - 1);
      if (isLocked) {
        sounds.playWrong();
      } else {
        sounds.playTap();
        onOpenQuest(q.id);
      }
    } else {
      // If not near any object, open active quest directly
      sounds.playTap();
      onOpenQuest(activeQuestId);
    }
  }, [nearestObject, quests, solvedQuestIds, onOpenQuest, activeQuestId]);

  // Handle Direct Map Tap (Walk to point)
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isJoystickActiveRef.current) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = 1000 / rect.width;
    const scaleY = 600 / rect.height;

    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    targetWalkPos.current = {
      x: Math.max(70, Math.min(930, clickX)),
      y: Math.max(90, Math.min(540, clickY)),
    };
  };

  // Modern Pointer-Captured Virtual Joystick Handlers (100% Reliable across mouse, trackpad, and mobile touch)
  const handleJoystickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    isJoystickActiveRef.current = true;
    targetWalkPos.current = null;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    joystickCenterRef.current = { x: centerX, y: centerY };

    handleJoystickPointerMove(e);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isJoystickActiveRef.current || !joystickCenterRef.current) return;
    e.stopPropagation();

    const dx = e.clientX - joystickCenterRef.current.x;
    const dy = e.clientY - joystickCenterRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 32;

    if (distance === 0) {
      joystickVectorRef.current = { x: 0, y: 0 };
      setJoystickVisual({ x: 0, y: 0 });
    } else {
      const clampedDist = Math.min(distance, maxRadius);
      const vx = (dx / distance) * (clampedDist / maxRadius);
      const vy = (dy / distance) * (clampedDist / maxRadius);
      joystickVectorRef.current = { x: vx, y: vy };
      setJoystickVisual({
        x: (dx / distance) * clampedDist,
        y: (dy / distance) * clampedDist,
      });
    }
  };

  const handleJoystickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    isJoystickActiveRef.current = false;
    joystickCenterRef.current = null;
    joystickVectorRef.current = { x: 0, y: 0 };
    setJoystickVisual({ x: 0, y: 0 });
  };

  // Direct 4-Direction Tap
  const handleDirectionPress = (dir: 'up' | 'down' | 'left' | 'right') => {
    targetWalkPos.current = null;
    let vx = 0;
    let vy = 0;
    if (dir === 'up') vy = -1;
    if (dir === 'down') vy = 1;
    if (dir === 'left') vx = -1;
    if (dir === 'right') vx = 1;
    joystickVectorRef.current = { x: vx, y: vy };
    setJoystickVisual({ x: vx * 18, y: vy * 18 });
  };

  const handleDirectionRelease = () => {
    joystickVectorRef.current = { x: 0, y: 0 };
    setJoystickVisual({ x: 0, y: 0 });
  };

  // Background Theme by Sector
  const getSectorBackground = () => {
    switch (currentSectorId) {
      case 1:
        return 'bg-gradient-to-b from-[#163321] via-[#1d422a] to-[#0f2417]';
      case 2:
        return 'bg-gradient-to-b from-[#2a1c0e] via-[#452e18] to-[#1d1208]';
      case 3:
        return 'bg-gradient-to-b from-[#3a1a1a] via-[#522424] to-[#240e0e]';
      case 4:
        return 'bg-gradient-to-b from-[#191533] via-[#28204d] to-[#0e0c1f]';
      case 5:
        return 'bg-gradient-to-b from-[#4d330c] via-[#6e4912] to-[#2a1b05]';
      default:
        return 'bg-[#0f172a]';
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      
      {/* ========================================================= */}
      {/* 16:9 RPG WIDESCREEN FULL-CANVAS STAGE CONTAINER */}
      {/* ========================================================= */}
      <div 
        className="relative w-full max-w-[1200px] max-h-[96dvh] aspect-[16/9] bg-slate-950 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-[#8e5837] shadow-2xl overflow-hidden flex flex-col justify-between"
        style={{
          boxShadow: '0 0 35px rgba(0, 0, 0, 0.9), inset 0 0 15px rgba(0,0,0,0.8)'
        }}
      >
        
        {/* ======================================================= */}
        {/* TOP RPG HUD BAR (Status, Map Info, Timer, Menu) */}
        {/* ======================================================= */}
        <div className="relative z-30 w-full bg-slate-950/90 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 border-b border-[#5c3823] flex items-center justify-between shadow-lg shrink-0">
          
          {/* Left: Player Profile & Faith Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-400 border-2 border-amber-200 shadow-md flex items-center justify-center text-base sm:text-lg shrink-0">
              <span>{fam.emoji}</span>
              <span className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] sm:text-[9px] font-black text-white px-1 rounded-md border border-slate-900">
                LV{currentSectorId}
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm text-slate-100 drop-shadow">
                  {playerProfile.name}
                </span>
                <span className="text-[10px] text-amber-300 font-bold hidden sm:inline-block">
                  ({fam.name[language]})
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${Math.max(10, (solvedQuestIds.length / 36) * 100)}%` }}
                  />
                </div>
                <span className="text-[8px] sm:text-[9px] text-blue-300 font-mono font-bold">
                  {solvedQuestIds.length}/36
                </span>
              </div>
            </div>
          </div>

          {/* Center: Current Map Name & Target */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-amber-600/50 shadow">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] sm:text-xs font-black text-amber-200 tracking-wide">
                {currentSector.name[language].split('(')[0]}
              </span>
            </div>
            {nearestObject ? (
              <span className="text-[9px] sm:text-[10px] text-yellow-300 font-bold animate-pulse mt-0.5">
                [A 버튼] #{nearestObject.questId} {nearestObject.name[language]} 조사하기!
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 hidden sm:inline-block">
                다음 목표: #{activeQuestId} {quests[activeQuestId - 1]?.objectName[language]}
              </span>
            )}
          </div>

          {/* Right: Timer, Sector Warp & Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="px-2 py-0.5 sm:py-1 bg-slate-900/90 rounded-xl border border-slate-700 text-red-400 font-mono font-bold text-xs sm:text-sm flex items-center gap-1 shadow">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-ping" />
              <span>{elapsedTimeFormatted}</span>
            </div>

            <button
              onClick={() => {
                sounds.playTap();
                onOpenLeaderboard();
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
              title="믿음의 이정표"
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                onOpenRules();
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="항해 규칙"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                onOpenSettings();
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="환경 설정"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* ======================================================= */}
        {/* INTERACTIVE 2D RPG MAP CANVAS (Full Height, Generous Spacing) */}
        {/* ======================================================= */}
        <div
          ref={containerRef}
          onClick={handleMapClick}
          className={`relative flex-1 w-full overflow-hidden ${getSectorBackground()} cursor-crosshair transition-colors duration-500`}
        >
          {/* Faith Voyage Sea Background at 40% Opacity */}
          <img
            src={ASSET_IMAGES.seaBackground}
            alt="Sea Voyage Canvas"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none mix-blend-overlay"
          />

          {/* Subtle Tile Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="rpgGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fcd34d" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#rpgGrid)" />
            </svg>
          </div>

          {/* Sector Locked Alert Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-950/95 border-2 border-amber-400 rounded-2xl shadow-2xl text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-2 max-w-[90%] text-center backdrop-blur-md"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map Stage Gate Portals (Left / Right fast warps) */}
          {currentSectorId > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sounds.playTap();
                onSelectSector(currentSectorId - 1);
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-slate-300 hover:text-white text-xs font-bold shadow-lg flex items-center gap-1 active:scale-95 transition cursor-pointer"
            >
              ◀ 이전 구역
            </button>
          )}

          {currentSectorId < 5 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextSectorId = currentSectorId + 1;
                if (!isSectorUnlocked(nextSectorId)) {
                  sounds.playWrong();
                  setToastMessage(`🔒 현재 구역의 모든 말씀(${currentSectorUnsolvedCount}개 남음)을 완료해야 다음 구역으로 갈 수 있습니다!`);
                  setTimeout(() => setToastMessage(null), 3500);
                  return;
                }
                sounds.playTap();
                onSelectSector(nextSectorId);
              }}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 z-20 px-2.5 py-1 rounded-xl backdrop-blur-sm text-xs font-bold shadow-lg flex items-center gap-1 active:scale-95 transition cursor-pointer border ${
                isSectorUnlocked(currentSectorId + 1)
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 font-black animate-pulse shadow-amber-500/50'
                  : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-300'
              }`}
            >
              {isSectorUnlocked(currentSectorId + 1) ? (
                <span>다음 구역 ▶</span>
              ) : (
                <span>🔒 다음 구역 ({currentSectorUnsolvedCount}개 남음)</span>
              )}
            </button>
          )}

          {/* Interactive World Objects / NPCs / Chests / Altars */}
          {sectorObjects.map((obj) => {
            const isSolved = solvedQuestIds.includes(obj.questId);
            const isCurrent = obj.questId === activeQuestId;
            const isLocked = obj.questId > 1 && !solvedQuestIds.includes(obj.questId - 1);
            const isNear = nearestObject?.questId === obj.questId;

            const posX = (obj.x / 1000) * 100;
            const posY = (obj.y / 600) * 100;

            const getObjectGraphic = () => {
              if (obj.questId === 36) {
                return isSolved ? '🚪✨' : '🗝️👑';
              }
              if (obj.type === 'chest') return isSolved ? '📦' : '🎁';
              if (obj.type === 'altar') return '🕯️';
              if (obj.type === 'npc') return '🧙‍♂️';
              if (obj.type === 'lantern') return '🏮';
              return '🪨';
            };

            return (
              <div
                key={obj.questId}
                onClick={(e) => {
                  e.stopPropagation();
                  targetWalkPos.current = { x: obj.x, y: obj.y + 30 };
                  if (isNear) {
                    handleInteractAction();
                  }
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group select-none"
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  zIndex: Math.floor(posY) + 5,
                }}
              >
                {/* Status Floating Indicator */}
                <div className="relative mb-0.5">
                  {isSolved ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shadow-md">
                      ✓
                    </div>
                  ) : isCurrent ? (
                    <div className="flex items-center gap-1 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black shadow-lg animate-bounce border border-amber-200">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>#{obj.questId}</span>
                    </div>
                  ) : isLocked ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[8px] border border-slate-700">
                      🔒
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">
                      {obj.questId}
                    </div>
                  )}

                  {/* Proximity Interaction Prompt [A] */}
                  {isNear && !isLocked && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-yellow-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-lg border border-yellow-200 animate-pulse">
                      [A] 대화 / 조사
                    </div>
                  )}
                </div>

                {/* Object Sprite Graphic */}
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  className={`text-2xl sm:text-3xl select-none transition-transform ${
                    isCurrent ? 'filter drop-shadow-[0_0_8px_#ffd700]' : ''
                  }`}
                >
                  {getObjectGraphic()}
                </motion.div>

                {/* Shadow */}
                <div className="w-7 h-1.5 bg-black/40 rounded-full blur-[1px] -mt-0.5" />

                {/* Object Name Label */}
                <div className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold whitespace-nowrap border shadow ${
                  isCurrent
                    ? 'bg-amber-500/90 text-slate-950 border-amber-300'
                    : isSolved
                    ? 'bg-slate-900/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800'
                }`}>
                  {obj.name[language]}
                </div>
              </div>
            );
          })}

          {/* ===================================================== */}
          {/* PHYSICS PARTICLES (Footstep Ripples & Dash Dust) */}
          {/* ===================================================== */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
              style={{
                left: `${(p.x / 1000) * 100}%`,
                top: `${(p.y / 600) * 100}%`,
                width: `${p.type === 'dash' ? 14 : 10}px`,
                height: `${p.type === 'dash' ? 7 : 5}px`,
                transform: `scale(${p.scale})`,
                opacity: p.alpha,
                backgroundColor: p.type === 'dash' ? 'rgba(251, 191, 36, 0.6)' : 'rgba(147, 197, 253, 0.45)',
                boxShadow: p.type === 'dash' ? '0 0 6px rgba(245, 158, 11, 0.5)' : '0 0 4px rgba(59, 130, 246, 0.3)',
                zIndex: 6,
              }}
            />
          ))}

          {/* ===================================================== */}
          {/* MASCOT FAM PET (Soft Spring-Damper Follower Physics) */}
          {/* ===================================================== */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center select-none"
            style={{
              left: `${(petPos.x / 1000) * 100}%`,
              top: `${(petPos.y / 600) * 100}%`,
              zIndex: Math.floor((petPos.y / 600) * 100) + 10,
            }}
          >
            {/* Free-standing Pet Mascot without square card box */}
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center animate-float select-none transition-transform">
              <img
                src={MASCOT_PETS.find((p) => p.id === fam.id || (p.id === 'lamb' && fam.id === 'shalom') || (p.id === 'turtle' && fam.id === 'wisdom'))?.image || MASCOT_PETS[0].image}
                alt="Pet"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
                style={{
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 6px rgba(56, 189, 248, 0.55))',
                }}
              />
            </div>
            <div className="w-5 h-1.5 bg-black/40 rounded-full blur-[1px] -mt-0.5" />
          </div>

          {/* ===================================================== */}
          {/* PLAYER CHARACTER SPRITE (Standalone Figure & Rigidbody2D) */}
          {/* ===================================================== */}
          {(() => {
            const currentSpeed = Math.sqrt(playerVelocity.x * playerVelocity.x + playerVelocity.y * playerVelocity.y);
            const bobbingY = isMoving ? Math.sin(walkPhase * 2) * 2.8 : 0;
            const tiltAngle = isMoving ? Math.min(7, Math.max(-7, playerVelocity.x * 1.6)) : 0;
            const squashX = isMoving ? 1 + Math.abs(Math.sin(walkPhase)) * 0.08 : 1;
            const squashY = isMoving ? 1 - Math.abs(Math.sin(walkPhase)) * 0.08 : 1;

            return (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center select-none"
                style={{
                  left: `${(playerPos.x / 1000) * 100}%`,
                  top: `${(playerPos.y / 600) * 100}%`,
                  zIndex: Math.floor((playerPos.y / 600) * 100) + 15,
                }}
              >
                {/* Player Name Overhead floating badge */}
                <div className="mb-0.5 px-1.5 py-0.2 rounded-full bg-slate-950/90 text-[8px] sm:text-[9px] font-black text-amber-300 border border-amber-500/50 shadow-md backdrop-blur-xs">
                  {playerProfile.name}
                </div>

                {/* Free-standing Character Body (No square border / No dark box) */}
                <div
                  className="relative select-none flex flex-col items-center"
                  style={{
                    transform: `translateY(${bobbingY}px) rotate(${tiltAngle}deg) scale(${squashX}, ${squashY}) ${
                      playerFacing === 'left' ? 'scaleX(-1)' : ''
                    }`,
                    transition: 'transform 0.04s ease-out',
                  }}
                >
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                    <img
                      src={HERO_CHARACTERS.find((h) => h.id === playerProfile.characterId)?.image || HERO_CHARACTERS[0].image}
                      alt={playerProfile.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                      style={{
                        filter: isColliding
                          ? 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 10px rgba(251, 191, 36, 0.9))'
                          : 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 6px rgba(251, 191, 36, 0.5))',
                      }}
                    />

                    {/* Collision Shockwave at character feet */}
                    {isColliding && (
                      <div className="absolute inset-0 rounded-full border-2 border-amber-300 animate-ping opacity-60 pointer-events-none" />
                    )}
                  </div>

                  {/* Dash Streak FX */}
                  {isDashing && currentSpeed > 2 && (
                    <span className="absolute -left-3 top-1 text-xl opacity-75 blur-[0.5px]">💨</span>
                  )}
                </div>

                {/* Organic Ground Shadow on the wooden deck */}
                <div
                  className="w-8 h-2 bg-black/60 rounded-full blur-[1.5px] -mt-1"
                  style={{
                    transform: `scale(${1 - Math.abs(bobbingY) * 0.08})`,
                  }}
                />
              </div>
            );
          })()}

          {/* Click Destination Target Marker */}
          {targetWalkPos.current && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${(targetWalkPos.current.x / 1000) * 100}%`,
                top: `${(targetWalkPos.current.y / 600) * 100}%`,
                zIndex: 3,
              }}
            >
              <div className="w-5 h-5 rounded-full border-2 border-amber-400 animate-ping" />
            </div>
          )}

          {/* ======================================================= */}
          {/* FLOATING MOBILE ACTION HUD CONTROLS (Semi-Transparent Overlaid) */}
          {/* ======================================================= */}
          
          {/* 1. BOTTOM-LEFT: Virtual Floating Joystick / D-Pad */}
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-30 pointer-events-auto select-none">
            <div
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-950/40 hover:bg-slate-950/60 backdrop-blur-[2px] border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center touch-none transition-colors"
              onPointerDown={handleJoystickPointerDown}
              onPointerMove={handleJoystickPointerMove}
              onPointerUp={handleJoystickPointerUp}
              onPointerCancel={handleJoystickPointerUp}
            >
              {/* Direction Arrows */}
              <button
                onPointerDown={(e) => { e.stopPropagation(); handleDirectionPress('up'); }}
                onPointerUp={(e) => { e.stopPropagation(); handleDirectionRelease(); }}
                className="absolute top-1 p-1 text-slate-300/70 hover:text-amber-300"
              >
                <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onPointerDown={(e) => { e.stopPropagation(); handleDirectionPress('down'); }}
                onPointerUp={(e) => { e.stopPropagation(); handleDirectionRelease(); }}
                className="absolute bottom-1 p-1 text-slate-300/70 hover:text-amber-300"
              >
                <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onPointerDown={(e) => { e.stopPropagation(); handleDirectionPress('left'); }}
                onPointerUp={(e) => { e.stopPropagation(); handleDirectionRelease(); }}
                className="absolute left-1 p-1 text-slate-300/70 hover:text-amber-300"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onPointerDown={(e) => { e.stopPropagation(); handleDirectionPress('right'); }}
                onPointerUp={(e) => { e.stopPropagation(); handleDirectionRelease(); }}
                className="absolute right-1 p-1 text-slate-300/70 hover:text-amber-300"
              >
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Moving Stick Center Knob */}
              <div
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-amber-500/80 to-amber-700/80 border border-amber-300/80 shadow-md flex items-center justify-center pointer-events-none transition-transform duration-75"
                style={{
                  transform: `translate(${joystickVisual.x}px, ${joystickVisual.y}px)`,
                }}
              >
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-200" />
              </div>
            </div>
          </div>

          {/* 2. BOTTOM-CENTER: Floating Compact Hint Toolbelt */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-slate-950/50 backdrop-blur-[3px] border border-white/15 px-2.5 py-1 rounded-2xl shadow-lg">
            <button
              onClick={(e) => {
                e.stopPropagation();
                sounds.playTap();
                onUseHint('magnifier');
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 text-[10px] font-bold text-blue-200 active:scale-95 transition"
              title="빛의 돋보기 (1번 키)"
            >
              <span>🔍</span>
              <span className="font-mono text-[9px] text-blue-300">{hints.magnifier}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                sounds.playTap();
                onUseHint('hourglass');
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 text-[10px] font-bold text-amber-200 active:scale-95 transition"
              title="진리의 모래시계 (2번 키)"
            >
              <span>⌛</span>
              <span className="font-mono text-[9px] text-amber-300">{hints.hourglass}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                sounds.playTap();
                onUseHint('whisper');
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 text-[10px] font-bold text-emerald-200 active:scale-95 transition"
              title="팜의 속삭임 (3번 키)"
            >
              <span>💬</span>
              <span className="font-mono text-[9px] text-emerald-300">{hints.whisper}</span>
            </button>
          </div>

          {/* 3. BOTTOM-RIGHT: Floating Action Buttons (A: 조사/암송, B: 대시) */}
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-30 pointer-events-auto flex items-center gap-2 sm:gap-3 select-none">
            
            {/* Button B: Dash / Run */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                isDashingRef.current = true;
                setIsDashing(true);
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                isDashingRef.current = false;
                setIsDashing(false);
              }}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 font-black text-xs sm:text-sm flex flex-col items-center justify-center shadow-lg transition backdrop-blur-[2px] active:scale-90 ${
                isDashing
                  ? 'bg-blue-600/90 border-blue-300 text-white shadow-blue-500/50 scale-95'
                  : 'bg-slate-950/40 text-slate-300 hover:bg-slate-900/60'
              }`}
              title="달리기 대시 (Shift / X 키)"
            >
              <span>B</span>
              <span className="text-[7px] sm:text-[8px] opacity-80">대시</span>
            </button>

            {/* Button A: Main Action (Interact / Decipher) */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleInteractAction();
              }}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 font-black text-xs sm:text-sm flex flex-col items-center justify-center shadow-2xl transition backdrop-blur-[2px] ${
                nearestObject
                  ? 'bg-gradient-to-b from-amber-400/90 to-amber-600/90 border-amber-200 text-slate-950 ring-4 ring-amber-400/50 animate-pulse'
                  : 'bg-amber-600/60 hover:bg-amber-600/80 border-amber-400/70 text-slate-100'
              }`}
              title="조사 / 대화 / 암송 풀기 (Space / Enter / Z 키)"
            >
              <span>A</span>
              <span className="text-[8px] sm:text-[9px] font-bold">
                {nearestObject ? '조사' : '암송'}
              </span>
            </motion.button>

          </div>

        </div>

      </div>

      {/* Helper Legend on PC Bottom */}
      <div className="mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] text-slate-400 hidden sm:flex items-center gap-3 sm:gap-4">
        <span>🕹️ <strong>조작법</strong>: 방향키/WASD/가상스틱 (이동)</span>
        <span>⚡ <strong>Shift/B버튼</strong> (대시)</span>
        <span>✨ <strong>Space/A버튼</strong> (조사/암송)</span>
        <span>🔍 <strong>1, 2, 3</strong> (힌트 사용)</span>
        <span>👆 <strong>화면 터치/클릭</strong> 목적지 자동 이동</span>
      </div>

    </div>
  );
};
