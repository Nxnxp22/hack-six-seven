import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { GameState } from "./types";
import { fetchNewGame, cutWire, fetchManualRules, fetchHint } from "./services/gameApi";
import type { DBManualRule } from "./services/gameApi";
import { fetchCoins } from "./services/stabilityApi";

const PowerOverloadHardPage: React.FC = () => {
  const navigate = useNavigate();
  const [game, setGame] = useState<GameState | null>(null);
  const [seconds, setSeconds] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [hintCount, setHintCount] = useState<number>(0);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [rules, setRules] = useState<DBManualRule[]>([]);

  useEffect(() => {
    const savedSessionId = sessionStorage.getItem("active_game_session_id");
    const savedDifficulty = sessionStorage.getItem("active_game_difficulty");
    const restoreId = savedDifficulty === "HARD" ? (savedSessionId || undefined) : undefined;

    fetchNewGame("HARD", restoreId)
      .then((data) => {
        setGame(data);
        setSeconds(data.timeLimitSeconds);
        sessionStorage.setItem("active_game_session_id", data.sessionId);
        sessionStorage.setItem("active_game_difficulty", "HARD");
      })
      .catch((err) => console.error("Error connecting to Hard game:", err));

    fetchManualRules("HARD")
      .then((data) => setRules(data))
      .catch((err) => console.error("Error fetching Hard manual rules:", err));

    fetchCoins()
      .then(({ balance }) => setCoins(balance))
      .catch((err) => console.error("Error fetching coins balance:", err));
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderRuleText = (text: string) => {
    const words = text.split(" ");
    return words.map((word, idx) => {
      const cleanWord = word
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .toUpperCase();
      if (cleanWord === "RED" || cleanWord === "CRIMSON") {
        return (
          <span key={idx} className="text-rose-500 font-semibold mx-0.5">
            {word}
          </span>
        );
      }
      if (cleanWord === "BLUE") {
        return (
          <span key={idx} className="text-blue-500 font-semibold mx-0.5">
            {word}
          </span>
        );
      }
      if (cleanWord === "GREEN" || cleanWord === "EMERALD") {
        return (
          <span key={idx} className="text-emerald-500 font-semibold mx-0.5">
            {word}
          </span>
        );
      }
      if (cleanWord === "YELLOW" || cleanWord === "AMBER") {
        return (
          <span key={idx} className="text-amber-400 font-semibold mx-0.5">
            {word}
          </span>
        );
      }
      if (cleanWord === "CYAN" || cleanWord === "NEON-CYAN") {
        return (
          <span key={idx} className="text-cyan-400 font-semibold mx-0.5">
            {word}
          </span>
        );
      }
      if (cleanWord === "ORANGE") {
        return (
          <span key={idx} className="text-orange-500 font-semibold mx-0.5">
            {word}
          </span>
        );
      }
      if (cleanWord === "PURPLE" || cleanWord === "AMETHYST") {
        return (
          <span key={idx} className="text-purple-500 font-semibold mx-0.5">
            {word}
          </span>
        );
      }
      if (
        cleanWord === "1ST" ||
        cleanWord === "2ND" ||
        cleanWord === "3RD" ||
        cleanWord === "4TH" ||
        cleanWord === "LAST" ||
        cleanWord === "TOP" ||
        cleanWord === "MIDDLE"
      ) {
        return (
          <span key={idx} className="text-white font-semibold mx-0.5">
            {word}
          </span>
        );
      }
      return (
        <span key={idx} className="mx-0.5">
          {word}
        </span>
      );
    });
  };

  const renderInstruction = (instruction: string) => {
    const colors = [
      "GREEN",
      "YELLOW",
      "CYAN",
      "RED",
      "BLUE",
      "ORANGE",
      "PURPLE",
    ];
    const words = instruction.split(" ");

    return words.map((word, index) => {
      const cleanWord = word
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .toUpperCase();
      const hasDash = word.includes("-");
      const isHex = cleanWord.startsWith("#");

      if (colors.includes(cleanWord) || isHex || hasDash) {
        return (
          <span
            key={index}
            className="text-yellow-500 text-xl font-black mx-1.5 transition-all duration-300 uppercase text-glow-yellow"
          >
            {word}
          </span>
        );
      }
      return (
        <span key={index} className="mx-0.5">
          {word}
        </span>
      );
    });
  };

  // Handle Timeout
  useEffect(() => {
    if (game && seconds === 0) {
      sessionStorage.removeItem("active_game_session_id");
      sessionStorage.removeItem("active_game_difficulty");
      alert("CRITICAL OVERLOAD FAILURE: TIME EXPIRED! Stability lost: -10%");
      navigate("/", { state: { stabilityLost: 10, status: "FAILED", feature: "powerOverload" } });
    }
  }, [seconds, game, navigate]);

  const handleWireCut = async (wireId: string) => {
    if (!game) return;
    try {
      const response = await cutWire(game.sessionId, wireId);
      if (response.success) {
        const updatedWires = game.wires.map(w => w.id === wireId ? { ...w, isCut: true } : w);
        setGame({ ...game, currentCuts: response.currentCuts, wires: updatedWires });
        if (response.isGameOver) {
          sessionStorage.removeItem("active_game_session_id");
          sessionStorage.removeItem("active_game_difficulty");
          const coinsGained = 10 + Math.floor((seconds / game.timeLimitSeconds) * 30);
          alert(
            response.message ||
              `SUCCESSFULLY DEFUSED! Stability restored: +20% | Coins earned: +${coinsGained} 🪙`,
          );
          navigate("/", {
            state: {
              stabilityGained: 20,
              coinsGained,
              status: "SUCCESS",
              feature: "powerOverload",
            },
          });
        }
      } else {
        sessionStorage.removeItem("active_game_session_id");
        sessionStorage.removeItem("active_game_difficulty");
        alert(
          response.message || "CRITICAL OVERLOAD FAILURE! Stability lost: -10%",
        );
        navigate("/", {
          state: {
            stabilityLost: 10,
            status: "FAILED",
            feature: "powerOverload",
          },
        });
      }
    } catch (error) {
      console.error("Error standardizing wire execution:", error);
    }
  };

  const handleBuyHint = async () => {
    if (!game) return;
    if (hintCount >= 3) {
      alert("HINT LIMIT REACHED! You can only use up to 3 hints on Hard difficulty.");
      return;
    }
    const nextHintOrder = hintCount + 1;
    const cost = nextHintOrder === 1 ? 15 : 20;

    if (coins < cost) {
      alert(`INSUFFICIENT COINS! Hint requires ${cost} coins, but you only have ${coins} coins.`);
      return;
    }

    try {
      const response = await fetchHint(game.sessionId, nextHintOrder);
      if (response.success) {
        setHintCount(nextHintOrder);
        setCoins(response.balance);
        setActiveHint(response.hintText);
      } else {
        alert(response.hintText || "Failed to purchase hint.");
      }
    } catch (error: any) {
      if (error.response?.data?.message === "INSUFFICIENT_COINS") {
        alert(`INSUFFICIENT COINS! Hint requires ${cost} coins.`);
      } else {
        console.error("Error purchasing hint:", error);
      }
    }
  };

  if (!game)
    return (
      <div className="bg-black min-h-screen text-zinc-500 font-mono flex items-center justify-center">
        LOADING HARD DATA MODULES...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white font-sans relative select-none">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none"></div>

      <nav className="flex items-center justify-between px-8 py-5 bg-black border-b border-zinc-900/60 z-20 relative">
        {/* Left Group */}
        <div className="flex items-center gap-12">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="text-zinc-400 hover:text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            BACK
          </button>

          {/* Dynamic header depending on manual open state */}
          {!isManualOpen ? (
            <div className="text-yellow-500 font-extrabold text-xs tracking-[0.25em] uppercase flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 fill-current text-yellow-500 animate-pulse"
                viewBox="0 0 24 24"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              POWER OVERLOAD [HARD]
            </div>
          ) : (
            <div className="text-yellow-500 font-extrabold text-xs tracking-[0.25em] uppercase flex items-center gap-2">
              <svg
                className="w-4 h-4 fill-none stroke-current text-yellow-500"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15.25a3.25 3.25 0 110-6.5 3.25 3.25 0 010 6.5z"
                />
                <circle cx="12" cy="12" r="0.75" fill="currentColor" />
              </svg>
              COMM FAILURE
            </div>
          )}

          {/* Dynamic manual button style depending on active state */}
          <button
            onClick={() => setIsManualOpen(!isManualOpen)}
            className={`flex items-center gap-2 border px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              isManualOpen
                ? "bg-yellow-500 text-zinc-950 border-yellow-500 shadow-md"
                : "text-zinc-400 hover:text-yellow-500 border-zinc-800"
            }`}
          >
            {isManualOpen ? (
              <svg
                className="w-3.5 h-3.5 fill-current text-zinc-950"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
            MANUAL
          </button>
          
          {/* Hint Button */}
          <button
            disabled={hintCount >= 3}
            onClick={handleBuyHint}
            className={`flex items-center gap-2 border px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-200
              ${hintCount >= 3
                ? "border-zinc-800 text-zinc-600 bg-zinc-950 cursor-not-allowed opacity-50"
                : "text-yellow-500 border-yellow-800/80 hover:text-yellow-400 hover:border-yellow-500/70 hover:shadow-[0_0_12px_rgba(234,179,8,0.3)] cursor-pointer"
              }`}
          >
            <svg className={`w-3.5 h-3.5 fill-current ${hintCount >= 3 ? "text-zinc-600" : "text-yellow-500"}`} viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm0-4h-2V7h2v7z" />
            </svg>
            {hintCount >= 3 ? "HINT EXHAUSTED" : `HINT (${hintCount === 0 ? 15 : 20} 🪙)`}
          </button>
        </div>

        {/* Right Group: Stacked HUD Counters */}
        <div className="flex items-center gap-12 font-mono mr-4">
          <div className="text-right">
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-0.5">
              COINS
            </p>
            <p className="text-lg font-bold tracking-wide text-yellow-500 text-glow-yellow">
              🪙 {coins}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-0.5">
              CUT
            </p>
            <p className="text-lg font-bold tracking-wide text-zinc-200">
              {game.currentCuts}/{game.totalCutsNeeded}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-0.5">
              TIME
            </p>
            <p className="text-lg font-bold tracking-wider text-yellow-500 text-glow-yellow">
              {formatTime(seconds)}
            </p>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col relative z-10">
        {/* INLINE EXPANDABLE HACKING MANUAL CARD */}
        {isManualOpen && (
          <div className="border border-yellow-500 bg-zinc-950/90 rounded-lg p-6 mb-8 max-w-2xl w-full mx-auto font-mono text-[11px] text-zinc-500 border-glow-yellow animate-fadeIn leading-relaxed">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4">
              <svg
                className="w-4 h-4 text-yellow-500 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
              <h3 className="text-yellow-500 font-bold text-xs tracking-wider uppercase">
                NEXUS HACKING MANUAL : SECURITY OVERRIDE [HARD]
              </h3>
            </div>

            <p className="text-zinc-400 font-sans mb-4 text-xs">
              <span className="font-bold text-zinc-200">OBJECTIVE:</span>{" "}
              Reroute power safety by cutting the correct wires.
            </p>

            <div className="space-y-4">
              {/* Hard Rule */}
              <div>
                <p className="text-yellow-500 font-bold mb-1.5 flex items-center gap-1 uppercase tracking-wide">
                  ⚡ HARD RESOLUTION PROTOCOL (5 wires - cut 3)
                </p>
                <ul className="space-y-1.5 pl-4 list-disc">
                  {rules.map((rule) => {
                    const isSpecialTip = rule.rule_number === 4;
                    return (
                      <li
                        key={rule.id}
                        className={
                          isSpecialTip
                            ? "list-none text-yellow-500 font-semibold mt-1"
                            : ""
                        }
                      >
                        {!isSpecialTip && `Wire ${rule.rule_number}: `}
                        {isSpecialTip
                          ? `*${rule.description}`
                          : renderRuleText(rule.description)}
                      </li>
                    );
                  })}
                  <li className="list-none text-zinc-500 font-mono text-[9px] mt-2 uppercase leading-normal tracking-wide border-t border-zinc-900 pt-2">
                    ⚠️ System Signatures Legend: GREEN (
                    <span className="text-emerald-500 font-semibold">
                      BIO-SYNAPSE
                    </span>
                    ), YELLOW (
                    <span className="text-amber-400 font-semibold">
                      SOLAR-VOLT
                    </span>
                    ), CYAN (
                    <span className="text-cyan-400 font-semibold">
                      CRYO-LINK
                    </span>
                    ), RED (
                    <span className="text-rose-500 font-semibold">
                      DANGER-CORE
                    </span>
                    ), PURPLE (
                    <span className="text-purple-500 font-semibold">
                      VOID-NODE
                    </span>
                    ).
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE HINT CARD */}
        {activeHint && (
          <div className="border border-yellow-500/50 bg-yellow-950/20 rounded-lg p-5 mb-12 flex items-center gap-4 max-w-2xl w-full mx-auto border-glow-yellow animate-fadeIn">
            <div className="w-6 h-6 rounded border border-yellow-500 flex items-center justify-center text-yellow-500 font-black text-sm shrink-0 text-glow-yellow animate-pulse">
              H
            </div>
            <div className="w-full text-center pr-6">
              <span className="text-yellow-500 font-bold text-sm tracking-widest uppercase font-mono text-glow-yellow flex items-center justify-center flex-wrap">
                {activeHint}
              </span>
            </div>
          </div>
        )}

        {/* Warning card alert */}
        <div className="border border-yellow-500 bg-yellow-500/5 rounded-lg p-5 mb-12 flex items-center gap-4 max-w-2xl w-full mx-auto border-glow-yellow">
          <div className="w-6 h-6 rounded border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-black text-sm shrink-0 text-glow-yellow animate-pulse">
            !
          </div>
          <div className="w-full text-center pr-6">
            <span className="text-yellow-500 font-bold text-sm tracking-widest uppercase font-mono text-glow-yellow flex items-center justify-center flex-wrap">
              {renderInstruction(game.instruction)}
            </span>
          </div>
        </div>

        {/* Junction Box Card */}
        <div className="border border-zinc-900 bg-zinc-950/40 rounded-xl p-8 max-w-lg w-full mx-auto shadow-2xl relative">
          <header className="text-center mb-8">
            <h2 className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.25em] mb-1">
              Power Junction Box
            </h2>
            <p className="text-zinc-600 text-[10px]">
              Click on wires to cut them
            </p>
          </header>

          <div className="flex flex-col gap-3.5">
            {game.wires.map((wire) => (
              <button
                key={wire.id}
                disabled={wire.isCut}
                onClick={() => handleWireCut(wire.id)}
                className={`w-full py-4 px-6 rounded font-black text-xs text-left uppercase tracking-[0.15em] transition-all transform
                  ${wire.isCut 
                    ? "bg-zinc-900/40 text-zinc-600 border border-zinc-900 line-through opacity-45 cursor-not-allowed pointer-events-none" 
                    : `cursor-pointer hover:brightness-110 active:scale-[0.98] shadow-lg
                       ${wire.color === "GREEN" ? "bg-[#00c838] text-white shadow-emerald-500/10 hover:bg-[#00b430]" : ""}
                       ${wire.color === "YELLOW" ? "bg-[#ffbc00] text-white shadow-amber-400/10 hover:bg-[#eab000]" : ""}
                       ${wire.color === "CYAN" ? "bg-[#00b4db] text-white shadow-cyan-500/10 hover:bg-[#00a3c6]" : ""}
                       ${wire.color === "RED" ? "bg-[#e11d48] text-white shadow-rose-600/10 hover:bg-[#f43f5e]" : ""}
                       ${wire.color === "BLUE" ? "bg-[#2563eb] text-white shadow-blue-600/10 hover:bg-[#3b82f6]" : ""}
                       ${wire.color === "ORANGE" ? "bg-[#f97316] text-white shadow-orange-500/10 hover:bg-[#fb923c]" : ""}
                       ${wire.color === "PURPLE" ? "bg-[#9333ea] text-white shadow-purple-600/10 hover:bg-[#a855f7]" : ""}
                    `
                  }
                `}
              >
                {wire.isCut ? `⚡ [SEVERED] ${wire.label}` : wire.label}
              </button>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-900/60 text-center">
            <span className="text-[9px] text-zinc-600 font-mono tracking-widest">
              CONSOLE PKY: {game.serialNumber}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PowerOverloadHardPage;
