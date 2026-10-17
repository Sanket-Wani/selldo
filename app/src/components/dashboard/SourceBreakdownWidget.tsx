import React from "react";
import { SourceBreakdownItem } from "@/lib/dashboard";
import { EmptyState } from "./EmptyState";

interface SourceBreakdownWidgetProps {
  data: SourceBreakdownItem[];
  totalLeads: number;
}

export const SourceBreakdownWidget: React.FC<SourceBreakdownWidgetProps> = ({
  data,
  totalLeads,
}) => {
  if (!data || data.length === 0 || totalLeads === 0) {
    return (
      <EmptyState
        title="No Source Attribution Data"
        description="No lead sources detected for the current filter criteria."
      />
    );
  }

  return (
    <div className="apple-table-container">
      <table className="apple-table">
        <thead>
          <tr>
            <th scope="col">Acquisition Channel</th>
            <th scope="col" style={{ textAlign: "right" }}>Leads</th>
            <th scope="col" style={{ textAlign: "right" }}>Share</th>
            <th scope="col" style={{ textAlign: "right" }}>Booked</th>
            <th scope="col" style={{ textAlign: "right" }}>Conv. Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const sharePct = totalLeads > 0 ? Math.round((item.leadsCount / totalLeads) * 100) : 0;
            const convPct = item.leadsCount > 0 ? Math.round((item.bookingsCount / item.leadsCount) * 100) : 0;

            return (
              <tr key={item.source}>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "var(--radius-full)",
                        backgroundColor:
                          item.source === "Google Ads"
                            ? "var(--color-primary)"
                            : item.source === "Meta Ads"
                            ? "var(--color-primary-on-dark)"
                            : "var(--color-ink-muted-80)",
                      }}
                    />
                    {item.source}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>{item.leadsCount}</td>
                <td style={{ textAlign: "right", color: "var(--color-ink-muted-48)" }}>
                  {sharePct}%
                </td>
                <td style={{ textAlign: "right" }}>{item.bookingsCount}</td>
                <td style={{ textAlign: "right", color: convPct > 0 ? "var(--color-primary)" : "inherit", fontWeight: convPct > 0 ? 600 : 400 }}>
                  {convPct}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
