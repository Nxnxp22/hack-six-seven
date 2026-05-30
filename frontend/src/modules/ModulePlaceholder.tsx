import React from "react";
import { useNavigate } from "react-router-dom";

interface ModulePlaceholderProps {
  title: string;
}

const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center px-6">
      <p className="text-zinc-500 text-[10px] tracking-[0.3em] uppercase mb-3">Route reserved</p>
      <h1 className="text-lg font-black tracking-widest uppercase text-[#e91e8c] mb-4">{title}</h1>
      <p className="text-zinc-500 text-xs text-center max-w-sm mb-8">
        Teammate module — connect your page to this route when ready.
      </p>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="text-[10px] tracking-widest uppercase text-zinc-500 hover:text-[#e91e8c] transition-colors"
      >
        ← Back to hub
      </button>
    </div>
  );
};

export default ModulePlaceholder;
