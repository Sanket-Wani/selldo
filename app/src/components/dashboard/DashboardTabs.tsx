"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface DashboardTabsProps {
  currentView: string;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ currentView }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelectView = (view: "overview" | "cp") => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "cp") {
      params.set("view", "cp");
    } else {
      params.delete("view");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const isCp = currentView === "cp";

  return (
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
      <button
        onClick={() => handleSelectView("overview")}
        style={{
          background: !isCp ? "var(--color-canvas)" : "transparent",
          color: !isCp ? "var(--color-primary)" : "var(--color-ink-muted-80)",
          border: "none",
          borderRadius: "var(--radius-pill)",
          padding: "5px 16px",
          fontSize: "var(--type-caption-size)",
          fontWeight: !isCp ? 600 : 400,
          cursor: "pointer",
          boxShadow: !isCp ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
          transition: "all 0.15s ease",
        }}
      >
        System Default Dashboard
      </button>

      <button
        onClick={() => handleSelectView("cp")}
        style={{
          background: isCp ? "var(--color-canvas)" : "transparent",
          color: isCp ? "var(--color-primary)" : "var(--color-ink-muted-80)",
          border: "none",
          borderRadius: "var(--radius-pill)",
          padding: "5px 16px",
          fontSize: "var(--type-caption-size)",
          fontWeight: isCp ? 600 : 400,
          cursor: "pointer",
          boxShadow: isCp ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
          transition: "all 0.15s ease",
        }}
      >
        Channel Partner (CP) Dashboard
      </button>
    </div>
  );
};
