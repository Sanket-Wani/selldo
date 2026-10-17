import { LeadStage, UserRole } from "@prisma/client";
import { withTenantTransaction } from "./tenant";
import { requirePermission } from "./rbac";
import {
  ALLOWED_TRANSITIONS,
  UNQUALIFIED_REASONS,
  LOST_REASONS,
  validateLeadTransition,
  TransitionValidationResult,
} from "./fsm-constants";

export {
  ALLOWED_TRANSITIONS,
  UNQUALIFIED_REASONS,
  LOST_REASONS,
  validateLeadTransition,
};
export type { TransitionValidationResult };

export interface TransitionPayload {
  targetStage: LeadStage;
  subStage?: "HOT" | "WARM" | "COLD" | null;
  reason?: string;
  notes?: string;
}

/**
 * Server-side transactional transition execution with RLS enforcement,
 * activity logging, and audit tracking.
 */
export async function executeLeadStageTransition(
  clientId: string,
  leadId: string,
  payload: TransitionPayload,
  actor: { id: string; role: UserRole; name?: string }
) {
  // 1. RBAC Guard: Verify actor possesses LEADS_STAGE_TRANSITION
  requirePermission(actor.role, "LEADS_STAGE_TRANSITION");

  return await withTenantTransaction(clientId, async (tx) => {
    // 2. Fetch lead strictly under tenant context
    const lead = await tx.lead.findFirst({
      where: { id: leadId, clientId },
      select: {
        id: true,
        crmId: true,
        stage: true,
        subStage: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!lead) {
      const err = new Error(`Lead '${leadId}' not found in current organization.`);
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    // 3. Validate state machine rules
    const validation = validateLeadTransition(lead.stage, payload.targetStage, {
      reason: payload.reason,
      subStage: payload.subStage,
    });

    if (!validation.valid) {
      const err = new Error(validation.error);
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    const previousStage = lead.stage;
    const isUnqualified = payload.targetStage === LeadStage.UNQUALIFIED;
    const isLost = payload.targetStage === LeadStage.LOST;

    // 4. Update Lead Record
    const updatedLead = await tx.lead.update({
      where: { id: leadId },
      data: {
        stage: payload.targetStage,
        subStage:
          payload.subStage !== undefined
            ? payload.subStage
            : isUnqualified || isLost
            ? null
            : lead.subStage,
        unqualifiedReason: isUnqualified ? payload.reason : null,
        lostReason: isLost ? payload.reason : null,
      },
    });

    // 5. Append Chronological Activity Stream Record
    const reasonText = payload.reason ? ` · Reason: ${payload.reason}` : "";
    const notesText = payload.notes ? ` · Note: ${payload.notes}` : "";
    await tx.leadActivity.create({
      data: {
        clientId,
        leadId,
        userId: actor.id,
        type: "STAGE_CHANGE",
        title: `Lifecycle Stage: ${payload.targetStage}`,
        description: `Transitioned from ${previousStage} to ${payload.targetStage}${reasonText}${notesText}`,
        metadata: {
          fromStage: previousStage,
          toStage: payload.targetStage,
          reason: payload.reason || null,
          subStage: payload.subStage || null,
          actorName: actor.name || "System User",
        },
      },
    });

    // 6. Append Immutable Security Audit Record
    await tx.auditLog.create({
      data: {
        clientId,
        userId: actor.id,
        action: "LEAD_STAGE_TRANSITION",
        entityType: "Lead",
        entityId: leadId,
        metadata: {
          crmId: lead.crmId,
          fromStage: previousStage,
          toStage: payload.targetStage,
          reason: payload.reason || null,
          subStage: payload.subStage || null,
        },
      },
    });

    return updatedLead;
  });
}
