import type { PuzzlePublicDTO } from '../types/passwordPuzzle.types'

interface Props {
  puzzle: PuzzlePublicDTO | null
  loading: boolean
  revealedHints: Record<string, string>
  currentCoins: number
  hintError: string | null
  onRevealHint: (hintId: string, coinCost: number) => Promise<void>
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
      <div className="h-full min-h-80 border border-white/20 bg-black flex items-center justify-center">
        <p className="text-purple-400 font-mono text-xs tracking-widest animate-pulse uppercase">
          Retrieving classified data...
        </p>
      </div>
    )
  }

  if (!puzzle || typeof puzzle !== 'object' || !puzzle.id) {
    return (
      <div className="h-full min-h-80 border border-white/20 bg-black flex items-center justify-center">
        <p className="text-white/30 font-mono text-xs tracking-widest">NO DATA</p>
      </div>
    )
  }

  // Find the next unrevealed hint
  const nextHint = puzzle.hints.find((h) => !revealedHints[h.id])

  return (
    <div className="border border-white/20 bg-black flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-white/20 px-4 py-3">
        <p className="text-white text-xs font-bold tracking-widest uppercase">Security Log</p>
      </div>

      {/* Document body — capped height on mobile so terminal stays visible when stacked */}
      <div className="flex-1 p-4 md:p-5 overflow-y-auto max-h-52 sm:max-h-64 md:max-h-none">
        <pre className="font-mono text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
          {puzzle.clueText}
        </pre>

        {/* Revealed hints */}
        {puzzle.hints.map((hint) =>
          revealedHints[hint.id] ? (
            <div key={hint.id} className="mt-4 border-t border-white/10 pt-3">
              <p className="text-purple-400 font-mono text-xs mb-1">
                {'>'} INTEL HINT #{hint.order} DECRYPTED
              </p>
              <p className="text-white/70 font-mono text-xs">{revealedHints[hint.id]}</p>
            </div>
          ) : null,
        )}
      </div>

      {/* Hint request footer */}
      <div className="border-t border-white/20 px-4 py-3">
        {hintError && (
          <p className="text-red-400 font-mono text-xs mb-2">{hintError}</p>
        )}

        {nextHint && (
          <button
            onClick={() => onRevealHint(nextHint.id, nextHint.coinCost)}
            disabled={currentCoins < nextHint.coinCost}
            className="text-purple-400 text-xs font-mono hover:text-purple-300 disabled:text-white/20 disabled:cursor-not-allowed transition-colors"
          >
            REQUEST HINT (-{nextHint.coinCost} pts)
          </button>
        )}
        {!nextHint && puzzle.hints.length > 0 && (
          <p className="text-white/20 font-mono text-xs">ALL HINTS REVEALED</p>
        )}
        {puzzle.hints.length === 0 && (
          <p className="text-white/20 font-mono text-xs">NO HINTS AVAILABLE</p>
        )}
      </div>
    </div>
  )
}
