import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal, Shield, Zap, Activity } from "lucide-react";

const WelcomeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);
  const [systemOnline, setSystemOnline] = useState(false);

  useEffect(() => {
    const messages = [
      "SYSINIT: LOADING CRITICAL POWER MATRIX...",
      "WARNING: DETECTED VOLTAGE FLUCTUATION IN NEXUS-C...",
      "COMM FAILURE IMMINENT. ENTERING SECURITY OVERRIDE MODE...",
      "GRID STABILITY: 14% AND DECREASING.",
      "MANUAL OVERRIDE: READY. STAND BY FOR HACKING PROTOCOL...",
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < messages.length) {
        setLogs((prev) => [...prev, messages[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
        setSystemOnline(true);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const handleStartHacking = (difficulty: "EASY" | "MEDIUM" | "HARD") => {
    navigate(`/game?difficulty=${difficulty}`);
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-center px-4 overflow-hidden select-none">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none"></div>

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-zinc-500 hover:text-yellow-400 text-xs uppercase tracking-widest transition-colors font-mono"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        BACK TO HUB
      </button>

      {/* Decorative cyber elements */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between pointer-events-none opacity-40 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />
          <span>SYS_STATUS: EMERGENCY_OVERRIDE</span>
        </div>
        <div>STATION: NEXUS_0x6A7</div>
      </div>

      <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8 items-stretch z-10 p-6 md:p-10 border border-zinc-900 bg-zinc-950/60 backdrop-blur-md rounded-2xl shadow-2xl relative">
        {/* Glow decoration */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/20 to-red-500/10 rounded-2xl blur opacity-30 pointer-events-none"></div>

        {/* Left column: Tactical Briefing */}
        <div className="flex-1 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 pb-6 md:pb-0 md:pr-8">
          <div>
            <div className="flex items-center gap-3 text-yellow-500 mb-4">
              <Zap className="w-8 h-8 text-glow-yellow animate-pulse" />
              <h1 className="text-2xl font-black tracking-widest uppercase text-glow-yellow">
                Power Overload
              </h1>
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed font-sans mb-6">
              Critical grid malfunction detected in the reactor core. Core
              coolant pressure is failing. The system requires manual sequence
              decryptions by cutting the correct sequence of power wires. Review
              the{" "}
              <span className="text-yellow-500 font-bold">NEXUS HACKING MANUAL</span>{" "}
              inline during operations to avoid an immediate explosive reaction.
            </p>
          </div>

          <div className="bg-black/80 border border-zinc-900 rounded-lg p-4 font-mono text-[10px] space-y-1.5 min-h-[160px] flex flex-col justify-end">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-2 border-b border-zinc-900 pb-1.5 uppercase font-bold tracking-wider">
              <Terminal className="w-3 h-3 text-yellow-500" />
              <span>Core Console Feed</span>
            </div>
            {logs.map((log, index) => (
              <p key={index} className={`truncate ${log.includes("WARNING") ? "text-red-400" : "text-zinc-400"}`}>
                &gt; {log}
              </p>
            ))}
            {systemOnline && (
              <p className="text-emerald-400 font-bold animate-pulse">&gt; GRID OVERRIDE CONSOLE READY.</p>
            )}
          </div>
        </div>

        {/* Right column: Hacking Protocols */}
        <div className="flex-1 flex flex-col justify-center pl-0 md:pl-4 py-4">
          <h2 className="text-zinc-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-500" />
            Select Decryption Protocol
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => handleStartHacking("EASY")}
              className="w-full text-left group border border-zinc-900 hover:border-yellow-500/50 bg-zinc-950 hover:bg-yellow-500/[0.02] p-4 rounded-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-1.5">
                <h3 className="font-bold text-sm tracking-wide text-zinc-200 group-hover:text-yellow-500 transition-colors">
                  EASY PROTOCOL
                </h3>
                <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20">
                  3 WIRES · 1 CUT
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                Simple grid configuration. Perfect for validating hacking console connectivity.
              </p>
            </button>

            <button
              onClick={() => handleStartHacking("MEDIUM")}
              className="w-full text-left group border border-zinc-900 hover:border-orange-500/50 bg-zinc-950 hover:bg-orange-500/[0.02] p-4 rounded-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-1.5">
                <h3 className="font-bold text-sm tracking-wide text-zinc-200 group-hover:text-orange-500 transition-colors">
                  MEDIUM PROTOCOL
                </h3>
                <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded border border-orange-500/20">
                  5 WIRES · 2 CUTS
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                Intermediate sequencing. Requires careful verification of conflicting conditions.
              </p>
            </button>

            <button
              onClick={() => handleStartHacking("HARD")}
              className="w-full text-left group border border-zinc-900 hover:border-red-500/50 bg-zinc-950 hover:bg-red-500/[0.02] p-4 rounded-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-1.5">
                <h3 className="font-bold text-sm tracking-wide text-zinc-200 group-hover:text-red-500 transition-colors">
                  HARD PROTOCOL
                </h3>
                <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20">
                  7 WIRES · 3 CUTS
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                Highly unstable system. Complex overlapping multi-wire severance sequence required.
              </p>
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-zinc-600 text-[10px] font-mono tracking-widest z-10">
        NEXUS CORE OS v4.3.0 // HACK-SIXSEVEN PROJECT
      </footer>
    </div>
  );
};

export default WelcomeDashboard;
