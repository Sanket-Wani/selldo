import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  resetHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Data Found in Selected Range",
  description = "No lead activities, site visits, or bookings match your current filter parameters. Try adjusting the date range or clearing selected filters.",
  resetHref = "/dashboard",
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-xxl) var(--space-lg)",
        textAlign: "center",
        backgroundColor: "var(--color-surface-pearl)",
        border: "1px dashed var(--color-hairline)",
        borderRadius: "var(--radius-lg)",
        margin: "var(--space-lg) 0",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--color-surface-chip-translucent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--space-md)",
          color: "var(--color-primary)",
          fontSize: "20px",
        }}
      >
        ○
      </div>
      <h3 className="type-body-strong" style={{ color: "var(--color-ink)", marginBottom: "var(--space-xs)" }}>
        {title}
      </h3>
      <p
        className="type-caption"
        style={{ color: "var(--color-ink-muted-48)", maxWidth: "420px", marginBottom: "var(--space-lg)" }}
      >
        {description}
      </p>
      {resetHref && (
        <Link href={resetHref}>
          <Button variant="pearl-capsule">Clear All Filters</Button>
        </Link>
      )}
    </div>
  );
};
