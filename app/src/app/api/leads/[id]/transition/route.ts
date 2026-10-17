import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { executeLeadStageTransition } from "@/lib/fsm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const updated = await executeLeadStageTransition(
      session.user.clientId,
      id,
      body,
      {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name || undefined,
      }
    );
    return NextResponse.json(updated);
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to execute stage transition" },
      { status }
    );
  }
}
