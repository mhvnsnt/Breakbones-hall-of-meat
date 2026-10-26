import React, { useState } from 'react';
import { BoneState } from '../types/game';
import { Activity, DollarSign, AlertTriangle, ShieldAlert, Award, RefreshCw, X } from 'lucide-react';

interface XRayDamageViewerProps {
  bones: BoneState[];
  totalBill: number;
  score: number;
  multiplier: number;
  rotations: number;
  flightDistance: number;
  onClose: () => void;
  onRespawn: () => void;
}

export const XRayDamageViewer: React.FC<XRayDamageViewerProps> = ({
  bones,
  totalBill,
  score,
  multiplier,
  rotations,
  flightDistance,
  onClose,
  onRespawn,
}) => {
  const [selectedBoneId, setSelectedBoneId] = useState<string | null>(null);

  const brokenBones = bones.filter(b => b.isBroken);
  const selectedBone = bones.find(b => b.id === selectedBoneId) || brokenBones[0] || bones[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md text-white select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wider uppercase text-rose-500 font-sans">
                Hall of Meat · Trauma Diagnostic
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                EMERGENCY TRIAGE UNIT · STUNT TRAUMA ANALYSIS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title="Close diagnostic"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto p-4 md:p-6 gap-6">
          {/* Left Column: Interactive Anatomical X-Ray Silhouette */}
          <div className="md:col-span-6 flex flex-col items-center justify-center bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 relative min-h-[380px]">
            <div className="absolute top-3 left-4 text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Skeletal Radiograph View
            </div>

            {/* SVG Anatomical Human Skeleton Visualizer */}
            <svg
              viewBox="0 0 320 480"
              className="w-full max-h-[380px] drop-shadow-[0_0_15px_rgba(225,29,72,0.2)]"
            >
              {/* Background scanning grid */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Head / Skull */}
              <g
                onClick={() => setSelectedBoneId('skull')}
                className="cursor-pointer group"
              >
                <circle
                  cx="160"
                  cy="65"
                  r="28"
                  className={`transition-all duration-300 ${
                    bones.find(b => b.id === 'skull')?.isBroken
                      ? 'fill-rose-600/70 stroke-rose-400 stroke-2 filter drop-shadow-[0_0_8px_#f43f5e]'
                      : 'fill-zinc-800/80 stroke-zinc-500 stroke-1 group-hover:stroke-cyan-400'
                  }`}
                />
                <circle cx="152" cy="62" r="4" fill="#09090b" />
                <circle cx="168" cy="62" r="4" fill="#09090b" />
                <path d="M 152 78 Q 160 82 168 78" stroke="#09090b" strokeWidth="2" fill="none" />
              </g>

              {/* Cervical Neck */}
              <g onClick={() => setSelectedBoneId('cervical')} className="cursor-pointer group">
                <rect
                  x="154"
                  y="95"
                  width="12"
                  height="18"
                  rx="3"
                  className={`transition-all duration-300 ${
                    bones.find(b => b.id === 'cervical')?.isBroken
                      ? 'fill-rose-600 stroke-rose-400 stroke-2'
                      : 'fill-zinc-700 stroke-zinc-500 stroke-1'
                  }`}
                />
              </g>

              {/* Clavicles */}
              <g onClick={() => setSelectedBoneId('l_clavicle')} className="cursor-pointer group">
                <line
                  x1="154"
                  y1="115"
                  x2="110"
                  y2="125"
                  strokeWidth="6"
                  className={`transition-all ${
                    bones.find(b => b.id === 'l_clavicle')?.isBroken ? 'stroke-rose-500' : 'stroke-zinc-600'
                  }`}
                  strokeLinecap="round"
                />
              </g>
              <g onClick={() => setSelectedBoneId('r_clavicle')} className="cursor-pointer group">
                <line
                  x1="166"
                  y1="115"
                  x2="210"
                  y2="125"
                  strokeWidth="6"
                  className={`transition-all ${
                    bones.find(b => b.id === 'r_clavicle')?.isBroken ? 'stroke-rose-500' : 'stroke-zinc-600'
                  }`}
                  strokeLinecap="round"
                />
              </g>

              {/* Ribcage */}
              <g onClick={() => setSelectedBoneId('ribcage')} className="cursor-pointer group">
                <path
                  d="M 130 130 C 130 120, 190 120, 190 130 C 205 160, 205 180, 190 200 C 170 210, 150 210, 130 200 C 115 180, 115 160, 130 130 Z"
                  className={`transition-all duration-300 ${
                    bones.find(b => b.id === 'ribcage')?.isBroken
                      ? 'fill-rose-700/60 stroke-rose-400 stroke-2 drop-shadow-[0_0_8px_#f43f5e]'
                      : 'fill-zinc-800/80 stroke-zinc-500 stroke-1 group-hover:stroke-cyan-400'
                  }`}
                />
                <line x1="160" y1="125" x2="160" y2="200" stroke="#09090b" strokeWidth="3" />
                <line x1="138" y1="145" x2="182" y2="145" stroke="#09090b" strokeWidth="2" />
                <line x1="135" y1="165" x2="185" y2="165" stroke="#09090b" strokeWidth="2" />
                <line x1="140" y1="185" x2="180" y2="185" stroke="#09090b" strokeWidth="2" />
              </g>

              {/* Spine */}
              <g onClick={() => setSelectedBoneId('spine')} className="cursor-pointer group">
                <rect
                  x="154"
                  y="200"
                  width="12"
                  height="35"
                  rx="3"
                  className={`transition-all duration-300 ${
                    bones.find(b => b.id === 'spine')?.isBroken
                      ? 'fill-rose-600 stroke-rose-400 stroke-2'
                      : 'fill-zinc-700 stroke-zinc-500 stroke-1'
                  }`}
                />
              </g>

              {/* Left Arm (Humerus + Forearm) */}
              <g onClick={() => setSelectedBoneId('l_clavicle')} className="cursor-pointer">
                <line
                  x1="108"
                  y1="128"
                  x2="90"
                  y2="190"
                  strokeWidth="7"
                  className={`transition-all ${bones.find(b => b.id === 'l_clavicle')?.isBroken ? 'stroke-rose-500' : 'stroke-zinc-600'}`}
                  strokeLinecap="round"
                />
              </g>
              <g onClick={() => setSelectedBoneId('l_radius')} className="cursor-pointer">
                <line
                  x1="90"
                  y1="195"
                  x2="75"
                  y2="255"
                  strokeWidth="6"
                  className={`transition-all ${bones.find(b => b.id === 'l_radius')?.isBroken ? 'stroke-rose-500' : 'stroke-zinc-600'}`}
                  strokeLinecap="round"
                />
                <circle cx="72" cy="260" r="5" fill="#a1a1aa" />
              </g>

              {/* Right Arm (Humerus + Forearm) */}
              <g onClick={() => setSelectedBoneId('r_clavicle')} className="cursor-pointer">
                <line
                  x1="212"
                  y1="128"
                  x2="230"
                  y2="190"
                  strokeWidth="7"
                  className={`transition-all ${bones.find(b => b.id === 'r_clavicle')?.isBroken ? 'stroke-rose-500' : 'stroke-zinc-600'}`}
                  strokeLinecap="round"
                />
              </g>
              <g onClick={() => setSelectedBoneId('r_radius')} className="cursor-pointer">
                <line
                  x1="230"
                  y1="195"
                  x2="245"
                  y2="255"
                  strokeWidth="6"
                  className={`transition-all ${bones.find(b => b.id === 'r_radius')?.isBroken ? 'stroke-rose-500' : 'stroke-zinc-600'}`}
                  strokeLinecap="round"
                />
                <circle cx="248" cy="260" r="5" fill="#a1a1aa" />
              </g>

              {/* Pelvis */}
              <g onClick={() => setSelectedBoneId('pelvis')} className="cursor-pointer group">
                <path
                  d="M 125 235 Q 160 250 195 235 L 185 270 Q 160 280 135 270 Z"
                  className={`transition-all duration-300 ${
                    bones.find(b => b.id === 'pelvis')?.isBroken
                      ? 'fill-rose-600 stroke-rose-400 stroke-2 drop-shadow-[0_0_8px_#f43f5e]'
                      : 'fill-zinc-800 stroke-zinc-500 stroke-1 group-hover:stroke-cyan-400'
                  }`}
                />
              </g>

              {/* Left Leg (Femur + Tibia) */}
              <g onClick={() => setSelectedBoneId('l_femur')} className="cursor-pointer">
                <line
                  x1="140"
                  y1="275"
                  x2="130"
                  y2="360"
                  strokeWidth="8"
                  className={`transition-all ${bones.find(b => b.id === 'l_femur')?.isBroken ? 'stroke-rose-500' : 'stroke-zinc-600'}`}
                  strokeLinecap="round"
                />
                <circle cx="130" cy="365" r="5" fill="#71717a" />
              </g>
              <g onClick={() => setSelectedBoneId('l_tibia')} className="cursor-pointer">
                <line
                  x1="130"
                  y1="370"
                  x2="125"
                  y2="445"
                  strokeWidth="7"
                  className={`transition-all ${bones.find(b => b.id === 'l_tibia')?.isBroken ? 'stroke-rose-500' : 'stroke-zinc-600'}`}
                  strokeLinecap="round"
                />
                <ellipse cx="120" cy="450" rx="8" ry="4" fill="#a1a1aa" />
              </g>

              {/* Right Leg (Femur + Tibia) */}
              <g onClick={() => setSelectedBoneId('r_femur')} className="cursor-pointer">
                <line
                  x1="180"
                  y1="275"
                  x2="190"
                  y2="360"
                  strokeWidth="8"
                  className={`transition-all ${bones.find(b => b.id === 'r_femur')?.isBroken ? 'stroke-rose-500' : 'stroke-zinc-600'}`}
                  strokeLinecap="round"
                />
                <circle cx="190" cy="365" r="5" fill="#71717a" />
              </g>
              <g onClick={() => setSelectedBoneId('r_tibia')} className="cursor-pointer">
                <line
                  x1="190"
                  y1="370"
                  x2="195"
                  y2="445"
                  strokeWidth="7"
                  className={`transition-all ${bones.find(b => b.id === 'r_tibia')?.isBroken ? 'stroke-rose-500' : 'stroke-zinc-600'}`}
                  strokeLinecap="round"
                />
                <ellipse cx="200" cy="450" rx="8" ry="4" fill="#a1a1aa" />
              </g>
            </svg>
          </div>

          {/* Right Column: Diagnostic Breakdown & Hospital Bill */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            {/* High-level Stunt Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase font-mono text-zinc-400">Total Bones</div>
                <div className="text-2xl font-black text-rose-500 font-mono tabular-nums">
                  {brokenBones.length}
                </div>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase font-mono text-zinc-400">Air Distance</div>
                <div className="text-2xl font-black text-amber-400 font-mono tabular-nums">
                  {Math.round(flightDistance)}m
                </div>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase font-mono text-zinc-400">Rotations</div>
                <div className="text-2xl font-black text-cyan-400 font-mono tabular-nums">
                  {rotations.toFixed(1)}x
                </div>
              </div>
            </div>

            {/* Selected Bone Medical Report */}
            {selectedBone && (
              <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${selectedBone.isBroken ? 'text-rose-500' : 'text-zinc-500'}`} />
                    <span className="font-bold text-sm text-zinc-100">{selectedBone.name}</span>
                  </div>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      selectedBone.isBroken ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {selectedBone.isBroken ? selectedBone.fractureType : 'Intact'}
                  </span>
                </div>

                <div className="text-xs text-zinc-400 flex items-center justify-between font-mono">
                  <span>Impact Damage: {selectedBone.damage}%</span>
                  <span className="text-emerald-400 font-bold">
                    Procedure Cost: ${selectedBone.cost.toLocaleString()}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedBone.isBroken ? 'bg-gradient-to-r from-amber-500 to-rose-600' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${selectedBone.damage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Itemized Broken Bones List */}
            <div className="flex-1 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 overflow-y-auto max-h-[160px] space-y-1.5">
              <div className="text-[11px] font-mono uppercase text-zinc-400 font-semibold mb-1">
                Fracture Ledger ({brokenBones.length} injuries)
              </div>
              {brokenBones.length === 0 ? (
                <div className="text-xs text-zinc-500 italic py-4 text-center">
                  No bones shattered yet! Launch off a bigger roof or cliff!
                </div>
              ) : (
                brokenBones.map(b => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBoneId(b.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
                      selectedBoneId === b.id ? 'bg-rose-950/60 border border-rose-800/60 text-white' : 'hover:bg-zinc-800/50 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>{b.name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      +${b.cost.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Total Medical Bill Callout */}
            <div className="bg-gradient-to-r from-rose-950/80 via-zinc-900 to-zinc-900 border border-rose-800/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-rose-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Total Emergency Room Bill
                </div>
                <div className="text-3xl font-black text-rose-400 font-mono tracking-tight tabular-nums">
                  ${totalBill.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-zinc-400">Total Stunt Score</div>
                <div className="text-xl font-bold text-amber-400 font-mono tabular-nums">
                  {score.toLocaleString()} PTS
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onRespawn}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-rose-950/50 transition-all font-sans"
              >
                <RefreshCw className="w-4 h-4" />
                Respawn & Drop Again
              </button>
              <button
                onClick={onClose}
                className="py-3 px-5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-semibold rounded-xl transition-all"
              >
                Free Cam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
