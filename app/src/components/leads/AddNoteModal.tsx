"use client";

import React, { useState } from "react";
import { X, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId: string;
  crmId: string;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  crmId,
}) => {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Note content cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add note");
      }

      setNote("");
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
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="type-body-strong" style={{ margin: 0, color: "var(--color-ink)", fontSize: "16px" }}>
                Add Interaction Note
              </h2>
              <span className="type-caption" style={{ color: "var(--color-ink-muted-48)", fontSize: "12px" }}>
                {crmId} · Record client discussion or requirement update
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

          <div>
            <textarea
              rows={4}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Customer prefers higher floor 3 BHK with east facing balcony. Site visit scheduled for Saturday..."
              className="apple-input"
              style={{ height: "auto", padding: "10px 12px", resize: "none" }}
            />
          </div>

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
              {loading ? "Saving..." : "Add Note"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
