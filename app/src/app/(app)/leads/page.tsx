import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLeadsList } from "@/lib/leads";
import { SubNavFrosted } from "@/components/layout/SubNavFrosted";
import { LeadsClientView } from "@/components/leads/LeadsClientView";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Database, Layers } from "lucide-react";

export const metadata = {
  title: "Leads 360 — Sell.do Enterprise",
  description: "Comprehensive omnichannel real estate lead pipeline management and qualification.",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const currentStage = (resolvedParams.stage as string) || "ALL";

  // Fetch tenant leads under strict RLS context
  const data = await getLeadsList(
    session.user.clientId,
    { id: session.user.id, role: session.user.role },
    resolvedParams
  );

  return (
    <div>
      {/* Subnavigation Bar */}
      <SubNavFrosted
        title="Leads 360"
        subtitle="Omnichannel Pipeline & Qualification"
      >
        <span
          className="btn-pearl-capsule"
          style={{
            fontSize: "12px",
            height: "28px",
            padding: "0 10px",
            gap: "5px",
            backgroundColor: "rgba(0, 102, 204, 0.08)",
            color: "var(--color-primary)",
            borderColor: "rgba(0, 102, 204, 0.2)",
            pointerEvents: "none",
          }}
        >
          <ShieldCheck size={13} />
          RLS Scoped: {session.user.role}
        </span>
      </SubNavFrosted>

      {/* Main Container */}
      <main
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          padding: "var(--space-lg)",
        }}
      >
        <LeadsClientView
          data={data}
          currentStage={currentStage}
        />

        {/* Enterprise Architecture Telemetry Bar */}
        <section
          style={{
            marginTop: "var(--space-xl)",
            padding: "var(--space-md) var(--space-lg)",
            backgroundColor: "var(--color-canvas)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-hairline)",
          }}
          aria-label="System Architecture Status"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--space-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Database size={15} style={{ color: "var(--color-primary)" }} />
              <span className="type-caption-strong" style={{ color: "var(--color-ink)", fontSize: "13px" }}>
                Sell.do Lead 360 Architecture Telemetry
              </span>
            </div>
            <span
              className="btn-pearl-capsule"
              style={{ fontSize: "11px", height: "24px", padding: "0 8px" }}
            >
              Phase 3 Active
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "var(--space-md)",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--color-surface-pearl)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-hairline)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="type-caption" style={{ color: "var(--color-ink)", fontSize: "12px", fontWeight: 600 }}>
                  Multi-Tenant Security
                </span>
                <span style={{ color: "#34c759", fontSize: "11px", fontWeight: 700 }}>
                  ENFORCED
                </span>
              </div>
              <p className="type-caption" style={{ color: "var(--color-ink-muted-48)", margin: "4px 0 0 0", fontSize: "11px" }}>
                PostgreSQL RLS with SET LOCAL app.current_tenant isolation
              </p>
            </div>

            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--color-surface-pearl)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-hairline)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="type-caption" style={{ color: "var(--color-ink)", fontSize: "12px", fontWeight: 600 }}>
                  Lifecycle FSM Engine
                </span>
                <span style={{ color: "var(--color-primary)", fontSize: "11px", fontWeight: 700 }}>
                  ACTIVE
                </span>
              </div>
              <p className="type-caption" style={{ color: "var(--color-ink-muted-48)", margin: "4px 0 0 0", fontSize: "11px" }}>
                Strict state machine with mandatory lost/unqualified reason taxonomy
              </p>
            </div>

            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--color-surface-pearl)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-hairline)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="type-caption" style={{ color: "var(--color-ink)", fontSize: "12px", fontWeight: 600 }}>
                  Design System Standard
                </span>
                <span style={{ color: "var(--color-ink)", fontSize: "11px", fontWeight: 700 }}>
                  100% APPLE SPEC
                </span>
              </div>
              <p className="type-caption" style={{ color: "var(--color-ink-muted-48)", margin: "4px 0 0 0", fontSize: "11px" }}>
                Parchment canvas, zero utility box-shadows, Action Blue (#0066cc)
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
