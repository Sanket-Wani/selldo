"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ProjectSiteVisitItem } from "@/lib/dashboard";
import { EmptyState } from "./EmptyState";

interface SiteVisitsWidgetProps {
  data: ProjectSiteVisitItem[];
}

export const SiteVisitsWidget: React.FC<SiteVisitsWidgetProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Site Visits Recorded"
        description="No site visits scheduled or conducted in this timeframe."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", width: "100%" }}>
      {/* Chart */}
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider-soft)" vertical={false} />
            <XAxis
              dataKey="projectName"
              tickLine={false}
              axisLine={{ stroke: "var(--color-divider-soft)" }}
              tick={{ fill: "var(--color-ink-muted-48)", fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-ink-muted-48)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-canvas)",
                border: "1px solid var(--color-hairline)",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                color: "var(--color-ink)",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="conducted"
              name="Conducted Visits"
              fill="var(--color-primary)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="scheduled"
              name="Scheduled / Upcoming"
              fill="var(--color-ink-muted-48)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.map((item) => {
          const total = item.conducted + item.scheduled;
          const completionRate = total > 0 ? Math.round((item.conducted / total) * 100) : 0;
          return (
            <div
              key={item.projectName}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "var(--color-surface-pearl)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-hairline)",
                fontSize: "var(--type-caption-size)",
              }}
            >
              <span className="type-caption-strong" style={{ color: "var(--color-ink)" }}>
                {item.projectName}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span>
                  <strong style={{ color: "var(--color-primary)" }}>{item.conducted}</strong> conducted
                </span>
                <span style={{ color: "var(--color-ink-muted-48)" }}>·</span>
                <span>
                  <strong>{item.scheduled}</strong> scheduled
                </span>
                <span className="type-fine-print" style={{ color: "var(--color-ink-muted-48)" }}>
                  ({completionRate}% completed)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
