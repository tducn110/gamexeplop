import { Clapperboard } from "lucide-react";

interface AdDoubleScoreButtonProps {
  score: number;
  onClick: () => void;
  disabled?: boolean;
}

export function AdDoubleScoreButton({ score, onClick, disabled = false }: AdDoubleScoreButtonProps) {
  return (
    <button
      type="button"
      className="game-btn game-btn-primary game-btn-lg"
      aria-label={`Nhân x2 điểm`}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        marginTop: "16px",
        marginBottom: "16px"
      }}
    >
      <Clapperboard size={20} strokeWidth={2.6} />
      <span>Nhân đôi x2 điểm</span>
    </button>
  );
}
