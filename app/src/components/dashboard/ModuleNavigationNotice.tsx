"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ModuleNoticeModalProps {
  moduleName: string;
  targetPhase: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ModuleNoticeModal: React.FC<ModuleNoticeModalProps> = ({
  moduleName,
  targetPhase,
  description,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "var(--space-md)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--color-canvas)",
          border: "1px solid var(--color-hairline)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-xl)",
          boxShadow: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="type-fine-print"
          style={{
            color: "var(--color-primary)",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontWeight: 600,
            display: "block",
            marginBottom: "var(--space-xs)",
          }}
        >
          Planned Architecture RoadMap
        </span>
        <h3 className="type-tagline" style={{ color: "var(--color-ink)", marginBottom: "var(--space-xs)" }}>
          {moduleName} Module ({targetPhase})
        </h3>
        <p className="type-body" style={{ color: "var(--color-ink-muted-48)", fontSize: "15px", marginBottom: "var(--space-lg)" }}>
          {description}
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-xs)" }}>
          <Button variant="primary" onClick={onClose}>
            Understood
          </Button>
        </div>
      </div>
    </div>
  );
};
