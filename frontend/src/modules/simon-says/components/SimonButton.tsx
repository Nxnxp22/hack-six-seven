import type { Color } from '../apis/gameEngine';

interface SimonButtonProps {
  color: Color;
  isFlashing: boolean;
  isDisabled: boolean;
  onClick: (color: Color) => void;
}

const COLOR_STYLES: Record<Color, { base: string; flash: string }> = {
  red:    { base: 'bg-[#E23336] hover:bg-[#C53030] active:bg-[#9B2C2C]', flash: 'bg-[#FEB2B2] scale-95 shadow-[0_0_35px_#E53E3E]' },
  blue:   { base: 'bg-[#3182CE] hover:bg-[#2B6CB0] active:bg-[#2B6CB0]', flash: 'bg-[#90CDF4] scale-95 shadow-[0_0_35px_#3182CE]' },
  green:  { base: 'bg-[#38A169] hover:bg-[#2F855A] active:bg-[#22543D]', flash: 'bg-[#9AE6B4] scale-95 shadow-[0_0_35px_#38A169]' },
  yellow: { base: 'bg-[#FFBF12] hover:bg-[#EFB004] active:bg-[#FFCC12]', flash: 'bg-[#FEEBC8] scale-95 shadow-[0_0_35px_#D69E2E]' },
};

const COLOR_LABELS: Record<Color, string> = {
  red: 'RED', blue: 'BLUE', green: 'GREEN', yellow: 'YELLOW',
};

export default function SimonButton({ color, isFlashing, isDisabled, onClick }: SimonButtonProps) {
  const styles = COLOR_STYLES[color];

  return (
    <button
      onClick={() => !isDisabled && onClick(color)}
      disabled={isDisabled && !isFlashing}
      className={`
        relative rounded-lg w-full aspect-square
        flex items-end justify-center pb-3
        font-bold text-white text-sm tracking-widest
        transition-all duration-150
        ${isFlashing ? styles.flash : styles.base}
        ${isDisabled && !isFlashing ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
      `}
    >
      {COLOR_LABELS[color]}
    </button>
  );
}