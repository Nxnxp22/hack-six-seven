import { useState, useRef, useEffect } from "react";
import { wordToMorse, morseToSymbols } from "../lib/morse";
import { useTimer } from "../hooks/useTimer";
import MorseVisual from "../components/MorseVisual";
import MorseReference from "../components/MorseReference";

type Phase = "loading" | "playing" | "result";

export default function GamePage() {
  const [currentWord, setCurrentWord] = useState<string>("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const [showRef, setShowRef] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const roundStartRef = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExpire = () => setPhase("result");
  const { timeLeft, formatted } = useTimer(120, handleExpire);

  // Fetch word from API on mount
  useEffect(() => {
    fetch("/api/challenges?count=1")
      .then((r) => r.json())
      .then((data) => {
        const word = data.challenges?.[0]?.word;
        if (word) {
          setCurrentWord(word);
          setPhase("playing");
        }
      })
      .catch(() => {
        // fallback if API is down
        setCurrentWord("SOS");
        setPhase("playing");
      });
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      roundStartRef.current = Date.now();
      setAnswer("");
      setFeedback(null);
      setShowRef(false);
      inputRef.current?.focus();
    }
  }, [phase]);

  const handleSubmit = () => {
    if (!answer.trim() || feedback === "correct") return;

    const isCorrect = answer.trim().toUpperCase() === currentWord.toUpperCase();

    if (isCorrect) {
      setCorrectCount(c => c + 1);
      setTimeout(() => setPhase("result"), 600);
    } else {
      setFeedback("wrong");
    }
  };

  const handleRestart = () => window.location.reload();

  const morse = wordToMorse(currentWord);

  // LOADING screen
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <p className="text-cyan-800 text-xs tracking-[0.4em] animate-pulse">INCOMING SIGNAL...</p>
      </div>
    );
  }
  if (phase === "result") {
    const passed = correctCount === 1;
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6 text-white font-mono">
        <div className="text-center">
          <h1 className={`text-4xl font-bold tracking-[0.4em] mb-4 ${passed ? "text-cyan-400" : "text-red-500"}`}>
            {passed ? "COMPLETED" : "COMM FAILURE"}
          </h1>
          <p className="text-gray-500 tracking-[0.3em] text-xs mb-10">
            {passed ? "SIGNAL DECODED SUCCESSFULLY" : "TRANSMISSION LOST"}
          </p>
          <button
            onClick={() => window.location.href = "/"}
            className="px-10 py-3 text-xs tracking-[0.3em] border border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition font-mono"
          >
            ← BACK TO MAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono border border-cyan-950 flex flex-col">

      {/* HEADER */}

      <header className="px-10 py-6 border-b border-cyan-950 flex justify-between">

        <div className="flex gap-10 items-center text-xs uppercase tracking-[0.25em]">

          <button className="text-gray-400 hover:text-white">
            ← Back
          </button>

          <div className="text-cyan-400 font-bold flex gap-2">
            <span>⟨◉⟩</span>
            <span>COMM FAILURE</span>
          </div>

          <button
            onClick={() => setShowManual(v => !v)}
            className={`
              px-3 py-1 border transition
              ${
                showManual
                  ? "bg-cyan-400 text-black border-cyan-400"
                  : "border-gray-700 text-gray-400"
              }
            `}
          >
            ⊞ MANUAL
          </button>

        </div>

        <div className="flex gap-12">

          <div className="text-right">
            <p className="text-gray-500 text-[10px]">
              LEN
            </p>

            <p className="text-cyan-400 text-xl">
              1/1
            </p>
          </div>

          <div className="text-right">
            <p className="text-gray-500 text-[10px]">
              TIME
            </p>

            <p
              className={`text-xl font-bold ${
                timeLeft <= 30
                  ? "text-red-500"
                  : "text-cyan-400"
              }`}
            >
              {formatted}
            </p>
          </div>

        </div>

      </header>

    {/* BODY */}

<div className="flex-1 flex justify-center px-8 pt-20 pb-24">

  <div className="w-full max-w-[1120px]">

    {/* MANUAL */}

    {showManual && (

      <div
        className="
        mb-8
        rounded-2xl
        border
        border-cyan-500
        bg-cyan-950/10
        px-9
        py-8
        shadow-[0_0_18px_rgba(34,211,238,0.08)]
      "
      >

        <h3 className="text-cyan-400 text-xs tracking-[0.4em] mb-6">
          NEXUS FIELD MANUAL
        </h3>

        <div className="space-y-4 text-gray-400 text-sm leading-7">

          <p>Decode incoming Morse transmissions.</p>
          <p>Use reference chart when needed.</p>
          <p>Enter decoded word and submit.</p>

        </div>

      </div>

    )}

    {/* ALERT */}

    <div
      className="
      mb-8
      rounded-2xl
      border
      border-cyan-500
      px-7
      py-6
      text-cyan-400
      flex
      gap-4
      shadow-[0_0_14px_rgba(34,211,238,0.08)]
    "
    >

      <span>⚠</span>

      <span className="text-xs tracking-[0.35em]">
        Decode the morse signal below.
      </span>

    </div>

    {/* MAIN CARD */}

    <div
      className="
      rounded-3xl
      border
      border-white/80
      bg-black/65

      px-12
      py-16

      md:px-16
      md:py-16

      flex
      flex-col
      gap-12

      shadow-[0_0_24px_rgba(255,255,255,0.08)]

      backdrop-blur-sm
    "
    >

      <p className="text-gray-500 text-xs tracking-[0.4em]">
        INCOMING SIGNAL
      </p>

      <div className="flex justify-center py-3">
        <MorseVisual word={currentWord} />
      </div>

      <div>

        <p className="text-center text-gray-500 text-xs tracking-[0.4em] mb-5">
          MORSE CODE
        </p>

        <p className="text-center text-lg tracking-[0.8em] text-gray-200">
          {morseToSymbols(morse)}
        </p>

      </div>

      {/* REFERENCE */}

      <button
        onClick={() => setShowRef(v => !v)}
        className="
        mx-auto
        text-sm
        tracking-[0.25em]
        text-gray-500
        hover:text-cyan-400
        transition
      "
      >
        {showRef
          ? "▲ HIDE REFERENCE"
          : "SHOW REFERENCE"}
      </button>

      {showRef && (

        <div
          className="
          rounded-2xl
          border
          border-white/20
          bg-black/30
          p-8
        "
        >

          <MorseReference />

        </div>

      )}

      {/* INPUTS */}

      <div className="flex flex-col gap-7">

        <input
          ref={inputRef}
          value={answer}
          disabled={feedback === "correct"}
          maxLength={20}
          placeholder="ENTER DECODED MESSAGE"
          onChange={(e) =>
            setAnswer(e.target.value.toUpperCase())
          }
          onKeyDown={(e) =>
            e.key === "Enter" && handleSubmit()
          }
          className="
            w-full

            rounded-2xl
            border-2
            border-cyan-400

            bg-[#041820]

            px-8
            py-6

            text-cyan-100
            text-lg

            placeholder:text-cyan-800

            tracking-[0.35em]

            shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_20px_rgba(34,211,238,0.18)]

            outline-none
            transition-all
            duration-300

            focus:border-cyan-200
            focus:shadow-[0_0_34px_rgba(34,211,238,0.5)]
          "
        />

        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || feedback === "correct"}
          className="
            w-full

            rounded-2xl
            border-2
            border-cyan-300

            bg-[#07212a]

            py-6

            text-cyan-200
            text-lg

            tracking-[0.45em]

            shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_28px_rgba(34,211,238,0.22)]

            transition-all
            duration-300

            hover:bg-cyan-500/15
            hover:border-cyan-200
            hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]

            active:scale-[0.995]

            disabled:opacity-40
          "
        >
          SUBMIT DECODE
        </button>

      </div>

      {/* FEEDBACK — wrong only */}

      {feedback === "wrong" && (

        <div
          className="
          rounded-xl
          border
          border-red-500
          bg-red-500/5
          py-4
          text-center
          text-red-500
          tracking-[0.25em]
        "
        >

          ✗ INCORRECT — TRY AGAIN

        </div>

      )}

    </div>

  </div>

</div>
    </div>
  );
}
