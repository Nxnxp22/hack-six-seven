import { useState, useEffect, useRef, useCallback } from "react";
import {
  COLORS,
  generateSequence,
  checkPartialInput,
  calculateScore,
  type Color,
  type Difficulty,
  type GamePhase,
} from "../apis/gameEngine";
import { createScore } from "../apis/scoreApi";
import SimonButton from "../components/SimonButton";
import Leaderboard from "../components/Leaderboard";

export default function ReactorSyncPage() {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [config, setConfig] = useState({
    sequenceLength: 5,
    flashDurationMs: 500,
    flashIntervalMs: 300,
    timerSeconds: 60,
  });
  const [dynamicDifficulty, setDynamicDifficulty] =
    useState<Difficulty>("medium");
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerInputs, setPlayerInputs] = useState<Color[]>([]);
  const [flashingColor, setFlashingColor] = useState<Color | null>(null);
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [showManual, setShowManual] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== "replicate") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("fail");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
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
          setSecondsLeft(gameConfig.timerSeconds);
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

  // Start game
  const startGame = () => {
    const randomLength = Math.floor(Math.random() * 6) + 3; // 3 to 8 steps
    const randomTimer = Math.floor(Math.random() * 61) + 30; // 30 to 90 seconds

    // Choose dynamic speed based on length
    const randomFlashDuration =
      randomLength >= 7 ? 300 : randomLength >= 5 ? 500 : 800;
    const randomFlashInterval =
      randomLength >= 7 ? 200 : randomLength >= 5 ? 300 : 400;

    const newConfig = {
      sequenceLength: randomLength,
      flashDurationMs: randomFlashDuration,
      flashIntervalMs: randomFlashInterval,
      timerSeconds: randomTimer,
    };
    setConfig(newConfig);

    const calculatedDifficulty =
      randomLength <= 4 ? "easy" : randomLength <= 6 ? "medium" : "hard";
    setDynamicDifficulty(calculatedDifficulty);

    const seq = generateSequence(randomLength);
    setSequence(seq);
    setPlayerInputs([]);
    setScoreSaved(false);
    flashSequence(seq, newConfig);
  };

  // Player clicks a button
  const handleColorClick = (color: Color) => {
    if (phase !== "replicate") return;
    const newInputs = [...playerInputs, color];
    setPlayerInputs(newInputs);
    const result = checkPartialInput(sequence, newInputs);
    if (result === "wrong") {
      clearInterval(timerRef.current!);
      setPhase("fail");
    } else if (result === "correct") {
      clearInterval(timerRef.current!);
      setPhase("success");
    }
  };

  // Save score
  const handleSaveScore = async () => {
    if (!playerName.trim() || scoreSaved) return;
    const timeTakenMs = Date.now() - startTimeRef.current;
    const score = calculateScore(
      dynamicDifficulty,
      timeTakenMs,
      phase === "success",
    );
    try {
      await createScore({
        playerName: playerName.trim(),
        difficulty: dynamicDifficulty,
        score,
        win: phase === "success",
        timeTakenMs,
      });
      setScoreSaved(true);
    } catch {
      alert("Failed to save score. Please try again.");
    }
  };

  const progressDots = Array.from(
    { length: config.sequenceLength },
    (_, i) => i,
  );

  const mins = String(Math.floor(secondsLeft / 60)).padStart(1, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
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
              SEQ
            </span>
            <span className="text-sm font-extrabold font-mono text-white">
              {playerInputs.length}/{config.sequenceLength}
            </span>
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className="text-[9px] font-bold text-gray-500 tracking-widest mb-1 uppercase">
              TIME
            </span>
            <span className="text-sm font-extrabold font-mono text-orange-500">
              {timeString}
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

        {/* Difficulty selector — replaced with random mode indicator */}
        {phase === "idle" && (
          <div className="w-full mb-6 text-center animate-fadeIn">
          </div>
        )}

        {(phase === "idle" || phase === "memorize") && (
          <div className="w-full border border-orange-500 bg-orange-950/20 rounded px-4 py-3 mb-4 text-xs text-orange-400 font-extrabold tracking-wider text-center uppercase flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 text-orange-500 shrink-0"
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
          <div className="w-full border border-green-500 bg-green-950/20 rounded px-4 py-3 mb-4 text-xs text-green-400 font-extrabold tracking-wider text-center uppercase flex items-center justify-center gap-2">
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
        )}
        {phase === "fail" && (
          <div className="w-full border border-red-500 bg-red-950/20 rounded px-4 py-3 mb-4 text-xs text-red-400 font-extrabold tracking-wider text-center uppercase flex items-center justify-center gap-2">
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
            REACTOR MISMATCH! Cooling sequence failed.
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

        {/* Start button */}
        {phase === "idle" && (
          <button
            onClick={startGame}
            className="w-full bg-orange-600 hover:bg-orange-500 active:scale-98 text-white font-extrabold py-3.5 rounded text-xs tracking-widest uppercase transition-all cursor-pointer shadow-[0_4px_12px_rgba(234,88,12,0.2)] hover:shadow-[0_4px_20px_rgba(234,88,12,0.3)]"
          >
            START SYNCHRONIZATION
          </button>
        )}

        {/* After game options */}
        {(phase === "success" || phase === "fail") && (
          <div className="w-full space-y-4">
            {!scoreSaved ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={30}
                  className="flex-1 bg-[#0F0F0F] border border-gray-800 rounded px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/70"
                />
                <button
                  onClick={handleSaveScore}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-5 py-2.5 rounded text-xs tracking-wider cursor-pointer"
                >
                  SAVE
                </button>
              </div>
            ) : (
              <p className="text-center text-green-400 text-xs font-bold tracking-wider">
                ✓ Score saved successfully!
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 bg-[#121212] hover:bg-[#1A1A1A] border border-gray-850 text-white font-bold py-2.5 rounded text-xs tracking-wider cursor-pointer transition-colors"
              >
                RETRY
              </button>
              <button
                onClick={() => {
                  setPhase("idle");
                  setPlayerInputs([]);
                  setSequence([]);
                }}
                className="flex-1 bg-[#121212] hover:bg-[#1A1A1A] border border-gray-850 text-white font-bold py-2.5 rounded text-xs tracking-wider cursor-pointer transition-colors"
              >
                MENU
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="flex-1 bg-orange-950/30 hover:bg-orange-950/50 border border-orange-500/40 text-orange-400 font-bold py-2.5 rounded text-xs tracking-wider cursor-pointer transition-colors"
              >
                SCORES
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0B0B0B] border border-[#222] rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-[0_0_30px_rgba(249,115,22,0.1)] animate-fadeIn">
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
