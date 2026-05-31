import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { wordToMorse, morseToSymbols } from '../lib/morse'
import MorseVisual from '../components/MorseVisual'
import MorseReference from '../components/MorseReference'
import GameNavbar, { GameNavbarStat } from '../../../components/GameNavbar'
import StabilityBar from '../../../components/StabilityBar'
import MissionResultPopup from '../../../components/MissionResultPopup'
import { api } from '../../../api'

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_SECONDS: Record<Difficulty, number> = {
  easy: 90,
  medium: 60,
  hard: 30,
}

const MAX_ATTEMPTS = 3
const SESSION_KEY = 'comm-failure-session'

interface Session {
  word: string
  difficulty: Difficulty
  startTimestamp: number
  attemptsLeft: number
  hintLevel: number
}

function difficultyColor(d: Difficulty) {
  if (d === 'easy')   return 'text-green-400'
  if (d === 'medium') return 'text-amber-400'
  return 'text-red-400'
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function GamePage() {
  const navigate = useNavigate()

  const [currentWord,   setCurrentWord]   = useState('')
  const [difficulty,    setDifficulty]    = useState<Difficulty>('easy')
  const [phase,         setPhase]         = useState<'loading' | 'playing' | 'done'>('loading')
  const [answer,        setAnswer]        = useState('')
  const [feedback,      setFeedback]      = useState<'correct' | 'wrong' | null>(null)
  const [attemptsLeft,  setAttemptsLeft]  = useState(MAX_ATTEMPTS)
  const [showRef,       setShowRef]       = useState(false)
  const [showManual,    setShowManual]    = useState(false)
  const [hintLevel,     setHintLevel]     = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [coins,         setCoins]         = useState<number>(0)
  const [moduleStabilities, setModuleStabilities] = useState<{ moduleId: string; stability: number }[]>([])
  const [result,        setResult]        = useState<{ correct: boolean; stabilityChange: number; coinsChange: number } | null>(null)

  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef(Date.now())

  // ── Timer ────────────────────────────────────────────────────────────────
  function clearTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function startTimer(seconds: number) {
    clearTimer()
    setTimeRemaining(seconds)
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { clearTimer(); handleTimeout(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // ── Fetch stability + coins ───────────────────────────────────────────────
  async function fetchStabilityAndCoins() {
    try {
      const [{ data: stabData }, { data: coinData }] = await Promise.all([
        api.get('/stability'),
        api.get('/stability/coins'),
      ])
      setModuleStabilities(stabData.modules)
      setCoins(coinData.balance)
    } catch { /* non-critical */ }
  }

  async function applyStabilityDelta(delta: number) {
    try {
      const { data } = await api.post('/stability/apply', { moduleId: 'commCollapse', delta })
      setModuleStabilities(prev => prev.map(m => m.moduleId === 'commCollapse' ? data : m))
    } catch { /* non-critical */ }
  }

  async function applyCoins(delta: number) {
    try {
      const { data } = await api.post('/stability/coins/apply', { delta })
      setCoins(data.balance)
    } catch { /* non-critical */ }
  }

  // ── Load puzzle ───────────────────────────────────────────────────────────
  async function loadPuzzle(forceNew = false) {
    clearTimer()

    if (!forceNew) {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        try {
          const session = JSON.parse(raw) as Session
          const elapsed   = Math.floor((Date.now() - session.startTimestamp) / 1000)
          const remaining = Math.max(0, DIFFICULTY_SECONDS[session.difficulty] - elapsed)
          if (remaining > 0) {
            setCurrentWord(session.word)
            setDifficulty(session.difficulty)
            setAttemptsLeft(session.attemptsLeft)
            setHintLevel(session.hintLevel)
            startTimeRef.current = session.startTimestamp
            startTimer(remaining)
            await fetchStabilityAndCoins()
            setPhase('playing')
            return
          }
        } catch { /* ignore */ }
        sessionStorage.removeItem(SESSION_KEY)
      }
    }

    sessionStorage.removeItem(SESSION_KEY)
    setAnswer('')
    setFeedback(null)
    setHintLevel(0)
    setAttemptsLeft(MAX_ATTEMPTS)
    setResult(null)
    setPhase('loading')

    try {
      const [{ data }, ] = await Promise.all([
        api.get('/challenges?count=1'),
        fetchStabilityAndCoins(),
      ])
      const challenge = data.challenges?.[0]
      const word = challenge?.word ?? 'SOS'
      const diff = (challenge?.difficulty ?? 'easy') as Difficulty
      startTimeRef.current = Date.now()
      setCurrentWord(word)
      setDifficulty(diff)
      startTimer(DIFFICULTY_SECONDS[diff])
      setPhase('playing')
    } catch {
      setCurrentWord('SOS')
      setDifficulty('easy')
      startTimer(90)
      setPhase('playing')
    }
  }

  useEffect(() => { void loadPuzzle(); return () => clearTimer() }, [])

  // Persist session
  useEffect(() => {
    if (phase !== 'playing' || result) return
    const session: Session = {
      word: currentWord,
      difficulty,
      startTimestamp: startTimeRef.current,
      attemptsLeft,
      hintLevel,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [currentWord, difficulty, attemptsLeft, hintLevel, phase, result])

  // Focus input when playing
  useEffect(() => {
    if (phase === 'playing') inputRef.current?.focus()
  }, [phase])

  // ── Timeout ───────────────────────────────────────────────────────────────
  async function handleTimeout() {
    const stabilityChange = -15
    const coinsChange = 0
    await applyStabilityDelta(stabilityChange)
    setResult({ correct: false, stabilityChange, coinsChange })
    setPhase('done')
    sessionStorage.removeItem(SESSION_KEY)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!answer.trim() || feedback === 'correct') return

    const isCorrect = answer.trim().toUpperCase() === currentWord.toUpperCase()

    if (isCorrect) {
      clearTimer()
      setFeedback('correct')
      const stabilityChange = difficulty === 'hard' ? 20 : difficulty === 'medium' ? 15 : 10
      const coinsChange     = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 20 : 10
      await Promise.all([
        applyStabilityDelta(stabilityChange),
        applyCoins(coinsChange),
      ])
      setResult({ correct: true, stabilityChange, coinsChange })
      setPhase('done')
      sessionStorage.removeItem(SESSION_KEY)
    } else {
      const remaining = attemptsLeft - 1
      setAttemptsLeft(remaining)
      setFeedback('wrong')
      setAnswer('')
      if (remaining === 0) {
        clearTimer()
        const stabilityChange = -15
        await applyStabilityDelta(stabilityChange)
        setResult({ correct: false, stabilityChange, coinsChange: 0 })
        setPhase('done')
        sessionStorage.removeItem(SESSION_KEY)
      }
    }
  }

  // ── Hint ──────────────────────────────────────────────────────────────────
  const HINT_COSTS = [10, 5] // hint 1 costs 10, hint 2 costs 5

  const nextHintCost = hintLevel < 2 ? HINT_COSTS[hintLevel] : 0

  const useHint = async () => {
    if (hintLevel >= 2) return
    const cost = HINT_COSTS[hintLevel]
    if (coins < cost) return
    if ((hintLevel === 0 && currentWord.length >= 1) || (hintLevel === 1 && currentWord.length >= 2)) {
      await applyCoins(-cost)
      setHintLevel(prev => prev + 1)
    }
  }

  // Hint 1 reveals first letter, hint 2 reveals second letter only (not cumulative slice)
  const revealedHint = hintLevel === 0
    ? ''
    : currentWord[0] + (hintLevel >= 2 ? currentWord[1] : '') + '_'.repeat(Math.max(currentWord.length - hintLevel, 0))

  // ── Stability values ──────────────────────────────────────────────────────
  const commStability = moduleStabilities.find(m => m.moduleId === 'commCollapse')?.stability ?? 100
  const globStability = moduleStabilities.length > 0
    ? Math.round(moduleStabilities.reduce((s, m) => s + m.stability, 0) / moduleStabilities.length)
    : 100
  const commBarColor = commStability > 60 ? 'bg-emerald-500' : commStability > 30 ? 'bg-amber-500' : 'bg-red-500'
  const globBarColor = globStability > 60 ? 'bg-emerald-500' : globStability > 30 ? 'bg-amber-500' : 'bg-red-500'

  const timerUrgent  = timeRemaining > 0 && timeRemaining <= 10
  const timerWarning = timeRemaining > 10 && timeRemaining <= 20
  const timerColor   = timerUrgent ? 'text-red-400' : timerWarning ? 'text-amber-400' : 'text-cyan-400'

  const morse = wordToMorse(currentWord)

  const signalIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"/>
    </svg>
  )

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <p className="text-cyan-800 text-xs tracking-[0.4em] animate-pulse">INCOMING SIGNAL...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* ── Mission result popup ─────────────────────────────────────── */}
      {result && (
        <MissionResultPopup
          success={result.correct}
          title="COMM COLLAPSE"
          stabilityChange={result.stabilityChange}
          coinsChange={result.coinsChange}
          timeTaken={Math.floor((Date.now() - startTimeRef.current) / 1000)}
          timeLimit={DIFFICULTY_SECONDS[difficulty]}
          accentColor="cyan"
          onReturn={() => navigate('/', {
            state: result.correct
              ? { stabilityGained: result.stabilityChange, coinsGained: result.coinsChange, feature: 'commCollapse' }
              : { stabilityLost: Math.abs(result.stabilityChange), feature: 'commCollapse' },
          })}
        />
      )}

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <GameNavbar
        title="COMM COLLAPSE"
        accentColor="cyan"
        icon={signalIcon}
        manualActive={showManual}
        onManualToggle={() => setShowManual(v => !v)}
        hint={hintLevel < 2 ? {
          cost: nextHintCost,
          onClick: () => { void useHint() },
          disabled: hintLevel >= 2 || coins < nextHintCost,
        } : undefined}
      >
        <GameNavbarStat label="ATTEMPTS" value={`${attemptsLeft}/${MAX_ATTEMPTS}`} />
        <GameNavbarStat
          label="TIME"
          value={formatTime(timeRemaining)}
          valueClass={`${timerColor}${timerUrgent ? ' animate-pulse' : ''}`}
        />
        <GameNavbarStat label="COINS" value={coins} valueClass="text-amber-400" />
        <GameNavbarStat
          label="LEVEL"
          value={difficulty.toUpperCase()}
          valueClass={difficultyColor(difficulty)}
        />
      </GameNavbar>

      {/* ── Stability bars ───────────────────────────────────────────── */}
      <div className="px-3 md:px-6 py-2 border-b border-white/10 shrink-0">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-1">
          <StabilityBar label="COMM"   value={commStability} color={commBarColor} />
          <StabilityBar label="GLOBAL" value={globStability} color={globBarColor} />
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-3 md:px-6 py-4 md:py-5">
        <div className="w-full max-w-2xl flex flex-col gap-3 md:gap-4">

          {/* Manual */}
          {showManual && (
            <div className="border border-cyan-500/50 px-4 py-3 text-xs font-mono text-white/70 space-y-2">
              <p className="text-cyan-400 font-bold tracking-widest">NEXUS FIELD MANUAL</p>
              <p>Decode incoming Morse transmissions.</p>
              <p>Use the reference chart if needed.</p>
              <p>Enter the decoded word and submit.</p>
              <p>Time limits — <span className="text-green-400">Easy: 1:30</span> · <span className="text-amber-400">Medium: 1:00</span> · <span className="text-red-400">Hard: 0:30</span></p>
              <p>You have <span className="text-cyan-400">{MAX_ATTEMPTS} attempts</span> to decode the signal.</p>
            </div>
          )}

          {/* Alert banner */}
          <div className="border border-cyan-500/50 px-3 md:px-4 py-2.5 flex items-center gap-2 shrink-0">
            <span className="text-cyan-400 shrink-0">⚠</span>
            <p className="text-cyan-400 text-xs font-bold italic tracking-wide">
              Decode the morse signal below.
            </p>
          </div>

          {/* Morse card */}
          <div className="border border-white/20 bg-black/60 rounded-lg px-5 py-8 flex flex-col gap-6">
            <p className="text-white/40 text-xs tracking-[0.4em] font-mono">INCOMING SIGNAL</p>

            <div className="flex justify-center overflow-x-auto">
              <MorseVisual word={currentWord} />
            </div>

            <div>
              <p className="text-center text-white/40 text-xs tracking-[0.4em] font-mono mb-3">MORSE CODE</p>
              <p className="text-center text-base tracking-[0.5em] text-white/80 break-all font-mono">
                {morseToSymbols(morse)}
              </p>
            </div>

            {/* Hint */}
            {hintLevel > 0 && (
              <div className="flex justify-center border border-yellow-500/30 bg-yellow-500/5 px-4 py-2 text-yellow-300 tracking-[0.3em] text-sm font-mono">
                HINT: {revealedHint}
              </div>
            )}

            {/* Reference toggle */}
            <button
              onClick={() => setShowRef(v => !v)}
              className="mx-auto text-xs tracking-[0.25em] text-white/40 hover:text-cyan-400 transition font-mono"
            >
              {showRef ? '▲ HIDE REFERENCE' : 'SHOW REFERENCE'}
            </button>

            {showRef && (
              <div className="border border-white/10 bg-black/30 p-4 rounded">
                <MorseReference />
              </div>
            )}

            {/* Input */}
            <input
              ref={inputRef}
              value={answer}
              disabled={feedback === 'correct' || attemptsLeft === 0}
              maxLength={20}
              placeholder="ENTER DECODED MESSAGE"
              onChange={e => setAnswer(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && void handleSubmit()}
              className="w-full border-2 border-cyan-400 bg-[#041820] px-4 py-3 text-cyan-100 placeholder:text-cyan-800 tracking-[0.2em] outline-none transition focus:border-cyan-200 font-mono"
            />

            <button
              onClick={() => void handleSubmit()}
              disabled={!answer.trim() || feedback === 'correct' || attemptsLeft === 0}
              className="w-full border-2 border-cyan-300 bg-[#07212a] py-3 text-cyan-200 tracking-[0.3em] transition hover:bg-cyan-500/15 hover:border-cyan-200 active:scale-[0.995] disabled:opacity-40 font-mono text-sm"
            >
              SUBMIT DECODE
            </button>

            {/* Feedback */}
            {feedback === 'wrong' && attemptsLeft > 0 && (
              <div className="border border-red-500 bg-red-500/5 py-3 text-center text-red-500 tracking-[0.25em] text-xs font-mono">
                ✗ INCORRECT — {attemptsLeft === 1 ? 'LAST ATTEMPT' : `${attemptsLeft} ATTEMPTS REMAINING`}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
