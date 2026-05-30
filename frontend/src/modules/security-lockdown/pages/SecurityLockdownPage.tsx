import { useEffect, useRef, useState } from "react";
import type {
  Difficulty,
  PuzzlePublicDTO,
  SubmitResponseDTO,
} from "../types/passwordPuzzle.types";
import * as service from "../services/passwordPuzzle.service";
import ClassifiedDocument from "../components/ClassifiedDocument";
import PasswordInput from "../components/PasswordInput";
import StatusDisplay from "../components/StatusDisplay";
import ResultBanner from "../components/ResultBanner";

const DIFFICULTY_ACTIVE: Record<Difficulty, string> = {
  EASY: "border-emerald-500 text-emerald-400 bg-emerald-500/10",
  MEDIUM: "border-amber-500  text-amber-400  bg-amber-500/10",
  HARD: "border-red-500    text-red-400    bg-red-500/10",
};

export default function SecurityLockdownPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("EASY");
  const [puzzle, setPuzzle] = useState<PuzzlePublicDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponseDTO | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [coinsSpentHints, setCoinsSpentHints] = useState(0);
  const [currentCoins, setCurrentCoins] = useState(100);
  const [revealedHints, setRevealedHints] = useState<Record<string, string>>(
    {},
  );
  const [hintError, setHintError] = useState<string | null>(null);

  // Timer starts when the puzzle loads
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    loadPuzzle();
  }, [difficulty]);

  async function loadPuzzle() {
    setLoading(true);
    setPageError(null);
    setResult(null);
    setAnswer("");
    setHintsUsed(0);
    setCoinsSpentHints(0);
    setRevealedHints({});
    setHintError(null);
    startTimeRef.current = Date.now();
    try {
      const data = await service.fetchRandomPuzzle(difficulty);
      setPuzzle(data);
    } catch {
      setPageError(
        "Failed to load puzzle. Make sure the backend is running on port 3000.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRevealHint(hintId: string, coinCost: number) {
    if (!puzzle) return;
    setHintError(null);
    try {
      const res = await service.revealHint(puzzle.id, hintId);
      setRevealedHints((prev) => ({ ...prev, [hintId]: res.hintText }));
      setHintsUsed((prev) => prev + 1);
      setCoinsSpentHints((prev) => prev + coinCost);
      setCurrentCoins(res.coinsRemaining);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setHintError(msg ?? "Failed to reveal hint. Try again.");
    }
  }

  async function handleSubmit() {
    if (!puzzle || !answer.trim()) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    try {
      const res = await service.submitAnswer({
        puzzleId: puzzle.id,
        answer: answer.trim(),
        timeTaken,
        hintsUsed,
        coinsSpentHints,
      });
      setResult(res);
      setCurrentCoins(res.currentCoins);
    } catch {
      setPageError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayStability = result?.currentStability ?? 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 px-6 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Module 04
            </span>
            <h1 className="text-sm font-bold font-mono tracking-wide text-slate-100">
              SECURITY LOCKDOWN SYSTEM
            </h1>
          </div>

          {/* Difficulty tabs */}
          <div className="flex gap-2">
            {(["EASY", "MEDIUM", "HARD"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                disabled={loading}
                className={`px-3 py-1 text-xs font-mono rounded border transition-colors disabled:opacity-50
                  ${
                    difficulty === d
                      ? DIFFICULTY_ACTIVE[d]
                      : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-400"
                  }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Error banner ─────────────────────────────────────────── */}
      {pageError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 shrink-0">
          <p className="text-red-400 text-sm font-mono max-w-7xl mx-auto">
            {pageError}
          </p>
        </div>
      )}

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Left — Classified Document */}
        <div className="flex-1">
          <ClassifiedDocument
            puzzle={puzzle}
            loading={loading}
            revealedHints={revealedHints}
            currentCoins={currentCoins}
            hintError={hintError}
            onRevealHint={handleRevealHint}
          />
        </div>

        {/* Right — Controls */}
        <div className="w-96 flex flex-col gap-4 shrink-0">
          <StatusDisplay
            stability={displayStability}
            difficulty={difficulty}
            coins={currentCoins}
          />

          {!result ? (
            <PasswordInput
              value={answer}
              onChange={setAnswer}
              onSubmit={handleSubmit}
              submitting={submitting}
              disabled={!puzzle || loading}
            />
          ) : (
            <ResultBanner result={result} onPlayAgain={loadPuzzle} />
          )}

          {/* Static instructions — hidden after result to save space */}
          {!result && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                Instructions
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5">
                <li>• Read the classified document carefully</li>
                <li>• Purchase intel hints with coins if stuck</li>
                <li>• Type the derived code and press Submit</li>
                <li>• Correct → +10% stability &amp; +20 coins</li>
                <li>• Wrong → −10% stability</li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
