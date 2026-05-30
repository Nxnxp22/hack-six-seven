import { useState, useRef, useEffect } from "react";
import { wordToMorse, morseToSymbols } from "../lib/morse";
import { useTimer } from "../hooks/useTimer";
import MorseVisual from "../components/MorseVisual";
import MorseReference from "../components/MorseReference";

type Phase = "loading" | "playing" | "result";
type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_SECONDS: Record<Difficulty, number> = {
  easy: 90,
  medium: 60,
  hard: 30,
};

const MAX_ATTEMPTS = 3;

export default function GamePage() {
  const [currentWord, setCurrentWord] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<Phase>("loading");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [showRef, setShowRef] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [hintLevel, setHintLevel] = useState(0);

  const roundStartRef = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExpire = () => setPhase("result");
  const { timeLeft, formatted } = useTimer(timerSeconds ?? 90, handleExpire);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isNew = params.get("new") === "1";

    if (isNew) window.history.replaceState(null, "", window.location.pathname);

    const savedWord = sessionStorage.getItem("comm-failure-word");
    const savedDiff = sessionStorage.getItem(
      "comm-failure-difficulty",
    ) as Difficulty | null;

    if (!isNew && savedWord && savedDiff) {
      setTimerSeconds(DIFFICULTY_SECONDS[savedDiff] ?? 90);
      setCurrentWord(savedWord);
      setDifficulty(savedDiff);
      setPhase("playing");
      return;
    }

    fetch("/api/challenges?count=1")
      .then((r) => r.json())
      .then((data) => {
        const challenge = data.challenges?.[0];
        const word = challenge?.word ?? "SOS";
        const diff = (challenge?.difficulty ?? "easy") as Difficulty;
        sessionStorage.setItem("comm-failure-word", word);
        sessionStorage.setItem("comm-failure-difficulty", diff);
        setTimerSeconds(DIFFICULTY_SECONDS[diff] ?? 90);
        setCurrentWord(word);
        setDifficulty(diff);
        setPhase("playing");
      })
      .catch(() => {
        sessionStorage.setItem("comm-failure-word", "SOS");
        sessionStorage.setItem("comm-failure-difficulty", "easy");
        setTimerSeconds(90);
        setCurrentWord("SOS");
        setDifficulty("easy");
        setPhase("playing");
      });
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      roundStartRef.current = Date.now();

      setAnswer("");
      setFeedback(null);
      setShowRef(false);

      setAttemptsLeft(MAX_ATTEMPTS);

      setHintLevel(0);

      inputRef.current?.focus();
    }
  }, [phase]);

  const handleSubmit = () => {
    if (!answer.trim() || feedback === "correct") return;

    const isCorrect = answer.trim().toUpperCase() === currentWord.toUpperCase();

    if (isCorrect) {
      setFeedback("correct");
      setCorrectCount((c) => c + 1);
      setTimeout(() => setPhase("result"), 600);
    } else {
      useEf;
      const remaining = attemptsLeft - 1;
      setAttemptsLeft(remaining);
      setFeedback("wrong");
      setAnswer("");
      if (remaining === 0) {
        setPhase("result");
      }
    }
  };

  const morse = wordToMorse(currentWord);
  const useHint = () => {
    if (hintLevel >= 2) return;

    if (
      (hintLevel === 0 && currentWord.length >= 1) ||
      (hintLevel === 1 && currentWord.length >= 2)
    ) {
      setHintLevel((prev) => prev + 1);
    }
  };

  const revealedHint = hintLevel === 0 ? "" : currentWord.slice(0, hintLevel);

  const difficultyLabel: Record<Difficulty, string> = {
    easy: "EASY",
    medium: "MEDIUM",
    hard: "HARD",
  };
  const difficultyColor: Record<Difficulty, string> = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-red-400",
  };

  // ── LOADING ──
  if (phase === "loading" || timerSeconds === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <p className="text-cyan-800 text-xs tracking-[0.4em] animate-pulse">
          INCOMING SIGNAL...
        </p>
      </div>
    );
  }

  // ── RESULT ──
  if (phase === "result") {
    const passed = correctCount === 1;
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6 text-white font-mono">
        <div className="text-center">
          <h1
            className={`text-3xl sm:text-4xl font-bold tracking-[0.4em] mb-4 ${passed ? "text-cyan-400" : "text-red-500"}`}
          >
            {passed ? "COMPLETED" : "COMM FAILURE"}
          </h1>
          <p className="text-gray-500 tracking-[0.3em] text-xs mb-10">
            {passed ? "SIGNAL DECODED SUCCESSFULLY" : "TRANSMISSION LOST"}
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-8 py-3 text-xs tracking-[0.3em] border border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition font-mono"
          >
            ← BACK TO MAIN
          </button>
        </div>
      </div>
    );
  }

  // ── PLAYING ──
  return (
    <div className="min-h-screen bg-black text-white font-mono border border-cyan-950 flex flex-col">
      {/* HEADER */}
      <header className="px-4 sm:px-10 py-4 sm:py-6 border-b border-cyan-950 flex justify-between items-center gap-4">
        <div className="flex flex-wrap gap-3 sm:gap-10 items-center text-xs uppercase tracking-[0.25em]">
          <button className="text-gray-400 hover:text-white">← Back</button>
          <div className="text-cyan-400 font-bold flex gap-2">
            <span>⟨◉⟩</span>
            <span className="hidden sm:inline">COMM FAILURE</span>
          </div>
          <button
            onClick={() => setShowManual((v) => !v)}
            className={`px-3 py-1 border transition ${
              showManual
                ? "bg-cyan-400 text-black border-cyan-400"
                : "border-gray-700 text-gray-400"
            }`}
          >
            ⊞ <span className="hidden sm:inline">MANUAL</span>
          </button>
          <button
            onClick={useHint}
            disabled={
              hintLevel >= 2 || (hintLevel === 1 && currentWord.length < 2)
            }
            className={`
    px-3 py-1 border transition
    ${
      hintLevel >= 2
        ? "border-gray-700 text-gray-600"
        : "border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
    }
  `}
          >
            💡 <span className="hidden sm:inline">HINT {hintLevel}/2</span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-8">
          {/* DIFFICULTY */}
          <div className="flex flex-col items-end justify-between h-[42px]">
            <span className="text-[9px] tracking-[0.25em] text-gray-500">
              DIFFICULTY
            </span>

            <span
              className={`text-lg font-bold leading-none ${difficultyColor[difficulty]}`}
            >
              {difficultyLabel[difficulty]}
            </span>
          </div>

          {/* ATTEMPTS */}
          <div className="flex flex-col items-end justify-between h-[42px]">
            <span className="text-[9px] tracking-[0.25em] text-gray-500">
              ATTEMPTS
            </span>

            <div className="flex gap-1 items-center h-[20px]">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < attemptsLeft ? "bg-cyan-400" : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* TIME */}
          <div className="flex flex-col items-end justify-between h-[42px]">
            <span className="text-[9px] tracking-[0.25em] text-gray-500">
              TIME
            </span>

            <span
              className={`text-lg font-bold leading-none tabular-nums ${
                timeLeft <= 10
                  ? "text-red-500 animate-pulse"
                  : timeLeft <= 20
                    ? "text-red-400"
                    : "text-cyan-400"
              }`}
            >
              {formatted}
            </span>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex justify-center px-4 sm:px-8 pt-8 sm:pt-20 pb-12 sm:pb-24">
        <div className="w-full max-w-[1120px]">
          {/* MANUAL */}
          {showManual && (
            <div className="mb-6 sm:mb-8 rounded-2xl border border-cyan-500 bg-cyan-950/10 px-5 sm:px-9 py-6 sm:py-8 shadow-[0_0_18px_rgba(34,211,238,0.08)]">
              <h3 className="text-cyan-400 text-xs tracking-[0.4em] mb-4 sm:mb-6">
                NEXUS FIELD MANUAL
              </h3>
              <div className="space-y-3 sm:space-y-4 text-gray-400 text-sm leading-7">
                <p>Decode incoming Morse transmissions.</p>
                <p>Use reference chart when needed.</p>
                <p>Enter decoded word and submit.</p>
                <p className="text-xs">
                  Time limit —{" "}
                  <span className="text-green-400">Easy: 1:30</span> ·{" "}
                  <span className="text-yellow-400">Medium: 1:00</span> ·{" "}
                  <span className="text-red-400">Hard: 0:30</span>
                </p>
                <p className="text-xs">
                  You have{" "}
                  <span className="text-cyan-400">{MAX_ATTEMPTS} attempts</span>{" "}
                  to decode the signal.
                </p>
              </div>
            </div>
          )}

          {/* ALERT */}
          <div className="mb-6 sm:mb-8 rounded-2xl border border-cyan-500 px-5 sm:px-7 py-4 sm:py-6 text-cyan-400 flex gap-4 shadow-[0_0_14px_rgba(34,211,238,0.08)]">
            <span>⚠</span>
            <span className="text-xs tracking-[0.2em] sm:tracking-[0.35em]">
              Decode the morse signal below.
            </span>
          </div>

          {/* MAIN CARD */}
          <div className="rounded-3xl border border-white/80 bg-black/65 px-5 py-10 sm:px-12 sm:py-16 md:px-16 flex flex-col gap-8 sm:gap-12 shadow-[0_0_24px_rgba(255,255,255,0.08)] backdrop-blur-sm">
            <p className="text-gray-500 text-xs tracking-[0.4em]">
              INCOMING SIGNAL
            </p>

            <div className="flex justify-center py-3 overflow-x-auto">
              <MorseVisual word={currentWord} />
            </div>

            <div>
              <p className="text-center text-gray-500 text-xs tracking-[0.4em] mb-4 sm:mb-5">
                MORSE CODE
              </p>
              <p className="text-center text-base sm:text-lg tracking-[0.5em] sm:tracking-[0.8em] text-gray-200 break-all">
                {morseToSymbols(morse)}
              </p>
            </div>

            {hintLevel > 0 && (
              <div
                className="
    flex justify-center
    rounded-xl
    border border-yellow-500/30
    bg-yellow-500/5
    px-5 py-3
    text-yellow-300
    tracking-[0.3em]
    text-sm
  "
              >
                HINT: {revealedHint}
                {"_".repeat(Math.max(currentWord.length - hintLevel, 0))}
              </div>
            )}
            <button
              onClick={() => setShowRef((v) => !v)}
              className="mx-auto text-sm tracking-[0.25em] text-gray-500 hover:text-cyan-400 transition"
            >
              {showRef ? "▲ HIDE REFERENCE" : "SHOW REFERENCE"}
            </button>

            {showRef && (
              <div className="rounded-2xl border border-white/20 bg-black/30 p-4 sm:p-8">
                <MorseReference />
              </div>
            )}

            {/* INPUTS */}
            <div className="flex flex-col gap-5 sm:gap-7">
              <input
                ref={inputRef}
                value={answer}
                disabled={feedback === "correct" || attemptsLeft === 0}
                maxLength={20}
                placeholder="ENTER DECODED MESSAGE"
                onChange={(e) => setAnswer(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="
                  w-full rounded-2xl border-2 border-cyan-400
                  bg-[#041820] px-5 py-4 sm:px-8 sm:py-6
                  text-cyan-100 text-base sm:text-lg
                  placeholder:text-cyan-800
                  tracking-[0.2em] sm:tracking-[0.35em]
                  shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_20px_rgba(34,211,238,0.18)]
                  outline-none transition-all duration-300
                  focus:border-cyan-200 focus:shadow-[0_0_34px_rgba(34,211,238,0.5)]
                "
              />

              <button
                onClick={handleSubmit}
                disabled={
                  !answer.trim() || feedback === "correct" || attemptsLeft === 0
                }
                className="
                  w-full rounded-2xl border-2 border-cyan-300
                  bg-[#07212a] py-4 sm:py-6
                  text-cyan-200 text-base sm:text-lg
                  tracking-[0.3em] sm:tracking-[0.45em]
                  shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_28px_rgba(34,211,238,0.22)]
                  transition-all duration-300
                  hover:bg-cyan-500/15 hover:border-cyan-200 hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]
                  active:scale-[0.995] disabled:opacity-40
                "
              >
                SUBMIT DECODE
              </button>
            </div>

            {/* FEEDBACK */}
            {feedback === "wrong" && attemptsLeft > 0 && (
              <div className="rounded-xl border border-red-500 bg-red-500/5 py-4 text-center text-red-500 tracking-[0.25em]">
                ✗ INCORRECT —{" "}
                {attemptsLeft === 1
                  ? "LAST ATTEMPT"
                  : `${attemptsLeft} ATTEMPTS REMAINING`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
