import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlobalNav } from "@/components/layout/GlobalNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch client details for nav
  const client = await db.client.findUnique({
    where: { id: session.user.clientId },
    select: { name: true },
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <GlobalNav
        tenantName={client?.name || "Sell.do Enterprise"}
        userName={session.user.name || session.user.email || "User"}
      />
      <div style={{ flex: 1, backgroundColor: "var(--color-canvas-parchment)" }}>
        {children}
      </div>
    </div>
  );
}
