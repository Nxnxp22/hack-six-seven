import type { KeyboardEvent } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  disabled: boolean
}

export default function PasswordInput({ value, onChange, onSubmit, submitting, disabled }: Props) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !disabled && !submitting && value.trim()) {
      onSubmit()
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-5 space-y-4">
      <div>
        <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">
          Access Terminal
        </p>
        <h3 className="text-base font-semibold text-slate-100">Enter Access Code</h3>
        <p className="text-xs text-slate-500 mt-1">
          Analyze the classified document and derive the password
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="ACCESS CODE..."
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-slate-950 border border-slate-600 rounded-lg px-4 py-3
            font-mono text-slate-100 placeholder-slate-700 uppercase tracking-widest text-sm
            focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        />

        <button
          onClick={onSubmit}
          disabled={disabled || submitting || !value.trim()}
          className="w-full py-3 rounded-lg font-mono font-semibold text-sm tracking-widest uppercase
            transition-all duration-150
            bg-cyan-600 hover:bg-cyan-500 text-white
            disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
        >
          {submitting ? '⟳ VERIFYING...' : 'SUBMIT ACCESS CODE'}
        </button>
      </div>
    </div>
  )
}
