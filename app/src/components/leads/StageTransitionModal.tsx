"use client";

import React, { useState } from "react";
import { X, ArrowRightLeft, AlertCircle } from "lucide-react";
import { LeadStage } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { ALLOWED_TRANSITIONS, UNQUALIFIED_REASONS, LOST_REASONS } from "@/lib/fsm-constants";

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lead?: { id: string; crmId: string; firstName: string; lastName: string; stage: LeadStage } | null;
  bulkIds?: string[];
}

export const StageTransitionModal: React.FC<StageTransitionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lead,
  bulkIds = [],
}) => {
  const isBulk = bulkIds.length > 0;
  const currentStage = lead?.stage || LeadStage.INCOMING;

  // Determine selectable stages
  const allowedStages = isBulk
    ? Object.values(LeadStage)
    : ALLOWED_TRANSITIONS[currentStage] || [];

  const [targetStage, setTargetStage] = useState<LeadStage>(allowedStages[0] || LeadStage.PROSPECT);
  const [subStage, setSubStage] = useState<"HOT" | "WARM" | "COLD">("WARM");
  const [unqualifiedReason, setUnqualifiedReason] = useState<string>(UNQUALIFIED_REASONS[0]);
  const [lostReason, setLostReason] = useState<string>(LOST_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let reason: string | undefined = undefined;
    if (targetStage === LeadStage.UNQUALIFIED) {
      reason = unqualifiedReason;
    } else if (targetStage === LeadStage.LOST) {
      reason = lostReason;
    }

    try {
      setLoading(true);

      if (isBulk) {
        const res = await fetch("/api/leads/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "TRANSITION",
            leadIds: bulkIds,
            targetStage,
            reason,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Bulk transition failed");
      } else if (lead) {
        const res = await fetch(`/api/leads/${lead.id}/transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetStage,
            subStage: targetStage === LeadStage.OPPORTUNITY ? subStage : undefined,
            reason,
            notes: notes.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Stage transition failed");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "var(--space-md)",
      }}
    >
      <div
        className="store-utility-card"
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--color-canvas)",
          borderRadius: "var(--radius-xl)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--space-md) var(--space-lg)",
            borderBottom: "1px solid var(--color-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--color-surface-pearl)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "rgba(0, 102, 204, 0.1)",
                color: "var(--color-primary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowRightLeft size={16} />
            </div>
            <div>
              <h2 className="type-body-strong" style={{ margin: 0, color: "var(--color-ink)", fontSize: "16px" }}>
                {isBulk ? `Transition ${bulkIds.length} Leads` : `Transition ${lead?.crmId}`}
              </h2>
              <span className="type-caption" style={{ color: "var(--color-ink-muted-48)", fontSize: "12px" }}>
                {isBulk
                  ? "Batch state machine transition"
                  : `Currently in '${currentStage}' · Enforcing Sell.do FSM matrix`}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-ink-muted-48)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: "var(--space-lg)" }}>
          {error && (
            <div
              style={{
                marginBottom: "var(--space-md)",
                padding: "8px 12px",
                backgroundColor: "rgba(255, 59, 48, 0.1)",
                border: "1px solid rgba(255, 59, 48, 0.3)",
                borderRadius: "var(--radius-sm)",
                color: "#d70015",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {allowedStages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--space-lg) 0", color: "var(--color-ink-muted-48)" }}>
              No transitions allowed from current stage <strong>{currentStage}</strong>.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              {/* Target Stage */}
              <div>
                <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "6px" }}>
                  Destination Stage *
                </label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as LeadStage)}
                  className="apple-input"
                  style={{ cursor: "pointer" }}
                >
                  {allowedStages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opportunity Hotness */}
              {targetStage === LeadStage.OPPORTUNITY && (
                <div>
                  <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "6px" }}>
                    Opportunity Temperature (Sub-stage)
                  </label>
                  <select
                    value={subStage}
                    onChange={(e) => setSubStage(e.target.value as "HOT" | "WARM" | "COLD")}
                    className="apple-input"
                    style={{ cursor: "pointer" }}
                  >
                    <option value="HOT">HOT (High Intent / Site Visit Conducted)</option>
                    <option value="WARM">WARM (Evaluating / Budget Match)</option>
                    <option value="COLD">COLD (Long-term Interest)</option>
                  </select>
                </div>
              )}

              {/* Mandatory Unqualified Reason */}
              {targetStage === LeadStage.UNQUALIFIED && (
                <div>
                  <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "6px" }}>
                    Mandatory Reason for Unqualified *
                  </label>
                  <select
                    value={unqualifiedReason}
                    onChange={(e) => setUnqualifiedReason(e.target.value)}
                    className="apple-input"
                    style={{ cursor: "pointer" }}
                  >
                    {UNQUALIFIED_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mandatory Lost Reason */}
              {targetStage === LeadStage.LOST && (
                <div>
                  <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "6px" }}>
                    Mandatory Reason for Lost *
                  </label>
                  <select
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    className="apple-input"
                    style={{ cursor: "pointer" }}
                  >
                    {LOST_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              {!isBulk && (
                <div>
                  <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "6px" }}>
                    Transition Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Customer feedback or discussion summary..."
                    className="apple-input"
                    style={{ height: "auto", padding: "8px 12px", resize: "none" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "var(--space-sm)",
              marginTop: "var(--space-lg)",
              paddingTop: "var(--space-md)",
              borderTop: "1px solid var(--color-hairline)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-pearl-capsule"
              style={{ height: "38px", padding: "0 18px" }}
            >
              Cancel
            </button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || allowedStages.length === 0}
              style={{ height: "38px", padding: "0 22px" }}
            >
              {loading ? "Transitioning..." : "Confirm Stage"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
