import React from "react";
import { StageDistributionItem } from "@/lib/dashboard";
import { EmptyState } from "./EmptyState";

interface StageDistributionProps {
  data: StageDistributionItem[];
  totalLeads: number;
}

export const StageDistributionChart: React.FC<StageDistributionProps> = ({
  data,
  totalLeads,
}) => {
  if (!data || data.length === 0 || totalLeads === 0) {
    return (
      <EmptyState
        title="No Stage Pipeline Activity"
        description="No leads have passed through the qualification lifecycle stages in this timeframe."
      />
    );
  }

  // Tonal palette strictly derived from DESIGN-apple.md tokens
  const getStageBarColor = (stage: string) => {
    switch (stage) {
      case "BOOKED":
        return "var(--color-primary)"; // #0066cc (Action Blue)
      case "OPPORTUNITY":
        return "var(--color-primary-on-dark)"; // #2997ff (Vibrant Blue)
      case "PROSPECT":
        return "var(--color-ink)"; // #1d1d1f (Solid Ink)
      case "INCOMING":
        return "var(--color-ink-muted-80)"; // #333333
      case "UNQUALIFIED":
        return "var(--color-ink-muted-48)"; // #7a7a7a
      case "LOST":
      default:
        return "var(--color-surface-chip-translucent)";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", width: "100%" }}>
      {data.map((item) => {
        const barColor = getStageBarColor(item.stage);
        const widthPct = Math.max(item.percentage, item.count > 0 ? 3 : 0);

        return (
          <div key={item.stage} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: "var(--type-caption-size)",
              }}
            >
              <span className="type-caption-strong" style={{ color: "var(--color-ink)" }}>
                {item.label}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="type-caption" style={{ color: "var(--color-ink)", fontWeight: 600 }}>
                  {item.count}
                </span>
                <span className="type-fine-print" style={{ color: "var(--color-ink-muted-48)" }}>
                  ({item.percentage}%)
                </span>
              </div>
            </div>

            {/* Accessible Bar Track */}
            <div
              role="progressbar"
              aria-valuenow={item.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${item.label}: ${item.count} leads (${item.percentage}%)`}
              style={{
                height: "8px",
                width: "100%",
                backgroundColor: "var(--color-divider-soft)",
                borderRadius: "var(--radius-pill)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${widthPct}%`,
                  backgroundColor: barColor,
                  borderRadius: "var(--radius-pill)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
