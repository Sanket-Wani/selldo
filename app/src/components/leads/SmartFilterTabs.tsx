"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface BucketCounts {
  all: number;
  incoming: number;
  prospect: number;
  opportunity: number;
  booked: number;
  unqualified: number;
  lost: number;
  assignedToMe: number;
}

interface SmartFilterTabsProps {
  currentStage: string;
  bucketCounts: BucketCounts;
}

export const SmartFilterTabs: React.FC<SmartFilterTabsProps> = ({
  currentStage = "ALL",
  bucketCounts,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabs = [
    { key: "ALL", label: "All Leads", count: bucketCounts.all },
    { key: "INCOMING", label: "Incoming / New", count: bucketCounts.incoming },
    { key: "PROSPECT", label: "Prospects", count: bucketCounts.prospect },
    { key: "OPPORTUNITY", label: "Opportunities", count: bucketCounts.opportunity },
    { key: "BOOKED", label: "Booked", count: bucketCounts.booked },
    { key: "ASSIGNED_TO_ME", label: "Assigned To Me", count: bucketCounts.assignedToMe },
    { key: "UNQUALIFIED", label: "Unqualified", count: bucketCounts.unqualified },
    { key: "LOST", label: "Lost", count: bucketCounts.lost },
  ];

  const handleSelectTab = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "ALL") {
      params.delete("stage");
    } else {
      params.set("stage", key);
    }
    params.set("page", "1"); // Reset pagination
    router.push(`/leads?${params.toString()}`);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        overflowX: "auto",
        paddingBottom: "4px",
        scrollbarWidth: "none",
      }}
    >
      {tabs.map((tab) => {
        const isActive =
          currentStage === tab.key || (tab.key === "ALL" && (!currentStage || currentStage === "ALL"));

        return (
          <button
            key={tab.key}
            onClick={() => handleSelectTab(tab.key)}
            className={`btn-pearl-capsule ${isActive ? "active" : ""}`}
            style={{
              padding: "7px 14px",
              whiteSpace: "nowrap",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: isActive ? "var(--color-primary)" : "var(--color-canvas)",
              color: isActive ? "var(--color-on-primary)" : "var(--color-ink)",
              borderColor: isActive ? "var(--color-primary)" : "var(--color-hairline)",
              fontWeight: isActive ? 600 : 400,
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                fontSize: "11px",
                padding: "1px 6px",
                borderRadius: "10px",
                backgroundColor: isActive
                  ? "rgba(255, 255, 255, 0.25)"
                  : "var(--color-surface-pearl)",
                color: isActive ? "#ffffff" : "var(--color-ink-muted-48)",
                fontWeight: 600,
              }}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
