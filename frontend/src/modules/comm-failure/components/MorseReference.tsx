import { MORSE_MAP } from "../lib/morse";

export default function MorseReference() {
  return (
    <div
      className="mt-4 p-4 rounded-sm"
      style={{ background: "rgba(0,20,30,0.9)", border: "1px solid #0e4f6b" }}
    >
      <p
        className="text-xs tracking-widest mb-3"
        style={{ color: "#00bcd4", letterSpacing: "3px" }}
      >
        MORSE CODE REFERENCE
      </p>
      <div className="grid grid-cols-6 gap-1">
        {Object.entries(MORSE_MAP).map(([char, code]) => (
          <div
            key={char}
            className="text-center py-1 px-1"
            style={{ border: "1px solid #0e2a35" }}
          >
            <div
              className="font-bold text-sm"
              style={{ color: "#00bcd4" }}
            >
              {char}
            </div>
            <div
              className="text-xs tracking-widest"
              style={{ color: "#2a6070", fontSize: "10px" }}
            >
              {code}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
