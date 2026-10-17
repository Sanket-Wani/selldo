import { z } from "zod";
import { LeadStage, UserRole, Prisma } from "@prisma/client";
import { withTenantTransaction } from "./tenant";
import { hasPermission, requirePermission } from "./rbac";
import { validateLeadTransition } from "./fsm";

// -----------------------------------------------------------------------------
// 1. ZOD INPUT SCHEMAS
// -----------------------------------------------------------------------------

export const LeadFilterSchema = z.object({
  search: z.string().optional().default(""),
  stage: z.string().optional().default("ALL"),
  projectId: z.string().optional().default(""),
  assignedUserId: z.string().optional().default(""),
  source: z.string().optional().default(""),
  sortBy: z.enum(["createdAt", "updatedAt", "firstName", "stage", "crmId"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type LeadFilter = z.infer<typeof LeadFilterSchema>;

export const CreateLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(7, "Phone must be at least 7 digits").max(25),
  projectId: z.string().optional().or(z.literal("")),
  assignedUserId: z.string().optional().or(z.literal("")),
  source: z.string().optional().default("Direct Walk-in"),
  subSource: z.string().optional().or(z.literal("")),
  budgetMin: z.coerce.number().min(0).optional().nullable(),
  budgetMax: z.coerce.number().min(0).optional().nullable(),
  propertyType: z.string().optional().or(z.literal("")),
  customFields: z.record(z.string(), z.any()).optional().nullable(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().min(7).max(25).optional(),
  projectId: z.string().optional().nullable().or(z.literal("")),
  budgetMin: z.coerce.number().min(0).optional().nullable(),
  budgetMax: z.coerce.number().min(0).optional().nullable(),
  propertyType: z.string().optional().nullable().or(z.literal("")),
  customFields: z.record(z.string(), z.any()).optional().nullable(),
});

export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

export const ReassignLeadSchema = z.object({
  assignedUserId: z.string().min(1, "Target assignee is required"),
  reason: z.string().optional().default("Managerial Reassignment"),
});

export type ReassignLeadInput = z.infer<typeof ReassignLeadSchema>;

export const BulkLeadActionSchema = z.object({
  action: z.enum(["REASSIGN", "TRANSITION"]),
  leadIds: z.array(z.string().min(1)).min(1, "At least one lead must be selected").max(100),
  assignedUserId: z.string().optional(),
  targetStage: z.nativeEnum(LeadStage).optional(),
  reason: z.string().optional(),
});

export type BulkLeadActionInput = z.infer<typeof BulkLeadActionSchema>;

// -----------------------------------------------------------------------------
// 2. LEAD LIST QUERY & SMART FILTER AGGREGATION
// -----------------------------------------------------------------------------

export interface LeadListItem {
  id: string;
  clientId: string;
  crmId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  stage: LeadStage;
  subStage: string | null;
  source: string | null;
  propertyType: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  createdAt: Date;
  updatedAt: Date;
  project: { id: string; name: string; code: string } | null;
  assignedUser: { id: string; firstName: string; lastName: string; role: UserRole } | null;
  _count: {
    activities: number;
    siteVisits: number;
    bookings: number;
  };
}

export interface LeadListResult {
  leads: LeadListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  bucketCounts: {
    all: number;
    incoming: number;
    prospect: number;
    opportunity: number;
    booked: number;
    unqualified: number;
    lost: number;
    assignedToMe: number;
  };
  availableProjects: Array<{ id: string; name: string; code: string }>;
  availableUsers: Array<{ id: string; firstName: string; lastName: string; role: UserRole }>;
  availableSources: string[];
}

export async function getLeadsList(
  clientId: string,
  user: { id: string; role: UserRole },
  rawFilter: unknown
): Promise<LeadListResult> {
  const parsed = LeadFilterSchema.safeParse(rawFilter);
  const filter = parsed.success ? parsed.data : LeadFilterSchema.parse({});

  return await withTenantTransaction(clientId, async (tx) => {
    // RBAC Scope resolution:
    // SUPER_ADMIN & ADMIN: All tenant leads
    // MANAGER: All team leads or tenant leads if no team
    // PRE_SALES, SALES, POST_SALES: Assigned leads only
    let rbacWhere: Prisma.LeadWhereInput = { clientId };

    if (!hasPermission(user.role, "LEADS_VIEW_ALL")) {
      if (hasPermission(user.role, "LEADS_VIEW_TEAM")) {
        // Fetch user's teamId
        const me = await tx.user.findUnique({
          where: { id: user.id },
          select: { teamId: true },
        });
        if (me?.teamId) {
          rbacWhere = {
            clientId,
            OR: [{ teamId: me.teamId }, { assignedUserId: user.id }],
          };
        } else {
          rbacWhere = { clientId, assignedUserId: user.id };
        }
      } else {
        rbacWhere = { clientId, assignedUserId: user.id };
      }
    }

    // Dynamic Filter Clauses
    const conditions: Prisma.LeadWhereInput[] = [rbacWhere];

    // Stage / Smart Bucket filter
    if (filter.stage && filter.stage !== "ALL") {
      if (filter.stage === "ASSIGNED_TO_ME") {
        conditions.push({ assignedUserId: user.id });
      } else if (Object.values(LeadStage).includes(filter.stage as LeadStage)) {
        conditions.push({ stage: filter.stage as LeadStage });
      }
    }

    // Project filter
    if (filter.projectId && filter.projectId.trim() !== "") {
      conditions.push({ projectId: filter.projectId });
    }

    // Assigned User filter
    if (filter.assignedUserId && filter.assignedUserId.trim() !== "") {
      conditions.push({ assignedUserId: filter.assignedUserId });
    }

    // Source filter
    if (filter.source && filter.source.trim() !== "") {
      conditions.push({ source: filter.source });
    }

    // Search query (matches crmId, firstName, lastName, phone, or email)
    if (filter.search && filter.search.trim() !== "") {
      const q = filter.search.trim();
      conditions.push({
        OR: [
          { crmId: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.LeadWhereInput = { AND: conditions };

    // Execute queries in parallel
    const skip = (filter.page - 1) * filter.pageSize;
    const take = filter.pageSize;

    const [
      leads,
      total,
      bucketAll,
      bucketIncoming,
      bucketProspect,
      bucketOpportunity,
      bucketBooked,
      bucketUnqualified,
      bucketLost,
      bucketAssignedToMe,
      projects,
      assignableUsers,
      distinctSources,
    ] = await Promise.all([
      // Paginated Leads
      tx.lead.findMany({
        where,
        select: {
          id: true,
          clientId: true,
          crmId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          stage: true,
          subStage: true,
          source: true,
          propertyType: true,
          budgetMin: true,
          budgetMax: true,
          createdAt: true,
          updatedAt: true,
          project: { select: { id: true, name: true, code: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true, role: true } },
          _count: {
            select: {
              activities: true,
              siteVisits: true,
              bookings: true,
            },
          },
        },
        orderBy: { [filter.sortBy]: filter.sortOrder },
        skip,
        take,
      }),

      // Filtered Count
      tx.lead.count({ where }),

      // Bucket Counts (scoped by RBAC)
      tx.lead.count({ where: rbacWhere }),
      tx.lead.count({ where: { ...rbacWhere, stage: LeadStage.INCOMING } }),
      tx.lead.count({ where: { ...rbacWhere, stage: LeadStage.PROSPECT } }),
      tx.lead.count({ where: { ...rbacWhere, stage: LeadStage.OPPORTUNITY } }),
      tx.lead.count({ where: { ...rbacWhere, stage: LeadStage.BOOKED } }),
      tx.lead.count({ where: { ...rbacWhere, stage: LeadStage.UNQUALIFIED } }),
      tx.lead.count({ where: { ...rbacWhere, stage: LeadStage.LOST } }),
      tx.lead.count({ where: { ...rbacWhere, assignedUserId: user.id } }),

      // Dropdown Options
      tx.project.findMany({
        where: { clientId },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
      tx.user.findMany({
        where: { clientId, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, role: true },
        orderBy: { firstName: "asc" },
      }),
      tx.lead.findMany({
        where: { clientId, source: { not: null } },
        select: { source: true },
        distinct: ["source"],
      }),
    ]);

    const totalPages = Math.ceil(total / filter.pageSize) || 1;

    return {
      leads,
      total,
      page: filter.page,
      pageSize: filter.pageSize,
      totalPages,
      bucketCounts: {
        all: bucketAll,
        incoming: bucketIncoming,
        prospect: bucketProspect,
        opportunity: bucketOpportunity,
        booked: bucketBooked,
        unqualified: bucketUnqualified,
        lost: bucketLost,
        assignedToMe: bucketAssignedToMe,
      },
      availableProjects: projects,
      availableUsers: assignableUsers,
      availableSources: distinctSources.map((s) => s.source!).filter(Boolean),
    };
  });
}

// -----------------------------------------------------------------------------
// 3. LEAD 360 PROFILE VIEW SERVICE
// -----------------------------------------------------------------------------

export interface Lead360Data {
  id: string;
  crmId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  stage: LeadStage;
  subStage: string | null;
  source: string | null;
  subSource: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  propertyType: string | null;
  lostReason: string | null;
  unqualifiedReason: string | null;
  customFields: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    name: string;
    code: string;
    location: string;
  } | null;
  assignedUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  } | null;
  team: {
    id: string;
    name: string;
    department: string;
  } | null;
  campaign: {
    id: string;
    name: string;
    source: string;
  } | null;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    metadata: any;
    createdAt: Date;
    user: { id: string; firstName: string; lastName: string; role: UserRole } | null;
  }>;
  siteVisits: Array<{
    id: string;
    status: string;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
    conductedAt: Date | null;
    feedbackRating: number | null;
    feedbackNotes: string | null;
    project: { name: string; code: string };
  }>;
  bookings: Array<{
    id: string;
    bookingId: string;
    status: string;
    agreementValue: number;
    bookingAmount: number;
    createdAt: Date;
    project: { name: string };
    unit: { unitNumber: string; configuration: string };
  }>;
  followups: Array<{
    id: string;
    scheduledAt: Date;
    status: string;
    notes: string | null;
    user: { firstName: string; lastName: string };
  }>;
}

export async function getLead360(
  clientId: string,
  leadId: string,
  user?: { id: string; role: UserRole }
): Promise<Lead360Data> {
  return await withTenantTransaction(clientId, async (tx) => {
    const lead = await tx.lead.findFirst({
      where: { id: leadId, clientId },
      include: {
        project: { select: { id: true, name: true, code: true, location: true } },
        assignedUser: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        team: { select: { id: true, name: true, department: true } },
        campaign: { select: { id: true, name: true, source: true } },
        activities: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        siteVisits: {
          include: {
            project: { select: { name: true, code: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        bookings: {
          include: {
            project: { select: { name: true } },
            unit: { select: { unitNumber: true, configuration: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        followups: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { scheduledAt: "asc" },
        },
      },
    });

    if (!lead) {
      const err = new Error(`Lead '${leadId}' not found.`);
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    // Role-based record access check:
    if (user && !hasPermission(user.role, "LEADS_VIEW_ALL")) {
      if (hasPermission(user.role, "LEADS_VIEW_TEAM")) {
        const me = await tx.user.findUnique({
          where: { id: user.id },
          select: { teamId: true },
        });
        if (me?.teamId && lead.teamId !== me.teamId && lead.assignedUserId !== user.id) {
          const err = new Error("Forbidden: You do not have permission to view leads outside your team.");
          (err as unknown as { status: number }).status = 403;
          throw err;
        }
      } else {
        if (lead.assignedUserId !== user.id) {
          const err = new Error("Forbidden: You only have permission to view your assigned leads.");
          (err as unknown as { status: number }).status = 403;
          throw err;
        }
      }
    }

    return {
      ...lead,
      customFields: lead.customFields as Record<string, any> | null,
    };
  });
}

// -----------------------------------------------------------------------------
// 4. LEAD MUTATION SERVICES (Create, Update, Reassign, Note)
// -----------------------------------------------------------------------------

export async function createLead(
  clientId: string,
  rawInput: unknown,
  actor: { id: string; role: UserRole; name?: string }
) {
  requirePermission(actor.role, "LEADS_CREATE");

  const parsed = CreateLeadSchema.safeParse(rawInput);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues[0]?.message || "Validation failed");
    (err as unknown as { status: number }).status = 400;
    throw err;
  }
  const input = parsed.data;

  return await withTenantTransaction(clientId, async (tx) => {
    // 1. Verify project belongs to tenant if provided
    if (input.projectId) {
      const proj = await tx.project.findFirst({
        where: { id: input.projectId, clientId },
      });
      if (!proj) {
        const err = new Error("Project not found in organization.");
        (err as unknown as { status: number }).status = 400;
        throw err;
      }
    }

    // 2. Verify assigned user belongs to tenant if provided
    let teamId: string | null = null;
    if (input.assignedUserId) {
      const targetUser = await tx.user.findFirst({
        where: { id: input.assignedUserId, clientId, status: "ACTIVE" },
        select: { id: true, teamId: true },
      });
      if (!targetUser) {
        const err = new Error("Assigned user is invalid or inactive.");
        (err as unknown as { status: number }).status = 400;
        throw err;
      }
      teamId = targetUser.teamId;
    }

    // 3. Generate sequential formatted Sell.do CRM ID (e.g. LD-10025)
    const count = await tx.lead.count({ where: { clientId } });
    const crmId = `LD-${10000 + count + 1}`;

    // 4. Create Lead
    const newLead = await tx.lead.create({
      data: {
        clientId,
        crmId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email ? input.email.trim() : null,
        phone: input.phone.trim(),
        stage: LeadStage.INCOMING,
        projectId: input.projectId || null,
        assignedUserId: input.assignedUserId || null,
        teamId,
        source: input.source || "Direct Walk-in",
        subSource: input.subSource || null,
        budgetMin: input.budgetMin ?? null,
        budgetMax: input.budgetMax ?? null,
        propertyType: input.propertyType || null,
        customFields: input.customFields ? (input.customFields as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });

    // 5. Append Creation Activity
    await tx.leadActivity.create({
      data: {
        clientId,
        leadId: newLead.id,
        userId: actor.id,
        type: "CREATE",
        title: "Lead Created",
        description: `Captured from ${input.source || "Direct Walk-in"}${input.assignedUserId ? " and assigned." : "."}`,
        metadata: {
          crmId,
          source: input.source,
          creatorRole: actor.role,
        },
      },
    });

    // 6. Security Audit Log
    await tx.auditLog.create({
      data: {
        clientId,
        userId: actor.id,
        action: "LEAD_CREATE",
        entityType: "Lead",
        entityId: newLead.id,
        metadata: { crmId, firstName: input.firstName, phone: input.phone },
      },
    });

    return newLead;
  });
}

export async function updateLead(
  clientId: string,
  leadId: string,
  rawInput: unknown,
  actor: { id: string; role: UserRole }
) {
  const parsed = UpdateLeadSchema.safeParse(rawInput);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues[0]?.message || "Validation failed");
    (err as unknown as { status: number }).status = 400;
    throw err;
  }
  const input = parsed.data;

  return await withTenantTransaction(clientId, async (tx) => {
    const existing = await tx.lead.findFirst({
      where: { id: leadId, clientId },
    });
    if (!existing) {
      const err = new Error("Lead not found.");
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    if (input.projectId) {
      const proj = await tx.project.findFirst({
        where: { id: input.projectId, clientId },
      });
      if (!proj) {
        const err = new Error("Project not found in organization.");
        (err as unknown as { status: number }).status = 400;
        throw err;
      }
    }

    const updated = await tx.lead.update({
      where: { id: leadId },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName.trim() } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email ? input.email.trim() : null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId || null } : {}),
        ...(input.budgetMin !== undefined ? { budgetMin: input.budgetMin } : {}),
        ...(input.budgetMax !== undefined ? { budgetMax: input.budgetMax } : {}),
        ...(input.propertyType !== undefined ? { propertyType: input.propertyType || null } : {}),
        ...(input.customFields !== undefined
          ? { customFields: input.customFields ? (input.customFields as Prisma.InputJsonValue) : Prisma.DbNull }
          : {}),
      },
    });

    await tx.leadActivity.create({
      data: {
        clientId,
        leadId,
        userId: actor.id,
        type: "UPDATE",
        title: "Lead Profile Updated",
        description: "Customer requirements or contact fields modified.",
      },
    });

    await tx.auditLog.create({
      data: {
        clientId,
        userId: actor.id,
        action: "LEAD_UPDATE",
        entityType: "Lead",
        entityId: leadId,
      },
    });

    return updated;
  });
}

export async function reassignLead(
  clientId: string,
  leadId: string,
  rawInput: unknown,
  actor: { id: string; role: UserRole; name?: string }
) {
  requirePermission(actor.role, "LEADS_REASSIGN");

  const parsed = ReassignLeadSchema.safeParse(rawInput);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues[0]?.message || "Validation failed");
    (err as unknown as { status: number }).status = 400;
    throw err;
  }
  const input = parsed.data;

  return await withTenantTransaction(clientId, async (tx) => {
    const lead = await tx.lead.findFirst({
      where: { id: leadId, clientId },
      include: { assignedUser: true },
    });
    if (!lead) {
      const err = new Error("Lead not found.");
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    const targetUser = await tx.user.findFirst({
      where: { id: input.assignedUserId, clientId, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, role: true, teamId: true },
    });
    if (!targetUser) {
      const err = new Error("Target employee not found or inactive.");
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    const prevRep = lead.assignedUser
      ? `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}`
      : "Unassigned";
    const nextRep = `${targetUser.firstName} ${targetUser.lastName}`;

    const updated = await tx.lead.update({
      where: { id: leadId },
      data: {
        assignedUserId: targetUser.id,
        teamId: targetUser.teamId || lead.teamId,
      },
    });

    await tx.leadActivity.create({
      data: {
        clientId,
        leadId,
        userId: actor.id,
        type: "REASSIGN",
        title: "Lead Reassigned",
        description: `Ownership transferred from ${prevRep} to ${nextRep} (${targetUser.role}) · Reason: ${input.reason}`,
        metadata: {
          fromUserId: lead.assignedUserId,
          toUserId: targetUser.id,
          reason: input.reason,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        clientId,
        userId: actor.id,
        action: "LEAD_REASSIGN",
        entityType: "Lead",
        entityId: leadId,
        metadata: {
          fromUserId: lead.assignedUserId,
          toUserId: targetUser.id,
          reason: input.reason,
        },
      },
    });

    return updated;
  });
}

export async function addLeadNote(
  clientId: string,
  leadId: string,
  noteText: string,
  actor: { id: string; role: UserRole; name?: string }
) {
  if (!noteText || noteText.trim() === "") {
    const err = new Error("Note content cannot be empty.");
    (err as unknown as { status: number }).status = 400;
    throw err;
  }

  return await withTenantTransaction(clientId, async (tx) => {
    const lead = await tx.lead.findFirst({
      where: { id: leadId, clientId },
      select: { id: true },
    });
    if (!lead) {
      const err = new Error("Lead not found.");
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    const activity = await tx.leadActivity.create({
      data: {
        clientId,
        leadId,
        userId: actor.id,
        type: "NOTE",
        title: "Agent Interaction Note",
        description: noteText.trim(),
        metadata: {
          authorName: actor.name || "Agent",
          authorRole: actor.role,
        },
      },
    });

    return activity;
  });
}

// -----------------------------------------------------------------------------
// 5. BULK LEAD OPERATIONS SERVICE
// -----------------------------------------------------------------------------

export async function executeBulkLeadAction(
  clientId: string,
  rawInput: unknown,
  actor: { id: string; role: UserRole; name?: string }
) {
  // Bulk operations require SUPER_ADMIN, ADMIN, or MANAGER
  requirePermission(actor.role, "BULK_OPERATIONS");

  const parsed = BulkLeadActionSchema.safeParse(rawInput);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues[0]?.message || "Invalid bulk request");
    (err as unknown as { status: number }).status = 400;
    throw err;
  }
  const input = parsed.data;

  return await withTenantTransaction(clientId, async (tx) => {
    // 1. Fetch all requested leads under tenant
    const leads = await tx.lead.findMany({
      where: {
        id: { in: input.leadIds },
        clientId,
      },
      select: { id: true, crmId: true, stage: true, assignedUserId: true },
    });

    if (leads.length === 0) {
      const err = new Error("No matching leads found in organization.");
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    if (input.action === "REASSIGN") {
      if (!input.assignedUserId) {
        const err = new Error("Target assignedUserId is required for bulk reassignment.");
        (err as unknown as { status: number }).status = 400;
        throw err;
      }

      const targetUser = await tx.user.findFirst({
        where: { id: input.assignedUserId, clientId, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, role: true, teamId: true },
      });
      if (!targetUser) {
        const err = new Error("Target assignee is invalid or inactive.");
        (err as unknown as { status: number }).status = 400;
        throw err;
      }

      const repName = `${targetUser.firstName} ${targetUser.lastName}`;
      const matchedIds = leads.map((l) => l.id);

      await tx.lead.updateMany({
        where: { id: { in: matchedIds }, clientId },
        data: {
          assignedUserId: targetUser.id,
          teamId: targetUser.teamId || undefined,
        },
      });

      // Append activity and audit for each affected lead
      for (const lead of leads) {
        await tx.leadActivity.create({
          data: {
            clientId,
            leadId: lead.id,
            userId: actor.id,
            type: "REASSIGN",
            title: "Bulk Reassigned",
            description: `Reassigned to ${repName} (${targetUser.role}) · Reason: ${input.reason || "Bulk Reassignment"}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          clientId,
          userId: actor.id,
          action: "LEAD_BULK_REASSIGN",
          entityType: "Lead",
          entityId: matchedIds.join(","),
          metadata: { count: matchedIds.length, targetUserId: targetUser.id },
        },
      });

      return { success: true, count: matchedIds.length };
    }

    if (input.action === "TRANSITION") {
      if (!input.targetStage) {
        const err = new Error("targetStage is required for bulk stage transition.");
        (err as unknown as { status: number }).status = 400;
        throw err;
      }

      let transitionedCount = 0;
      for (const lead of leads) {
        const check = validateLeadTransition(lead.stage, input.targetStage, {
          reason: input.reason,
        });
        if (check.valid) {
          await tx.lead.update({
            where: { id: lead.id },
            data: {
              stage: input.targetStage,
              unqualifiedReason:
                input.targetStage === LeadStage.UNQUALIFIED ? input.reason : null,
              lostReason: input.targetStage === LeadStage.LOST ? input.reason : null,
            },
          });

          await tx.leadActivity.create({
            data: {
              clientId,
              leadId: lead.id,
              userId: actor.id,
              type: "STAGE_CHANGE",
              title: `Stage Changed to ${input.targetStage}`,
              description: `Bulk transition from ${lead.stage} to ${input.targetStage}${input.reason ? ` · Reason: ${input.reason}` : ""}`,
            },
          });

          transitionedCount++;
        }
      }

      await tx.auditLog.create({
        data: {
          clientId,
          userId: actor.id,
          action: "LEAD_BULK_STAGE_TRANSITION",
          entityType: "Lead",
          entityId: leads.map((l) => l.id).join(","),
          metadata: { count: transitionedCount, targetStage: input.targetStage },
        },
      });

      return { success: true, count: transitionedCount };
    }

    throw new Error("Unsupported bulk action.");
  });
}
