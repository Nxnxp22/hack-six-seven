import type { PuzzlePublicDTO } from '../types/passwordPuzzle.types'

interface Props {
  puzzle: PuzzlePublicDTO | null
  loading: boolean
  revealedHints: Record<string, string>
}

export default function ClassifiedDocument({ puzzle, loading, revealedHints }: Readonly<Props>) {
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

  return (
    <div className="border border-white/20 bg-black flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-white/20 px-4 py-3">
        <p className="text-white text-xs font-bold tracking-widest uppercase">Security Log</p>
      </div>

      {/* Document body */}
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
    </div>
  )
}
