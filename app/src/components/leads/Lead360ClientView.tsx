"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lead360Data } from "@/lib/leads";
import { LeadStageBadge } from "./LeadStageBadge";
import { LeadTimeline } from "./LeadTimeline";
import { StageTransitionModal } from "./StageTransitionModal";
import { ReassignModal } from "./ReassignModal";
import { AddNoteModal } from "./AddNoteModal";
import {
  Building2,
  Phone,
  Mail,
  User,
  Calendar,
  DollarSign,
  ArrowRightLeft,
  UserCheck,
  MessageSquare,
  PhoneCall,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Home,
  Tag,
  Clock,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { LeadStage } from "@prisma/client";

interface Lead360ClientViewProps {
  lead: Lead360Data;
  availableUsers: Array<{ id: string; firstName: string; lastName: string; role: string }>;
}

export const Lead360ClientView: React.FC<Lead360ClientViewProps> = ({
  lead,
  availableUsers,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "visits_bookings" | "simulated">("overview");

  // Modals state
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  const handleActionSuccess = () => {
    router.refresh();
  };

  // Pipeline chevron steps
  const pipelineSteps = [
    { stage: LeadStage.INCOMING, label: "Incoming" },
    { stage: LeadStage.PROSPECT, label: "Prospect" },
    { stage: LeadStage.OPPORTUNITY, label: "Opportunity" },
    { stage: LeadStage.BOOKED, label: "Booked" },
  ];

  const getStageIndex = (stage: LeadStage) => {
    switch (stage) {
      case LeadStage.INCOMING: return 0;
      case LeadStage.PROSPECT: return 1;
      case LeadStage.OPPORTUNITY: return 2;
      case LeadStage.BOOKED: return 3;
      default: return -1;
    }
  };

  const currentStageIndex = getStageIndex(lead.stage);
  const isTerminal = lead.stage === LeadStage.UNQUALIFIED || lead.stage === LeadStage.LOST;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumbs"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "var(--color-ink-muted-48)",
        }}
      >
        <Link href="/dashboard" style={{ color: "var(--color-ink-muted-48)", textDecoration: "none" }}>
          Dashboard
        </Link>
        <ChevronRight size={12} />
        <Link href="/leads" style={{ color: "var(--color-ink-muted-48)", textDecoration: "none" }}>
          Leads 360
        </Link>
        <ChevronRight size={12} />
        <span style={{ color: "var(--color-ink)", fontWeight: 600 }}>
          {lead.crmId} · {lead.firstName} {lead.lastName}
        </span>
      </nav>

      {/* Header Profile Card */}
      <div
        className="store-utility-card"
        style={{
          backgroundColor: "var(--color-canvas)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
          padding: "var(--space-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "var(--space-md)",
          }}
        >
          {/* Left: Identity info */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "var(--color-surface-pearl)",
                color: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 600,
                border: "1px solid var(--color-hairline)",
              }}
            >
              {lead.firstName[0]}{lead.lastName[0]}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "var(--color-surface-pearl)",
                    color: "var(--color-ink-muted-80)",
                    border: "1px solid var(--color-hairline)",
                  }}
                >
                  {lead.crmId}
                </span>
                <h1 className="type-tagline" style={{ margin: 0, color: "var(--color-ink)", fontSize: "22px" }}>
                  {lead.firstName} {lead.lastName}
                </h1>
                <LeadStageBadge stage={lead.stage} subStage={lead.subStage} />
              </div>

              {/* Contact & Meta Subline */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "13px", color: "var(--color-ink-muted-80)", marginTop: "2px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Phone size={13} style={{ color: "var(--color-primary)" }} />
                  {lead.phone}
                </span>
                {lead.email && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Mail size={13} style={{ color: "var(--color-primary)" }} />
                    {lead.email}
                  </span>
                )}
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Building2 size={13} style={{ color: "var(--color-ink-muted-48)" }} />
                  {lead.project ? lead.project.name : "General Project"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Tag size={13} style={{ color: "var(--color-ink-muted-48)" }} />
                  {lead.source || "Direct Walk-in"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setIsTransitionOpen(true)}
              className="btn-pearl-capsule"
              style={{
                height: "36px",
                padding: "0 14px",
                fontSize: "13px",
                gap: "5px",
                backgroundColor: "rgba(0, 102, 204, 0.08)",
                color: "var(--color-primary)",
                borderColor: "rgba(0, 102, 204, 0.25)",
              }}
            >
              <ArrowRightLeft size={14} />
              Change Stage
            </button>

            <button
              onClick={() => setIsReassignOpen(true)}
              className="btn-pearl-capsule"
              style={{ height: "36px", padding: "0 14px", fontSize: "13px", gap: "5px" }}
            >
              <UserCheck size={14} />
              Reassign
            </button>

            <button
              onClick={() => setIsAddNoteOpen(true)}
              className="btn-pearl-capsule"
              style={{ height: "36px", padding: "0 14px", fontSize: "13px", gap: "5px" }}
            >
              <MessageSquare size={14} />
              Add Note
            </button>

            {/* Simulated Action Triggers */}
            <button
              onClick={() => setSimulationNotice("Telephony outbound IVR bridge is simulated in Phase 3. Full dialer activation scheduled for Phase 4.")}
              className="btn-pearl-capsule"
              style={{ height: "36px", padding: "0 12px", fontSize: "12px", gap: "4px" }}
              title="Simulated Click-to-call"
            >
              <PhoneCall size={13} />
              Call [SIM]
            </button>

            <button
              onClick={() => setSimulationNotice("Meta WhatsApp Business conversational flow is simulated in Phase 3. Interactive flow studio scheduled for Phase 4.")}
              className="btn-pearl-capsule"
              style={{ height: "36px", padding: "0 12px", fontSize: "12px", gap: "4px" }}
              title="Simulated WhatsApp"
            >
              <MessageCircle size={13} />
              WhatsApp [SIM]
            </button>
          </div>
        </div>

        {/* Simulation Notice Banner if triggered */}
        {simulationNotice && (
          <div
            style={{
              padding: "8px 14px",
              backgroundColor: "var(--color-surface-pearl)",
              border: "1px solid var(--color-hairline)",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              color: "var(--color-ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="badge-simulated">Phase 3 Scope</span>
              <span>{simulationNotice}</span>
            </div>
            <button
              onClick={() => setSimulationNotice(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-ink-muted-48)" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Pipeline Progress Chevrons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isTerminal ? "repeat(5, 1fr)" : "repeat(4, 1fr)",
            gap: "4px",
            marginTop: "var(--space-xs)",
            backgroundColor: "var(--color-surface-pearl)",
            padding: "4px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-hairline)",
          }}
        >
          {pipelineSteps.map((step, idx) => {
            const isCompleted = !isTerminal && currentStageIndex > idx;
            const isCurrent = !isTerminal && currentStageIndex === idx;

            return (
              <div
                key={step.stage}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: isCurrent
                    ? "var(--color-canvas)"
                    : isCompleted
                    ? "rgba(52, 199, 89, 0.08)"
                    : "transparent",
                  border: isCurrent
                    ? "1px solid var(--color-primary)"
                    : isCompleted
                    ? "1px solid rgba(52, 199, 89, 0.2)"
                    : "1px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: isCurrent ? 600 : 500,
                  color: isCurrent
                    ? "var(--color-primary)"
                    : isCompleted
                    ? "#248a3d"
                    : "var(--color-ink-muted-48)",
                }}
              >
                {isCompleted && <CheckCircle2 size={13} />}
                <span>{step.label}</span>
              </div>
            );
          })}

          {/* Terminal state chevron if Unqualified or Lost */}
          {isTerminal && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                backgroundColor:
                  lead.stage === LeadStage.LOST
                    ? "rgba(255, 59, 48, 0.1)"
                    : "rgba(255, 149, 0, 0.1)",
                border:
                  lead.stage === LeadStage.LOST
                    ? "1px solid rgba(255, 59, 48, 0.3)"
                    : "1px solid rgba(255, 149, 0, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: lead.stage === LeadStage.LOST ? "#d70015" : "#b25900",
              }}
            >
              <span>{lead.stage} ({lead.lostReason || lead.unqualifiedReason || "Flagged"})</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderBottom: "1px solid var(--color-hairline)",
          paddingBottom: "2px",
        }}
      >
        <button
          onClick={() => setActiveTab("overview")}
          className={`btn-pearl-capsule ${activeTab === "overview" ? "active" : ""}`}
          style={{
            borderRadius: "var(--radius-sm)",
            height: "36px",
            border: activeTab === "overview" ? "1px solid var(--color-primary)" : "1px solid transparent",
            backgroundColor: activeTab === "overview" ? "var(--color-canvas)" : "transparent",
            color: activeTab === "overview" ? "var(--color-primary)" : "var(--color-ink)",
            fontWeight: activeTab === "overview" ? 600 : 400,
          }}
        >
          Overview & Requirements
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`btn-pearl-capsule ${activeTab === "timeline" ? "active" : ""}`}
          style={{
            borderRadius: "var(--radius-sm)",
            height: "36px",
            border: activeTab === "timeline" ? "1px solid var(--color-primary)" : "1px solid transparent",
            backgroundColor: activeTab === "timeline" ? "var(--color-canvas)" : "transparent",
            color: activeTab === "timeline" ? "var(--color-primary)" : "var(--color-ink)",
            fontWeight: activeTab === "timeline" ? 600 : 400,
          }}
        >
          Activity Timeline ({lead.activities.length})
        </button>

        <button
          onClick={() => setActiveTab("visits_bookings")}
          className={`btn-pearl-capsule ${activeTab === "visits_bookings" ? "active" : ""}`}
          style={{
            borderRadius: "var(--radius-sm)",
            height: "36px",
            border: activeTab === "visits_bookings" ? "1px solid var(--color-primary)" : "1px solid transparent",
            backgroundColor: activeTab === "visits_bookings" ? "var(--color-canvas)" : "transparent",
            color: activeTab === "visits_bookings" ? "var(--color-primary)" : "var(--color-ink)",
            fontWeight: activeTab === "visits_bookings" ? 600 : 400,
          }}
        >
          Site Visits ({lead.siteVisits.length}) & Bookings ({lead.bookings.length})
        </button>

        <button
          onClick={() => setActiveTab("simulated")}
          className={`btn-pearl-capsule ${activeTab === "simulated" ? "active" : ""}`}
          style={{
            borderRadius: "var(--radius-sm)",
            height: "36px",
            border: activeTab === "simulated" ? "1px solid var(--color-primary)" : "1px solid transparent",
            backgroundColor: activeTab === "simulated" ? "var(--color-canvas)" : "transparent",
            color: activeTab === "simulated" ? "var(--color-primary)" : "var(--color-ink)",
            fontWeight: activeTab === "simulated" ? 600 : 400,
          }}
        >
          Simulated Communications [SIM]
        </button>
      </div>

      {/* Tab 1: Overview & Requirements */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-md)" }}>
          {/* Card: Customer Requirements */}
          <div className="store-utility-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <h3 className="type-caption-strong" style={{ margin: 0, color: "var(--color-ink)" }}>
              Property Requirements
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider-soft)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Project</span>
                <strong style={{ color: "var(--color-ink)" }}>{lead.project ? lead.project.name : "Not specified"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider-soft)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Configuration</span>
                <strong style={{ color: "var(--color-ink)" }}>{lead.propertyType || "Standard Unit"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider-soft)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Maximum Budget</span>
                <strong style={{ color: "var(--color-primary)" }}>
                  {lead.budgetMax ? `₹${(lead.budgetMax / 100000).toFixed(0)} Lakhs` : "Open Budget"}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Project Location</span>
                <span style={{ color: "var(--color-ink)" }}>{lead.project?.location || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Card: Assignment & Internal Team */}
          <div className="store-utility-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <h3 className="type-caption-strong" style={{ margin: 0, color: "var(--color-ink)" }}>
              Sales Assignment & Governance
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider-soft)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Assigned Representative</span>
                <strong style={{ color: "var(--color-ink)" }}>
                  {lead.assignedUser ? `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}` : "Unassigned"}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider-soft)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Employee Role</span>
                <span style={{ color: "var(--color-ink)" }}>{lead.assignedUser?.role || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider-soft)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Department / Team</span>
                <span style={{ color: "var(--color-ink)" }}>{lead.team?.name || "Direct Sales"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Employee Email</span>
                <span style={{ color: "var(--color-ink)" }}>{lead.assignedUser?.email || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Card: Campaign & Attribution */}
          <div className="store-utility-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <h3 className="type-caption-strong" style={{ margin: 0, color: "var(--color-ink)" }}>
              Marketing & Attribution
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider-soft)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Acquisition Source</span>
                <strong style={{ color: "var(--color-ink)" }}>{lead.source || "Direct Walk-in"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider-soft)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Campaign Attribution</span>
                <span style={{ color: "var(--color-ink)" }}>{lead.campaign?.name || "General Campaign"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider-soft)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Ingestion Date</span>
                <span style={{ color: "var(--color-ink)" }}>
                  {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-ink-muted-48)" }}>Last Modified</span>
                <span style={{ color: "var(--color-ink)" }}>
                  {new Date(lead.updatedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Timeline */}
      {activeTab === "timeline" && (
        <div className="store-utility-card">
          <LeadTimeline
            activities={lead.activities}
            onOpenAddNote={() => setIsAddNoteOpen(true)}
          />
        </div>
      )}

      {/* Tab 3: Site Visits & Bookings */}
      {activeTab === "visits_bookings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {/* Site Visits Section */}
          <div className="store-utility-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 className="type-caption-strong" style={{ margin: 0, color: "var(--color-ink)" }}>
                Site Visits & Walkthroughs ({lead.siteVisits.length})
              </h3>
            </div>

            {lead.siteVisits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-lg) 0", color: "var(--color-ink-muted-48)", fontSize: "13px" }}>
                No site visits have been scheduled or conducted yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {lead.siteVisits.map((sv) => (
                  <div
                    key={sv.id}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-surface-pearl)",
                      border: "1px solid var(--color-hairline)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MapPin size={16} style={{ color: "var(--color-primary)" }} />
                      <div>
                        <strong style={{ fontSize: "13px", color: "var(--color-ink)" }}>
                          {sv.project.name}
                        </strong>
                        <div style={{ fontSize: "11px", color: "var(--color-ink-muted-48)" }}>
                          Scheduled: {new Date(sv.scheduledStartTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        className="btn-pearl-capsule"
                        style={{
                          fontSize: "11px",
                          height: "24px",
                          padding: "0 8px",
                          color: sv.status === "CONDUCTED" ? "#248a3d" : "var(--color-ink)",
                        }}
                      >
                        {sv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings Section */}
          <div className="store-utility-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <h3 className="type-caption-strong" style={{ margin: 0, color: "var(--color-ink)" }}>
              Confirmed Inventory Bookings ({lead.bookings.length})
            </h3>

            {lead.bookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-lg) 0", color: "var(--color-ink-muted-48)", fontSize: "13px" }}>
                No active unit bookings recorded for this lead.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {lead.bookings.map((bk) => (
                  <div
                    key={bk.id}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-surface-pearl)",
                      border: "1px solid var(--color-hairline)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "1px 5px",
                            backgroundColor: "var(--color-canvas)",
                            border: "1px solid var(--color-hairline)",
                            borderRadius: "3px",
                          }}
                        >
                          {bk.bookingId}
                        </span>
                        <strong style={{ fontSize: "14px", color: "var(--color-ink)" }}>
                          Unit {bk.unit.unitNumber} ({bk.unit.configuration})
                        </strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--color-ink-muted-48)", marginTop: "2px" }}>
                        {bk.project.name} · Booked on {new Date(bk.createdAt).toLocaleDateString("en-IN")}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-primary)" }}>
                        ₹{(bk.agreementValue / 100000).toFixed(2)} Lakhs
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--color-ink-muted-48)" }}>
                        Status: <strong style={{ color: "#248a3d" }}>{bk.status}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Simulated Communications Disclosure */}
      {activeTab === "simulated" && (
        <div className="store-utility-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="badge-simulated">Phase 3 Architectural Disclosure</span>
            <h3 className="type-caption-strong" style={{ margin: 0, color: "var(--color-ink)" }}>
              Communications & External Subsystems
            </h3>
          </div>

          <p className="type-caption" style={{ color: "var(--color-ink-muted-80)", margin: 0 }}>
            In accordance with the Sell.do phased architecture and project boundaries, external telephony (virtual DIDs, dual-leg calling, AI transcriptions) and WhatsApp Meta Cloud API integrations are strictly simulated mock representations. Full SIP telephony bridge and Meta Flows studio are scheduled for Phase 4.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)", marginTop: "var(--space-sm)" }}>
            <div
              style={{
                padding: "12px",
                backgroundColor: "var(--color-surface-pearl)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-hairline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <PhoneCall size={14} style={{ color: "var(--color-primary)" }} />
                <strong style={{ fontSize: "13px" }}>Telephony IVR Bridge</strong>
                <span className="badge-simulated">SIMULATED</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-ink-muted-48)", margin: 0 }}>
                Virtual number mapping, disposition timeouts, and call audio waveform recording player.
              </p>
            </div>

            <div
              style={{
                padding: "12px",
                backgroundColor: "var(--color-surface-pearl)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-hairline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <MessageCircle size={14} style={{ color: "#34c759" }} />
                <strong style={{ fontSize: "13px" }}>Meta WhatsApp Flow Studio</strong>
                <span className="badge-simulated">SIMULATED</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-ink-muted-48)", margin: 0 }}>
                Two-way conversational chat, HSM template approval evaluator, and DND quiet-hours windows.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <StageTransitionModal
        isOpen={isTransitionOpen}
        onClose={() => setIsTransitionOpen(false)}
        onSuccess={handleActionSuccess}
        lead={lead}
      />

      <ReassignModal
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        onSuccess={handleActionSuccess}
        lead={lead}
        availableUsers={availableUsers}
      />

      <AddNoteModal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        onSuccess={handleActionSuccess}
        leadId={lead.id}
        crmId={lead.crmId}
      />
    </div>
  );
};
