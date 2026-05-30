import { useEffect, useState, useCallback } from "react";
import { getAllScores, deleteScore, type ScoreRecord } from "../apis/scoreApi";

interface LeaderboardProps {
  onClose: () => void;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  easy: "bg-green-950/40 text-green-400 border border-green-800/30",
  medium: "bg-yellow-950/40 text-yellow-400 border border-yellow-800/30",
  hard: "bg-red-950/40 text-red-400 border border-red-800/30",
};

export default function Leaderboard({ onClose }: LeaderboardProps) {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllScores();
      setScores(data);
    } catch {
      setError("Failed to load history scores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this log entry?")) return;
    try {
      await deleteScore(id);
      fetchScores(); // Reload history list
    } catch (err) {
      console.error("Failed to delete log entry:", err);
      alert("Failed to delete log entry.");
    }
  };

  return (
    <div className="flex flex-col w-full font-sans select-none">
      {/* Title Header */}
      <div className="flex items-center justify-between mb-4 border-b border-[#222] pb-3">
        <h2 className="text-orange-500 font-extrabold text-xs tracking-widest uppercase flex items-center gap-2">
          📋 REACTOR REPAIR LOGS (MISSION HISTORY)
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-xl leading-none cursor-pointer transition-colors"
        >
          ×
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <p className="text-gray-400 text-xs text-center py-8 animate-pulse">
          Decoding mission history logs...
        </p>
      )}

      {/* Error state */}
      {error && (
        <p className="text-red-400 text-xs text-center py-8">{error}</p>
      )}

      {/* Empty state */}
      {!loading && !error && scores.length === 0 && (
        <p className="text-gray-500 text-xs text-center py-8">
          No repair history logs found. Complete a synchronization cycle to log your first mission record!
        </p>
      )}

      {/* History Log List */}
      {!loading && !error && scores.length > 0 && (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {scores.map((s) => (
            <div
              key={s.id}
              className="bg-[#080808] border border-[#1a1a1a] rounded p-3 flex flex-col gap-2.5 hover:border-orange-500/20 transition-all"
            >
              {/* Top line: Name & Win/Fail Badge */}
              <div className="flex items-center justify-between">
                <span className="text-white font-extrabold text-xs truncate max-w-[150px]">
                  {s.playerName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    s.win
                      ? "bg-green-950/40 text-green-400 border border-green-800/30"
                      : "bg-red-950/40 text-red-400 border border-red-800/30"
                  }`}
                >
                  {s.win ? "Success" : "Core Failure"}
                </span>
              </div>

              {/* Middle line: Stats (Difficulty, Score, Time) */}
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      DIFFICULTY_STYLE[s.difficulty] ?? "text-gray-400"
                    }`}
                  >
                    {s.difficulty}
                  </span>
                  <span className="font-mono text-orange-500 font-extrabold text-xs">
                    {s.score} pts
                  </span>
                </div>
                <span className="font-mono text-[9px] text-gray-500">
                  time: {(s.timeTakenMs / 1000).toFixed(2)}s
                </span>
              </div>

              {/* Bottom line: Action / Deletion */}
              <div className="flex justify-end border-t border-[#121212] pt-2 mt-1">
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-red-500 hover:text-red-400 text-[9px] font-extrabold uppercase tracking-wider cursor-pointer border border-red-500/20 hover:border-red-500 bg-red-950/10 rounded px-2.5 py-1 transition-all"
                >
                  DELETE RECORD
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}