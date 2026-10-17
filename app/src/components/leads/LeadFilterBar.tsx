"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus, RotateCcw, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LeadFilterBarProps {
  availableProjects: Array<{ id: string; name: string; code: string }>;
  availableUsers: Array<{ id: string; firstName: string; lastName: string; role: string }>;
  availableSources: string[];
  viewMode: "list" | "pipeline";
  onToggleView: (mode: "list" | "pipeline") => void;
  onOpenCreateModal: () => void;
}

export const LeadFilterBar: React.FC<LeadFilterBarProps> = ({
  availableProjects,
  availableUsers,
  availableSources,
  viewMode,
  onToggleView,
  onOpenCreateModal,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentProject = searchParams.get("projectId") || "";
  const currentAssigned = searchParams.get("assignedUserId") || "";
  const currentSource = searchParams.get("source") || "";

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "" && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/leads?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchTerm);
  };

  const handleReset = () => {
    setSearchTerm("");
    router.push("/leads");
  };

  const hasActiveFilters = Boolean(
    currentSearch ||
      currentProject ||
      currentAssigned ||
      currentSource ||
      (searchParams.get("stage") && searchParams.get("stage") !== "ALL")
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-sm)",
        backgroundColor: "var(--color-canvas)",
        padding: "var(--space-sm) var(--space-md)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-hairline)",
      }}
    >
      {/* Left side: Search & Dropdown Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", flex: 1 }}>
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} style={{ position: "relative", minWidth: "220px", maxWidth: "300px", flex: 1 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-ink-muted-48)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search CRM ID, name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={() => updateParam("search", searchTerm)}
            className="apple-input"
            style={{
              height: "36px",
              paddingLeft: "32px",
              fontSize: "13px",
              borderRadius: "var(--radius-md)",
            }}
          />
        </form>

        {/* Project Filter */}
        <select
          value={currentProject}
          onChange={(e) => updateParam("projectId", e.target.value)}
          className="apple-input"
          style={{
            height: "36px",
            width: "auto",
            minWidth: "150px",
            fontSize: "13px",
            cursor: "pointer",
            borderRadius: "var(--radius-md)",
          }}
          aria-label="Filter by Project"
        >
          <option value="">All Projects</option>
          {availableProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>

        {/* Assigned Rep Filter */}
        <select
          value={currentAssigned}
          onChange={(e) => updateParam("assignedUserId", e.target.value)}
          className="apple-input"
          style={{
            height: "36px",
            width: "auto",
            minWidth: "150px",
            fontSize: "13px",
            cursor: "pointer",
            borderRadius: "var(--radius-md)",
          }}
          aria-label="Filter by Assigned Agent"
        >
          <option value="">All Sales Reps</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName} ({u.role})
            </option>
          ))}
        </select>

        {/* Source Filter */}
        <select
          value={currentSource}
          onChange={(e) => updateParam("source", e.target.value)}
          className="apple-input"
          style={{
            height: "36px",
            width: "auto",
            minWidth: "140px",
            fontSize: "13px",
            cursor: "pointer",
            borderRadius: "var(--radius-md)",
          }}
          aria-label="Filter by Lead Source"
        >
          <option value="">All Sources</option>
          {availableSources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Reset Filters Action */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="btn-pearl-capsule"
            style={{
              height: "36px",
              padding: "0 10px",
              fontSize: "12px",
              gap: "4px",
              color: "var(--color-primary)",
            }}
            title="Reset All Filters"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      {/* Right side: View Toggle & New Lead Action */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* List / Pipeline View Switcher */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "var(--color-canvas-parchment)",
            borderRadius: "var(--radius-md)",
            padding: "2px",
            border: "1px solid var(--color-hairline)",
          }}
        >
          <button
            onClick={() => onToggleView("list")}
            style={{
              background: viewMode === "list" ? "var(--color-canvas)" : "transparent",
              color: viewMode === "list" ? "var(--color-ink)" : "var(--color-ink-muted-48)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: viewMode === "list" ? 600 : 400,
            }}
            title="Table List View"
          >
            <List size={14} />
            List
          </button>
          <button
            onClick={() => onToggleView("pipeline")}
            style={{
              background: viewMode === "pipeline" ? "var(--color-canvas)" : "transparent",
              color: viewMode === "pipeline" ? "var(--color-ink)" : "var(--color-ink-muted-48)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: viewMode === "pipeline" ? 600 : 400,
            }}
            title="Pipeline Stage View"
          >
            <LayoutGrid size={14} />
            Pipeline
          </button>
        </div>

        {/* New Lead Button */}
        <Button
          variant="primary"
          onClick={onOpenCreateModal}
          style={{
            height: "36px",
            padding: "0 16px",
            fontSize: "13px",
            gap: "5px",
          }}
        >
          <Plus size={15} />
          New Lead
        </Button>
      </div>
    </div>
  );
};
