"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface FilterBarProps {
  currentRange: string;
  currentProjectId: string;
  currentSource: string;
  availableProjects: Array<{ id: string; name: string; code: string }>;
  availableSources: string[];
}

export const DashboardFilterBar: React.FC<FilterBarProps> = ({
  currentRange,
  currentProjectId,
  currentSource,
  availableProjects,
  availableSources,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all_sources" && value !== "all_projects") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    Boolean(currentProjectId) ||
    Boolean(currentSource) ||
    (currentRange && currentRange !== "30d");

  const ranges = [
    { label: "Today", value: "today" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "MTD", value: "mtd" },
    { label: "All Time", value: "all" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-sm)",
        padding: "var(--space-md) var(--space-lg)",
        backgroundColor: "var(--color-canvas)",
        borderBottom: "1px solid var(--color-hairline)",
      }}
    >
      {/* Range Segmented Buttons */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          backgroundColor: "var(--color-surface-pearl)",
          padding: "3px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--color-hairline)",
        }}
      >
        {ranges.map((r) => {
          const isSelected = (currentRange || "30d") === r.value;
          return (
            <button
              key={r.value}
              onClick={() => updateParam("range", r.value)}
              disabled={isPending}
              style={{
                background: isSelected ? "var(--color-canvas)" : "transparent",
                color: isSelected ? "var(--color-primary)" : "var(--color-ink-muted-80)",
                border: "none",
                borderRadius: "var(--radius-pill)",
                padding: "4px 14px",
                fontSize: "var(--type-caption-size)",
                fontWeight: isSelected ? 600 : 400,
                cursor: "pointer",
                boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Select Dropdowns */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", flexWrap: "wrap" }}>
        {/* Project Selector */}
        <select
          value={currentProjectId || "all_projects"}
          onChange={(e) => updateParam("projectId", e.target.value)}
          aria-label="Filter by Project"
          style={{
            height: "36px",
            padding: "0 var(--space-sm)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(0,0,0,0.08)",
            backgroundColor: "var(--color-canvas)",
            color: "var(--color-ink)",
            fontSize: "var(--type-caption-size)",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all_projects">All Projects</option>
          {availableProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>

        {/* Source Selector */}
        <select
          value={currentSource || "all_sources"}
          onChange={(e) => updateParam("source", e.target.value)}
          aria-label="Filter by Lead Source"
          style={{
            height: "36px",
            padding: "0 var(--space-sm)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(0,0,0,0.08)",
            backgroundColor: "var(--color-canvas)",
            color: "var(--color-ink)",
            fontSize: "var(--type-caption-size)",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all_sources">All Lead Sources</option>
          {availableSources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="pearl-capsule"
            onClick={handleReset}
            style={{ height: "36px", fontSize: "12px" }}
          >
            Reset Filters
          </Button>
        )}

        {isPending && (
          <span
            className="type-fine-print"
            style={{ color: "var(--color-primary)", marginLeft: "4px" }}
          >
            Updating...
          </span>
        )}
      </div>
    </div>
  );
};
