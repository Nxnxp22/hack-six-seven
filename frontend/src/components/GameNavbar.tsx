import { useNavigate } from 'react-router-dom'

// ── Accent colour map ────────────────────────────────────────────────────────
const ACCENT: Record<string, { title: string; btnOn: string; btnOff: string }> = {
  purple: {
    title:  'text-purple-400',
    btnOn:  'border-purple-500/60 text-purple-400',
    btnOff: 'border-transparent text-white/50 hover:text-white',
  },
  cyan: {
    title:  'text-cyan-400',
    btnOn:  'border-cyan-500/60 text-cyan-400',
    btnOff: 'border-transparent text-white/50 hover:text-white',
  },
  orange: {
    title:  'text-orange-400',
    btnOn:  'border-orange-500/60 text-orange-400',
    btnOff: 'border-transparent text-white/50 hover:text-white',
  },
  yellow: {
    title:  'text-yellow-400',
    btnOn:  'border-yellow-500/60 text-yellow-400',
    btnOff: 'border-transparent text-white/50 hover:text-white',
  },
}

// ── Stat item ────────────────────────────────────────────────────────────────
interface StatProps {
  label: string
  value: string | number
  valueClass?: string
}

export function GameNavbarStat({ label, value, valueClass = 'text-white' }: Readonly<StatProps>) {
  return (
    <div>
      <p className="text-white/40 text-xs font-mono">{label}</p>
      <p className={`font-bold font-mono text-sm ${valueClass}`}>{value}</p>
    </div>
  )
}

// ── Main navbar ──────────────────────────────────────────────────────────────
interface HintConfig {
  /** Coin cost of the next hint to be revealed */
  cost: number
  onClick: () => void
  /** True when no more hints are available or coins are insufficient */
  disabled?: boolean
}

interface GameNavbarProps {
  title: string
  /** SVG or any icon node placed next to the title */
  icon: React.ReactNode
  accentColor?: keyof typeof ACCENT
  onBack?: () => void
  /** When provided, a MANUAL toggle button is rendered */
  manualActive?: boolean
  onManualToggle?: () => void
  /** When provided, a HINT button is rendered */
  hint?: HintConfig
  /** Right-side stat items — use <GameNavbarStat> */
  children?: React.ReactNode
}

export default function GameNavbar({
  title,
  icon,
  accentColor = 'purple',
  onBack,
  manualActive,
  onManualToggle,
  hint,
  children,
}: Readonly<GameNavbarProps>) {
  const navigate   = useNavigate()
  const accent     = ACCENT[accentColor] ?? ACCENT.purple
  const handleBack = onBack ?? (() => navigate('/'))

  return (
    <header className="px-3 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 border-b border-white/10">
      <div className="flex items-center gap-3 md:gap-5">

        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-mono transition-colors"
        >
          <span>←</span>
          <span className="hidden xs:inline">BACK</span>
        </button>

        {/* Module title */}
        <div className={`flex items-center gap-1.5 text-xs font-mono ${accent.title}`}>
          <span className="w-3 h-3 shrink-0 flex items-center justify-center">{icon}</span>
          {title}
        </div>

        {/* Manual toggle */}
        {onManualToggle && (
          <button
            onClick={onManualToggle}
            className={`flex items-center gap-1.5 text-xs font-mono transition-colors px-2 py-0.5 border
              ${manualActive ? accent.btnOn : accent.btnOff}`}
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            MANUAL
          </button>
        )}

        {/* Hint button — shows cost of the next available hint */}
        {hint && (
          <button
            onClick={hint.onClick}
            disabled={hint.disabled}
            className={`flex items-center gap-1.5 text-xs font-mono transition-colors px-2 py-0.5 border
              ${hint.disabled
                ? 'border-transparent text-white/20 cursor-not-allowed'
                : accent.btnOff}`}
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            HINT
            {!hint.disabled && (
              <span className="text-amber-400 ml-0.5">-{hint.cost}</span>
            )}
          </button>
        )}
      </div>

      {/* Right-side stats */}
      {children && (
        <div className="flex items-center gap-4 md:gap-6">
          {children}
        </div>
      )}
    </header>
  )
}
