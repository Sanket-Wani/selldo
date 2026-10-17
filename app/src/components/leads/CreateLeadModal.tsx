"use client";

import React, { useState } from "react";
import { X, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableProjects: Array<{ id: string; name: string; code: string }>;
  availableUsers: Array<{ id: string; firstName: string; lastName: string; role: string }>;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  availableProjects,
  availableUsers,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [source, setSource] = useState("Direct Walk-in");
  const [propertyType, setPropertyType] = useState("2 BHK");
  const [budgetMax, setBudgetMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError("First name, last name, and phone number are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email: email.trim() || undefined,
          projectId: projectId || undefined,
          assignedUserId: assignedUserId || undefined,
          source,
          propertyType,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create lead");
      }

      // Reset and close
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setProjectId("");
      setAssignedUserId("");
      setBudgetMax("");
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
          maxWidth: "540px",
          backgroundColor: "var(--color-canvas)",
          borderRadius: "var(--radius-xl)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
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
              <UserPlus size={16} />
            </div>
            <div>
              <h2 className="type-body-strong" style={{ margin: 0, color: "var(--color-ink)", fontSize: "16px" }}>
                Capture New Lead
              </h2>
              <span className="type-caption" style={{ color: "var(--color-ink-muted-48)", fontSize: "12px" }}>
                Direct customer inquiry ingestion with automatic CRM ID assignment
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

        {/* Modal Body / Form */}
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
            {/* First Name */}
            <div>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "4px" }}>
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Rahul"
                className="apple-input"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "4px" }}>
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Sharma"
                className="apple-input"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "4px" }}>
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="apple-input"
              />
            </div>

            {/* Email */}
            <div>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "4px" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul.sharma@example.com"
                className="apple-input"
              />
            </div>

            {/* Project */}
            <div>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "4px" }}>
                Project Interest
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="apple-input"
                style={{ cursor: "pointer" }}
              >
                <option value="">Select Project</option>
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Rep */}
            <div>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "4px" }}>
                Assign Sales Rep
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="apple-input"
                style={{ cursor: "pointer" }}
              >
                <option value="">Leave Unassigned</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Acquisition Source */}
            <div>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "4px" }}>
                Acquisition Channel
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="apple-input"
                style={{ cursor: "pointer" }}
              >
                <option value="Direct Walk-in">Direct Walk-in</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Channel Partner">Channel Partner</option>
                <option value="Referral">Customer Referral</option>
                <option value="Website">Official Website</option>
              </select>
            </div>

            {/* Configuration */}
            <div>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "4px" }}>
                Configuration
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="apple-input"
                style={{ cursor: "pointer" }}
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
                <option value="Villa">Luxury Villa</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>

            {/* Budget Max */}
            <div style={{ gridColumn: "span 2" }}>
              <label className="type-caption-strong" style={{ color: "var(--color-ink)", display: "block", marginBottom: "4px" }}>
                Maximum Budget (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="e.g. 12500000 (1.25 Cr)"
                className="apple-input"
              />
            </div>
          </div>

          {/* Modal Actions */}
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
              {loading ? "Capturing..." : "Create Lead"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
