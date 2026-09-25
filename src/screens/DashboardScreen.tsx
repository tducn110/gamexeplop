import { ArrowLeft, Layers, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/features/db/schema";
import { GameButton } from "@/components/shared/primitives/GameButton";
import { useTranslation } from "react-i18next";

interface DashboardScreenProps {
  open: boolean;
  best: number;
  bestFloors?: number;
  personalBestRank?: number | null;
  lastScore: number;
  leaderboard: LeaderboardEntry[];
  playerName: string;
  onClose: () => void;
}

export function DashboardScreen({ open, best, bestFloors = 0, personalBestRank = null, lastScore, leaderboard, playerName, onClose }: DashboardScreenProps) {
  const { t, i18n } = useTranslation();
  if (!open) return null;

  return (
    <div className="leaderboardScreen" style={{ zIndex: 120 }}>
      <div className="leaderboardCard">
        <div className="leaderboardTitle">
          <Trophy size={22} />
          <span>{t("LEADERBOARD")}</span>
        </div>

        <div className="leaderboardBestCard">
          <p className="leaderboardEyebrow">{t("BEST")}</p>
          <h1>{best > 0 ? best.toLocaleString(i18n.language === 'vi' ? "vi-VN" : "en-US") : t("NONE")}</h1>
        </div>

        <section className="leaderboardBoard">
          <div className="dashboardRankHeader">
            <span className="rankTitle">
              <Trophy size={16} />
              Ranking 1-10
            </span>
            <span className="rankColName">TOP {t("SCORE")}</span>
          </div>

          <div className="dashboardRankList leaderboardRankList">
            {leaderboard.length === 0 ? <p style={{ textAlign: "center", color: "var(--pencil-gray)", fontSize: 14 }}>{t("LEADERBOARD_EMPTY")}</p> : null}
            {leaderboard.slice(0, 10).map((entry) => {
              const rank = entry.rank;
              const isCurrent = Boolean(entry.isCurrentPlayer);
              
              let badgeBg = "rgba(42,36,24,0.08)";
              let badgeBorder = "rgba(42,36,24,0.25)";
              let badgeColor = "var(--ink-dark)";
              let rowBorder = isCurrent ? "rgba(232,116,50,0.55)" : "transparent";
              let rowBg = isCurrent ? "rgba(232,116,50,0.14)" : "rgba(138,125,101,0.1)";
              
              if (rank === 1) {
                badgeBg = "#EDB338"; badgeBorder = "#C49021"; rowBorder = isCurrent ? "#E87432" : "#EDB338";
              } else if (rank === 2) {
                badgeBg = "#B4B598"; badgeBorder = "#8C8E76"; rowBorder = isCurrent ? "#E87432" : "#B4B598";
              } else if (rank === 3) {
                badgeBg = "#CE8654"; badgeBorder = "#A46538"; rowBorder = isCurrent ? "#E87432" : "#CE8654";
              }

              return (
                <div
                  key={`${entry.rank}-${entry.playerName}-${entry.score}`}
                  className="dashboardRankRow"
                  style={{
                    background: rowBg,
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
                  {entry.floors !== null && (
                    <div className="dashboardRankTime">
                      <Layers size={12} /> {entry.floors} {t("FLOORS").toLowerCase()}
                    </div>
                  )}
                  <div className="dashboardRankScore">
                    {entry.score.toLocaleString(i18n.language === 'vi' ? "vi-VN" : "en-US")}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {(() => {
          const topTen = leaderboard.slice(0, 10);
          const playerInTopTen = topTen.find(
            (entry) => entry.isCurrentPlayer || (playerName && entry.playerName === playerName)
          );
          const playerRank = playerInTopTen?.rank ?? personalBestRank ?? null;
          const playerScore = best || 0;
          const playerFloors = (playerInTopTen?.floors ?? bestFloors) || 0;
          
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
                  {playerRank ? `#${playerRank}` : "-"}
                </div>
                <div className="dashboardRankName">
                  <span>{playerName || t("YOU")}</span>
                </div>
                <div className="dashboardRankTime">
                  <Layers size={12} /> {playerFloors} {t("FLOORS").toLowerCase()}
                </div>
                <div className="dashboardRankScore">
                  {playerScore.toLocaleString(i18n.language === 'vi' ? "vi-VN" : "en-US")}
                </div>
              </div>
            </div>
          );
        })()}

        <GameButton variant="secondary" size="lg" className="leaderboardBackBtn" onClick={onClose} style={{ marginTop: "auto", width: "100%" }}>
          <ArrowLeft size={16} />
          {t("BACK")}
        </GameButton>
      </div>
    </div>
  );
}
