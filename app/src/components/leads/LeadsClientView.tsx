"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadListResult, LeadListItem } from "@/lib/leads";
import { SmartFilterTabs } from "./SmartFilterTabs";
import { LeadFilterBar } from "./LeadFilterBar";
import { LeadTable } from "./LeadTable";
import { PipelineView } from "./PipelineView";
import { BulkActionBar } from "./BulkActionBar";
import { CreateLeadModal } from "./CreateLeadModal";
import { StageTransitionModal } from "./StageTransitionModal";
import { ReassignModal } from "./ReassignModal";

interface LeadsClientViewProps {
  data: LeadListResult;
  currentStage: string;
}

export const LeadsClientView: React.FC<LeadsClientViewProps> = ({
  data,
  currentStage,
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [transitionLead, setTransitionLead] = useState<LeadListItem | null>(null);
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [reassignLeadTarget, setReassignLeadTarget] = useState<LeadListItem | null>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isBulkTransition, setIsBulkTransition] = useState(false);
  const [isBulkReassign, setIsBulkReassign] = useState(false);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (data.leads.length > 0 && data.leads.every((l) => selectedIds.includes(l.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.leads.map((l) => l.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Modals open triggers
  const handleOpenSingleTransition = (lead: LeadListItem) => {
    setTransitionLead(lead);
    setIsBulkTransition(false);
    setIsTransitionOpen(true);
  };

  const handleOpenBulkTransition = () => {
    setTransitionLead(null);
    setIsBulkTransition(true);
    setIsTransitionOpen(true);
  };

  const handleOpenSingleReassign = (lead: LeadListItem) => {
    setReassignLeadTarget(lead);
    setIsBulkReassign(false);
    setIsReassignOpen(true);
  };

  const handleOpenBulkReassign = () => {
    setReassignLeadTarget(null);
    setIsBulkReassign(true);
    setIsReassignOpen(true);
  };

  const handleActionSuccess = () => {
    setSelectedIds([]);
    router.refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Smart Filter Tabs */}
      <SmartFilterTabs
        currentStage={currentStage}
        bucketCounts={data.bucketCounts}
      />

      {/* Filter and Search Bar */}
      <LeadFilterBar
        availableProjects={data.availableProjects}
        availableUsers={data.availableUsers}
        availableSources={data.availableSources}
        viewMode={viewMode}
        onToggleView={setViewMode}
        onOpenCreateModal={() => setIsCreateOpen(true)}
      />

      {/* Main Content: Table or Pipeline View */}
      {viewMode === "list" ? (
        <LeadTable
          leads={data.leads}
          total={data.total}
          page={data.page}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onOpenTransitionModal={handleOpenSingleTransition}
          onOpenReassignModal={handleOpenSingleReassign}
        />
      ) : (
        <PipelineView
          leads={data.leads}
          onOpenTransitionModal={handleOpenSingleTransition}
          onOpenReassignModal={handleOpenSingleReassign}
        />
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={handleClearSelection}
        onOpenBulkReassign={handleOpenBulkReassign}
        onOpenBulkTransition={handleOpenBulkTransition}
      />

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleActionSuccess}
        availableProjects={data.availableProjects}
        availableUsers={data.availableUsers}
      />

      {/* Stage Transition Modal (Single & Bulk) */}
      <StageTransitionModal
        isOpen={isTransitionOpen}
        onClose={() => {
          setIsTransitionOpen(false);
          setTransitionLead(null);
          setIsBulkTransition(false);
        }}
        onSuccess={handleActionSuccess}
        lead={transitionLead}
        bulkIds={isBulkTransition ? selectedIds : []}
      />

      {/* Reassign Modal (Single & Bulk) */}
      <ReassignModal
        isOpen={isReassignOpen}
        onClose={() => {
          setIsReassignOpen(false);
          setReassignLeadTarget(null);
          setIsBulkReassign(false);
        }}
        onSuccess={handleActionSuccess}
        lead={reassignLeadTarget}
        bulkIds={isBulkReassign ? selectedIds : []}
        availableUsers={data.availableUsers}
      />
    </div>
  );
};
