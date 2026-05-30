import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GameStateDTO, PuzzlePublicDTO, SubmitResponseDTO } from '../types/passwordPuzzle.types'
import * as service from '../services/passwordPuzzle.service'
import ClassifiedDocument from '../components/ClassifiedDocument'
import PasswordInput from '../components/PasswordInput'
import ManualPanel from '../components/ManualPanel'
import MissionResultPopup from '../../../components/MissionResultPopup'
import GameNavbar, { GameNavbarStat } from '../../../components/GameNavbar'
import StabilityBar from '../../../components/StabilityBar'

const MAX_TRIES = 4
const SESSION_KEY = 'sl_active_session'

interface ActiveSession {
  puzzleId: string
  startTimestamp: number
  hintsUsed: number
  coinsSpentHints: number
  revealedHints: Record<string, string>
  triesLeft: number
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function difficultyColor(difficulty: string | undefined): string {
  if (difficulty === 'EASY')   return 'text-green-400'
  if (difficulty === 'MEDIUM') return 'text-amber-400'
  if (difficulty === 'HARD')   return 'text-red-400'
  return 'text-white'
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
  const [moduleStabilities, setModuleStabilities] = useState<{ moduleId: string; stability: number }[]>([])

  const startTimeRef        = useRef<number>(Date.now())
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null)
  const handleTimeoutRef    = useRef<() => void>(() => {})
  const timedOutOnRestoreRef = useRef(false)

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

  // On mount: try to restore an existing session before fetching a new puzzle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadPuzzle(false); return () => clearTimer() }, [])

  // Persist session state to localStorage whenever it changes mid-game
  useEffect(() => {
    if (!puzzle || result) return
    const session: ActiveSession = {
      puzzleId:       puzzle.id,
      startTimestamp: startTimeRef.current,
      hintsUsed,
      coinsSpentHints,
      revealedHints,
      triesLeft,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [puzzle, hintsUsed, coinsSpentHints, revealedHints, triesLeft, result])

  // Clear session and timer once the game has a result
  useEffect(() => {
    if (result) {
      clearTimer()
      localStorage.removeItem(SESSION_KEY)
    }
  }, [result])

  // If the puzzle timed out while the page was closed/refreshed, fire timeout after puzzle state is set
  useEffect(() => {
    if (puzzle && timedOutOnRestoreRef.current) {
      timedOutOnRestoreRef.current = false
      void handleTimeout()
    }
  // handleTimeout is stable within a render; puzzle identity triggers this
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle])

  async function loadPuzzle(forceNew: boolean) {
    clearTimer()

    if (!forceNew) {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) {
        try {
          const session = JSON.parse(raw) as ActiveSession
          await restoreSession(session)
          return
        } catch {
          localStorage.removeItem(SESSION_KEY)
        }
      }
    }

    localStorage.removeItem(SESSION_KEY)
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
      const [stateData, stabilityData] = await Promise.all([
        service.fetchGameState(),
        service.fetchModuleStability(),
      ])
      setGameState(stateData)
      setModuleStabilities(stabilityData.modules)
      const puzzleData = await service.fetchRandomPuzzle()
      setPuzzle(puzzleData)
      startTimer(puzzleData.timeLimit)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        setPageError('No puzzles in database. Run: npm run seed')
      } else {
        setPageError('Backend unreachable. Make sure the server is running on port 3000.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function restoreSession(session: ActiveSession) {
    setLoading(true)
    setPageError(null)
    setResult(null)
    setAnswer('')
    setHintError(null)
    setWrongFeedback(null)
    try {
      const [stateData, puzzleData, stabilityData] = await Promise.all([
        service.fetchGameState(),
        service.fetchPuzzleById(session.puzzleId),
        service.fetchModuleStability(),
      ])
      setGameState(stateData)
      setModuleStabilities(stabilityData.modules)
      setHintsUsed(session.hintsUsed)
      setCoinsSpentHints(session.coinsSpentHints)
      setRevealedHints(session.revealedHints)
      setTriesLeft(session.triesLeft)
      startTimeRef.current = session.startTimestamp

      const elapsed    = Math.floor((Date.now() - session.startTimestamp) / 1000)
      const remaining  = Math.max(0, puzzleData.timeLimit - elapsed)
      setPuzzle(puzzleData)

      if (remaining === 0) {
        // Session expired while away — start fresh rather than immediately failing
        localStorage.removeItem(SESSION_KEY)
        await loadPuzzle(true)
      } else {
        startTimer(remaining)
      }
    } catch {
      // Puzzle no longer exists or backend unavailable — start fresh
      localStorage.removeItem(SESSION_KEY)
      await loadPuzzle(true)
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
      setGameState((prev) => prev ? { ...prev, coins: res.currentCoins } : prev)
      try {
        const updated = await service.applyModuleStabilityDelta('securityLockdown', res.stabilityChange)
        setModuleStabilities(prev => prev.map(m => (m.moduleId === 'securityLockdown' ? updated : m)))
      } catch { /* non-critical */ }
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
      setGameState((prev) => prev ? { ...prev, coins: res.currentCoins } : prev)
      try {
        const updated = await service.applyModuleStabilityDelta('securityLockdown', res.stabilityChange)
        setModuleStabilities(prev => prev.map(m => (m.moduleId === 'securityLockdown' ? updated : m)))
      } catch { /* non-critical */ }
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

  const sec  = moduleStabilities.find(m => m.moduleId === 'securityLockdown')?.stability ?? 100
  const glob = moduleStabilities.length > 0
    ? Math.round(moduleStabilities.reduce((s, m) => s + m.stability, 0) / moduleStabilities.length)
    : 100
  const secBarColor  = sec  > 60 ? 'bg-emerald-500' : sec  > 30 ? 'bg-amber-500' : 'bg-red-500'
  const globBarColor = glob > 60 ? 'bg-emerald-500' : glob > 30 ? 'bg-amber-500' : 'bg-red-500'

  const hintsRevealed = Object.keys(revealedHints).length
  const totalHints    = puzzle?.hints.length ?? 0
  const nextHint      = puzzle?.hints.find(h => !revealedHints[h.id]) ?? null

  const lockIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="1" strokeWidth="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2"/>
    </svg>
  )

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* ── Mission result popup ─────────────────────────────────────── */}
      {result && puzzle && (
        <MissionResultPopup
          success={result.correct}
          title={puzzle.title}
          stabilityChange={result.stabilityChange}
          coinsChange={result.coinsChange}
          timeTaken={result.timeTaken}
          timeLimit={puzzle.timeLimit}
          accentColor="purple"
          onReturn={() => navigate('/', {
            state: result.correct
              ? { stabilityGained: result.stabilityChange, coinsGained: result.coinsChange, feature: 'securityLockdown' }
              : { stabilityLost: Math.abs(result.stabilityChange), feature: 'securityLockdown' },
          })}
        />
      )}

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <GameNavbar
        title="LOCKDOWN"
        accentColor="purple"
        icon={lockIcon}
        manualActive={showManual}
        onManualToggle={() => setShowManual((v) => !v)}
        hint={nextHint && !result ? {
          cost: nextHint.coinCost,
          onClick: () => { void handleRevealHint(nextHint.id, nextHint.coinCost) },
          disabled: (gameState?.coins ?? 0) < nextHint.coinCost,
        } : undefined}
      >
        <GameNavbarStat label="TRIES" value={`${triesLeft}/${MAX_TRIES}`} />
        <GameNavbarStat
          label="TIME"
          value={puzzle ? formatTime(timeRemaining) : '--:--'}
          valueClass={`${timerColor}${timerUrgent ? ' animate-pulse' : ''}`}
        />
        <GameNavbarStat label="COINS" value={gameState?.coins ?? '—'} valueClass="text-amber-400" />
        <GameNavbarStat
          label="LEVEL"
          value={puzzle?.difficulty ?? '—'}
          valueClass={difficultyColor(puzzle?.difficulty)}
        />
      </GameNavbar>

      {/* ── Stability bars ──────────────────────────────────────────── */}
      <div className="px-3 md:px-6 py-2 border-b border-white/10 shrink-0">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-1">
          <StabilityBar label="SECURITY" value={sec}  color={secBarColor}  />
          <StabilityBar label="GLOBAL"   value={glob} color={globBarColor} />
        </div>
      </div>

      {/* ── Errors ──────────────────────────────────────────────────── */}
      {pageError && (
        <div className="px-3 md:px-6 py-2 bg-red-500/10 border-b border-red-500/20 shrink-0">
          <p className="text-red-400 text-xs font-mono max-w-2xl mx-auto">{pageError}</p>
        </div>
      )}
      {hintError && (
        <div className="px-3 md:px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
          <p className="text-amber-400 text-xs font-mono max-w-2xl mx-auto">{hintError}</p>
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
                onPlayAgain={() => { void loadPuzzle(true) }}
              />
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
