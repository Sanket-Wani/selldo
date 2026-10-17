import React from "react";
import { LeadStage } from "@prisma/client";

interface LeadStageBadgeProps {
  stage: LeadStage | string;
  subStage?: string | null;
  className?: string;
}

export const LeadStageBadge: React.FC<LeadStageBadgeProps> = ({
  stage,
  subStage,
  className = "",
}) => {
  let bg = "var(--color-surface-pearl)";
  let color = "var(--color-ink)";
  let borderColor = "var(--color-hairline)";
  let dotColor = "var(--color-ink-muted-48)";

  switch (stage) {
    case LeadStage.INCOMING:
      bg = "rgba(142, 142, 147, 0.1)";
      color = "#636366";
      borderColor = "rgba(142, 142, 147, 0.25)";
      dotColor = "#8e8e93";
      break;
    case LeadStage.PROSPECT:
      bg = "rgba(88, 86, 214, 0.1)";
      color = "#5856d6";
      borderColor = "rgba(88, 86, 214, 0.25)";
      dotColor = "#5856d6";
      break;
    case LeadStage.OPPORTUNITY:
      bg = "rgba(0, 102, 204, 0.1)";
      color = "var(--color-primary)";
      borderColor = "rgba(0, 102, 204, 0.25)";
      dotColor = "var(--color-primary)";
      break;
    case LeadStage.BOOKED:
      bg = "rgba(52, 199, 89, 0.12)";
      color = "#248a3d";
      borderColor = "rgba(52, 199, 89, 0.3)";
      dotColor = "#34c759";
      break;
    case LeadStage.UNQUALIFIED:
      bg = "rgba(255, 149, 0, 0.12)";
      color = "#b25900";
      borderColor = "rgba(255, 149, 0, 0.3)";
      dotColor = "#ff9500";
      break;
    case LeadStage.LOST:
      bg = "rgba(255, 59, 48, 0.12)";
      color = "#d70015";
      borderColor = "rgba(255, 59, 48, 0.3)";
      dotColor = "#ff3b30";
      break;
  }

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 9px",
        borderRadius: "var(--radius-pill)",
        backgroundColor: bg,
        color: color,
        border: `1px solid ${borderColor}`,
        fontFamily: "var(--font-body)",
        fontSize: "12px",
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: "0.2px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: dotColor,
        }}
      />
      {stage}
      {subStage && (
        <span
          style={{
            opacity: 0.8,
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          · {subStage}
        </span>
      )}
    </span>
  );
};
