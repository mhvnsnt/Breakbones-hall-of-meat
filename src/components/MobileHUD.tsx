import React, { useState, useRef, useEffect } from 'react';
import { VehicleType, RagdollPose } from '../types/game';
import { 
  Zap, 
  RotateCcw, 
  Eye, 
  Footprints, 
  Bike, 
  Sparkles, 
  ShieldAlert, 
  Gauge, 
  Flame, 
  Activity,
  Layers,
  Camera
} from 'lucide-react';

interface MobileHUDProps {
  vehicle: VehicleType;
  onSetVehicle: (v: VehicleType) => void;
  isBailed: boolean;
  onBail: () => void;
  currentPose: RagdollPose;
  onSetPose: (pose: RagdollPose) => void;
  onJump: () => void;
  onSprintToggle: (sprint: boolean) => void;
  onRespawn: () => void;
  onOpenXRay: () => void;
  brokenBonesCount: number;
  hospitalBill: number;
  speed: number;
  multiplier: number;
  isSlowMo: boolean;
  onToggleSlowMo: () => void;
  onMoveInput: (x: number, y: number) => void;
}

export const MobileHUD: React.FC<MobileHUDProps> = ({
  vehicle,
  onSetVehicle,
  isBailed,
  onBail,
  currentPose,
  onSetPose,
  onJump,
  onSprintToggle,
  onRespawn,
  onOpenXRay,
  brokenBonesCount,
  hospitalBill,
  speed,
  multiplier,
  isSlowMo,
  onToggleSlowMo,
  onMoveInput,
}) => {
  const [isSprinting, setIsSprinting] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  // Touch Virtual Joystick Handler
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setStickPos({ x: 0, y: 0 });
        onMoveInput(0, 0);
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxDist = rect.width / 2 - 12;

    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    const nx = (Math.cos(angle) * clampedDist) / maxDist;
    const ny = -(Math.sin(angle) * clampedDist) / maxDist;

    setStickPos({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });

    onMoveInput(nx, ny);
  };

  const poses: { id: RagdollPose; label: string; icon: string }[] = [
    { id: 'cannonball', label: 'Cannonball', icon: '💣' },
    { id: 'spread_eagle', label: 'Spread Eagle', icon: '🦅' },
    { id: 'torpedo', label: 'Torpedo', icon: '🚀' },
    { id: 'judo_kick', label: 'Judo Kick', icon: '🥋' },
    { id: 'flying_squirrel', label: 'Squirrel', icon: '🐿️' },
    { id: 'meat_hook', label: 'Meat Hook', icon: '🪝' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-3 md:p-5">
      {/* Top Floating Dashboard Bar */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        {/* Speedometer & Multiplier */}
        <div className="flex items-center gap-2">
          <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl px-3.5 py-2 flex items-center gap-3 shadow-lg">
            <Gauge className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-400">Velocity</div>
              <div className="text-lg font-black font-mono tabular-nums text-white">
                {Math.round(speed * 3.6)} <span className="text-xs text-zinc-400 font-normal">KM/H</span>
              </div>
            </div>
          </div>

          {multiplier > 1 && (
            <div className="bg-rose-950/85 backdrop-blur-md border border-rose-500/60 rounded-2xl px-3 py-2 flex items-center gap-1.5 animate-bounce shadow-lg shadow-rose-950/50">
              <Flame className="w-4 h-4 text-rose-400" />
              <div className="text-sm font-black font-mono text-rose-300 tabular-nums">
                {multiplier.toFixed(1)}x COMBO
              </div>
            </div>
          )}
        </div>

        {/* Center / Right Hospital Bill & Quick X-Ray Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenXRay}
            className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-2xl backdrop-blur-md border transition-all active:scale-95 shadow-xl ${
              brokenBonesCount > 0
                ? 'bg-rose-900/80 border-rose-500/80 text-rose-100 animate-pulse'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Activity className="w-4 h-4 text-rose-400" />
            <div className="text-left">
              <div className="text-[9px] font-mono uppercase tracking-wider text-rose-300">
                {brokenBonesCount} Fractures
              </div>
              <div className="text-sm font-black font-mono tabular-nums text-emerald-400">
                ${hospitalBill.toLocaleString()}
              </div>
            </div>
          </button>

          {/* Slow Motion Bullet Time Toggle */}
          <button
            onClick={onToggleSlowMo}
            className={`p-2.5 rounded-2xl backdrop-blur-md border transition-all active:scale-95 ${
              isSlowMo
                ? 'bg-cyan-500 border-cyan-400 text-black font-bold'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:text-white'
            }`}
            title="Bullet Time Slow-Mo"
          >
            <Eye className="w-5 h-5" />
          </button>

          {/* Respawn Button */}
          <button
            onClick={onRespawn}
            className="p-2.5 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white transition-all active:scale-95"
            title="Instant Respawn / Session Marker"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mid-Screen: Hall of Meat Airborne Pose Selector (Appears during Bail / Airtime) */}
      {isBailed && (
        <div className="pointer-events-auto self-center bg-black/75 backdrop-blur-md border border-rose-500/50 rounded-2xl p-2 flex items-center gap-1.5 max-w-[95vw] overflow-x-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="px-2 text-[10px] font-black uppercase text-rose-400 font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Poses:
          </div>
          {poses.map(p => (
            <button
              key={p.id}
              onClick={() => onSetPose(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                currentPose === p.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/60 scale-105'
                  : 'bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom Controls Layout */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Left Side: Virtual Movement Joystick */}
        <div className="flex flex-col items-center gap-2">
          {/* Vehicle Selector Carousel */}
          {!isBailed && (
            <div className="flex items-center gap-1 bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 p-1 rounded-xl">
              <button
                onClick={() => onSetVehicle('foot')}
                className={`p-2 rounded-lg transition-all ${
                  vehicle === 'foot' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="On Foot / Parkour"
              >
                <Footprints className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSetVehicle('skateboard')}
                className={`p-2 rounded-lg text-xs font-black transition-all ${
                  vehicle === 'skateboard' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Skateboard"
              >
                🛹
              </button>
              <button
                onClick={() => onSetVehicle('bmx')}
                className={`p-2 rounded-lg transition-all ${
                  vehicle === 'bmx' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="BMX Bike"
              >
                <Bike className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSetVehicle('cart')}
                className={`p-2 rounded-lg text-xs font-black transition-all ${
                  vehicle === 'cart' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Stunt Cart"
              >
                🛒
              </button>
            </div>
          )}

          {/* Virtual Joystick Touch Base */}
          <div
            ref={joystickRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-zinc-950/70 backdrop-blur-md border-2 border-zinc-700/60 relative flex items-center justify-center touch-none shadow-2xl active:border-rose-500/60"
          >
            {/* Guide crosshairs */}
            <div className="absolute w-full h-[1px] bg-zinc-700/30" />
            <div className="absolute h-full w-[1px] bg-zinc-700/30" />

            {/* Draggable thumb knob */}
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 border-2 border-white/50 shadow-lg pointer-events-none transition-transform duration-75 flex items-center justify-center text-white/70"
              style={{
                transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              }}
            >
              <div className="w-3 h-3 rounded-full bg-white/80" />
            </div>
          </div>
        </div>

        {/* Right Side: Action Trigger Cluster */}
        <div className="flex flex-col items-end gap-3">
          {/* Upper Action Row: Sprint / Nitro */}
          {!isBailed && (
            <button
              onMouseDown={() => {
                setIsSprinting(true);
                onSprintToggle(true);
              }}
              onMouseUp={() => {
                setIsSprinting(false);
                onSprintToggle(false);
              }}
              onTouchStart={() => {
                setIsSprinting(true);
                onSprintToggle(true);
              }}
              onTouchEnd={() => {
                setIsSprinting(false);
                onSprintToggle(false);
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md border-2 transition-all active:scale-95 shadow-xl ${
                isSprinting
                  ? 'bg-amber-500 border-amber-300 text-black scale-105'
                  : 'bg-zinc-950/80 border-zinc-700 text-amber-400 hover:bg-zinc-900'
              }`}
              title="Sprint / Nitro"
            >
              <Zap className="w-6 h-6 fill-current" />
            </button>
          )}

          {/* Lower Action Row: JUMP & BAIL / HALL OF MEAT */}
          <div className="flex items-center gap-3">
            {/* Jump / Ollie / Parkour Leap */}
            {!isBailed && (
              <button
                onClick={onJump}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-500 active:scale-90 border-2 border-cyan-300/60 shadow-xl shadow-cyan-950/60 text-white font-black flex flex-col items-center justify-center text-xs tracking-wider transition-transform"
              >
                <span>JUMP</span>
                <span className="text-[9px] opacity-75 font-normal">Ollie</span>
              </button>
            )}

            {/* THE ICONIC HALL OF MEAT BAIL BUTTON */}
            <button
              onClick={onBail}
              className={`w-20 h-20 md:w-22 md:h-22 rounded-full border-4 flex flex-col items-center justify-center transition-all active:scale-90 shadow-2xl ${
                isBailed
                  ? 'bg-gradient-to-br from-rose-800 to-rose-950 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-gradient-to-br from-rose-600 via-rose-500 to-red-700 border-rose-300 text-white shadow-rose-900/80'
              }`}
            >
              <Flame className="w-6 h-6 fill-current animate-bounce" />
              <span className="font-black text-sm md:text-base tracking-widest uppercase">
                {isBailed ? 'MEAT!' : 'BAIL'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
