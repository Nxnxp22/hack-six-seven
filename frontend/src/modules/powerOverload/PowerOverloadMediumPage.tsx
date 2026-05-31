import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GameState } from './types'
import { fetchNewGame, cutWire, fetchManualRules, fetchHint } from './services/gameApi'
import type { DBManualRule } from './services/gameApi'
import { fetchCoins, fetchStability } from './services/stabilityApi'
import type { ModuleStabilityItem } from './services/stabilityApi'
import GameNavbar, { GameNavbarStat } from '../../components/GameNavbar'
import MissionResultPopup from '../../components/MissionResultPopup'
import StabilityBar from '../../components/StabilityBar'

type GameResult = { success: boolean; stabilityChange: number; coinsChange: number; timeTaken: number }

const MAX_HINTS = 2

function barColor(v: number) {
  if (v > 60) return 'bg-emerald-500'
  if (v > 30) return 'bg-amber-500'
  return 'bg-red-500'
}

const lightningIcon = (
  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const PowerOverloadMediumPage: React.FC = () => {
  const navigate = useNavigate()
  const [game, setGame]             = useState<GameState | null>(null)
  const [seconds, setSeconds]       = useState<number>(0)
  const [coins, setCoins]           = useState<number>(0)
  const [hintCount, setHintCount]   = useState<number>(0)
  const [activeHint, setActiveHint] = useState<string | null>(null)
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false)
  const [rules, setRules]           = useState<DBManualRule[]>([])
  const [result, setResult]         = useState<GameResult | null>(null)
  const [modules, setModules]       = useState<ModuleStabilityItem[]>([])

  useEffect(() => {
    const savedSessionId  = sessionStorage.getItem('active_game_session_id')
    const savedDifficulty = sessionStorage.getItem('active_game_difficulty')
    const restoreId = savedDifficulty === 'MEDIUM' ? (savedSessionId || undefined) : undefined

    fetchNewGame('MEDIUM', restoreId)
      .then((data) => {
        setGame(data)
        sessionStorage.setItem('active_game_session_id', data.sessionId)
        sessionStorage.setItem('active_game_difficulty', 'MEDIUM')

        const isRestored = restoreId !== undefined && data.sessionId === restoreId
        if (isRestored) {
          const startTime = Number.parseInt(sessionStorage.getItem('active_game_start_time') ?? '0')
          const elapsed   = startTime > 0 ? Math.floor((Date.now() - startTime) / 1000) : 0
          const remaining = data.timeLimitSeconds - elapsed
          if (remaining <= 0) {
            sessionStorage.setItem('active_game_start_time', Date.now().toString())
            setSeconds(data.timeLimitSeconds)
          } else {
            setSeconds(remaining)
          }
        } else {
          sessionStorage.setItem('active_game_start_time', Date.now().toString())
          setSeconds(data.timeLimitSeconds)
        }
      })
      .catch((err) => console.error('Error connecting to Medium game:', err))

    fetchManualRules('MEDIUM').then(setRules).catch(console.error)
    fetchCoins().then(({ balance }) => setCoins(balance)).catch(console.error)
    fetchStability().then(({ modules }) => setModules(modules)).catch(console.error)
  }, [])

  useEffect(() => {
    if (seconds <= 0) return
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [seconds])

  useEffect(() => {
    if (game && seconds === 0 && !result) {
      sessionStorage.removeItem('active_game_session_id')
      sessionStorage.removeItem('active_game_difficulty')
      sessionStorage.removeItem('active_game_start_time')
      setResult({ success: false, stabilityChange: -10, coinsChange: 0, timeTaken: game.timeLimitSeconds })
    }
  }, [seconds, game, result])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const renderRuleText = (text: string) =>
    text.split(' ').map((word, idx) => {
      const w = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').toUpperCase()
      if (w === 'RED' || w === 'CRIMSON') return <span key={idx} className="text-rose-500 font-semibold mx-0.5">{word}</span>
      if (w === 'BLUE') return <span key={idx} className="text-blue-500 font-semibold mx-0.5">{word}</span>
      if (w === 'GREEN' || w === 'EMERALD') return <span key={idx} className="text-emerald-500 font-semibold mx-0.5">{word}</span>
      if (w === 'YELLOW' || w === 'AMBER') return <span key={idx} className="text-amber-400 font-semibold mx-0.5">{word}</span>
      if (w === 'CYAN' || w === 'NEON-CYAN') return <span key={idx} className="text-cyan-400 font-semibold mx-0.5">{word}</span>
      if (w === 'ORANGE') return <span key={idx} className="text-orange-500 font-semibold mx-0.5">{word}</span>
      if (w === 'PURPLE' || w === 'AMETHYST') return <span key={idx} className="text-purple-500 font-semibold mx-0.5">{word}</span>
      return <span key={idx} className="mx-0.5">{word}</span>
    })

  const renderInstruction = (instruction: string) => {
    const colors = new Set(['GREEN', 'YELLOW', 'CYAN', 'RED', 'BLUE', 'ORANGE', 'PURPLE', 'EMERALD', 'AMBER', 'NEON-CYAN', 'CRIMSON', 'AMETHYST'])
    return instruction.split(' ').map((word, i) => {
      const w = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').toUpperCase()
      if (colors.has(w) || w.startsWith('#') || word.includes('-'))
        return <span key={i} className="text-yellow-500 font-black mx-1.5 uppercase text-glow-yellow">{word}</span>
      return <span key={i} className="mx-0.5">{word}</span>
    })
  }

  const handleWireCut = async (wireId: string) => {
    if (!game) return
    try {
      const response = await cutWire(game.sessionId, wireId)
      if (response.success) {
        const updatedWires = game.wires.map(w => w.id === wireId ? { ...w, isCut: true } : w)
        setGame({ ...game, currentCuts: response.currentCuts, wires: updatedWires })
        if (response.isGameOver) {
          sessionStorage.removeItem('active_game_session_id')
          sessionStorage.removeItem('active_game_difficulty')
          sessionStorage.removeItem('active_game_start_time')
          const timeTaken   = game.timeLimitSeconds - seconds
          const coinsChange = 10 + Math.floor((seconds / game.timeLimitSeconds) * 30)
          setResult({ success: true, stabilityChange: 15, coinsChange, timeTaken })
        }
      } else {
        sessionStorage.removeItem('active_game_session_id')
        sessionStorage.removeItem('active_game_difficulty')
        sessionStorage.removeItem('active_game_start_time')
        setResult({ success: false, stabilityChange: -10, coinsChange: 0, timeTaken: game.timeLimitSeconds - seconds })
      }
    } catch (err: any) {
      // Session lost (backend restarted) — clear stale session and reload fresh game
      if (err?.response?.status === 404) {
        sessionStorage.removeItem('active_game_session_id')
        sessionStorage.removeItem('active_game_difficulty')
        sessionStorage.removeItem('active_game_start_time')
        void initGame()
      } else {
        console.error('Error cutting wire:', err)
      }
    }
  }

  const handleBuyHint = async () => {
    if (!game || hintCount >= MAX_HINTS) return
    const nextHintOrder = hintCount + 1
    const cost = nextHintOrder === 1 ? 15 : 20
    if (coins < cost) return
    try {
      const response = await fetchHint(game.sessionId, nextHintOrder)
      if (response.success) {
        setHintCount(nextHintOrder)
        setCoins(response.balance)
        setActiveHint(response.hintText)
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; balance?: number } } })?.response?.data
      if (data?.message === 'HINT_LIMIT_REACHED') setHintCount(MAX_HINTS)
      else if (data?.message === 'INSUFFICIENT_COINS' && data.balance !== undefined) setCoins(data.balance)
      else console.error('Error purchasing hint:', err)
    }
  }

  const nextHintCost = hintCount === 0 ? 15 : 20
  const powerStab    = modules.find(m => m.moduleId === 'powerOverload')?.stability ?? 100
  const globalStab   = modules.length > 0 ? Math.round(modules.reduce((s, m) => s + m.stability, 0) / modules.length) : 100

  if (!game)
    return <div className="bg-black min-h-screen text-zinc-500 font-mono flex items-center justify-center">LOADING MEDIUM DATA MODULES...</div>

  return (
    <div className="min-h-screen bg-black text-white font-mono relative select-none">
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />

      {result && (
        <MissionResultPopup
          success={result.success}
          title="POWER OVERLOAD [MEDIUM]"
          stabilityChange={result.stabilityChange}
          coinsChange={result.coinsChange}
          timeTaken={result.timeTaken}
          timeLimit={game.timeLimitSeconds}
          accentColor="yellow"
          successMessage="Power grid stabilized. Crisis averted. Well done, Technician."
          failMessage="Power grid failure. System integrity compromised."
          onReturn={() => navigate('/', {
            state: result.success
              ? { stabilityGained: result.stabilityChange, coinsGained: result.coinsChange, feature: 'powerOverload' }
              : { stabilityLost: Math.abs(result.stabilityChange), feature: 'powerOverload' },
          })}
        />
      )}

      <GameNavbar
        title="OVERLOAD"
        accentColor="yellow"
        icon={lightningIcon}
        onBack={() => navigate('/')}
        manualActive={isManualOpen}
        onManualToggle={() => setIsManualOpen((v) => !v)}
        hint={hintCount < MAX_HINTS ? {
          cost: nextHintCost,
          onClick: handleBuyHint,
          disabled: coins < nextHintCost,
        } : undefined}
      >
        <GameNavbarStat label="COINS" value={coins} valueClass="text-yellow-400" />
        <GameNavbarStat label="CUT" value={`${game.currentCuts}/${game.totalCutsNeeded}`} />
        <GameNavbarStat label="TIME" value={formatTime(seconds)} valueClass="text-yellow-400" />
      </GameNavbar>

      <div className="px-3 md:px-6 py-2 border-b border-white/10 shrink-0">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-1">
          <StabilityBar label="POWER"  value={powerStab}  color={barColor(powerStab)}  />
          <StabilityBar label="GLOBAL" value={globalStab} color={barColor(globalStab)} />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col relative z-10">

        {isManualOpen && (
          <div className="border border-yellow-500 bg-zinc-950/90 rounded-lg p-6 mb-8 max-w-2xl w-full mx-auto font-mono text-[11px] text-zinc-500 border-glow-yellow animate-fadeIn leading-relaxed">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4">
              <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
              <h3 className="text-yellow-500 font-bold text-xs tracking-wider uppercase">NEXUS HACKING MANUAL : POWER OVERLOAD [MEDIUM]</h3>
            </div>
            <p className="text-zinc-400 mb-4 text-xs"><span className="font-bold text-zinc-200">OBJECTIVE:</span> Reroute power safety by cutting the correct wires.</p>
            <div>
              <p className="text-yellow-500 font-bold mb-1.5 uppercase tracking-wide">⚡ MEDIUM RESOLUTION PROTOCOL (5 wires — cut 2)</p>
              <ul className="space-y-1.5 pl-4 list-disc">
                {rules.map((rule) => {
                  const isSpecialTip = rule.rule_number === 3
                  return (
                    <li key={rule.id} className={isSpecialTip ? 'list-none text-yellow-500 font-semibold mt-1' : ''}>
                      {isSpecialTip ? `*${rule.description}` : <>{`Wire ${rule.rule_number}: `}{renderRuleText(rule.description)}</>}
                    </li>
                  )
                })}
                <li className="list-none text-zinc-500 font-mono text-[9px] mt-2 uppercase leading-normal tracking-wide border-t border-zinc-900 pt-2">
                  ⚠️ Hex Signatures: GREEN (<span className="text-emerald-500">#00C838</span>), YELLOW (<span className="text-amber-400">#FFBC00</span>), CYAN (<span className="text-cyan-400">#00B4DB</span>), RED (<span className="text-rose-500">#E11D48</span>), PURPLE (<span className="text-purple-500">#9333EA</span>)
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeHint && (
          <div className="border border-yellow-500/50 bg-yellow-950/20 rounded-lg p-5 mb-8 flex items-center gap-4 max-w-2xl w-full mx-auto border-glow-yellow animate-fadeIn">
            <div className="w-6 h-6 rounded border border-yellow-500 flex items-center justify-center text-yellow-500 font-black text-sm shrink-0 animate-pulse">H</div>
            <span className="text-yellow-500 font-bold text-sm tracking-widest uppercase font-mono text-glow-yellow">{activeHint}</span>
          </div>
        )}

        <div className="border border-yellow-500 bg-yellow-500/5 rounded-lg p-5 mb-12 flex items-center gap-4 max-w-2xl w-full mx-auto border-glow-yellow">
          <div className="w-6 h-6 rounded border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-black text-sm shrink-0 animate-pulse">!</div>
          <div className="w-full text-center pr-6">
            <span className="text-yellow-500 font-bold text-sm tracking-widest uppercase font-mono text-glow-yellow flex items-center justify-center flex-wrap">
              {renderInstruction(game.instruction)}
            </span>
          </div>
        </div>

        <div className="border border-zinc-900 bg-zinc-950/40 rounded-xl p-8 max-w-lg w-full mx-auto shadow-2xl">
          <header className="text-center mb-8">
            <h2 className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.25em] mb-1">Power Junction Box</h2>
            <p className="text-zinc-600 text-[10px]">Click on wires to cut them</p>
          </header>
          <div className="flex flex-col gap-3.5">
            {game.wires.map((wire) => (
              <button
                key={wire.id}
                disabled={wire.isCut}
                onClick={() => handleWireCut(wire.id)}
                className={`w-full py-4 px-6 rounded font-black text-xs text-left uppercase tracking-[0.15em] transition-all transform
                  ${wire.isCut
                    ? 'bg-zinc-900/40 text-zinc-600 border border-zinc-900 line-through opacity-45 cursor-not-allowed pointer-events-none'
                    : `cursor-pointer hover:brightness-110 active:scale-[0.98] shadow-lg
                       ${wire.color === 'GREEN'  ? 'bg-[#00c838] text-white hover:bg-[#00b430]' : ''}
                       ${wire.color === 'YELLOW' ? 'bg-[#ffbc00] text-white hover:bg-[#eab000]' : ''}
                       ${wire.color === 'CYAN'   ? 'bg-[#00b4db] text-white hover:bg-[#00a3c6]' : ''}
                       ${wire.color === 'RED'    ? 'bg-[#e11d48] text-white hover:bg-[#f43f5e]' : ''}
                       ${wire.color === 'BLUE'   ? 'bg-[#2563eb] text-white hover:bg-[#3b82f6]' : ''}
                       ${wire.color === 'ORANGE' ? 'bg-[#f97316] text-white hover:bg-[#fb923c]' : ''}
                       ${wire.color === 'PURPLE' ? 'bg-[#9333ea] text-white hover:bg-[#a855f7]' : ''}`
                  }`}
              >
                {wire.isCut ? `⚡ [SEVERED] ${wire.label}` : wire.label}
              </button>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-900/60 text-center">
            <span className="text-[9px] text-zinc-600 font-mono tracking-widest">CONSOLE PKY: {game.serialNumber}</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PowerOverloadMediumPage
