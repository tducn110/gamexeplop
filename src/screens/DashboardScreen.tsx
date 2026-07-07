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
  playerName: string;
  onClose: () => void;
}

export function DashboardScreen({ open, best, lastScore, leaderboard, playerName, onClose }: DashboardScreenProps) {
  if (!open) return null;

  return (
    <div className="leaderboardScreen" style={{ zIndex: 120 }}>
      <div className="leaderboardCard">
        <div className="leaderboardTitle">
          <Trophy size={22} />
          <span>Kỷ lục</span>
        </div>

        <div className="leaderboardBestCard">
          <p className="leaderboardEyebrow">Kỷ lục của bạn</p>
          <h1>{best.toLocaleString("vi-VN")}</h1>
        </div>

        <section className="leaderboardBoard">
          <div className="dashboardRankHeader">
            <span className="rankTitle">
              <Trophy size={16} />
              Ranking 1-10
            </span>
            <span className="rankColName">TOP ĐIỂM</span>
          </div>

          <div className="dashboardRankList leaderboardRankList">
            {leaderboard.length === 0 ? <p style={{ textAlign: "center", color: "var(--pencil-gray)", fontSize: 14 }}>{GAME_TEXT.LEADERBOARD_EMPTY}</p> : null}
            {leaderboard.map((entry) => {
              const rank = entry.rank;
              const isLocal = entry.playerName === playerName && entry.score === best;
              
              let badgeBg = "rgba(42,36,24,0.08)";
              let badgeBorder = "rgba(42,36,24,0.25)";
              let badgeColor = "var(--ink-dark)";
              let rowBorder = "transparent";
              
              if (rank === 1) {
                badgeBg = "#EDB338"; badgeBorder = "#C49021"; rowBorder = "#EDB338";
              } else if (rank === 2) {
                badgeBg = "#B4B598"; badgeBorder = "#8C8E76"; rowBorder = "#B4B598";
              } else if (rank === 3) {
                badgeBg = "#CE8654"; badgeBorder = "#A46538"; rowBorder = "#CE8654";
              }

              return (
                <div
                  key={`${entry.rank}-${entry.playerName}-${entry.score}`}
                  className="dashboardRankRow"
                  style={{
                    background: "rgba(138,125,101,0.1)",
                    borderColor: rowBorder,
                  }}
                >
                  <div 
                    className="dashboardRankBadge" 
                    style={{ 
                      background: badgeBg, 
                      color: badgeColor,
                      borderColor: badgeBorder
                    }}
                  >
                    #{entry.rank}
                  </div>
                  <div className="dashboardRankName">
                    <span>{entry.playerName}</span>
                  </div>
                  <div className="dashboardRankTime">
                    <Clock3 size={12} /> {entry.floors}s
                  </div>
                  <div className="dashboardRankScore">
                    {entry.score.toLocaleString("vi-VN")}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {(() => {
          const playerInTopTen = leaderboard.find((entry) => entry.playerName === playerName && entry.score === best);
          const playerRow = playerInTopTen || { rank: null, playerName, score: best };
          
          return (
            <div className="leaderboardPlayerRow" style={{ marginTop: 12 }}>
              <div
                className="dashboardRankRow"
                style={{
                  background: "rgba(232,116,50,0.16)",
                  borderColor: "rgba(232,116,50,0.45)",
                }}
              >
                <div 
                  className="dashboardRankBadge" 
                  style={{ 
                    background: "rgba(42,36,24,0.08)", 
                    color: "var(--pencil-gray)",
                    borderColor: "rgba(42,36,24,0.25)"
                  }}
                >
                  {playerRow.rank ? `#${playerRow.rank}` : "Mới"}
                </div>
                <div className="dashboardRankName">
                  <span>Bạn</span>
                </div>
                {playerRow.score > 0 && (
                  <div className="dashboardRankTime">
                    <Clock3 size={12} /> {playerRow.floors || 0}s
                  </div>
                )}
                <div className="dashboardRankScore">
                  {playerRow.score > 0 ? playerRow.score.toLocaleString("vi-VN") : "Chưa có"}
                </div>
              </div>
            </div>
          );
        })()}

        <GameButton variant="secondary" size="lg" className="leaderboardBackBtn" onClick={onClose} style={{ marginTop: "auto", width: "100%" }}>
          <ArrowLeft size={16} />
          Quay lại
        </GameButton>
      </div>
    </div>
  );
}
