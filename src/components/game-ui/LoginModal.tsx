import { useState } from "react";
import { GameButton } from "../ui/primitives/GameButton";
import { PanelFrame } from "../ui/primitives/PanelFrame";

interface LoginModalProps {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function LoginModal({ open, currentName, onClose, onSave }: LoginModalProps) {
  const [name, setName] = useState(currentName);

  if (!open) return null;

  return (
    <div className="overlay-scrim">
      <PanelFrame className="modal-card">
        <p className="eyebrow">Nguoi choi</p>
        <h2 className="panel-title">Cap nhat ten hien thi</h2>
        <input
          className="game-input"
          value={name}
          maxLength={18}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nhap ten cua ban"
        />
        <div className="modal-actions">
          <GameButton variant="secondary" onClick={onClose}>
            Huy
          </GameButton>
          <GameButton onClick={() => onSave(name)}>
            Luu
          </GameButton>
        </div>
      </PanelFrame>
    </div>
  );
}
