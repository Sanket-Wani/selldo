import { z } from "zod";
import { LeadStage, BookingStatus, Prisma } from "@prisma/client";
import { withTenantTransaction } from "./tenant";

// -----------------------------------------------------------------------------
// 1. INPUT FILTER VALIDATION SCHEMA
// -----------------------------------------------------------------------------
export const DashboardFilterSchema = z.object({
  range: z.enum(["today", "7d", "30d", "mtd", "all"]).default("30d"),
  projectId: z.string().optional().default(""),
  source: z.string().optional().default(""),
  view: z.enum(["overview", "cp"]).default("overview"),
});

export type DashboardFilter = z.infer<typeof DashboardFilterSchema>;

export interface DateRangeBoundaries {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
  label: string;
}

/**
 * Computes exact Date objects for current and previous historical period comparison.
 */
export function resolveDateRange(range: string): DateRangeBoundaries {
  const now = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;

  let startDate: Date;
  let prevStartDate: Date;
  let prevEndDate: Date;
  let label = "Last 30 Days";

  switch (range) {
    case "today": {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      prevStartDate = new Date(startDate.getTime() - DAY_MS);
      prevEndDate = new Date(now.getTime() - DAY_MS);
      label = "Today";
      break;
    }
    case "7d": {
      startDate = new Date(now.getTime() - 7 * DAY_MS);
      prevStartDate = new Date(now.getTime() - 14 * DAY_MS);
      prevEndDate = new Date(now.getTime() - 7 * DAY_MS);
      label = "Last 7 Days";
      break;
    }
    case "mtd": {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysIntoMonth = now.getDate();
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      prevStartDate = new Date(prevYear, prevMonth, 1);
      prevEndDate = new Date(prevYear, prevMonth, Math.min(daysIntoMonth, 28));
      label = "Month to Date";
      break;
    }
    case "all": {
      startDate = new Date(2020, 0, 1);
      prevStartDate = new Date(2019, 0, 1);
      prevEndDate = new Date(2020, 0, 1);
      label = "All Time";
      break;
    }
    case "30d":
    default: {
      startDate = new Date(now.getTime() - 30 * DAY_MS);
      prevStartDate = new Date(now.getTime() - 60 * DAY_MS);
      prevEndDate = new Date(now.getTime() - 30 * DAY_MS);
      label = "Last 30 Days";
      break;
    }
  }

  return {
    startDate,
    endDate: now,
    prevStartDate,
    prevEndDate,
    label,
  };
}

// -----------------------------------------------------------------------------
// 2. DASHBOARD METRIC DTO DEFINITIONS
// -----------------------------------------------------------------------------
export interface ExecutiveKpiSummary {
  totalLeads: number;
  prevTotalLeads: number;
  totalLeadsDeltaPct: number;
  newInflow: number;
  activePipeline: number;
  bookedLeads: number;
  lostLeads: number;
  unqualifiedLeads: number;
  siteVisitsTotal: number;
  siteVisitsConducted: number;
  siteVisitsScheduled: number;
  followupsPending: number;
  followupsOverdue: number;
  bookingsCount: number;
  grossAgreementValue: number;
}

export interface InflowTimelinePoint {
  date: string;
  inflow: number;
  converted: number;
}

export interface StageDistributionItem {
  stage: string;
  label: string;
  count: number;
  percentage: number;
}

export interface SourceBreakdownItem {
  source: string;
  leadsCount: number;
  bookingsCount: number;
}

export interface ProjectSiteVisitItem {
  projectName: string;
  conducted: number;
  scheduled: number;
}

export interface ChannelPartnerMetrics {
  totalCpLeads: number;
  conductedVisits: number;
  confirmedBookings: number;
  cumulativeAgreementValue: number;
  conversionRatePct: number;
}

export interface DashboardDataResult {
  filter: DashboardFilter;
  dateRangeLabel: string;
  kpis: ExecutiveKpiSummary;
  inflowTimeline: InflowTimelinePoint[];
  stageDistribution: StageDistributionItem[];
  sourceBreakdown: SourceBreakdownItem[];
  projectSiteVisits: ProjectSiteVisitItem[];
  cpMetrics: ChannelPartnerMetrics;
  availableProjects: Array<{ id: string; name: string; code: string }>;
  availableSources: string[];
}

// -----------------------------------------------------------------------------
// 3. SERVER-SIDE AGGREGATION & SERVICE IMPLEMENTATION
// -----------------------------------------------------------------------------
export async function getDashboardData(
  clientId: string,
  rawFilter: unknown
): Promise<DashboardDataResult> {
  // 1. Server-side Zod validation of input parameters
  const parsedFilter = DashboardFilterSchema.safeParse(rawFilter);
  const filter = parsedFilter.success
    ? parsedFilter.data
    : DashboardFilterSchema.parse({});

  const { startDate, endDate, prevStartDate, prevEndDate, label } =
    resolveDateRange(filter.range);

  // 2. Execute all queries within tenant-isolated RLS transaction
  return await withTenantTransaction(clientId, async (tx) => {
    // Lead filters
    const leadWhere: Prisma.LeadWhereInput = {
      clientId,
      createdAt: { gte: startDate, lte: endDate },
      ...(filter.projectId ? { projectId: filter.projectId } : {}),
      ...(filter.source ? { source: filter.source } : {}),
    };

    const prevLeadWhere: Prisma.LeadWhereInput = {
      clientId,
      createdAt: { gte: prevStartDate, lte: prevEndDate },
      ...(filter.projectId ? { projectId: filter.projectId } : {}),
      ...(filter.source ? { source: filter.source } : {}),
    };

    // Parallel aggregate queries
    const [
      totalLeads,
      prevTotalLeads,
      newInflow,
      opportunitiesCount,
      prospectsCount,
      bookedLeads,
      lostLeads,
      unqualifiedLeads,
      siteVisitsTotal,
      siteVisitsConducted,
      siteVisitsScheduled,
      followupsPending,
      followupsOverdue,
      bookingsCount,
      bookingAggregate,
      leadRecords,
      allProjects,
      allSourcesRaw,
    ] = await Promise.all([
      // Total Leads in current window
      tx.lead.count({ where: leadWhere }),
      // Previous period comparison count
      tx.lead.count({ where: prevLeadWhere }),
      // Stage: INCOMING
      tx.lead.count({ where: { ...leadWhere, stage: LeadStage.INCOMING } }),
      // Stage: OPPORTUNITY
      tx.lead.count({ where: { ...leadWhere, stage: LeadStage.OPPORTUNITY } }),
      // Stage: PROSPECT
      tx.lead.count({ where: { ...leadWhere, stage: LeadStage.PROSPECT } }),
      // Stage: BOOKED
      tx.lead.count({ where: { ...leadWhere, stage: LeadStage.BOOKED } }),
      // Stage: LOST
      tx.lead.count({ where: { ...leadWhere, stage: LeadStage.LOST } }),
      // Stage: UNQUALIFIED
      tx.lead.count({ where: { ...leadWhere, stage: LeadStage.UNQUALIFIED } }),

      // Site visits
      tx.siteVisit.count({
        where: {
          clientId,
          createdAt: { gte: startDate, lte: endDate },
          ...(filter.projectId ? { projectId: filter.projectId } : {}),
        },
      }),
      tx.siteVisit.count({
        where: {
          clientId,
          status: "CONDUCTED",
          createdAt: { gte: startDate, lte: endDate },
          ...(filter.projectId ? { projectId: filter.projectId } : {}),
        },
      }),
      tx.siteVisit.count({
        where: {
          clientId,
          status: "SCHEDULED",
          createdAt: { gte: startDate, lte: endDate },
          ...(filter.projectId ? { projectId: filter.projectId } : {}),
        },
      }),

      // Followups
      tx.followup.count({
        where: {
          clientId,
          status: "PENDING",
          scheduledAt: { gte: new Date() },
        },
      }),
      tx.followup.count({
        where: {
          clientId,
          OR: [
            { status: "OVERDUE" },
            { status: "PENDING", scheduledAt: { lt: new Date() } },
          ],
        },
      }),

      // Bookings count & gross agreement value
      tx.booking.count({
        where: {
          clientId,
          createdAt: { gte: startDate, lte: endDate },
          ...(filter.projectId ? { projectId: filter.projectId } : {}),
        },
      }),
      tx.booking.aggregate({
        where: {
          clientId,
          status: BookingStatus.CONFIRMED,
          createdAt: { gte: startDate, lte: endDate },
          ...(filter.projectId ? { projectId: filter.projectId } : {}),
        },
        _sum: {
          agreementValue: true,
        },
      }),

      // Raw leads for time-series and breakdown (bounded query)
      tx.lead.findMany({
        where: leadWhere,
        select: {
          id: true,
          stage: true,
          source: true,
          projectId: true,
          createdAt: true,
          project: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 500,
      }),

      // Available projects for dropdown filter
      tx.project.findMany({
        where: { clientId },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),

      // Available sources for dropdown filter
      tx.lead.findMany({
        where: { clientId, source: { not: null } },
        select: { source: true },
        distinct: ["source"],
      }),
    ]);

    // Calculate percentage change vs previous period
    const totalLeadsDeltaPct =
      prevTotalLeads > 0
        ? Math.round(((totalLeads - prevTotalLeads) / prevTotalLeads) * 100)
        : totalLeads > 0
        ? 100
        : 0;

    const activePipeline = opportunitiesCount + prospectsCount;
    const grossAgreementValue = bookingAggregate._sum.agreementValue || 0;

    // Build Time-Series Inflow Timeline
    const timelineMap = new Map<string, { inflow: number; converted: number }>();
    for (const lead of leadRecords) {
      const dateStr = lead.createdAt.toISOString().split("T")[0];
      const entry = timelineMap.get(dateStr) || { inflow: 0, converted: 0 };
      entry.inflow += 1;
      if (lead.stage === LeadStage.BOOKED || lead.stage === LeadStage.OPPORTUNITY) {
        entry.converted += 1;
      }
      timelineMap.set(dateStr, entry);
    }

    const inflowTimeline: InflowTimelinePoint[] = Array.from(
      timelineMap.entries()
    ).map(([date, counts]) => ({
      date,
      inflow: counts.inflow,
      converted: counts.converted,
    }));

    // Build Stage Distribution
    const stageLabels: Record<LeadStage, string> = {
      INCOMING: "Incoming / New",
      PROSPECT: "Prospect",
      OPPORTUNITY: "Opportunity",
      BOOKED: "Booked",
      UNQUALIFIED: "Unqualified",
      LOST: "Lost",
    };

    const stageCounts: Record<LeadStage, number> = {
      INCOMING: newInflow,
      PROSPECT: prospectsCount,
      OPPORTUNITY: opportunitiesCount,
      BOOKED: bookedLeads,
      UNQUALIFIED: unqualifiedLeads,
      LOST: lostLeads,
    };

    const stageDistribution: StageDistributionItem[] = Object.keys(
      stageLabels
    ).map((key) => {
      const stage = key as LeadStage;
      const count = stageCounts[stage];
      const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
      return {
        stage,
        label: stageLabels[stage],
        count,
        percentage,
      };
    });

    // Build Source Breakdown
    const sourceMap = new Map<string, { leads: number; bookings: number }>();
    for (const lead of leadRecords) {
      const src = lead.source || "Direct Walk-in";
      const entry = sourceMap.get(src) || { leads: 0, bookings: 0 };
      entry.leads += 1;
      if (lead.stage === LeadStage.BOOKED) {
        entry.bookings += 1;
      }
      sourceMap.set(src, entry);
    }

    const sourceBreakdown: SourceBreakdownItem[] = Array.from(
      sourceMap.entries()
    ).map(([source, stats]) => ({
      source,
      leadsCount: stats.leads,
      bookingsCount: stats.bookings,
    }));

    // Build Project Site Visits
    const projectVisits = await tx.siteVisit.findMany({
      where: {
        clientId,
        createdAt: { gte: startDate, lte: endDate },
        ...(filter.projectId ? { projectId: filter.projectId } : {}),
      },
      select: {
        status: true,
        project: { select: { name: true } },
      },
    });

    const projectVisitMap = new Map<string, { conducted: number; scheduled: number }>();
    for (const pv of projectVisits) {
      const pName = pv.project?.name || "General";
      const entry = projectVisitMap.get(pName) || { conducted: 0, scheduled: 0 };
      if (pv.status === "CONDUCTED") entry.conducted += 1;
      if (pv.status === "SCHEDULED") entry.scheduled += 1;
      projectVisitMap.set(pName, entry);
    }

    const projectSiteVisits: ProjectSiteVisitItem[] = Array.from(
      projectVisitMap.entries()
    ).map(([projectName, counts]) => ({
      projectName,
      conducted: counts.conducted,
      scheduled: counts.scheduled,
    }));

    // Channel Partner (CP) Specific Metrics
    const cpLeadsCount = leadRecords.filter(
      (l) => l.source === "Channel Partner"
    ).length;
    const cpBookings = await tx.booking.aggregate({
      where: {
        clientId,
        status: BookingStatus.CONFIRMED,
        createdAt: { gte: startDate, lte: endDate },
        lead: { source: "Channel Partner" },
      },
      _count: true,
      _sum: { agreementValue: true },
    });

    const cpMetrics: ChannelPartnerMetrics = {
      totalCpLeads: cpLeadsCount,
      conductedVisits: siteVisitsConducted,
      confirmedBookings: cpBookings._count || 0,
      cumulativeAgreementValue: cpBookings._sum.agreementValue || 0,
      conversionRatePct:
        cpLeadsCount > 0
          ? Math.round(((cpBookings._count || 0) / cpLeadsCount) * 100)
          : 0,
    };

    const availableSources = allSourcesRaw
      .map((s) => s.source)
      .filter((s): s is string => Boolean(s));

    return {
      filter,
      dateRangeLabel: label,
      kpis: {
        totalLeads,
        prevTotalLeads,
        totalLeadsDeltaPct,
        newInflow,
        activePipeline,
        bookedLeads,
        lostLeads,
        unqualifiedLeads,
        siteVisitsTotal,
        siteVisitsConducted,
        siteVisitsScheduled,
        followupsPending,
        followupsOverdue,
        bookingsCount,
        grossAgreementValue,
      },
      inflowTimeline,
      stageDistribution,
      sourceBreakdown,
      projectSiteVisits,
      cpMetrics,
      availableProjects: allProjects,
      availableSources,
    };
  });
}
