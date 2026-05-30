import type { SubmitResponseDTO } from '../types/passwordPuzzle.types'

interface Props {
  result: SubmitResponseDTO
  puzzleTitle: string
  timeLimit: number
  onReturn: () => void
}

export default function MissionResultPopup({ result, puzzleTitle, timeLimit, onReturn }: Props) {
  const { correct, stabilityChange, timeTaken } = result
  const timeRemaining = Math.max(0, timeLimit - timeTaken)

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div
        className={`border w-full max-w-sm bg-black p-5 md:p-8
          ${correct
            ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.25)]'
            : 'border-red-500   shadow-[0_0_30px_rgba(239,68,68,0.2)]'
          }`}
      >
        {/* Circle icon */}
        <div className="flex justify-center mb-5">
          <div
            className={`w-16 h-16 rounded-full border-2 flex items-center justify-center
              ${correct ? 'border-purple-500' : 'border-red-500'}`}
          >
            {correct ? (
              <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>

        {/* Puzzle name + verdict */}
        <div className="text-center mb-6">
          <p className="text-white/40 text-xs font-mono tracking-widest uppercase mb-2">
            {puzzleTitle}
          </p>
          <h2
            className={`text-2xl font-bold font-mono tracking-widest
              ${correct ? 'text-purple-400' : 'text-red-400'}`}
          >
            {correct ? 'MISSION COMPLETE' : 'MISSION FAILED'}
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`border p-4 text-center ${correct ? 'border-purple-500/30' : 'border-red-500/30'}`}>
            <div className="flex justify-center mb-2">
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <p className="text-white/40 text-xs font-mono tracking-wider mb-1">STABILITY IMPACT</p>
            <p className={`text-xl font-bold font-mono ${stabilityChange >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
              {stabilityChange > 0 ? '+' : ''}{stabilityChange}%
            </p>
          </div>

          <div className={`border p-4 text-center ${correct ? 'border-purple-500/30' : 'border-red-500/30'}`}>
            <div className="flex justify-center mb-2">
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2"/>
              </svg>
            </div>
            <p className="text-white/40 text-xs font-mono tracking-wider mb-1">
              {correct ? 'TIME REMAINING' : 'TIME TAKEN'}
            </p>
            <p className="text-xl font-bold font-mono text-white">
              {correct ? timeRemaining : timeTaken}s
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="text-white/40 text-xs font-mono text-center leading-relaxed mb-6">
          {correct
            ? 'Systems stabilized. Crisis averted. Well done, Operator.'
            : 'Security breach unresolved. System integrity compromised.'}
        </p>

        {/* Return button */}
        <button
          onClick={onReturn}
          className={`w-full border py-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors
            ${correct
              ? 'border-purple-500 text-purple-400 hover:bg-purple-500/10'
              : 'border-red-500   text-red-400   hover:bg-red-500/10'
            }`}
        >
          ← RETURN TO COMMAND
        </button>
      </div>
    </div>
  )
}
