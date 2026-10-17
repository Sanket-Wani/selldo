"use client";

import React, { useState } from "react";
import { X, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lead?: { id: string; crmId: string; firstName: string; lastName: string; assignedUser?: any } | null;
  bulkIds?: string[];
  availableUsers: Array<{ id: string; firstName: string; lastName: string; role: string }>;
}

export const ReassignModal: React.FC<ReassignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lead,
  bulkIds = [],
  availableUsers,
}) => {
  const isBulk = bulkIds.length > 0;
  const [assignedUserId, setAssignedUserId] = useState(availableUsers[0]?.id || "");
  const [reason, setReason] = useState("Managerial Load Balancing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!assignedUserId) {
      setError("Please select a target sales representative.");
      return;
    }

    try {
      setLoading(true);

      if (isBulk) {
        const res = await fetch("/api/leads/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REASSIGN",
            leadIds: bulkIds,
            assignedUserId,
            reason,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Bulk reassignment failed");
      } else if (lead) {
        const res = await fetch(`/api/leads/${lead.id}/reassign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignedUserId,
            reason,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Reassignment failed");
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
          maxWidth: "460px",
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
              <UserCheck size={16} />
            </div>
            <div>
              <h2 className="type-body-strong" style={{ margin: 0, color: "var(--color-ink)", fontSize: "16px" }}>
                {isBulk ? `Reassign ${bulkIds.length} Leads` : `Reassign ${lead?.crmId}`}
              </h2>
              <span className="type-caption" style={{ color: "var(--color-ink-muted-48)", fontSize: "12px" }}>
                {isBulk ? "Batch transfer of lead ownership" : `Currently: ${lead?.assignedUser?.firstName || "Unassigned"}`}
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

        {/* Form */}
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

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            {/* Target Agent Select */}
            <div>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "6px" }}>
                Target Sales Representative *
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="apple-input"
                style={{ cursor: "pointer" }}
              >
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Reassignment Reason */}
            <div>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "6px" }}>
                Reassignment Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="apple-input"
                style={{ cursor: "pointer" }}
              >
                <option value="Managerial Load Balancing">Managerial Load Balancing</option>
                <option value="Pre-Sales to Direct Sales Handoff">Pre-Sales to Direct Sales Handoff</option>
                <option value="Agent On Leave / Unreachable">Agent On Leave / Unreachable</option>
                <option value="Project Specialization Match">Project Specialization Match</option>
                <option value="Customer Preference / Language">Customer Preference / Language</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

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
              disabled={loading}
              style={{ height: "38px", padding: "0 22px" }}
            >
              {loading ? "Reassigning..." : "Confirm Reassignment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
