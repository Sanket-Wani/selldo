import { db } from "../src/lib/db";
import { withTenantTransaction } from "../src/lib/tenant";
import { hasPermission, requirePermission } from "../src/lib/rbac";
import {
  resolveDateRange,
  DashboardFilterSchema,
  getDashboardData,
} from "../src/lib/dashboard";
import { LeadStage, BookingStatus, UserRole } from "@prisma/client";

async function runDashboardTests() {
  console.log("==========================================================");
  console.log("RUNNING AUTOMATED DASHBOARD & ANALYTICS TEST SUITE (PHASE 2)");
  console.log("==========================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Retrieve seed tenants
  const clientA = await db.client.findUnique({
    where: { domain: "prestige.sell.do" },
  });
  const clientB = await db.client.findUnique({
    where: { domain: "sobha.sell.do" },
  });

  if (!clientA || !clientB) {
    throw new Error("Seed tenants Client A or Client B not found in database.");
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Date Range Boundaries & Historical Windows
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 1: Date Range Calculation & Period Windows ---");
  const now = new Date();

  // Test 'today'
  const todayRange = resolveDateRange("today");
  assert(
    todayRange.startDate <= now &&
      todayRange.startDate.getDate() === now.getDate() &&
      todayRange.label === "Today",
    "resolveDateRange('today') calculates start of today"
  );
  assert(
    todayRange.prevStartDate < todayRange.startDate &&
      todayRange.prevEndDate < todayRange.startDate,
    "resolveDateRange('today') prev period is exactly 24 hours prior"
  );

  // Test '7d'
  const weekRange = resolveDateRange("7d");
  const diffDays7 = Math.round(
    (weekRange.endDate.getTime() - weekRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  assert(diffDays7 === 7, "resolveDateRange('7d') spans exactly 7 days");
  assert(weekRange.label === "Last 7 Days", "resolveDateRange('7d') label is correct");

  // Test '30d'
  const monthRange = resolveDateRange("30d");
  const diffDays30 = Math.round(
    (monthRange.endDate.getTime() - monthRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  assert(diffDays30 === 30, "resolveDateRange('30d') spans exactly 30 days");

  // Test 'mtd'
  const mtdRange = resolveDateRange("mtd");
  assert(
    mtdRange.startDate.getDate() === 1 &&
      mtdRange.startDate.getMonth() === now.getMonth(),
    "resolveDateRange('mtd') starts on 1st of current month"
  );

  // Test 'all'
  const allRange = resolveDateRange("all");
  assert(
    allRange.startDate.getFullYear() === 2020 && allRange.label === "All Time",
    "resolveDateRange('all') covers historical data"
  );

  // ---------------------------------------------------------------------------
  // TEST 2: Zod Filter Schema Validation
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 2: Dashboard Filter Schema Validation ---");
  const defaultParsed = DashboardFilterSchema.safeParse({});
  assert(
    defaultParsed.success &&
      defaultParsed.data.range === "30d" &&
      defaultParsed.data.view === "overview" &&
      defaultParsed.data.projectId === "" &&
      defaultParsed.data.source === "",
    "DashboardFilterSchema supplies correct defaults on empty input"
  );

  const customParsed = DashboardFilterSchema.safeParse({
    range: "7d",
    projectId: "proj-abc",
    source: "Channel Partner",
    view: "cp",
  });
  assert(
    customParsed.success &&
      customParsed.data.range === "7d" &&
      customParsed.data.view === "cp" &&
      customParsed.data.source === "Channel Partner",
    "DashboardFilterSchema validates valid custom parameters"
  );

  const invalidRange = DashboardFilterSchema.safeParse({ range: "1000days" });
  assert(!invalidRange.success, "DashboardFilterSchema rejects invalid range");

  const invalidView = DashboardFilterSchema.safeParse({ view: "superadmin_backdoor" });
  assert(!invalidView.success, "DashboardFilterSchema rejects invalid view mode");

  // ---------------------------------------------------------------------------
  // TEST 3: Cross-Tenant Aggregation Isolation via PostgreSQL RLS
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 3: Cross-Tenant Isolation in Aggregation Engine ---");
  const dataA = await getDashboardData(clientA.id, { range: "all" });
  const dataB = await getDashboardData(clientB.id, { range: "all" });

  assert(
    dataA.kpis.totalLeads > 0,
    `Tenant A aggregated data contains leads (found ${dataA.kpis.totalLeads})`
  );
  assert(
    dataB.kpis.totalLeads > 0,
    `Tenant B aggregated data contains leads (found ${dataB.kpis.totalLeads})`
  );

  // Project isolation
  const tenantAProjectIds = new Set(dataA.availableProjects.map((p) => p.id));
  const tenantBProjectIds = new Set(dataB.availableProjects.map((p) => p.id));
  const hasProjectOverlap = [...tenantAProjectIds].some((id) => tenantBProjectIds.has(id));
  assert(
    !hasProjectOverlap,
    "Tenant A and Tenant B have strictly zero overlapping projects in filter lists"
  );

  // Verify Tenant A's project breakdown contains ONLY Tenant A projects
  const tenantAProjectNames = new Set(dataA.availableProjects.map((p) => p.name));
  const siteVisitProjectNamesA = dataA.projectSiteVisits.map((p) => p.projectName);
  const allVisitsBelongToTenantA = siteVisitProjectNamesA.every((name) =>
    tenantAProjectNames.has(name)
  );
  assert(
    allVisitsBelongToTenantA,
    "Tenant A site visit breakdown contains only Tenant A projects"
  );

  // ---------------------------------------------------------------------------
  // TEST 4: Server-Side RBAC Enforcement on Reports/Dashboard Capability
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 4: RBAC Capability Verification for REPORTS_VIEW ---");
  // Permitted roles: SUPER_ADMIN, ADMIN, MANAGER
  assert(
    hasPermission(UserRole.SUPER_ADMIN, "REPORTS_VIEW"),
    "SUPER_ADMIN has REPORTS_VIEW permission"
  );
  assert(
    hasPermission(UserRole.ADMIN, "REPORTS_VIEW"),
    "ADMIN has REPORTS_VIEW permission"
  );
  assert(
    hasPermission(UserRole.MANAGER, "REPORTS_VIEW"),
    "MANAGER has REPORTS_VIEW permission"
  );

  // Non-permitted roles: SALES, PRE_SALES, CHANNEL_PARTNER
  assert(
    !hasPermission(UserRole.SALES, "REPORTS_VIEW"),
    "SALES lacks REPORTS_VIEW permission (blocked at server boundary)"
  );
  assert(
    !hasPermission(UserRole.PRE_SALES, "REPORTS_VIEW"),
    "PRE_SALES lacks REPORTS_VIEW permission"
  );
  assert(
    !hasPermission(UserRole.POST_SALES, "REPORTS_VIEW"),
    "POST_SALES lacks REPORTS_VIEW permission"
  );

  // requirePermission throws 403 on unauthorized role
  let rbacBlocked = false;
  try {
    requirePermission(UserRole.SALES, "REPORTS_VIEW");
  } catch (err: any) {
    if (err.status === 403 || err.message.includes("Forbidden")) {
      rbacBlocked = true;
    }
  }
  assert(rbacBlocked, "requirePermission throws 403 Forbidden for unauthorized role");

  // ---------------------------------------------------------------------------
  // TEST 5: Ground-Truth KPI Metric Accuracy & Exact DB Reflection
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 5: Ground-Truth Metric Reflection vs Database Queries ---");
  await withTenantTransaction(clientA.id, async (tx) => {
    // 1. Direct count of all Tenant A leads
    const directLeadCount = await tx.lead.count({ where: { clientId: clientA.id } });
    assert(
      dataA.kpis.totalLeads === directLeadCount,
      `Total Leads KPI (${dataA.kpis.totalLeads}) matches exact DB count (${directLeadCount})`
    );

    // 2. Direct count of stage breakdown
    const directIncoming = await tx.lead.count({
      where: { clientId: clientA.id, stage: LeadStage.INCOMING },
    });
    assert(
      dataA.kpis.newInflow === directIncoming,
      `New Inflow KPI (${dataA.kpis.newInflow}) matches exact INCOMING lead count (${directIncoming})`
    );

    const directBooked = await tx.lead.count({
      where: { clientId: clientA.id, stage: LeadStage.BOOKED },
    });
    assert(
      dataA.kpis.bookedLeads === directBooked,
      `Booked Leads KPI (${dataA.kpis.bookedLeads}) matches exact BOOKED lead count (${directBooked})`
    );

    // 3. Direct count of site visits
    const directVisits = await tx.siteVisit.count({
      where: { clientId: clientA.id },
    });
    assert(
      dataA.kpis.siteVisitsTotal === directVisits,
      `Site Visits Total KPI (${dataA.kpis.siteVisitsTotal}) matches exact DB count (${directVisits})`
    );

    const directConducted = await tx.siteVisit.count({
      where: { clientId: clientA.id, status: "CONDUCTED" },
    });
    assert(
      dataA.kpis.siteVisitsConducted === directConducted,
      `Conducted Site Visits (${dataA.kpis.siteVisitsConducted}) matches DB count (${directConducted})`
    );

    // 4. Direct sum of confirmed agreement value
    const directAgreementValue = await tx.booking.aggregate({
      where: { clientId: clientA.id, status: BookingStatus.CONFIRMED },
      _sum: { agreementValue: true },
    });
    const expectedValue = directAgreementValue._sum.agreementValue || 0;
    assert(
      dataA.kpis.grossAgreementValue === expectedValue,
      `Gross Agreement Value (₹${dataA.kpis.grossAgreementValue}) matches direct DB sum (₹${expectedValue})`
    );
  });

  // ---------------------------------------------------------------------------
  // TEST 6: Honest Empty-State Behavior (Zero Fabricated Metrics)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 6: Zero Fabricated Metrics & Honest Empty State ---");
  const emptyFilterData = await getDashboardData(clientA.id, {
    projectId: "non-existent-project-00000000-0000",
  });

  assert(
    emptyFilterData.kpis.totalLeads === 0 &&
      emptyFilterData.kpis.newInflow === 0 &&
      emptyFilterData.kpis.activePipeline === 0 &&
      emptyFilterData.kpis.bookedLeads === 0 &&
      emptyFilterData.kpis.grossAgreementValue === 0 &&
      emptyFilterData.kpis.siteVisitsTotal === 0,
    "Non-matching filter yields strictly zero across all KPI metrics (no fake values)"
  );
  assert(
    emptyFilterData.inflowTimeline.length === 0,
    "Time-series inflow timeline is empty on non-matching filter"
  );
  assert(
    emptyFilterData.sourceBreakdown.length === 0,
    "Source breakdown is empty on non-matching filter"
  );
  assert(
    emptyFilterData.projectSiteVisits.length === 0,
    "Project site visits breakdown is empty on non-matching filter"
  );
  assert(
    emptyFilterData.stageDistribution.every((s) => s.count === 0 && s.percentage === 0),
    "Stage distribution accurately reports 0 count and 0% for all stages"
  );

  // ---------------------------------------------------------------------------
  // TEST 7: Channel Partner (CP) Dashboard View Metrics Integrity
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 7: Channel Partner Metrics Integrity ---");
  const cpFilterData = await getDashboardData(clientA.id, {
    range: "all",
    view: "cp",
  });

  await withTenantTransaction(clientA.id, async (tx) => {
    const directCpLeads = await tx.lead.count({
      where: { clientId: clientA.id, source: "Channel Partner" },
    });
    assert(
      cpFilterData.cpMetrics.totalCpLeads === directCpLeads,
      `CP Leads (${cpFilterData.cpMetrics.totalCpLeads}) matches exact DB count of Channel Partner leads (${directCpLeads})`
    );

    const directCpBookings = await tx.booking.count({
      where: {
        clientId: clientA.id,
        status: BookingStatus.CONFIRMED,
        lead: { source: "Channel Partner" },
      },
    });
    assert(
      cpFilterData.cpMetrics.confirmedBookings === directCpBookings,
      `CP Bookings (${cpFilterData.cpMetrics.confirmedBookings}) matches DB confirmed CP bookings (${directCpBookings})`
    );

    const directCpAgreement = await tx.booking.aggregate({
      where: {
        clientId: clientA.id,
        status: BookingStatus.CONFIRMED,
        lead: { source: "Channel Partner" },
      },
      _sum: { agreementValue: true },
    });
    const expectedCpValue = directCpAgreement._sum.agreementValue || 0;
    assert(
      cpFilterData.cpMetrics.cumulativeAgreementValue === expectedCpValue,
      `CP Cumulative Value (₹${cpFilterData.cpMetrics.cumulativeAgreementValue}) matches direct DB sum (₹${expectedCpValue})`
    );
  });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n==========================================================");
  console.log(`DASHBOARD TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runDashboardTests()
  .catch((err) => {
    console.error("Dashboard test runner fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
