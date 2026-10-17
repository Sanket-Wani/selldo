"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { InflowTimelinePoint } from "@/lib/dashboard";
import { EmptyState } from "./EmptyState";

interface LeadInflowChartProps {
  data: InflowTimelinePoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "var(--color-canvas)",
          border: "1px solid var(--color-hairline)",
          borderRadius: "var(--radius-sm)",
          padding: "8px 12px",
          boxShadow: "none",
        }}
      >
        <div className="type-caption-strong" style={{ color: "var(--color-ink)", marginBottom: "4px" }}>
          {label}
        </div>
        <div className="type-caption" style={{ color: "var(--color-primary)" }}>
          New Inflow: {payload[0]?.value || 0} leads
        </div>
      </div>
    );
  }
  return null;
};

export const LeadInflowChart: React.FC<LeadInflowChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <EmptyState title="No Lead Inflow Data" description="No leads were created during this timeframe." />;
  }

  const formattedData = data.map((d) => {
    const parts = d.date.split("-");
    const displayDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;
    return {
      ...d,
      displayDate,
    };
  });

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider-soft)" vertical={false} />
          <XAxis
            dataKey="displayDate"
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
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="inflow"
            name="Inflow"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="rgba(0, 102, 204, 0.12)"
            activeDot={{ r: 5, fill: "var(--color-primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
