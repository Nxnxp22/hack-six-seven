import type { KeyboardEvent } from 'react'
import type { SubmitResponseDTO } from '../types/passwordPuzzle.types'

type Props = Readonly<{
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  disabled: boolean
  result: SubmitResponseDTO | null
  wrongFeedback: string | null
  triesLeft: number
  maxTries: number
  totalHints: number
  hintsRevealed: number
  onPlayAgain: () => void
}>

export default function PasswordInput({
  value,
  onChange,
  onSubmit,
  submitting,
  disabled,
  result,
  wrongFeedback,
  triesLeft,
  maxTries,
  totalHints,
  hintsRevealed,
  onPlayAgain,
}: Props) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !disabled && !submitting && value.trim()) {
      onSubmit()
    }
  }

  const isFinished = !!result

  return (
    <div className="border border-white/20 bg-black flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-white/20 px-4 py-3">
        <p className="text-white text-xs font-bold tracking-widest uppercase">Terminal Access</p>
      </div>

      {/* Terminal output */}
      <div className="flex-1 p-4 font-mono text-xs space-y-1 min-h-32">
        {!result && !wrongFeedback && (
          <>
            <p className="text-purple-400">&gt; SECURITY OVERRIDE REQUESTED</p>
            <p className="text-purple-400">&gt; ENTER AUTHORIZATION CODE !</p>
            <p className="text-purple-400 flex items-center gap-1">
              &gt; <span className="uppercase">{value}</span>
              {!disabled && <span className="animate-pulse">_</span>}
            </p>
          </>
        )}

        {wrongFeedback && !result && (
          <>
            <p className="text-red-400">&gt; {wrongFeedback}</p>
            <p className="text-purple-400">&gt; ENTER AUTHORIZATION CODE !</p>
            <p className="text-purple-400 flex items-center gap-1">
              &gt; <span className="uppercase">{value}</span>
              <span className="animate-pulse">_</span>
            </p>
          </>
        )}

        {result && result.correct && (
          <>
            <p className="text-green-400">&gt; CODE ACCEPTED</p>
            <p className="text-green-400">&gt; ACCESS GRANTED</p>
            <p className="text-white/50 mt-2">&gt; stability {result.stabilityChange > 0 ? '+' : ''}{result.stabilityChange}%</p>
            <p className="text-white/50">&gt; coins +{result.coinsChange}</p>
            <p className="text-white/50">&gt; time {result.timeTaken}s</p>
          </>
        )}

        {result && !result.correct && (
          <>
            <p className="text-red-400">&gt; CODE REJECTED</p>
            <p className="text-red-400">&gt; ACCESS DENIED</p>
            <p className="text-white/50 mt-2">&gt; stability {result.stabilityChange}%</p>
            <p className="text-white/50">&gt; time {result.timeTaken}s</p>
          </>
        )}
      </div>

      {/* Input / result section */}
      <div className="border-t border-white/20 p-4 space-y-3">
        {isFinished ? (
          <button
            onClick={onPlayAgain}
            className="w-full border border-purple-500/70 text-purple-400 py-2.5
              font-mono text-xs font-bold tracking-widest uppercase
              hover:bg-purple-500/10 hover:border-purple-400 transition-colors"
          >
            NEW PUZZLE
          </button>
        ) : (
          <>
            <p className="text-white/40 text-xs font-mono tracking-widest">OVERRIDE CODE</p>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || submitting}
              placeholder="SUBMIT CODE"
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-transparent border border-white/30 text-white px-3 py-2
                font-mono text-xs placeholder-white/25 uppercase tracking-widest
                focus:outline-none focus:border-purple-500
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            />
            <button
              onClick={onSubmit}
              disabled={disabled || submitting || !value.trim()}
              className="w-full border border-purple-500/70 text-purple-400 py-2.5
                font-mono text-xs font-bold tracking-widest uppercase
                hover:bg-purple-500/10 hover:border-purple-400
                disabled:border-white/10 disabled:text-white/20 disabled:cursor-not-allowed
                transition-colors"
            >
              {submitting ? 'VERIFYING...' : 'SUBMIT CODE'}
            </button>
          </>
        )}

        {/* Hint dots + tries indicator */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: maxTries }, (_, i) => i + 1).map((tryNum) => (
              <span
                key={`try-${tryNum}`}
                className={`w-2 h-2 rounded-full ${
                  tryNum <= triesLeft ? 'bg-purple-500' : 'bg-white/15'
                }`}
              />
            ))}
          </div>
          {totalHints > 0 && (
            <p className="text-white/30 font-mono text-xs">
              {hintsRevealed}/{totalHints} hints
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
