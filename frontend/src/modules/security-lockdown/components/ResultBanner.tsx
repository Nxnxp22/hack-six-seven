import type { SubmitResponseDTO } from '../types/passwordPuzzle.types'

interface Props {
  result: SubmitResponseDTO
  onPlayAgain: () => void
}

export default function ResultBanner({ result, onPlayAgain }: Props) {
  const { correct } = result

  return (
    <div
      className={`rounded-lg border p-5 space-y-4 ${
        correct
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}
    >
      {/* Verdict */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{correct ? '✓' : '✗'}</span>
        <div>
          <p
            className={`text-lg font-bold font-mono tracking-widest ${
              correct ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {correct ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {correct ? 'Correct access code verified' : 'Invalid access code — system integrity compromised'}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCell
          label="Stability"
          value={`${result.stabilityChange > 0 ? '+' : ''}${result.stabilityChange}%`}
          color={result.stabilityChange > 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <StatCell
          label="Coins"
          value={`${result.coinsChange > 0 ? '+' : ''}${result.coinsChange} 💰`}
          color={result.coinsChange > 0 ? 'text-amber-400' : 'text-slate-400'}
        />
        <StatCell label="Time" value={`${result.timeTaken}s`} color="text-cyan-400" />
        <StatCell label="Hints Used" value={String(result.hintsUsed)} color="text-slate-300" />
      </div>

      {/* Running totals */}
      <div className="border-t border-slate-700/30 pt-3 space-y-1 text-xs font-mono">
        <div className="flex justify-between text-slate-500">
          <span>Current Stability</span>
          <span className="text-slate-300">{result.currentStability}%</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Current Coins</span>
          <span className="text-amber-400">{result.currentCoins} 💰</span>
        </div>
        {result.coinsSpentHints > 0 && (
          <div className="flex justify-between text-slate-500">
            <span>Spent on Hints</span>
            <span className="text-slate-400">−{result.coinsSpentHints} 💰</span>
          </div>
        )}
      </div>

      <button
        onClick={onPlayAgain}
        className="w-full py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-mono
          hover:border-slate-400 hover:text-slate-100 transition-colors"
      >
        NEW PUZZLE
      </button>
    </div>
  )
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-2.5">
      <p className="text-xs text-slate-500 font-mono">{label}</p>
      <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
    </div>
  )
}
