import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getLeadsList, createLead } from "@/lib/leads";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawParams = {
    search: url.searchParams.get("search") || undefined,
    stage: url.searchParams.get("stage") || undefined,
    projectId: url.searchParams.get("projectId") || undefined,
    assignedUserId: url.searchParams.get("assignedUserId") || undefined,
    source: url.searchParams.get("source") || undefined,
    sortBy: url.searchParams.get("sortBy") || undefined,
    sortOrder: url.searchParams.get("sortOrder") || undefined,
    page: url.searchParams.get("page") || undefined,
    pageSize: url.searchParams.get("pageSize") || undefined,
  };

  try {
    const data = await getLeadsList(
      session.user.clientId,
      { id: session.user.id, role: session.user.role },
      rawParams
    );
    return NextResponse.json(data);
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to retrieve leads" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newLead = await createLead(
      session.user.clientId,
      body,
      {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name || undefined,
      }
    );
    return NextResponse.json(newLead, { status: 201 });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to create lead" },
      { status }
    );
  }
}
