import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ─── Module Data ─────────────────────────────────────────────────────────────

interface GameModule {
  id: string;
  category: string;
  name: string;
  description: string;
  stability: number;
  decayIntervalMs: number;
  route: string;
  implemented: boolean;
  accentHex: string;
  accentClass: string;
  barClass: string;
  borderClass: string;
  iconBgClass: string;
  icon: React.ReactNode;
}

/** Per-module decay: −1% every N ms (yellow 5s, orange 7s, cyan 10s, purple 14s) */
const MODULE_DECAY_MS: Record<string, number> = {
  powerOverload: 5000,
  reactionFailure: 7000,
  commCollapse: 10000,
  securityLockdown: 14000,
};

const LightningIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SignalIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const INITIAL_MODULES: GameModule[] = [
  {
    id: "powerOverload",
    category: "WIRE DEFUSAL",
    name: "POWER OVERLOAD",
    description: "Reroute the power grid before critical systems fail. Cut the correct wires to prevent cascade failure.",
    stability: 100,
    decayIntervalMs: MODULE_DECAY_MS.powerOverload,
    route: "/poweroverload",
    implemented: true,
    accentHex: "#eab308",
    accentClass: "text-yellow-400",
    barClass: "bg-yellow-400",
    borderClass: "border-yellow-500/40 hover:border-yellow-400/70",
    iconBgClass: "bg-yellow-400/15 text-yellow-400",
    icon: <LightningIcon />,
  },
  {
    id: "reactionFailure",
    category: "SYNCHRONIZATION",
    name: "REACTION FAILURE",
    description: "Reactor cooling sequence compromised. Replicate the pattern to stabilize reactor core temperature.",
    stability: 100,
    decayIntervalMs: MODULE_DECAY_MS.reactionFailure,
    route: "/reaction-failure",
    implemented: false,
    accentHex: "#f97316",
    accentClass: "text-orange-400",
    barClass: "bg-orange-400",
    borderClass: "border-orange-500/40 hover:border-orange-400/70",
    iconBgClass: "bg-orange-400/15 text-orange-400",
    icon: <ActivityIcon />,
  },
  {
    id: "commCollapse",
    category: "SIGNAL DECODER",
    name: "COMM COLLAPSE",
    description: "Emergency transmission detected. Decode the morse signal to receive critical survivor coordinates.",
    stability: 100,
    decayIntervalMs: MODULE_DECAY_MS.commCollapse,
    route: "/comm-collapse",
    implemented: false,
    accentHex: "#22d3ee",
    accentClass: "text-cyan-400",
    barClass: "bg-cyan-400",
    borderClass: "border-cyan-500/40 hover:border-cyan-400/70",
    iconBgClass: "bg-cyan-400/15 text-cyan-400",
    icon: <SignalIcon />,
  },
  {
    id: "securityLockdown",
    category: "ACCESS OVERRIDE",
    name: "SECURITY LOCKDOWN",
    description: "System lockdown initiated. Analyze security logs to find the override code and restore access.",
    stability: 100,
    decayIntervalMs: MODULE_DECAY_MS.securityLockdown,
    route: "/security-lockdown",
    implemented: false,
    accentHex: "#c084fc",
    accentClass: "text-purple-400",
    barClass: "bg-purple-400",
    borderClass: "border-purple-500/40 hover:border-purple-400/70",
    iconBgClass: "bg-purple-400/15 text-purple-400",
    icon: <LockIcon />,
  },
];

const NEXUS_PINK = "#e91e8c";

// ─── Stability bar color helper ───────────────────────────────────────────────
const getStabilityColor = (pct: number) => {
  if (pct < 25) {
    return { bar: "bg-red-500", text: "text-red-400", glow: "#ef4444", blink: true };
  }
  if (pct >= 70) return { bar: "bg-emerald-400", text: "text-emerald-400", glow: "#34d399", blink: false };
  if (pct >= 40) return { bar: "bg-orange-400", text: "text-orange-400", glow: "#fb923c", blink: false };
  return { bar: "bg-orange-400", text: "text-orange-400", glow: "#fb923c", blink: false };
};

const averageStability = (mods: GameModule[]) =>
  Math.round(mods.reduce((sum, m) => sum + m.stability, 0) / mods.length);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const MainDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [modules, setModules] = useState<GameModule[]>(INITIAL_MODULES);
  const [flashMsg, setFlashMsg] = useState<{ text: string; type: "success" | "fail" } | null>(null);
  const [scanlineY, setScanlineY] = useState(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scanline animation
  useEffect(() => {
    const t = setInterval(() => setScanlineY(y => (y + 1) % 101), 30);
    return () => clearInterval(t);
  }, []);

  // Each module loses 1% on its own timer (yellow 5s, orange 7s, cyan 10s, purple 14s)
  useEffect(() => {
    const timers = INITIAL_MODULES.map((mod) =>
      setInterval(() => {
        setModules((prev) =>
          prev.map((m) =>
            m.id === mod.id ? { ...m, stability: Math.max(0, m.stability - 1) } : m
          )
        );
      }, mod.decayIntervalMs)
    );
    return () => timers.forEach(clearInterval);
  }, []);

  const systemStability = averageStability(modules);
  const systemCritical = systemStability < 25;

  // Handle game return state
  useEffect(() => {
    const state = location.state as {
      stabilityGained?: number;
      stabilityLost?: number;
      status?: string;
      feature?: string;
    } | null;

    if (!state) return;

    if (state.stabilityGained) {
      setModules(prev => prev.map(m =>
        m.id === state.feature ? { ...m, stability: Math.min(100, m.stability + state.stabilityGained!) } : m
      ));
      setFlashMsg({ text: `✓ MAINTENANCE COMPLETE — STABILITY +${state.stabilityGained}%`, type: "success" });
    } else if (state.stabilityLost) {
      setModules(prev => prev.map(m =>
        m.id === state.feature ? { ...m, stability: Math.max(0, m.stability - state.stabilityLost!) } : m
      ));
      setFlashMsg({ text: `✗ CRITICAL FAILURE — STABILITY −${state.stabilityLost}%`, type: "fail" });
    }

    // Clear the location state so it doesn't re-trigger
    window.history.replaceState({}, "");

    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashMsg(null), 4000);
  }, [location.state]);

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden select-none">

      {/* ── Background grid ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(233,30,140,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(233,30,140,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Scanline sweep ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 h-[2px] opacity-10 transition-none"
          style={{
            top: `${scanlineY}%`,
            background: "linear-gradient(90deg, transparent, #e91e8c 40%, #e91e8c 60%, transparent)",
          }}
        />
      </div>

      {/* ── Top header bar ── */}
      <header className="relative z-20 border-b border-zinc-800/60 bg-black/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded border border-[#e91e8c]/70 bg-[#e91e8c]/10 flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: "0 0 12px rgba(233,30,140,0.25)" }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#e91e8c]" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <div className="text-[#e91e8c] font-black text-sm tracking-[0.2em] uppercase"
              style={{ textShadow: "0 0 20px rgba(233,30,140,0.5)" }}>
              NEXUS CONTROL
            </div>
            <div className="text-zinc-500 text-[9px] tracking-[0.25em] uppercase">
              EMERGENCY BUNKERS SYSTEM HUD
            </div>
          </div>
        </div>

        {/* Stability only */}
        <div className="text-right">
          <div className="text-zinc-500 text-[9px] tracking-widest uppercase">STABILITY</div>
          <div
            className={`text-lg font-black tracking-wider ${systemCritical ? "text-red-400 stability-critical-blink" : "text-[#e91e8c]"}`}
            style={{ textShadow: systemCritical ? "0 0 15px rgba(239,68,68,0.7)" : "0 0 15px rgba(233,30,140,0.6)" }}
          >
            {systemStability}%
          </div>
        </div>
      </header>

      {/* ── System stability bar ── */}
      <div className="relative z-20 border-b border-zinc-800/40 px-6 py-3 bg-black/70">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${systemCritical ? "bg-red-500" : "bg-[#e91e8c]"}`} />
            <span className="text-zinc-500">SYSTEM STABILITY:</span>
            <span className={`font-bold ${systemCritical ? "text-red-400 stability-critical-blink" : "text-[#e91e8c]"}`}>
              {systemStability}%
            </span>
            <span className="text-zinc-700 text-[9px] hidden sm:inline">(avg · 4 modules)</span>
          </div>
          <div className={`text-[10px] tracking-widest uppercase ${systemCritical ? "text-red-400 stability-critical-blink" : "text-zinc-600"}`}>
            {systemCritical ? "CRITICAL · IMMINENT CASCADE FAILURE" :
             systemStability >= 70 ? "SYSTEM SECURE · STABLE STATE" :
             systemStability >= 40 ? "WARNING · DEGRADED PERFORMANCE" :
             "DEGRADED · MONITOR ALL SYSTEMS"}
          </div>
        </div>
        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${systemCritical ? "bg-red-500 stability-critical-blink" : "bg-[#e91e8c]"}`}
            style={{
              width: `${systemStability}%`,
              boxShadow: systemCritical ? "0 0 12px rgba(239,68,68,0.8)" : `0 0 10px ${NEXUS_PINK}b3`,
            }}
          />
        </div>
      </div>

      {/* ── Flash notification ── */}
      {flashMsg && (
        <div className={`relative z-30 px-6 py-2 text-xs font-bold tracking-widest text-center border-b transition-all
          ${flashMsg.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
            : "bg-rose-500/10 border-rose-500/40 text-rose-400"
          }`}
          style={{ animation: "flashIn 0.3s ease" }}
        >
          {flashMsg.text}
        </div>
      )}

      {/* ── Module grid ── */}
      <main className="relative z-10 p-6 max-w-5xl mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gradient-to-r from-[#e91e8c]/30 to-transparent" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
            MAINTENANCE OPERATIONS · {modules.length} SYSTEMS ONLINE
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-[#e91e8c]/30 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => {
            const stab = getStabilityColor(mod.stability);
            const isCritical = mod.stability < 25;
            return (
              <div
                key={mod.id}
                className={`group relative border rounded-lg p-5 transition-all duration-300 cursor-pointer
                  bg-zinc-950/60 backdrop-blur-sm hover:bg-zinc-900/60
                  ${mod.borderClass}
                  ${isCritical ? "border-red-500/50" : ""}
                `}
                onClick={() => navigate(mod.route)}
                style={{
                  borderStyle: "solid",
                  boxShadow: `0 0 20px ${mod.accentHex}12`,
                }}
              >
                {/* Card top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 border border-current transition-all group-hover:shadow-lg ${mod.iconBgClass}`}
                      style={{ boxShadow: `0 0 14px ${mod.accentHex}40` }}
                    >
                      <div className={mod.accentClass}>{mod.icon}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-[9px] tracking-[0.25em] uppercase mb-0.5">{mod.category}</div>
                      <div
                        className={`font-black text-sm tracking-wider uppercase transition-all ${mod.accentClass}`}
                        style={{ textShadow: `0 0 12px ${mod.accentHex}60` }}
                      >
                        {mod.name}
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  {!mod.implemented && (
                    <span
                      className="text-[8px] font-bold tracking-widest px-2 py-0.5 rounded border uppercase"
                      style={{ borderColor: `${mod.accentHex}55`, color: mod.accentHex }}
                    >
                      ROUTE PENDING
                    </span>
                  )}
                  {isCritical && (
                    <span className="text-[8px] font-bold tracking-widest px-2 py-0.5 rounded border border-red-500/60 text-red-400 uppercase stability-critical-blink">
                      CRITICAL
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-zinc-500 text-[11px] leading-relaxed mb-4 font-sans">
                  {mod.description}
                </p>

                {/* Stability bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-zinc-600 text-[9px] tracking-widest uppercase">SYSTEM STABILITY:</span>
                    <span className={`text-[10px] font-bold ${stab.text} ${stab.blink ? "stability-critical-blink" : ""}`}>
                      {Math.round(mod.stability)}%
                    </span>
                  </div>
                  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${stab.bar} ${stab.blink ? "stability-critical-blink" : ""}`}
                      style={{
                        width: `${mod.stability}%`,
                        boxShadow: `0 0 6px ${stab.glow}80`,
                      }}
                    />
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(mod.route);
                  }}
                  className="w-full py-2 text-[10px] font-bold tracking-[0.25em] uppercase rounded border transition-all duration-200 text-zinc-300 hover:text-white"
                  style={{ borderColor: `${mod.accentHex}66` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = mod.accentHex;
                    e.currentTarget.style.boxShadow = `0 0 12px ${mod.accentHex}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${mod.accentHex}66`;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  PERFORM MAINTENANCE
                </button>

                {/* Corner decoration */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg opacity-60 transition-opacity group-hover:opacity-100"
                  style={{ borderColor: mod.accentHex }} />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-lg opacity-60 transition-opacity group-hover:opacity-100"
                  style={{ borderColor: mod.accentHex }} />
              </div>
            );
          })}
        </div>

        {/* Bottom status row */}
        <div className="mt-6 flex items-center justify-between text-[9px] tracking-widest text-zinc-700 uppercase">
          <div className="flex items-center gap-4">
            <span>NEXUS CORE OS v4.3.0</span>
            <span className="text-zinc-800">|</span>
            <span>HACK-SIXSEVEN PROJECT</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1 ${systemCritical ? "text-red-400 stability-critical-blink" : "text-[#e91e8c]"}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${systemCritical ? "bg-red-500" : "bg-[#e91e8c]"}`} />
              SYSTEM {systemCritical ? "CRITICAL" : systemStability >= 70 ? "NOMINAL" : systemStability >= 40 ? "DEGRADED" : "UNSTABLE"}
            </span>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes flashIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default MainDashboard;
