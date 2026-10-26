/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GameCanvas } from './components/GameCanvas';
import { MobileHUD } from './components/MobileHUD';
import { XRayDamageViewer } from './components/XRayDamageViewer';
import { LocationSelector } from './components/LocationSelector';
import { ChallengesModal } from './components/ChallengesModal';
import { RagdollPhysics } from './physics/ragdoll';
import { STUNT_SPOTS } from './game/stuntWorld';
import { VehicleType, RagdollPose, StuntSpot, Challenge } from './types/game';
import { soundEngine } from './audio/soundEngine';
import { 
  Flame, 
  MapPin, 
  Trophy, 
  Activity, 
  Volume2, 
  VolumeX, 
  Music, 
  HelpCircle, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'Six-Figure Patient',
    description: 'Rack up at least $100,000 in a single emergency medical bill.',
    targetBill: 100000,
    targetBones: 0,
    targetAirtime: 0,
    completed: false,
    rewardPoints: 25000,
  },
  {
    id: 'c2',
    title: 'Compound Carnage',
    description: 'Break 4 or more distinct bones in a single wipeout.',
    targetBill: 0,
    targetBones: 4,
    targetAirtime: 0,
    completed: false,
    rewardPoints: 30000,
  },
  {
    id: 'c3',
    title: 'Skyline Diver',
    description: 'Achieve at least 50 meters of horizontal flight distance.',
    targetBill: 0,
    targetBones: 0,
    targetAirtime: 4,
    completed: false,
    rewardPoints: 18000,
  },
  {
    id: 'c4',
    title: 'Spinal Tumble',
    description: 'Execute at least 3 full rotations while bailing.',
    targetBill: 0,
    targetBones: 0,
    targetAirtime: 0,
    completed: false,
    rewardPoints: 20000,
  },
];

export default function App() {
  const [vehicle, setVehicle] = useState<VehicleType>('skateboard');
  const [currentPose, setCurrentPose] = useState<RagdollPose>('none');
  const [isBailed, setIsBailed] = useState<boolean>(false);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);
  const [activeSpot, setActiveSpot] = useState<StuntSpot>(STUNT_SPOTS[0]);
  const [customMarker, setCustomMarker] = useState<[number, number, number] | null>(null);

  // Modals & Panels
  const [showXRay, setShowXRay] = useState<boolean>(false);
  const [showLocations, setShowLocations] = useState<boolean>(false);
  const [showChallenges, setShowChallenges] = useState<boolean>(false);
  const [showControlsHelp, setShowControlsHelp] = useState<boolean>(false);

  // Audio State
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicOn, setIsMusicOn] = useState<boolean>(false);

  // Telemetry & Floating Popups
  const [stats, setStats] = useState({
    speed: 0,
    airTime: 0,
    flightDist: 0,
    hospitalBill: 0,
    brokenCount: 0,
    score: 0,
    multiplier: 1.0,
    rotations: 0,
  });

  const [floatingDamage, setFloatingDamage] = useState<{ id: number; text: string; bill: number }[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);

  // Input states from Mobile HUD or touch
  const [virtualInput, setVirtualInput] = useState({
    x: 0,
    y: 0,
    jump: false,
    sprint: false,
  });

  const ragdollRef = useRef<RagdollPhysics | null>(null);

  // Check Challenge completions on stats update
  useEffect(() => {
    setChallenges(prev =>
      prev.map(c => {
        if (c.completed) return c;
        let isMet = false;
        if (c.id === 'c1' && stats.hospitalBill >= c.targetBill) isMet = true;
        if (c.id === 'c2' && stats.brokenCount >= c.targetBones) isMet = true;
        if (c.id === 'c3' && stats.flightDist >= 50) isMet = true;
        if (c.id === 'c4' && stats.rotations >= 3) isMet = true;

        if (isMet) {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
          return { ...c, completed: true };
        }
        return c;
      })
    );
  }, [stats]);

  const handleBail = () => {
    if (!isBailed && ragdollRef.current) {
      ragdollRef.current.triggerBail();
      setIsBailed(true);
    }
  };

  const handleRespawn = () => {
    if (ragdollRef.current) {
      if (customMarker) {
        ragdollRef.current.resetTo(new THREE.Vector3(...customMarker), activeSpot.spawnRotation);
      } else {
        ragdollRef.current.resetTo(new THREE.Vector3(...activeSpot.spawnPosition), activeSpot.spawnRotation);
      }
      setIsBailed(false);
      setShowXRay(false);
    }
  };

  const handleBoneImpact = (boneName: string, bill: number) => {
    const id = Date.now() + Math.random();
    setFloatingDamage(prev => [...prev.slice(-3), { id, text: boneName, bill }]);
    setTimeout(() => {
      setFloatingDamage(prev => prev.filter(f => f.id !== id));
    }, 2400);
  };

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const toggleMusic = () => {
    const playing = soundEngine.toggleMusic();
    setIsMusicOn(playing);
  };

  const setCustomDropMarker = () => {
    if (ragdollRef.current) {
      const pos = ragdollRef.current.characterPos;
      setCustomMarker([pos.x, pos.y, pos.z]);
    }
  };

  const returnToCustomMarker = () => {
    if (customMarker && ragdollRef.current) {
      ragdollRef.current.resetTo(new THREE.Vector3(...customMarker), activeSpot.spawnRotation);
      setIsBailed(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans text-white">
      {/* 1. TOP BAR CONTRACT: Exactly 3 Zones */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 md:px-6 py-2.5 bg-zinc-950/70 backdrop-blur-md border-b border-zinc-800/80">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-rose-900/40">
            BB
          </div>
          <span className="text-base md:text-lg font-black tracking-tight text-white whitespace-nowrap">
            Breakbones: Hall of Meat
          </span>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-300">
          <button
            onClick={() => setShowLocations(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Drop Zones</span>
          </button>
          <button
            onClick={() => setShowChallenges(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap"
          >
            <Trophy className="w-3.5 h-3.5 text-rose-400" />
            <span>Bounties</span>
          </button>
          <button
            onClick={() => setShowXRay(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>X-Ray Trauma</span>
          </button>
          <button
            onClick={toggleMusic}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              isMusicOn ? 'text-amber-400 font-bold' : 'hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>{isMusicOn ? 'Groove ON' : 'Music Beat'}</span>
          </button>
          <button
            onClick={() => setShowControlsHelp(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Controls</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleBail}
            className={`px-3 py-1.5 text-xs font-black tracking-wider uppercase rounded-lg transition-all shadow-md whitespace-nowrap ${
              isBailed
                ? 'bg-rose-950/80 border border-rose-500 text-rose-300'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {isBailed ? 'MEAT ACTIVE' : 'BAIL NOW'}
          </button>
        </div>
      </header>

      {/* 2. Floating Damage Popups (Skate 3 Style Bone Crack Notifications) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1.5">
        {floatingDamage.map(item => (
          <div
            key={item.id}
            className="bg-black/85 border-2 border-rose-500 px-4 py-2 rounded-xl text-center shadow-[0_0_20px_rgba(225,29,72,0.6)] animate-in zoom-in-90 slide-in-from-top-4 duration-150"
          >
            <div className="text-xs font-black tracking-widest text-rose-400 uppercase font-mono">
              💥 {item.text}
            </div>
            <div className="text-sm font-black text-emerald-400 font-mono tabular-nums">
              +${item.bill.toLocaleString()} HOSPITAL BILL
            </div>
          </div>
        ))}
      </div>

      {/* 3. 3D WebGL Three.js Canvas Scene */}
      <GameCanvas
        vehicle={vehicle}
        currentPose={currentPose}
        isBailed={isBailed}
        isSlowMo={isSlowMo}
        onBailChange={setIsBailed}
        onPoseChange={setCurrentPose}
        onStatsUpdate={setStats}
        onBoneImpact={handleBoneImpact}
        ragdollRef={ragdollRef}
        activeSpot={activeSpot}
        virtualInput={virtualInput}
      />

      {/* 4. Responsive Mobile & Desktop HUD Overlay */}
      <MobileHUD
        vehicle={vehicle}
        onSetVehicle={setVehicle}
        isBailed={isBailed}
        onBail={handleBail}
        currentPose={currentPose}
        onSetPose={setCurrentPose}
        onJump={() => {
          setVirtualInput(prev => ({ ...prev, jump: true }));
          setTimeout(() => setVirtualInput(prev => ({ ...prev, jump: false })), 150);
        }}
        onSprintToggle={sprint => setVirtualInput(prev => ({ ...prev, sprint }))}
        onRespawn={handleRespawn}
        onOpenXRay={() => setShowXRay(true)}
        brokenBonesCount={stats.brokenCount}
        hospitalBill={stats.hospitalBill}
        speed={stats.speed}
        multiplier={stats.multiplier}
        isSlowMo={isSlowMo}
        onToggleSlowMo={() => setIsSlowMo(!isSlowMo)}
        onMoveInput={(x, y) => setVirtualInput(prev => ({ ...prev, x, y }))}
      />

      {/* 5. Modals */}
      {showXRay && ragdollRef.current && (
        <XRayDamageViewer
          bones={ragdollRef.current.bones}
          totalBill={stats.hospitalBill}
          score={stats.score}
          multiplier={stats.multiplier}
          rotations={stats.rotations}
          flightDistance={stats.flightDist}
          onClose={() => setShowXRay(false)}
          onRespawn={handleRespawn}
        />
      )}

      {showLocations && (
        <LocationSelector
          currentSpotId={activeSpot.id}
          onSelectSpot={spot => {
            setActiveSpot(spot);
            setIsBailed(false);
          }}
          onSetCustomMarker={setCustomDropMarker}
          onReturnCustomMarker={returnToCustomMarker}
          hasCustomMarker={customMarker !== null}
          onClose={() => setShowLocations(false)}
        />
      )}

      {showChallenges && (
        <ChallengesModal
          challenges={challenges}
          totalScore={stats.score}
          onClose={() => setShowChallenges(false)}
        />
      )}

      {/* Controls Help Modal */}
      {showControlsHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md text-white select-none animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-black uppercase text-zinc-100 font-sans">
                Controls & Stunt Guide
              </h2>
              <button
                onClick={() => setShowControlsHelp(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-zinc-900/60 rounded-xl space-y-1">
                <div className="font-bold text-amber-400 uppercase">Movement & Riding:</div>
                <div>• Desktop: WASD / Arrow Keys to steer & drive</div>
                <div>• Mobile: Drag the Left Virtual Joystick</div>
                <div>• Space / Jump Button: Ollie, Bunny Hop, or Parkour Leap</div>
                <div>• Shift / Lightning Button: Sprint / High Speed Nitro</div>
              </div>

              <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl space-y-1">
                <div className="font-bold text-rose-400 uppercase">Hall of Meat Mechanics:</div>
                <div>• Press 'B' or Tap the Giant Red 'BAIL' Button anytime!</div>
                <div>• In Bail Mode, press 1-6 or tap Mid-Air Pose buttons:</div>
                <div className="text-zinc-400 pl-2">
                  1: Cannonball · 2: Spread Eagle · 3: Torpedo · 4: Judo Kick
                </div>
                <div>• Steer with WASD or joystick mid-air to hit cars, glass, or rails</div>
                <div>• Tap the Hospital Bill button to inspect Mortal Kombat X-Ray damage!</div>
              </div>

              <div className="p-3 bg-zinc-900/60 rounded-xl space-y-1">
                <div className="font-bold text-cyan-400 uppercase">Camera & Replay:</div>
                <div>• Drag canvas with finger / mouse to orbit the camera</div>
                <div>• Tap Eye icon for Bullet-Time Slow Motion (0.25x speed)</div>
                <div>• Tap Reset icon or 'R' to immediately respawn at drop point</div>
              </div>
            </div>

            <button
              onClick={() => setShowControlsHelp(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 font-bold rounded-xl text-xs uppercase"
            >
              Ready to Break Bones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
