type AccentColor = 'purple' | 'yellow' | 'orange' | 'cyan'

const SUCCESS_STYLE: Record<AccentColor, { outer: string; text: string; statBorder: string; btn: string }> = {
  purple: {
    outer:      'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.25)]',
    text:       'text-purple-400',
    statBorder: 'border-purple-500/30',
    btn:        'border-purple-500 text-purple-400 hover:bg-purple-500/10',
  },
  yellow: {
    outer:      'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]',
    text:       'text-yellow-400',
    statBorder: 'border-yellow-500/30',
    btn:        'border-yellow-500 text-yellow-400 hover:bg-yellow-500/10',
  },
  orange: {
    outer:      'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)]',
    text:       'text-orange-400',
    statBorder: 'border-orange-500/30',
    btn:        'border-orange-500 text-orange-400 hover:bg-orange-500/10',
  },
  cyan: {
    outer:      'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]',
    text:       'text-cyan-400',
    statBorder: 'border-cyan-500/30',
    btn:        'border-cyan-500 text-cyan-400 hover:bg-cyan-500/10',
  },
}

const FAIL_STYLE = {
  outer:      'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]',
  text:       'text-red-400',
  statBorder: 'border-red-500/30',
  btn:        'border-red-500 text-red-400 hover:bg-red-500/10',
}

interface Props {
  success: boolean
  title: string
  stabilityChange: number
  coinsChange: number
  timeTaken: number
  timeLimit: number
  accentColor?: AccentColor
  successMessage?: string
  failMessage?: string
  onReturn: () => void
}

export default function MissionResultPopup({
  success,
  title,
  stabilityChange,
  coinsChange,
  timeTaken,
  timeLimit,
  accentColor = 'purple',
  successMessage = 'Systems stabilized. Crisis averted. Well done, Operator.',
  failMessage = 'System integrity compromised. Mission failed.',
  onReturn,
}: Readonly<Props>) {
  const timeRemaining = Math.max(0, timeLimit - timeTaken)
  const style = success ? SUCCESS_STYLE[accentColor] : FAIL_STYLE

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className={`border w-full max-w-sm bg-black p-5 md:p-8 ${style.outer}`}>

        {/* Circle icon */}
        <div className="flex justify-center mb-5">
          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${style.text.replace('text-', 'border-')}`}>
            {success ? (
              <svg className={`w-7 h-7 ${style.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className={`w-7 h-7 ${style.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>

        {/* Title + verdict */}
        <div className="text-center mb-6">
          <p className="text-white/40 text-xs font-mono tracking-widest uppercase mb-2">{title}</p>
          <h2 className={`text-2xl font-bold font-mono tracking-widest ${style.text}`}>
            {success ? 'MISSION COMPLETE' : 'MISSION FAILED'}
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`border p-4 text-center ${style.statBorder}`}>
            <div className="flex justify-center mb-2">
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <p className="text-white/40 text-xs font-mono tracking-wider mb-1">STABILITY</p>
            <p className={`text-xl font-bold font-mono ${stabilityChange >= 0 ? style.text : 'text-red-400'}`}>
              {stabilityChange > 0 ? '+' : ''}{stabilityChange}%
            </p>
          </div>

          <div className={`border p-4 text-center ${style.statBorder}`}>
            <div className="flex justify-center mb-2">
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2"/>
              </svg>
            </div>
            <p className="text-white/40 text-xs font-mono tracking-wider mb-1">
              {success ? 'TIME LEFT' : 'TIME USED'}
            </p>
            <p className="text-xl font-bold font-mono text-white">
              {success ? timeRemaining : timeTaken}s
            </p>
          </div>

          <div className={`border p-4 text-center ${style.statBorder}`}>
            <div className="flex justify-center mb-2">
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01"/>
              </svg>
            </div>
            <p className="text-white/40 text-xs font-mono tracking-wider mb-1">COINS</p>
            <p className={`text-xl font-bold font-mono ${coinsChange > 0 ? 'text-amber-400' : 'text-white/40'}`}>
              {coinsChange > 0 ? `+${coinsChange}` : '—'}
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="text-white/40 text-xs font-mono text-center leading-relaxed mb-6">
          {success ? successMessage : failMessage}
        </p>

        {/* Return button */}
        <button
          onClick={onReturn}
          className={`w-full border py-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors ${style.btn}`}
        >
          ← RETURN TO COMMAND
        </button>
      </div>
    </div>
  )
}
