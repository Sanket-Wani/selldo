import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { getDashboardData, DashboardFilterSchema } from "@/lib/dashboard";

export async function GET(request: NextRequest) {
  // 1. Authenticate server session
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized: Active session required" },
      { status: 401 }
    );
  }

  // 2. Server-side RBAC authorization check
  // Note: Only SUPER_ADMIN, ADMIN, and MANAGER possess REPORTS_VIEW permission
  if (!hasPermission(session.user.role, "REPORTS_VIEW")) {
    return NextResponse.json(
      {
        error: `Forbidden: Role '${session.user.role}' lacks REPORTS_VIEW capability`,
      },
      { status: 403 }
    );
  }

  // 3. Parse query parameters and validate via Zod
  const url = new URL(request.url);
  const rawParams = {
    range: url.searchParams.get("range") || undefined,
    projectId: url.searchParams.get("projectId") || undefined,
    source: url.searchParams.get("source") || undefined,
    view: url.searchParams.get("view") || undefined,
  };

  const parsed = DashboardFilterSchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid filter parameters", details: parsed.error.issues },
      { status: 400 }
    );
  }

  // 4. Derive tenant strictly from server session
  const data = await getDashboardData(session.user.clientId, parsed.data);

  return NextResponse.json(data);
}
