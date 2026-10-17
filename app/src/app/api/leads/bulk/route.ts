import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { executeBulkLeadAction } from "@/lib/leads";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await executeBulkLeadAction(
      session.user.clientId,
      body,
      {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name || undefined,
      }
    );
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to execute bulk action" },
      { status }
    );
  }
}
