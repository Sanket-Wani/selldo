import { UserRole } from "@prisma/client";

export type Permission =
  | "SETTINGS_MANAGE"
  | "USERS_MANAGE"
  | "BILLING_VIEW"
  | "LEADS_VIEW_ALL"
  | "LEADS_VIEW_TEAM"
  | "LEADS_VIEW_ASSIGNED"
  | "LEADS_CREATE"
  | "LEADS_REASSIGN"
  | "LEADS_STAGE_TRANSITION"
  | "BOOKINGS_READ"
  | "BOOKINGS_WRITE"
  | "REPORTS_VIEW"
  | "EXPORT_DATA"
  | "BULK_OPERATIONS";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "SETTINGS_MANAGE",
    "USERS_MANAGE",
    "BILLING_VIEW",
    "LEADS_VIEW_ALL",
    "LEADS_VIEW_TEAM",
    "LEADS_VIEW_ASSIGNED",
    "LEADS_CREATE",
    "LEADS_REASSIGN",
    "LEADS_STAGE_TRANSITION",
    "BOOKINGS_READ",
    "BOOKINGS_WRITE",
    "REPORTS_VIEW",
    "EXPORT_DATA",
    "BULK_OPERATIONS",
  ],
  ADMIN: [
    "SETTINGS_MANAGE",
    "USERS_MANAGE",
    "LEADS_VIEW_ALL",
    "LEADS_VIEW_TEAM",
    "LEADS_VIEW_ASSIGNED",
    "LEADS_CREATE",
    "LEADS_REASSIGN",
    "LEADS_STAGE_TRANSITION",
    "BOOKINGS_READ",
    "BOOKINGS_WRITE",
    "REPORTS_VIEW",
    "EXPORT_DATA",
    "BULK_OPERATIONS",
  ],
  MANAGER: [
    "LEADS_VIEW_TEAM",
    "LEADS_VIEW_ASSIGNED",
    "LEADS_CREATE",
    "LEADS_REASSIGN",
    "LEADS_STAGE_TRANSITION",
    "BOOKINGS_READ",
    "REPORTS_VIEW",
    "EXPORT_DATA",
  ],
  PRE_SALES: [
    "LEADS_VIEW_ASSIGNED",
    "LEADS_CREATE",
    "LEADS_STAGE_TRANSITION",
  ],
  SALES: [
    "LEADS_VIEW_ASSIGNED",
    "LEADS_STAGE_TRANSITION",
    "BOOKINGS_READ",
    "BOOKINGS_WRITE",
  ],
  POST_SALES: [
    "BOOKINGS_READ",
    "BOOKINGS_WRITE",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return Boolean(permissions && permissions.includes(permission));
}

export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    const error = new Error(`Forbidden: Role ${role} lacks permission ${permission}`);
    (error as unknown as { status: number }).status = 403;
    throw error;
  }
}
