interface Props {
  label: string
  value: number
  /** Tailwind bg-* colour class — text colour is derived automatically */
  color: string
}

export default function StabilityBar({ label, value, color }: Readonly<Props>) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-white/40 text-xs font-mono shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full min-w-12">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold tabular-nums shrink-0 ${color.replace('bg-', 'text-')}`}>
        {value}%
      </span>
    </div>
  )
}
