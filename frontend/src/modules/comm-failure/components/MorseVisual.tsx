import { MORSE_MAP } from "../lib/morse";

interface Props {
  word: string;
}

export default function MorseVisual({ word }: Props) {
  const letters = word.toUpperCase().split("");

  return (
    <div className="flex justify-center items-center gap-4 flex-wrap">
      {letters.map((letter, li) => (
        <div key={li} className="flex items-center gap-1">
          {(MORSE_MAP[letter] ?? "").split("").map((sym, si) =>
            sym === "." ? (
              <span
                key={si}
                className="inline-block h-3 rounded-sm"
                style={{ width: "14px", background: "#00bcd4" }}
              />
            ) : (
              <span
                key={si}
                className="inline-block h-3 rounded-sm"
                style={{ width: "34px", background: "#00bcd4" }}
              />
            )
          )}
        </div>
      ))}
    </div>
  );
}
