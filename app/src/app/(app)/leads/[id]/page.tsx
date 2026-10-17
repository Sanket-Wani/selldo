import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLead360 } from "@/lib/leads";
import { withTenantTransaction } from "@/lib/tenant";
import { SubNavFrosted } from "@/components/layout/SubNavFrosted";
import { Lead360ClientView } from "@/components/leads/Lead360ClientView";
import { ShieldCheck } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `Lead 360 Profile — Sell.do Enterprise`,
    description: `Consolidated 360-degree real estate customer lifecycle profile.`,
  };
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  let lead;
  try {
    lead = await getLead360(
      session.user.clientId,
      id,
      { id: session.user.id, role: session.user.role }
    );
  } catch (err: any) {
    if (err.status === 404) {
      notFound();
    }
    throw err;
  }

  // Fetch available active agents for reassignment
  const assignableUsers = await withTenantTransaction(session.user.clientId, async (tx) => {
    return await tx.user.findMany({
      where: { clientId: session.user.clientId, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { firstName: "asc" },
    });
  });

  return (
    <div>
      <SubNavFrosted
        title={`Lead 360 Profile`}
        subtitle={`${lead.crmId} · ${lead.firstName} ${lead.lastName}`}
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
          Tenant Context Enforced
        </span>
      </SubNavFrosted>

      <main
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          padding: "var(--space-lg)",
        }}
      >
        <Lead360ClientView
          lead={lead}
          availableUsers={assignableUsers}
        />
      </main>
    </div>
  );
}
