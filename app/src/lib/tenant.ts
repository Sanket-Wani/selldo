import { Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";

/**
 * Executes a callback within an interactive transaction where PostgreSQL RLS
 * session variable `app.current_tenant` is safely scoped using `SET LOCAL`.
 * 
 * Connection-Pooling Safe:
 * `SET LOCAL` guarantees the setting automatically expires upon transaction
 * COMMIT or ROLLBACK, completely eliminating cross-tenant connection pollution.
 */
export async function withTenantTransaction<T>(
  clientId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  if (!clientId || typeof clientId !== "string") {
    throw new Error("Invalid tenant context: clientId is required");
  }

  // Sanitize clientId to prevent SQL injection in session setting
  const cleanId = clientId.replace(/[^a-zA-Z0-9_\-]/g, "");

  return db.$transaction(async (tx) => {
    // Set local session variable for Row Level Security
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${cleanId}'`);
    return await callback(tx);
  });
}

/**
 * Application-level defense-in-depth helper.
 * Enforces that every Prisma where-clause includes the mandatory clientId.
 */
export function scopeQuery<T extends Record<string, unknown>>(
  clientId: string,
  query: T
): T & { clientId: string } {
  if (!clientId) {
    throw new Error("scopeQuery: clientId is required");
  }
  return {
    ...query,
    clientId,
  };
}
