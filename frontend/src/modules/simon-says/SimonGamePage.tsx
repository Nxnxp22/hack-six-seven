import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import SimonButton from './components/SimonButton';

export type Color = 'red' | 'blue' | 'green' | 'yellow';
export type Difficulty = 'easy' | 'medium';
export type GamePhase = 'idle' | 'memorize' | 'replicate' | 'success' | 'fail';

export interface ScoreRecord {
  id: number;
  playerName: string;
  difficulty: string;
  score: number;
  win: boolean;
  timeTakenMs: number;
  createdAt: string;
}

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

const CONFIGS = {
  easy: { sequenceLength: 3, flashDurationMs: 800, flashIntervalMs: 400, timerSeconds: 90 },
  medium: { sequenceLength: 5, flashDurationMs: 500, flashIntervalMs: 300, timerSeconds: 60 }
};

export default function SimonGamePage() {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerInputs, setPlayerInputs] = useState<Color[]>([]);
  const [flashingColor, setFlashingColor] = useState<Color | null>(null);
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [logs, setLogs] = useState<ScoreRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeConfig = CONFIGS[difficulty];

  // Fetch Mission Logs (Read)
  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const res = await axios.get('/api/simon-says/scores');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch mission logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Timer
  useEffect(() => {
    if (phase !== 'replicate') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase('fail');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  // Auto-Save Score in background (Create / POST)
  useEffect(() => {
    if (phase === 'success' || phase === 'fail') {
      const timeTakenMs = Date.now() - startTimeRef.current;
      const baseScore = difficulty === 'easy' ? 100 : 250;
      const timeBonus = Math.max(0, activeConfig.timerSeconds * 1000 - timeTakenMs);
      const score = phase === 'success' ? Math.round(baseScore + timeBonus / 100) : 0;

      const autoSave = async () => {
        try {
          await axios.post('/api/simon-says/scores', {
            playerName: 'OPERATOR-SYSTEM',
            difficulty,
            score,
            win: phase === 'success',
            timeTakenMs
          });
          fetchLogs(); // Reload logs list automatically
        } catch (err) {
          console.error('Failed to auto-save score:', err);
        }
      };
      
      autoSave();
    }
  }, [phase, difficulty, activeConfig.timerSeconds, fetchLogs]);

  // Flash sequence logic
  const flashSequence = useCallback((seq: Color[], duration: number, interval: number) => {
    setPhase('memorize');
    setCurrentFlashIndex(0);
    let i = 0;
    const next = () => {
      if (i >= seq.length) {
        setFlashingColor(null);
        setPhase('replicate');
        setSecondsLeft(activeConfig.timerSeconds);
        startTimeRef.current = Date.now();
        return;
      }
      setFlashingColor(seq[i]);
      setCurrentFlashIndex(i + 1);
      setTimeout(() => {
        setFlashingColor(null);
        setTimeout(() => { i++; next(); }, interval);
      }, duration);
    };
    setTimeout(next, 600);
  }, [activeConfig.timerSeconds]);

  // Start game
  const startGame = () => {
    const seq = Array.from({ length: activeConfig.sequenceLength }, () => COLORS[Math.floor(Math.random() * COLORS.length)]);
    setSequence(seq);
    setPlayerInputs([]);
    flashSequence(seq, activeConfig.flashDurationMs, activeConfig.flashIntervalMs);
  };

  // Player clicks a button
  const handleColorClick = (color: Color) => {
    if (phase !== 'replicate') return;
    const newInputs = [...playerInputs, color];
    setPlayerInputs(newInputs);

    // Validate inputs
    for (let i = 0; i < newInputs.length; i++) {
      if (newInputs[i] !== sequence[i]) {
        clearInterval(timerRef.current!);
        setPhase('fail');
        return;
      }
    }

    if (newInputs.length === sequence.length) {
      clearInterval(timerRef.current!);
      setPhase('success');
    }
  };

  // Delete Log (Delete / DELETE)
  const handleDeleteLog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this log entry?')) return;
    try {
      await axios.delete(`/api/simon-says/scores/${id}`);
      fetchLogs(); // Reload logs list
    } catch (err) {
      console.log(err)
      alert('Failed to delete log entry.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-[#111111] bg-black">
        <div className="flex items-center gap-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold tracking-widest transition-colors cursor-pointer"
          >
            ← BACK
          </button>
          
          <div className="flex items-center gap-2 text-orange-500 font-extrabold text-xs tracking-widest">
            <svg className="w-5 h-5 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l3-9 3 18 3-12 3 3h3" />
            </svg>
            REACTOR SYNCHRONIZATION
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end leading-none">
            <span className="text-[9px] font-bold text-gray-500 tracking-widest mb-1 uppercase">SEQ</span>
            <span className="text-sm font-extrabold font-mono text-white">
              {playerInputs.length}/{sequence.length || activeConfig.sequenceLength}
            </span>
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className="text-[9px] font-bold text-gray-500 tracking-widest mb-1 uppercase">TIME</span>
            <span className="text-sm font-extrabold font-mono text-orange-500">
              {String(Math.floor(secondsLeft / 60)).padStart(1, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Left Hand Side: Gameplay panel */}
        <div className="flex-1 max-w-md mx-auto w-full flex flex-col">
          {/* Difficulty Selection */}
          {phase === 'idle' && (
            <div className="w-full mb-6">
              <div className="flex gap-2 mb-2">
                {(['easy', 'medium'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      setSecondsLeft(CONFIGS[d].timerSeconds);
                    }}
                    className={`flex-1 py-2.5 rounded font-bold uppercase tracking-widest text-xs border transition-all cursor-pointer ${
                      difficulty === d
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]'
                        : 'border-gray-800 text-gray-600 hover:border-gray-700 hover:text-gray-400'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-center text-gray-600 text-[10px] tracking-widest uppercase">
                {activeConfig.sequenceLength} steps · {activeConfig.timerSeconds}s limit
              </p>
            </div>
          )}

          {/* Phase Banner */}
          {(phase === 'idle' || phase === 'memorize') && (
            <div className="w-full border border-orange-500 bg-orange-950/20 rounded-lg px-4 py-3 mb-4 text-xs text-orange-400 font-extrabold tracking-wider text-center uppercase flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              MEMORIZE SEQUENCE: Observe the {activeConfig.sequenceLength}-step sequence.
            </div>
          )}
          {phase === 'replicate' && (
            <div className="w-full border border-yellow-500 bg-yellow-950/20 rounded px-4 py-3 mb-4 text-xs text-yellow-400 font-extrabold tracking-wider text-center uppercase flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17m-.5 0h.5m-.5 0v.5" />
              </svg>
              REPLICATE PHASE: Click the buttons in the correct order!
            </div>
          )}
          {phase === 'success' && (
            <div className="w-full border border-green-500 bg-green-950/20 rounded px-4 py-3 mb-4 text-xs text-green-400 font-extrabold tracking-wider text-center uppercase flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              REACTOR SYNCHRONIZED! Sequence logged in logs.
            </div>
          )}
          {phase === 'fail' && (
            <div className="w-full border border-red-500 bg-red-950/20 rounded px-4 py-3 mb-4 text-xs text-red-400 font-extrabold tracking-wider text-center uppercase flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              REACTOR MISMATCH! Core failure logged.
            </div>
          )}

          {/* Game Panel Box */}
          <div className="w-full border border-gray-650 rounded-lg p-5 bg-[#080808] mb-4">
            <div className="text-center text-gray-500 text-[10px] font-bold tracking-widest mb-4">
              REACTOR COOLING PANEL
            </div>
            <div className="grid grid-cols-2 gap-4">
              {COLORS.map(color => (
                <SimonButton
                  key={color}
                  color={color}
                  isFlashing={flashingColor === color}
                  isDisabled={phase !== 'replicate'}
                  onClick={handleColorClick}
                />
              ))}
            </div>

            {/* Step Counter Badge */}
            {(phase === 'memorize' || phase === 'replicate') && (
              <div className="flex justify-center mt-5 animate-pulse">
                <span className="border border-orange-500/85 bg-[#0A0A0A] text-orange-400 text-[10px] font-extrabold px-4 py-1.5 rounded tracking-widest uppercase">
                  STEP {phase === 'memorize' ? currentFlashIndex : playerInputs.length}/{activeConfig.sequenceLength}
                </span>
              </div>
            )}
          </div>

          {/* Actions panel */}
          <div className="w-full space-y-4">
            {phase === 'idle' && (
              <button
                onClick={startGame}
                className="w-full bg-orange-600 hover:bg-orange-500 active:scale-98 text-white font-extrabold py-3.5 rounded text-xs tracking-widest uppercase transition-all cursor-pointer shadow-[0_4px_12px_rgba(234,88,12,0.2)]"
              >
                START SYNCHRONIZATION
              </button>
            )}

            {(phase === 'success' || phase === 'fail') && (
              <div className="flex gap-2">
                <button onClick={startGame} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded text-xs tracking-widest cursor-pointer transition-colors uppercase">
                  RETRY SYNC
                </button>
                <button
                  onClick={() => { setPhase('idle'); setPlayerInputs([]); setSequence([]); }}
                  className="flex-1 bg-[#121212] hover:bg-[#1A1A1A] border border-gray-850 text-white font-bold py-2.5 rounded text-xs tracking-wider cursor-pointer transition-colors uppercase"
                >
                  RESET PANEL
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Hand Side: Mission Logs Table */}
        <div className="flex-1 flex flex-col bg-[#080808] border border-[#1a1a1a] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[#222222] pb-3">
            <h2 className="text-orange-500 font-extrabold text-xs tracking-widest uppercase flex items-center gap-2">
              📋 AUTOMATED REACTOR REPAIR LOGS (MISSION HISTORY)
            </h2>
            <button
              onClick={fetchLogs}
              className="text-gray-500 hover:text-white text-xs font-bold tracking-wider cursor-pointer transition-colors"
            >
              REFRESH
            </button>
          </div>

          {loadingLogs ? (
            <p className="text-center text-gray-600 text-xs py-8">Decoding mission logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-500 text-xs py-8">No repair history logged. Sync the reactor core to create first log!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#222] text-gray-500">
                    <th className="py-2.5 font-bold tracking-wider uppercase text-[10px]">Operator</th>
                    <th className="py-2.5 font-bold tracking-wider uppercase text-[10px]">Difficulty</th>
                    <th className="py-2.5 font-bold tracking-wider uppercase text-[10px]">Score</th>
                    <th className="py-2.5 font-bold tracking-wider uppercase text-[10px]">Result</th>
                    <th className="py-2.5 font-bold tracking-wider uppercase text-[10px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151515]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#0E0E0E] transition-colors">
                      <td className="py-3 font-semibold text-white truncate max-w-[120px]">{log.playerName}</td>
                      <td className="py-3 capitalize text-gray-400">{log.difficulty}</td>
                      <td className="py-3 font-mono font-bold text-orange-500">{log.score}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          log.win ? 'bg-green-950/40 text-green-400 border border-green-800/30' : 'bg-red-950/40 text-red-400 border border-red-800/30'
                        }`}>
                          {log.win ? 'Success' : 'Failure'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-red-500 hover:text-red-400 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer border border-red-500/20 hover:border-red-500 bg-red-950/10 rounded px-2.5 py-1 transition-all"
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
