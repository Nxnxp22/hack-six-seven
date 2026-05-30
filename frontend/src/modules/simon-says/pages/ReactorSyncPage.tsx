import { useState, useEffect, useRef, useCallback } from "react";
import {
  COLORS,
  generateSequence,
  checkPartialInput,
  type Color,
  type Difficulty,
  type GamePhase,
} from "../apis/gameEngine";
import {
  calculateCoinsReward,
  calculateStabilityChange,
  SHARED_GAME_RULES,
} from "../apis/sharedRules";
import { createScore } from "../apis/scoreApi";
import SimonButton from "../components/SimonButton";
import Leaderboard from "../components/Leaderboard";

export default function ReactorSyncPage() {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("reactor_game_config");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        const seqLength = parsed.sequenceLength || 5;
        const difficulty = seqLength <= 4 ? "easy" : seqLength <= 6 ? "medium" : "hard";
        parsed.timerSeconds = difficulty === "easy" ? 30 : difficulty === "medium" ? 20 : 15;
        return parsed;
      }
    } catch (e) {}
    return {
      sequenceLength: 5,
      flashDurationMs: 500,
      flashIntervalMs: 300,
      timerSeconds: 20,
    };
  });
  const [dynamicDifficulty, setDynamicDifficulty] = useState<Difficulty>(() => {
    const saved = localStorage.getItem("reactor_game_difficulty");
    return (saved === "easy" || saved === "medium" || saved === "hard") ? saved : "medium";
  });
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerInputs, setPlayerInputs] = useState<Color[]>([]);
  const [flashingColor, setFlashingColor] = useState<Color | null>(null);
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const savedSeconds = localStorage.getItem("reactor_seconds_left");
    if (savedSeconds) {
      const parsedSeconds = parseInt(savedSeconds, 10);
      if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
        return parsedSeconds;
      }
    }
    const saved = localStorage.getItem("reactor_game_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const seqLength = parsed.sequenceLength || 5;
        const difficulty = seqLength <= 4 ? "easy" : seqLength <= 6 ? "medium" : "hard";
        return difficulty === "easy" ? 30 : difficulty === "medium" ? 20 : 15;
      } catch (e) {}
    }
    return 20;
  });
  const [showManual, setShowManual] = useState(false);
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem("operator_coins");
    return saved ? parseInt(saved, 10) : 100;
  });
  const [stability, setStability] = useState(() => {
    const saved = localStorage.getItem("reactor_stability");
    return saved ? parseInt(saved, 10) : 50;
  });
  const [roundCoinsEarned, setRoundCoinsEarned] = useState(0);
  const [roundStabilityDelta, setRoundStabilityDelta] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(() => {
    const saved = localStorage.getItem("reactor_attempts_left");
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    localStorage.setItem("reactor_attempts_left", String(attemptsLeft));
  }, [attemptsLeft]);



  useEffect(() => {
    localStorage.setItem("operator_coins", String(coins));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem("reactor_stability", String(stability));
  }, [stability]);

  useEffect(() => {
    if (phase === "memorize" || phase === "replicate") {
      localStorage.setItem("reactor_seconds_left", String(secondsLeft));
    }
  }, [secondsLeft, phase]);

  useEffect(() => {
    if (phase === "success" || phase === "fail") {
      localStorage.removeItem("reactor_seconds_left");
    }
  }, [phase]);

  const startTimeRef = useRef<number>(0);

  // Timer runs immediately upon entering the page (during idle, memorize, and replicate phases)
  useEffect(() => {
    if (phase !== "replicate" && phase !== "idle" && phase !== "memorize") return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setPhase("fail");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Flash sequence
  const flashSequence = useCallback(
    (seq: Color[], gameConfig: typeof config) => {
      setPhase("memorize");
      setCurrentFlashIndex(0);
      let i = 0;
      const next = () => {
        if (i >= seq.length) {
          setFlashingColor(null);
          setPhase("replicate");
          startTimeRef.current = Date.now();
          return;
        }
        setFlashingColor(seq[i]);
        setCurrentFlashIndex(i + 1);
        setTimeout(() => {
          setFlashingColor(null);
          setTimeout(() => {
            i++;
            next();
          }, gameConfig.flashIntervalMs);
        }, gameConfig.flashDurationMs);
      };
      setTimeout(next, 600);
    },
    [],
  );

  // Randomize game difficulty (config & sequence length)
  const randomizeDifficulty = () => {
    const randomLength = Math.floor(Math.random() * 6) + 3; // 3 to 8 steps
    const calculatedDifficulty =
      randomLength <= 4 ? "easy" : randomLength <= 6 ? "medium" : "hard";
    setDynamicDifficulty(calculatedDifficulty);
    localStorage.setItem("reactor_game_difficulty", calculatedDifficulty);

    const timerSeconds = calculatedDifficulty === "easy" ? 30 : calculatedDifficulty === "medium" ? 20 : 15;

    const randomFlashDuration =
      randomLength >= 7 ? 300 : randomLength >= 5 ? 500 : 800;
    const randomFlashInterval =
      randomLength >= 7 ? 200 : randomLength >= 5 ? 300 : 400;

    const newConfig = {
      sequenceLength: randomLength,
      flashDurationMs: randomFlashDuration,
      flashIntervalMs: randomFlashInterval,
      timerSeconds: timerSeconds,
    };
    setConfig(newConfig);
    localStorage.setItem("reactor_game_config", JSON.stringify(newConfig));
    setSecondsLeft(timerSeconds);
  };

  // Start new round with randomized difficulty
  const startNewRound = () => {
    const randomLength = Math.floor(Math.random() * 6) + 3; // 3 to 8 steps
    const calculatedDifficulty =
      randomLength <= 4 ? "easy" : randomLength <= 6 ? "medium" : "hard";
    setDynamicDifficulty(calculatedDifficulty);
    localStorage.setItem("reactor_game_difficulty", calculatedDifficulty);

    const timerSeconds = calculatedDifficulty === "easy" ? 30 : calculatedDifficulty === "medium" ? 20 : 15;

    const randomFlashDuration =
      randomLength >= 7 ? 300 : randomLength >= 5 ? 500 : 800;
    const randomFlashInterval =
      randomLength >= 7 ? 200 : randomLength >= 5 ? 300 : 400;

    const newConfig = {
      sequenceLength: randomLength,
      flashDurationMs: randomFlashDuration,
      flashIntervalMs: randomFlashInterval,
      timerSeconds: timerSeconds,
    };
    setConfig(newConfig);
    localStorage.setItem("reactor_game_config", JSON.stringify(newConfig));
    setSecondsLeft(timerSeconds);

    const seq = generateSequence(randomLength);
    setSequence(seq);
    setPlayerInputs([]);
    setRoundCoinsEarned(0);
    setRoundStabilityDelta(0);
    setHintsUsed(0);
    flashSequence(seq, newConfig);
  };

  // Start game with currently set/loaded config
  const startGame = () => {
    const seq = generateSequence(config.sequenceLength);
    setSequence(seq);
    setPlayerInputs([]);
    setRoundCoinsEarned(0);
    setRoundStabilityDelta(0);
    setHintsUsed(0);
    
    // Only reset timer seconds if there is no saved progress from a reload
    const savedSeconds = localStorage.getItem("reactor_seconds_left");
    if (!savedSeconds) {
      setSecondsLeft(config.timerSeconds);
    }

    flashSequence(seq, config);
  };

  // Auto-start the game immediately when entering the page or when state goes to 'idle'
  useEffect(() => {
    if (phase === "idle") {
      const savedSeconds = localStorage.getItem("reactor_seconds_left");
      if (savedSeconds) {
        startGame();
      } else {
        startNewRound(); // Randomize difficulty and start fresh!
      }
      setAttemptsLeft(1); // Reset attempts to 1 when starting a new game session
    }
  }, [phase]);

  // Buy hint logic to replay the entire sequence
  const buyHint = () => {
    if (phase !== "replicate") return;
    const cost = SHARED_GAME_RULES.hints.cost[hintsUsed];
    if (coins < cost) {
      alert("Not enough coins to buy a hint!");
      return;
    }
    
    // Deduct coins and record hint use
    setCoins((prev) => prev - cost);
    setHintsUsed((prev) => prev + 1);

    // Replay the entire pattern sequence
    flashSequence(sequence, config);
  };

  // Player clicks a button
  const handleColorClick = (color: Color) => {
    if (phase !== "replicate") return;
    const newInputs = [...playerInputs, color];
    setPlayerInputs(newInputs);
    const result = checkPartialInput(sequence, newInputs);
    if (result === "wrong") {
      setPhase("fail");
    } else if (result === "correct") {
      setPhase("success");
    }
  };

  // Listen for phase transitions to calculate coins and stability exactly once
  useEffect(() => {
    if (phase === "success") {
      const timeTakenMs = Date.now() - startTimeRef.current;
      const earnedCoins = calculateCoinsReward(dynamicDifficulty, timeTakenMs, config.timerSeconds, true);
      const stabilityDelta = calculateStabilityChange(dynamicDifficulty, true);
      
      setRoundCoinsEarned(earnedCoins);
      setRoundStabilityDelta(stabilityDelta);
      
      setCoins((c) => c + earnedCoins);
      setStability((s) => Math.min(100, Math.max(0, s + stabilityDelta)));
      setAttemptsLeft(1); // Reset attempts on successful sync
    } else if (phase === "fail") {
      const stabilityDelta = calculateStabilityChange(dynamicDifficulty, false);
      
      setRoundCoinsEarned(0);
      setRoundStabilityDelta(stabilityDelta);
      
      setStability((s) => Math.min(100, Math.max(0, s + stabilityDelta)));
      setAttemptsLeft((prev) => Math.max(0, prev - 1)); // Deduct 1 attempt/heart on failure
    }
  }, [phase, dynamicDifficulty, config.timerSeconds]);



  const progressDots = Array.from(
    { length: config.sequenceLength },
    (_, i) => i,
  );

  const displaySeconds = secondsLeft;
  const mins = String(Math.floor(displaySeconds / 60)).padStart(1, "0");
  const secs = String(displaySeconds % 60).padStart(2, "0");
  const timeString = `${mins}:${secs}`;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none">
      {/* Top Nav / Header */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-[#111111] bg-black">
        {/* Left Actions */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold tracking-widest transition-colors cursor-pointer"
          >
            ← BACK
          </button>

          <div className="flex items-center gap-2 text-orange-500 font-extrabold text-xs tracking-widest">
            <svg
              className="w-5 h-5 text-orange-500 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12h3l3-9 3 18 3-12 3 3h3"
              />
            </svg>
            POWER OVERLOAD
          </div>

          <button
            onClick={() => setShowManual(!showManual)}
            className={`flex items-center gap-2 text-xs font-bold tracking-widest transition-colors cursor-pointer ${
              showManual ? "text-orange-500" : "text-gray-500 hover:text-white"
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            MANUAL
          </button>
        </div>

        {/* Right Stats */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end leading-none">
            <span className="text-[9px] font-bold text-gray-500 tracking-widest mb-1 uppercase">
              ATTEMPTS
            </span>
            <span className="text-sm font-extrabold font-mono text-white">
              {attemptsLeft}/1
            </span>
          </div>
          <div className="flex flex-col items-end leading-none border-l border-[#222] pl-8">
            <span className="text-[9px] font-bold text-gray-500 tracking-widest mb-1 uppercase">
              TIME
            </span>
            <span className="text-sm font-extrabold font-mono text-white">
              {timeString}
            </span>
          </div>
          <div className="flex flex-col items-end leading-none border-l border-[#222] pl-8">
            <span className="text-[9px] font-bold text-gray-500 tracking-widest mb-1 uppercase">
              COINS
            </span>
            <span className="text-sm font-extrabold font-mono text-yellow-400">
              {coins}
            </span>
          </div>
          <div className="flex flex-col items-end leading-none border-l border-[#222] pl-8">
            <span className="text-[9px] font-bold text-gray-500 tracking-widest mb-1 uppercase">
              STABILITY
            </span>
            <span className={`text-sm font-extrabold font-mono ${stability > 50 ? 'text-green-400' : stability > 25 ? 'text-yellow-400' : 'text-red-500 animate-pulse'}`}>
              {stability}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-4 py-6">
        {/* Inline Manual Hacking overlay */}
        {showManual && (
          <div className="w-full border border-orange-500/70 bg-orange-950/5 rounded-lg p-5 mb-4 shadow-[0_0_15px_rgba(249,115,22,0.05)] animate-fadeIn">
            <div className="text-orange-500 font-extrabold text-xs tracking-wider mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 shrink-0 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              NEXUS HACKING MANUAL : SECURITY OVERRIDE
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-gray-300">
              <p>
                <span className="text-white font-bold">OBJECTIVE:</span>{" "}
                Synchronize the cooling panel with the reactor core.
              </p>
              <div>
                <span className="text-blue-400 font-bold">
                  ● MEMORIZE PHASE:
                </span>
                <p className="text-gray-400 pl-4 mt-0.5">
                  Watch the cooling panel buttons flash. Remember the exact
                  sequence and step order.
                </p>
              </div>
              <div>
                <span className="text-yellow-400 font-bold">
                  ● REPLICATE PHASE:
                </span>
                <p className="text-gray-400 pl-4 mt-0.5">
                  Click the colored buttons in the exact sequence you just
                  observed.
                </p>
              </div>
              <div>
                <span className="text-red-400 font-bold">
                  ● SPEED INTRUSION:
                </span>
                <p className="text-gray-400 pl-4 mt-0.5 font-medium">
                  Harder difficulties increase the pattern length and accelerate
                  light display speeds.
                  <span className="block mt-1 text-gray-500 italic">
                    *Note: Clicking any wrong button in the sequence will
                    trigger an immediate reactor mismatch failure.
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Random mode indicator */}
        {phase === "idle" && (
          <div className="w-full mb-6 text-center animate-fadeIn">
          </div>
        )}

        {(phase === "idle" || phase === "memorize") && (
          <div className="w-full border border-orange-500 bg-orange-950/20 rounded px-4 py-3 mb-4 text-xs text-orange-400 font-extrabold tracking-wider text-center uppercase flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 text-orange-500 shrink-0 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            MEMORIZE SEQUENCE: Observe the {config.sequenceLength}-step
            sequence.
          </div>
        )}
        {phase === "replicate" && (
          <div className="w-full border border-yellow-500 bg-yellow-950/20 rounded px-4 py-3 mb-4 text-xs text-yellow-400 font-extrabold tracking-wider text-center uppercase flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 text-yellow-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17m-.5 0h.5m-.5 0v.5"
              />
            </svg>
            REPLICATE PHASE: Click the buttons in the correct order!
          </div>
        )}
        {phase === "success" && (
          <div className="w-full border border-green-500 bg-green-950/20 rounded px-4 py-3 mb-4 text-xs text-green-400 font-extrabold tracking-wider text-center uppercase flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              REACTOR SYNCHRONIZED! Sequence matched successfully.
            </div>
            <div className="text-[10px] text-green-500 font-bold tracking-widest mt-1">
              +{roundCoinsEarned} COINS EARNED · +{roundStabilityDelta}% REACTOR STABILITY
            </div>
          </div>
        )}
        {phase === "fail" && (
          <div className="w-full border border-red-500 bg-red-950/20 rounded px-4 py-3 mb-4 text-xs text-red-400 font-extrabold tracking-wider text-center uppercase flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-red-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {attemptsLeft === 0
                ? "CRITICAL CORE FAILURE! OUT OF ATTEMPTS!"
                : `REACTOR MISMATCH! COOLING SEQUENCE FAILED. (${attemptsLeft} ATTEMPT${attemptsLeft > 1 ? "S" : ""} LEFT)`}
            </div>
            <div className="text-[10px] text-red-500 font-bold tracking-widest mt-1">
              {roundStabilityDelta}% REACTOR STABILITY
            </div>
          </div>
        )}

        {/* Game panel */}
        <div className="w-full border border-gray-600 rounded-lg p-5 bg-[#080808] mb-4">
          <div className="text-center text-gray-500 text-[10px] font-bold tracking-widest mb-4">
            REACTOR COOLING PANEL
          </div>
          <div className="grid grid-cols-2 gap-4">
            {COLORS.map((color) => (
              <SimonButton
                key={color}
                color={color}
                isFlashing={flashingColor === color}
                isDisabled={phase !== "replicate"}
                onClick={handleColorClick}
              />
            ))}
          </div>

          {/* Centered Step Badge inside the Panel */}
          {(phase === "memorize" || phase === "replicate") && (
            <div className="flex justify-center mt-5 animate-pulse">
              <span className="border border-orange-500/85 bg-[#0A0A0A] text-orange-400 text-[10px] font-extrabold px-4 py-1.5 rounded tracking-widest uppercase">
                STEP{" "}
                {phase === "memorize" ? currentFlashIndex : playerInputs.length}
                /{config.sequenceLength}
              </span>
            </div>
          )}
        </div>

        {/* Progress dots - Rendered outside the panel container */}
        {(phase === "memorize" || phase === "replicate") && (
          <div className="flex justify-center gap-2 mb-6">
            {progressDots.map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  phase === "memorize"
                    ? i < currentFlashIndex
                      ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                      : "border border-gray-700 bg-transparent"
                    : i < playerInputs.length
                      ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                      : "border border-gray-700 bg-transparent"
                }`}
              />
            ))}
          </div>
        )}

        {/* Hint button */}
        {phase === "replicate" && (
          <div className="w-full mb-6 flex justify-center">
            <button
              onClick={buyHint}
              disabled={hintsUsed >= 2 || coins < SHARED_GAME_RULES.hints.cost[hintsUsed]}
              className={`px-6 py-2.5 rounded font-extrabold text-xs tracking-widest uppercase transition-all border cursor-pointer ${
                hintsUsed >= 2
                  ? "border-gray-800 text-gray-600 bg-transparent cursor-not-allowed"
                  : coins < SHARED_GAME_RULES.hints.cost[hintsUsed]
                  ? "border-red-950 bg-red-950/10 text-red-500/60 cursor-not-allowed animate-pulse"
                  : "border-orange-500/55 hover:border-orange-500 bg-orange-500/5 hover:bg-orange-500/10 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.05)] hover:shadow-[0_0_15px_rgba(249,115,22,0.1)] active:scale-98"
              }`}
            >
              {hintsUsed >= 2
                ? "HINTS DEPLETED"
                : `BUY HINT (${SHARED_GAME_RULES.hints.cost[hintsUsed]} COINS)`}
            </button>
          </div>
        )}


        {/* After game options */}
        {(phase === "success" || phase === "fail") && (
          <div className="w-full space-y-4">
            <div className="space-y-2">
              {phase === "fail" && attemptsLeft > 0 && (
                <button
                  onClick={startNewRound}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-3.5 rounded text-xs tracking-widest cursor-pointer transition-colors uppercase shadow-[0_4px_12px_rgba(234,88,12,0.2)]"
                >
                  NEW ROUND
                </button>
              )}
              <button
                onClick={() => {
                  setPhase("idle");
                  setPlayerInputs([]);
                  setSequence([]);
                  setSecondsLeft(config.timerSeconds);
                  setAttemptsLeft(1); // Reset attempts back to 1
                  localStorage.removeItem("reactor_seconds_left"); // Explicitly clear saved seconds
                }}
                className="w-full bg-[#121212] hover:bg-[#1A1A1A] border border-gray-850 text-white font-bold py-2.5 rounded text-xs tracking-wider cursor-pointer transition-colors uppercase"
              >
                {phase === "success"
                  ? "SUCCESS · RETURN TO MENU"
                  : phase === "fail" && attemptsLeft === 0
                  ? "RETURN TO MENU"
                  : "MENU"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
