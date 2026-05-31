interface TimerBarProps {
  secondsLeft: number;
  totalSeconds: number;
}

export default function TimerBar({ secondsLeft, totalSeconds }: TimerBarProps) {
  const pct = (secondsLeft / totalSeconds) * 100;
  const mins = String(Math.floor(secondsLeft / 60)).padStart(1, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const barColor =
    pct > 50 ? 'bg-green-500' :
    pct > 25 ? 'bg-yellow-400' :
    'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-orange-400 font-bold text-lg min-w-[3rem]">
        {mins}:{secs}
      </span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}