import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GameStateDTO, PuzzlePublicDTO, SubmitResponseDTO } from '../types/passwordPuzzle.types'
import * as service from '../services/passwordPuzzle.service'
import ClassifiedDocument from '../components/ClassifiedDocument'
import PasswordInput from '../components/PasswordInput'
import ManualPanel from '../components/ManualPanel'
import MissionResultPopup from '../components/MissionResultPopup'

const MAX_TRIES = 4

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function StabilityBar({ label, value, color }: { label: string; value: number; color: string }) {
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

export default function SecurityLockdownPage() {
  const navigate = useNavigate()

  const [puzzle, setPuzzle]                   = useState<PuzzlePublicDTO | null>(null)
  const [gameState, setGameState]             = useState<GameStateDTO | null>(null)
  const [loading, setLoading]                 = useState(false)
  const [pageError, setPageError]             = useState<string | null>(null)
  const [answer, setAnswer]                   = useState('')
  const [submitting, setSubmitting]           = useState(false)
  const [result, setResult]                   = useState<SubmitResponseDTO | null>(null)
  const [hintsUsed, setHintsUsed]             = useState(0)
  const [coinsSpentHints, setCoinsSpentHints] = useState(0)
  const [revealedHints, setRevealedHints]     = useState<Record<string, string>>({})
  const [hintError, setHintError]             = useState<string | null>(null)
  const [showManual, setShowManual]           = useState(false)
  const [triesLeft, setTriesLeft]             = useState(MAX_TRIES)
  const [timeRemaining, setTimeRemaining]     = useState(0)
  const [wrongFeedback, setWrongFeedback]     = useState<string | null>(null)

  const startTimeRef     = useRef<number>(Date.now())
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const handleTimeoutRef = useRef<() => void>(() => {})

  function clearTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function startTimer(seconds: number) {
    clearTimer()
    setTimeRemaining(seconds)
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { clearTimer(); handleTimeoutRef.current(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPuzzle(); return () => clearTimer() }, [])
  useEffect(() => { if (result) clearTimer() }, [result])

  async function loadPuzzle() {
    clearTimer()
    setLoading(true)
    setPageError(null)
    setResult(null)
    setAnswer('')
    setHintsUsed(0)
    setCoinsSpentHints(0)
    setRevealedHints({})
    setHintError(null)
    setTriesLeft(MAX_TRIES)
    setWrongFeedback(null)
    startTimeRef.current = Date.now()
    try {
      const [stateData, puzzleData] = await Promise.all([
        service.fetchGameState(),
        service.fetchRandomPuzzle(),
      ])
      setGameState(stateData)
      setPuzzle(puzzleData)
      startTimer(puzzleData.timeLimit)
    } catch {
      setPageError('Backend unreachable. Make sure the server is running on port 3000.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevealHint(hintId: string, coinCost: number) {
    if (!puzzle) return
    setHintError(null)
    try {
      const res = await service.revealHint(puzzle.id, hintId)
      setRevealedHints((prev) => ({ ...prev, [hintId]: res.hintText }))
      setHintsUsed((prev) => prev + 1)
      setCoinsSpentHints((prev) => prev + coinCost)
      setGameState((prev) => prev ? { ...prev, coins: res.coinsRemaining } : prev)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setHintError(msg ?? 'Failed to reveal hint.')
    }
  }

  async function handleSubmit() {
    if (!puzzle || !answer.trim() || triesLeft === 0) return
    setSubmitting(true)
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)
    try {
      const res = await service.submitAnswer({ puzzleId: puzzle.id, answer: answer.trim(), timeTaken, hintsUsed, coinsSpentHints })
      setGameState((prev) => prev ? {
        ...prev,
        securityStability: res.securityStability,
        globalStability: res.globalStability,
        coins: res.currentCoins,
      } : prev)
      if (res.correct) {
        setResult(res)
      } else {
        const newTries = triesLeft - 1
        setTriesLeft(newTries)
        if (newTries === 0) {
          setResult(res)
        } else {
          setWrongFeedback(`ACCESS DENIED — ${newTries} ${newTries === 1 ? 'TRY' : 'TRIES'} REMAINING`)
          setAnswer('')
        }
      }
    } catch {
      setPageError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTimeout() {
    if (!puzzle || result) return
    setSubmitting(true)
    try {
      const res = await service.submitAnswer({ puzzleId: puzzle.id, answer: '', timeTaken: puzzle.timeLimit, hintsUsed, coinsSpentHints, timedOut: true })
      setResult(res)
      setGameState((prev) => prev ? { ...prev, securityStability: res.securityStability, globalStability: res.globalStability, coins: res.currentCoins } : prev)
    } catch {
      setPageError('Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  handleTimeoutRef.current = () => { void handleTimeout() }

  const timerUrgent  = timeRemaining > 0 && timeRemaining <= 10
  const timerWarning = timeRemaining > 10 && timeRemaining <= 30
  let timerColor = 'text-white'
  if (timerUrgent) timerColor = 'text-red-400'
  else if (timerWarning) timerColor = 'text-amber-400'

  const sec  = gameState?.securityStability ?? 100
  const glob = gameState?.globalStability   ?? 100
  const secBarColor  = sec  > 60 ? 'bg-emerald-500' : sec  > 30 ? 'bg-amber-500' : 'bg-red-500'
  const globBarColor = glob > 60 ? 'bg-emerald-500' : glob > 30 ? 'bg-amber-500' : 'bg-red-500'

  const hintsRevealed = Object.keys(revealedHints).length
  const totalHints    = puzzle?.hints.length ?? 0

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* ── Mission result popup ─────────────────────────────────────── */}
      {result && puzzle && (
        <MissionResultPopup
          result={result}
          puzzleTitle={puzzle.title}
          timeLimit={puzzle.timeLimit}
          onReturn={() => navigate('/')}
        />
      )}

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="px-3 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 border-b border-white/10">
        <div className="flex items-center gap-3 md:gap-5">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-mono transition-colors">
            <span>←</span> <span className="hidden xs:inline">BACK</span>
          </button>
          <div className="flex items-center gap-1.5 text-purple-400 text-xs font-mono">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="1" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2"/>
            </svg>
            LOCKDOWN
          </div>
          <button
            onClick={() => setShowManual((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-mono transition-colors px-2 py-0.5 border
              ${showManual ? 'border-purple-500/60 text-purple-400' : 'border-transparent text-white/50 hover:text-white'}`}
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            MANUAL
          </button>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div>
            <p className="text-white/40 text-xs font-mono">TRIES</p>
            <p className="text-white font-bold font-mono text-sm">{triesLeft}/{MAX_TRIES}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs font-mono">TIME</p>
            <p className={`font-bold font-mono text-sm ${timerColor} ${timerUrgent ? 'animate-pulse' : ''}`}>
              {puzzle ? formatTime(timeRemaining) : '--:--'}
            </p>
          </div>
          <div>
            <p className="text-white/40 text-xs font-mono">COINS</p>
            <p className="text-amber-400 font-bold font-mono text-sm">{gameState?.coins ?? '—'}</p>
          </div>
        </div>
      </header>

      {/* ── Stability bars ──────────────────────────────────────────── */}
      <div className="px-3 md:px-6 py-2 border-b border-white/10 shrink-0">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-1">
          <StabilityBar label="SECURITY" value={sec}  color={secBarColor}  />
          <StabilityBar label="GLOBAL"   value={glob} color={globBarColor} />
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {pageError && (
        <div className="px-3 md:px-6 py-2 bg-red-500/10 border-b border-red-500/20 shrink-0">
          <p className="text-red-400 text-xs font-mono max-w-2xl mx-auto">{pageError}</p>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-3 md:px-6 py-4 md:py-5">
        <div className="w-full max-w-2xl flex flex-col gap-3 md:gap-4">

          {showManual && <ManualPanel />}

          {/* Instruction banner */}
          <div className="border border-purple-500/50 px-3 md:px-4 py-2.5 flex items-center gap-2 shrink-0">
            <span className="text-purple-400 shrink-0">⚠</span>
            <p className="text-purple-400 text-xs font-bold italic tracking-wide">
              Analyze the security logs to find the override password.
            </p>
          </div>

          {/* Two panels — stacked on mobile, side by side on sm+ */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">

            {/* Left — Security Log */}
            <div className="flex-1 min-w-0">
              <ClassifiedDocument
                puzzle={puzzle}
                loading={loading}
                revealedHints={revealedHints}
                currentCoins={gameState?.coins ?? 0}
                hintError={hintError}
                onRevealHint={handleRevealHint}
              />
            </div>

            {/* Right — Terminal */}
            <div className="w-full sm:w-60 md:w-64 shrink-0">
              <PasswordInput
                value={answer}
                onChange={setAnswer}
                onSubmit={handleSubmit}
                submitting={submitting}
                disabled={!puzzle || loading || triesLeft === 0}
                result={result}
                wrongFeedback={wrongFeedback}
                triesLeft={triesLeft}
                maxTries={MAX_TRIES}
                totalHints={totalHints}
                hintsRevealed={hintsRevealed}
                onPlayAgain={loadPuzzle}
              />
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
