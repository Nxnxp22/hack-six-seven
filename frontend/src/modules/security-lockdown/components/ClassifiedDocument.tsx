import type {
  HintMetadata,
  PuzzlePublicDTO,
} from "../types/passwordPuzzle.types";

interface Props {
  puzzle: PuzzlePublicDTO | null;
  loading: boolean;
  revealedHints: Record<string, string>;
  currentCoins: number;
  hintError: string | null;
  onRevealHint: (hintId: string, coinCost: number) => Promise<void>;
}

export default function ClassifiedDocument({
  puzzle,
  loading,
  revealedHints,
  currentCoins,
  hintError,
  onRevealHint,
}: Props) {
  if (loading) {
    return (
      <div className="min-h-96 bg-slate-900 border border-slate-700/50 rounded-lg flex items-center justify-center">
        <p className="text-cyan-400 font-mono text-sm animate-pulse tracking-widest">
          RETRIEVING CLASSIFIED DATA...
        </p>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="min-h-96 bg-slate-900 border border-slate-700/50 rounded-lg flex items-center justify-center">
        <p className="text-slate-600 font-mono text-sm">NO DATA</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-lg flex flex-col">
      {/* Document header */}
      <div className="border-b border-slate-700/50 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-red-400 uppercase tracking-widest mb-1">
            ⚠ CLASSIFIED DOCUMENT
          </p>
          <h2 className="text-lg font-bold text-slate-100">{puzzle.title}</h2>
        </div>
        <p className="text-xs font-mono text-slate-600 shrink-0 mt-1">
          REF: {puzzle.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Clue text */}
      <div className="p-5">
        <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
          {puzzle.clueText}
        </pre>
      </div>

      {/* Hints section */}
      {puzzle.hints.length > 0 && (
        <div className="border-t border-slate-700/50 px-5 py-4 space-y-2">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
            — Intel Assistance —
          </p>

          {hintError && (
            <p className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {hintError}
            </p>
          )}

          {puzzle.hints.map((hint) => (
            <HintRow
              key={hint.id}
              hint={hint}
              revealed={revealedHints[hint.id]}
              canAfford={currentCoins >= hint.coinCost}
              onReveal={() => onRevealHint(hint.id, hint.coinCost)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HintRowProps {
  hint: HintMetadata;
  revealed: string | undefined;
  canAfford: boolean;
  onReveal: () => void;
}

function HintRow({ hint, revealed, canAfford, onReveal }: HintRowProps) {
  if (revealed) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
        <p className="text-xs font-mono text-amber-400 mb-1">
          INTEL #{hint.order}
        </p>
        <p className="text-sm text-slate-200">{revealed}</p>
      </div>
    );
  }

  return (
    <button
      onClick={onReveal}
      disabled={!canAfford}
      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-mono transition-colors
        ${
          canAfford
            ? "border-slate-600 text-slate-300 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer"
            : "border-slate-800 text-slate-600 cursor-not-allowed"
        }`}
    >
      <span>▶ Intel Hint #{hint.order}</span>
      <span
        className={`text-xs ${canAfford ? "text-amber-400" : "text-slate-600"}`}
      >
        {hint.coinCost} 💰
      </span>
    </button>
  );
}
