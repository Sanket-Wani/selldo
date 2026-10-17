"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { LeadListItem } from "@/lib/leads";
import { LeadStageBadge } from "./LeadStageBadge";
import { UserRole } from "@prisma/client";
import { ChevronRight, ArrowRightLeft, UserCheck, Calendar, Phone, Mail, Building2 } from "lucide-react";

interface LeadTableProps {
  leads: LeadListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenTransitionModal: (lead: LeadListItem) => void;
  onOpenReassignModal: (lead: LeadListItem) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  total,
  page,
  pageSize,
  totalPages,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenTransitionModal,
  onOpenReassignModal,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.includes(l.id));
  const someSelected = leads.some((l) => selectedIds.includes(l.id)) && !allSelected;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/leads?${params.toString()}`);
  };

  const startRecord = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(page * pageSize, total);

  if (leads.length === 0) {
    return (
      <div
        className="apple-table-container"
        style={{
          padding: "var(--space-xxl) var(--space-lg)",
          textAlign: "center",
          backgroundColor: "var(--color-canvas)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "var(--color-surface-pearl)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "var(--space-sm)",
            color: "var(--color-ink-muted-48)",
          }}
        >
          <Building2 size={24} />
        </div>
        <h3 className="type-body-strong" style={{ margin: "0 0 6px 0", color: "var(--color-ink)" }}>
          No Leads Found
        </h3>
        <p className="type-caption" style={{ color: "var(--color-ink-muted-48)", margin: "0 0 var(--space-md) 0" }}>
          No customer inquiries match the current filter criteria or stage.
        </p>
        <Link
          href="/leads"
          className="btn-secondary-pill"
          style={{ height: "36px", padding: "0 18px", fontSize: "13px", display: "inline-flex" }}
        >
          Clear Filters
        </Link>
      </div>
    );
  }

  return (
    <div className="apple-table-container">
      <div style={{ overflowX: "auto" }}>
        <table className="apple-table">
          <thead>
            <tr>
              <th style={{ width: "40px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  aria-label="Select all leads"
                  style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                />
              </th>
              <th>Lead / Customer</th>
              <th>Contact Details</th>
              <th>Lifecycle Stage</th>
              <th>Project Interest</th>
              <th>Assigned Rep</th>
              <th>Created Date</th>
              <th style={{ textAlign: "right", minWidth: "140px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const isSelected = selectedIds.includes(lead.id);
              const initials = lead.assignedUser
                ? `${lead.assignedUser.firstName[0]}${lead.assignedUser.lastName[0]}`
                : "?";

              return (
                <tr
                  key={lead.id}
                  style={{
                    backgroundColor: isSelected ? "rgba(0, 102, 204, 0.04)" : undefined,
                  }}
                >
                  {/* Select Checkbox */}
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(lead.id)}
                      aria-label={`Select lead ${lead.crmId}`}
                      style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                    />
                  </td>

                  {/* Lead ID & Name */}
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "1px 5px",
                            borderRadius: "4px",
                            backgroundColor: "var(--color-surface-pearl)",
                            color: "var(--color-ink-muted-80)",
                            border: "1px solid var(--color-hairline)",
                          }}
                        >
                          {lead.crmId}
                        </span>
                        <Link
                          href={`/leads/${lead.id}`}
                          style={{
                            fontFamily: "var(--font-body)",
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "var(--color-primary)",
                            textDecoration: "none",
                          }}
                          className="hover:underline"
                        >
                          {lead.firstName} {lead.lastName}
                        </Link>
                      </div>
                      <span className="type-caption" style={{ color: "var(--color-ink-muted-48)", fontSize: "12px" }}>
                        via {lead.source || "Direct Walk-in"}
                      </span>
                    </div>
                  </td>

                  {/* Contact Details */}
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "13px",
                          color: "var(--color-ink)",
                        }}
                      >
                        <Phone size={12} style={{ color: "var(--color-ink-muted-48)" }} />
                        {lead.phone}
                      </span>
                      {lead.email && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12px",
                            color: "var(--color-ink-muted-48)",
                          }}
                        >
                          <Mail size={12} style={{ color: "var(--color-ink-muted-48)" }} />
                          {lead.email}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Lifecycle Stage */}
                  <td>
                    <LeadStageBadge stage={lead.stage} subStage={lead.subStage} />
                  </td>

                  {/* Project Interest & Budget */}
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-ink)" }}>
                        {lead.project ? lead.project.name : "General Inquiry"}
                      </span>
                      {(lead.propertyType || lead.budgetMin || lead.budgetMax) && (
                        <span className="type-caption" style={{ color: "var(--color-ink-muted-48)", fontSize: "12px" }}>
                          {lead.propertyType || "Unit"}
                          {lead.budgetMax
                            ? ` · Up to ₹${(lead.budgetMax / 100000).toFixed(0)}L`
                            : ""}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Assigned Rep */}
                  <td>
                    {lead.assignedUser ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "var(--color-surface-pearl)",
                            color: "var(--color-primary)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 600,
                            border: "1px solid var(--color-hairline)",
                          }}
                        >
                          {initials}
                        </span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "13px", color: "var(--color-ink)", fontWeight: 500 }}>
                            {lead.assignedUser.firstName} {lead.assignedUser.lastName}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--color-ink-muted-48)" }}>
                            {lead.assignedUser.role}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="type-caption" style={{ color: "var(--color-ink-muted-48)", fontStyle: "italic" }}>
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Created Date */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-ink-muted-80)", fontSize: "12px" }}>
                      <Calendar size={12} style={{ color: "var(--color-ink-muted-48)" }} />
                      {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </td>

                  {/* Row Actions */}
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {/* Transition button */}
                      <button
                        onClick={() => onOpenTransitionModal(lead)}
                        className="btn-pearl-capsule"
                        style={{ padding: "4px 8px", fontSize: "11px", height: "28px", gap: "3px" }}
                        title="Change Stage"
                      >
                        <ArrowRightLeft size={12} />
                        Stage
                      </button>

                      {/* Reassign button */}
                      <button
                        onClick={() => onOpenReassignModal(lead)}
                        className="btn-pearl-capsule"
                        style={{ padding: "4px 8px", fontSize: "11px", height: "28px", gap: "3px" }}
                        title="Reassign Rep"
                      >
                        <UserCheck size={12} />
                        Assign
                      </button>

                      {/* Detail 360 Link */}
                      <Link
                        href={`/leads/${lead.id}`}
                        className="btn-pearl-capsule"
                        style={{ padding: "4px 8px", fontSize: "11px", height: "28px", color: "var(--color-primary)" }}
                        title="Open Lead 360"
                      >
                        360
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-sm) var(--space-md)",
          borderTop: "1px solid var(--color-hairline)",
          backgroundColor: "var(--color-surface-pearl)",
        }}
      >
        <span className="type-caption" style={{ color: "var(--color-ink-muted-48)", fontSize: "12px" }}>
          Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of{" "}
          <strong>{total}</strong> leads
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="btn-pearl-capsule"
            style={{
              height: "30px",
              padding: "0 10px",
              fontSize: "12px",
              opacity: page <= 1 ? 0.4 : 1,
              cursor: page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>
          <span className="type-caption" style={{ fontSize: "12px", color: "var(--color-ink)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn-pearl-capsule"
            style={{
              height: "30px",
              padding: "0 10px",
              fontSize: "12px",
              opacity: page >= totalPages ? 0.4 : 1,
              cursor: page >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
