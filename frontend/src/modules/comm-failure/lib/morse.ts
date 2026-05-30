export const MORSE_MAP: Record<string, string> = {
  A: ".-",   B: "-...", C: "-.-.", D: "-..",  E: ".",
  F: "..-.", G: "--.",  H: "....", I: "..",   J: ".---",
  K: "-.-",  L: ".-..", M: "--",   N: "-.",   O: "---",
  P: ".--.", Q: "--.-", R: ".-.",  S: "...",  T: "-",
  U: "..-",  V: "...-", W: ".--",  X: "-..-", Y: "-.--",
  Z: "--..",
};

export function wordToMorse(word: string): string {
  return word
    .toUpperCase()
    .split("")
    .map((c) => MORSE_MAP[c] ?? "")
    .join(" ");
}

export function morseToSymbols(morse: string): string {
  return morse
    .split("")
    .map((c) => (c === "." ? "•" : c === "-" ? "—" : " "))
    .join("");
}
