import type { Difficulty } from "../types/passwordPuzzle.types";

const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  EASY: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  MEDIUM: "border-amber-500/40  text-amber-400  bg-amber-500/10",
  HARD: "border-red-500/40    text-red-400    bg-red-500/10",
};

interface Props {
  stability: number;
  difficulty: Difficulty;
  coins: number;
}

export default function StatusDisplay({ stability, difficulty, coins }: Props) {
  const barColor =
    stability > 60
      ? "bg-emerald-500"
      : stability > 30
        ? "bg-amber-500"
        : "bg-red-500";

  const stabilityText =
    stability > 60
      ? "text-emerald-400"
      : stability > 30
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          System Status
        </span>
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded border ${DIFFICULTY_BADGE[difficulty]}`}
        >
          {difficulty}
        </span>
      </div>

      {/* Stability bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400">Security Stability</span>
          <span className={stabilityText}>{stability}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${stability}%` }}
          />
        </div>
      </div>

      {/* Coins */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">💰</span>
        <span className="font-mono font-semibold text-amber-400">{coins}</span>
        <span className="text-slate-500 text-xs font-mono">coins</span>
      </div>
    </div>
  );
}
