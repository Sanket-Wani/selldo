import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { addLeadNote } from "@/lib/leads";

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
    const activity = await addLeadNote(
      session.user.clientId,
      id,
      body.note || body.description,
      {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name || undefined,
      }
    );
    return NextResponse.json(activity, { status: 201 });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to add note" },
      { status }
    );
  }
}
