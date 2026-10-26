import React from 'react';
import { Challenge } from '../types/game';
import { Trophy, CheckCircle2, Circle, DollarSign, X } from 'lucide-react';

interface ChallengesModalProps {
  challenges: Challenge[];
  totalScore: number;
  onClose: () => void;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({
  challenges,
  totalScore,
  onClose,
}) => {
  const completedCount = challenges.filter(c => c.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md text-white select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase text-white font-sans">
                Hall of Meat Bounties
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                {completedCount} OF {challenges.length} OBJECTIVES UNLOCKED
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

        {/* List of Challenges */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {challenges.map(c => (
            <div
              key={c.id}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                c.completed
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {c.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-600" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    {c.title}
                  </div>
                  <div className="text-xs text-zinc-400">{c.description}</div>
                </div>
              </div>

              <div className="text-right font-mono text-xs font-bold text-amber-400">
                +{c.rewardPoints.toLocaleString()} PTS
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
