"use client";

import React from "react";
import Link from "next/link";
import type { LeadListItem } from "@/lib/leads";
import { LeadStage } from "@prisma/client";
import { LeadStageBadge } from "./LeadStageBadge";
import { Building2, Phone, Calendar, ArrowRightLeft, UserCheck } from "lucide-react";

interface PipelineViewProps {
  leads: LeadListItem[];
  onOpenTransitionModal: (lead: LeadListItem) => void;
  onOpenReassignModal: (lead: LeadListItem) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  leads,
  onOpenTransitionModal,
  onOpenReassignModal,
}) => {
  const columns: Array<{ stage: LeadStage; title: string }> = [
    { stage: LeadStage.INCOMING, title: "Incoming / New" },
    { stage: LeadStage.PROSPECT, title: "Prospects" },
    { stage: LeadStage.OPPORTUNITY, title: "Opportunities" },
    { stage: LeadStage.BOOKED, title: "Booked" },
    { stage: LeadStage.UNQUALIFIED, title: "Unqualified" },
    { stage: LeadStage.LOST, title: "Lost" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "var(--space-md)",
        alignItems: "start",
        overflowX: "auto",
        paddingBottom: "var(--space-md)",
      }}
    >
      {columns.map(({ stage, title }) => {
        const columnLeads = leads.filter((l) => l.stage === stage);

        return (
          <div
            key={stage}
            style={{
              backgroundColor: "var(--color-canvas)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-hairline)",
              display: "flex",
              flexDirection: "column",
              minHeight: "450px",
              maxHeight: "750px",
              overflow: "hidden",
            }}
          >
            {/* Column Header */}
            <div
              style={{
                padding: "var(--space-sm) var(--space-md)",
                borderBottom: "1px solid var(--color-hairline)",
                backgroundColor: "var(--color-surface-pearl)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="type-caption-strong" style={{ color: "var(--color-ink)", fontSize: "13px" }}>
                  {title}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: "10px",
                    backgroundColor: "var(--color-canvas)",
                    color: "var(--color-ink-muted-48)",
                    border: "1px solid var(--color-hairline)",
                  }}
                >
                  {columnLeads.length}
                </span>
              </div>
            </div>

            {/* Column Body / Cards */}
            <div
              style={{
                padding: "var(--space-sm)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {columnLeads.length === 0 ? (
                <div
                  style={{
                    padding: "var(--space-lg) var(--space-sm)",
                    textAlign: "center",
                    color: "var(--color-ink-muted-48)",
                    fontSize: "12px",
                  }}
                >
                  No leads in {title}
                </div>
              ) : (
                columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    style={{
                      backgroundColor: "var(--color-canvas)",
                      border: "1px solid var(--color-hairline)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-sm)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    {/* Header: CRM ID & Name */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "1px 4px",
                          borderRadius: "3px",
                          backgroundColor: "var(--color-surface-pearl)",
                          color: "var(--color-ink-muted-80)",
                          border: "1px solid var(--color-hairline)",
                        }}
                      >
                        {lead.crmId}
                      </span>
                      <LeadStageBadge stage={lead.stage} subStage={lead.subStage} />
                    </div>

                    <Link
                      href={`/leads/${lead.id}`}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "var(--color-ink)",
                        textDecoration: "none",
                      }}
                      className="hover:underline"
                    >
                      {lead.firstName} {lead.lastName}
                    </Link>

                    {/* Project & Phone */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "12px", color: "var(--color-ink-muted-48)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Building2 size={11} />
                        {lead.project ? lead.project.name : "General Project"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Phone size={11} />
                        {lead.phone}
                      </span>
                    </div>

                    {/* Assigned Rep & Date */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "4px",
                        borderTop: "1px solid var(--color-divider-soft)",
                        marginTop: "2px",
                        fontSize: "11px",
                      }}
                    >
                      <span style={{ color: "var(--color-ink)", fontWeight: 500 }}>
                        {lead.assignedUser
                          ? `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}`
                          : "Unassigned"}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <button
                          onClick={() => onOpenTransitionModal(lead)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--color-primary)",
                            padding: "2px",
                          }}
                          title="Change Stage"
                        >
                          <ArrowRightLeft size={13} />
                        </button>
                        <button
                          onClick={() => onOpenReassignModal(lead)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--color-ink-muted-80)",
                            padding: "2px",
                          }}
                          title="Reassign Rep"
                        >
                          <UserCheck size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
