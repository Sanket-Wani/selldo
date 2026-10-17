import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getLead360, updateLead } from "@/lib/leads";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const lead = await getLead360(
      session.user.clientId,
      id,
      { id: session.user.id, role: session.user.role }
    );
    return NextResponse.json(lead);
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to retrieve lead profile" },
      { status }
    );
  }
}

export async function PATCH(
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
    const updated = await updateLead(
      session.user.clientId,
      id,
      body,
      { id: session.user.id, role: session.user.role }
    );
    return NextResponse.json(updated);
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update lead" },
      { status }
    );
  }
}
