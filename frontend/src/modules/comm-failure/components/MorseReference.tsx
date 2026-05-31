import { MORSE_MAP } from "../lib/morse";

function MorseBar({ code }: { code: string }) {
  return (
    <div className="flex items-center gap-[3px]">
      {code.split("").map((sym, i) =>
        sym === "." ? (
          <span
            key={i}
            className="inline-block rounded-full bg-cyan-400"
            style={{ width: 5, height: 5 }}
          />
        ) : (
          <span
            key={i}
            className="inline-block rounded-sm bg-cyan-400"
            style={{ width: 14, height: 5 }}
          />
        )
      )}
    </div>
  );
}

export default function MorseReference() {
  const entries = Object.entries(MORSE_MAP);

  return (
    <div>
      <p className="text-cyan-400 text-[10px] tracking-[0.4em] mb-5">
        MORSE CODE REFERENCE
      </p>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
        {entries.map(([char, code]) => (
          <div
            key={char}
            className="flex items-center gap-2 px-2 py-2 rounded-lg border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 hover:bg-cyan-950/20 transition-colors overflow-hidden"
          >
            <span className="text-cyan-300 font-bold text-sm w-3 shrink-0 font-mono">
              {char}
            </span>

            <span className="w-px h-4 bg-white/10 shrink-0" />

            <div className="flex flex-1 justify-center min-w-0 overflow-hidden">
              <MorseBar code={code} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}