import { Prisma } from "@prisma/client";
import { db } from "./db";

export interface LogAuditParams {
  clientId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * Writes an immutable security audit entry into the database.
 * Used for all authentication, state transitions, reassignments, and administrative operations.
 */
export async function logAudit(
  params: LogAuditParams,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx || db;
  try {
    await client.auditLog.create({
      data: {
        clientId: params.clientId,
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: (params.metadata as Prisma.InputJsonValue) || undefined,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    // Audit failures should be logged to stderr but never expose internals
    console.error("Critical: Failed to record audit log entry:", error);
  }
}
