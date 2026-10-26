import React from 'react';
import { STUNT_SPOTS } from '../game/stuntWorld';
import { StuntSpot } from '../types/game';
import { MapPin, Navigation, Flag, ArrowUpRight, X } from 'lucide-react';

interface LocationSelectorProps {
  currentSpotId: string;
  onSelectSpot: (spot: StuntSpot) => void;
  onSetCustomMarker: () => void;
  onReturnCustomMarker: () => void;
  hasCustomMarker: boolean;
  onClose: () => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  currentSpotId,
  onSelectSpot,
  onSetCustomMarker,
  onReturnCustomMarker,
  hasCustomMarker,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md text-white select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase text-white font-sans">
                Drop Zone Coordinates
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                TELEPORT TO NOTORIOUS HALL OF MEAT DROP LOCATIONS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Session Marker Section (Skate 3 style) */}
        <div className="px-6 py-3 bg-zinc-900/40 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-300 flex items-center gap-1.5">
            <Flag className="w-4 h-4 text-rose-500" />
            <span>Session Marker: {hasCustomMarker ? 'Active drop saved' : 'No custom marker set'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSetCustomMarker}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg transition-colors text-zinc-200"
            >
              Set Marker Here
            </button>
            <button
              onClick={onReturnCustomMarker}
              disabled={!hasCustomMarker}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-xs font-bold rounded-lg transition-colors text-white"
            >
              Return to Marker
            </button>
          </div>
        </div>

        {/* Spot Cards List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {STUNT_SPOTS.map(spot => {
            const isSelected = spot.id === currentSpotId;
            return (
              <div
                key={spot.id}
                onClick={() => {
                  onSelectSpot(spot);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/40'
                    : 'bg-zinc-900/60 border-zinc-800/90 hover:bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-zinc-100 group-hover:text-white">
                      {spot.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        spot.difficulty === 'Insane'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : spot.difficulty === 'Extreme'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {spot.difficulty}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      · {spot.heightMeters}m Drop
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{spot.description}</p>
                </div>

                <div className="flex items-center gap-2 text-rose-400 group-hover:translate-x-1 transition-transform">
                  <span className="text-xs font-mono font-bold hidden sm:inline">WARP</span>
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
