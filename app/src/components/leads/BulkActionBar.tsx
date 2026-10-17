"use client";

import React from "react";
import { UserCheck, ArrowRightLeft, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onOpenBulkReassign: () => void;
  onOpenBulkTransition: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onOpenBulkReassign,
  onOpenBulkTransition,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "var(--color-surface-black)",
        color: "var(--color-body-on-dark)",
        padding: "8px 16px",
        borderRadius: "var(--radius-pill)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-md)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        zIndex: 90,
        fontFamily: "var(--font-body)",
        fontSize: "13px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            backgroundColor: "var(--color-primary-on-dark)",
            color: "#000000",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          {selectedCount}
        </span>
        <span style={{ fontWeight: 500 }}>leads selected</span>
      </div>

      <div style={{ width: "1px", height: "16px", backgroundColor: "var(--color-surface-tile-2)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button
          onClick={onOpenBulkReassign}
          style={{
            backgroundColor: "var(--color-surface-tile-1)",
            color: "#ffffff",
            border: "1px solid var(--color-surface-tile-2)",
            borderRadius: "var(--radius-pill)",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <UserCheck size={13} />
          Bulk Reassign
        </button>

        <button
          onClick={onOpenBulkTransition}
          style={{
            backgroundColor: "var(--color-surface-tile-1)",
            color: "#ffffff",
            border: "1px solid var(--color-surface-tile-2)",
            borderRadius: "var(--radius-pill)",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <ArrowRightLeft size={13} />
          Change Stage
        </button>
      </div>

      <button
        onClick={onClearSelection}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--color-body-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: "2px",
        }}
        title="Deselect all"
      >
        <X size={15} />
      </button>
    </div>
  );
};
