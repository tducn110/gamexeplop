import { ArrowLeft, Clock3, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/features/db/schema";
import { GAME_TEXT } from "@/features/core/gameText";
import { PanelFrame } from "@/components/shared/primitives";
import { GameButton } from "@/components/shared/primitives/GameButton";

interface DashboardScreenProps {
  open: boolean;
  best: number;
  lastScore: number;
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
  onOpenLogin: () => void;
}

export function DashboardScreen({ open, best, lastScore, leaderboard, onClose, onOpenLogin }: DashboardScreenProps) {
  if (!open) return null;

  return (
    <div className="leaderboardScreen" style={{ zIndex: 120 }}>
      <div className="leaderboardCard">
        <div className="leaderboardTitle">
          <Trophy size={22} />
          <span>Bảng Điểm</span>
        </div>

        <div className="leaderboardBestCard">
          <p className="leaderboardEyebrow">Kỷ lục của bạn</p>
          <h1>{best.toLocaleString("vi-VN")}</h1>
          <span>Lần trước: {lastScore.toLocaleString("vi-VN")}</span>
        </div>

        <section className="leaderboardBoard">
          <div className="dashboardRankHeader">
            <span>
              <Trophy size={18} />
              Top Điểm
            </span>
            <GameButton variant="secondary" size="sm" onClick={onOpenLogin}>
              Đổi Tên
            </GameButton>
          </div>

          <div className="dashboardRankList leaderboardRankList">
            {leaderboard.length === 0 ? <p style={{ textAlign: "center", color: "var(--pencil-gray)", fontSize: 14 }}>{GAME_TEXT.LEADERBOARD_EMPTY}</p> : null}
            {leaderboard.map((entry) => {
              const isTopThree = entry.rank && entry.rank <= 3;
              return (
                <div
                  key={`${entry.rank}-${entry.playerName}-${entry.score}`}
                  className="dashboardRankRow"
                  style={{
                    background: isTopThree ? "linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(255,255,255,0.18) 100%)" : "rgba(138,125,101,0.08)",
                    boxShadow: isTopThree ? "0 2px 0 rgba(255,255,255,0.52) inset" : "none",
                  }}
                >
                  <div className="dashboardRankBadge" style={{ background: isTopThree ? "var(--orange-cta)" : "rgba(42,36,24,0.1)", color: isTopThree ? "#fff" : "var(--pencil-gray)" }}>
                    #{entry.rank}
                  </div>
                  <div className="dashboardRankName">
                    <span>{entry.playerName}</span>
                  </div>
                  <div className="dashboardRankScore">
                    {entry.score.toLocaleString("vi-VN")}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <GameButton variant="secondary" size="lg" className="leaderboardBackBtn" onClick={onClose} style={{ marginTop: "auto", width: "100%" }}>
          <ArrowLeft size={16} />
          Quay lại
        </GameButton>
      </div>
    </div>
  );
}
