import { db } from "../src/lib/db";
import { withTenantTransaction } from "../src/lib/tenant";
import { requirePermission, hasPermission } from "../src/lib/rbac";
import { UserRole, LeadStage, BookingStatus } from "@prisma/client";
import {
  validateLeadTransition,
  ALLOWED_TRANSITIONS,
} from "../src/lib/fsm-constants";
import { executeLeadStageTransition } from "../src/lib/fsm";
import {
  getLeadsList,
  getLead360,
  createLead,
  updateLead,
  reassignLead,
  addLeadNote,
  executeBulkLeadAction,
} from "../src/lib/leads";

async function runLead360Tests() {
  console.log("==========================================================");
  console.log("RUNNING PHASE 3: LEAD 360 & PIPELINE OPERATIONS TEST SUITE");
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

  // 1. Fetch seed tenants (Client table does not have RLS)
  const clientA = await db.client.findUnique({
    where: { domain: "prestige.sell.do" },
  });
  const clientB = await db.client.findUnique({
    where: { domain: "sobha.sell.do" },
  });

  if (!clientA || !clientB) {
    throw new Error("Seed tenants Client A or Client B not found in database.");
  }

  // 2. Fetch seed users and leads inside their respective RLS tenant contexts
  const { adminA, salesA, managerA, leadA } = await withTenantTransaction(
    clientA.id,
    async (tx) => {
      const adminA = await tx.user.findFirst({
        where: { clientId: clientA.id, role: UserRole.ADMIN },
      });
      const salesA = await tx.user.findFirst({
        where: { clientId: clientA.id, role: UserRole.SALES },
      });
      const managerA = await tx.user.findFirst({
        where: { clientId: clientA.id, role: UserRole.MANAGER },
      });
      const leadA = await tx.lead.findFirst({
        where: { clientId: clientA.id },
      });
      return { adminA, salesA, managerA, leadA };
    }
  );

  const { userB, leadB } = await withTenantTransaction(
    clientB.id,
    async (tx) => {
      const userB = await tx.user.findFirst({
        where: { clientId: clientB.id },
      });
      const leadB = await tx.lead.findFirst({
        where: { clientId: clientB.id },
      });
      return { userB, leadB };
    }
  );

  if (!adminA || !salesA || !managerA || !leadA || !userB || !leadB) {
    throw new Error("Seed users or leads not found in tenant contexts.");
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 1: FINITE STATE MACHINE (FSM) TRANSITION MATRIX RULES
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 1: Finite State Machine (FSM) Matrix ---");

  // Valid forward transitions
  const valid1 = validateLeadTransition(LeadStage.INCOMING, LeadStage.PROSPECT);
  assert(valid1.valid, "FSM: INCOMING -> PROSPECT is allowed");

  const valid2 = validateLeadTransition(LeadStage.PROSPECT, LeadStage.OPPORTUNITY);
  assert(valid2.valid, "FSM: PROSPECT -> OPPORTUNITY is allowed");

  const valid3 = validateLeadTransition(LeadStage.OPPORTUNITY, LeadStage.BOOKED);
  assert(valid3.valid, "FSM: OPPORTUNITY -> BOOKED is allowed");

  // Reversal / Re-engagement transitions
  const valid4 = validateLeadTransition(LeadStage.BOOKED, LeadStage.PROSPECT);
  assert(valid4.valid, "FSM: BOOKED -> PROSPECT (Booking Cancelled) is allowed");

  const valid5 = validateLeadTransition(LeadStage.UNQUALIFIED, LeadStage.PROSPECT);
  assert(valid5.valid, "FSM: UNQUALIFIED -> PROSPECT (Re-engagement) is allowed");

  const valid6 = validateLeadTransition(LeadStage.LOST, LeadStage.PROSPECT);
  assert(valid6.valid, "FSM: LOST -> PROSPECT (Campaign Re-engagement) is allowed");

  // Terminal / Drop transitions with mandatory reasons
  const validUnqual = validateLeadTransition(LeadStage.INCOMING, LeadStage.UNQUALIFIED, {
    reason: "Budget Mismatch",
  });
  assert(validUnqual.valid, "FSM: INCOMING -> UNQUALIFIED with mandatory reason is allowed");

  const invalidUnqualNoReason = validateLeadTransition(LeadStage.INCOMING, LeadStage.UNQUALIFIED, {});
  assert(!invalidUnqualNoReason.valid, "FSM: Transition to UNQUALIFIED without reason is rejected");

  const validLost = validateLeadTransition(LeadStage.OPPORTUNITY, LeadStage.LOST, {
    reason: "Purchased Competitor Project",
  });
  assert(validLost.valid, "FSM: OPPORTUNITY -> LOST with mandatory reason is allowed");

  const invalidLostNoReason = validateLeadTransition(LeadStage.OPPORTUNITY, LeadStage.LOST, {});
  assert(!invalidLostNoReason.valid, "FSM: Transition to LOST without reason is rejected");

  // Illegal transitions
  const illegal1 = validateLeadTransition(LeadStage.INCOMING, LeadStage.BOOKED);
  assert(!illegal1.valid, "FSM: Skipping stages directly (INCOMING -> BOOKED) is rejected");

  const illegal2 = validateLeadTransition(LeadStage.PROSPECT, LeadStage.BOOKED);
  assert(!illegal2.valid, "FSM: Skipping Opportunity (PROSPECT -> BOOKED) is rejected");

  const illegal3 = validateLeadTransition(LeadStage.BOOKED, LeadStage.UNQUALIFIED);
  assert(!illegal3.valid, "FSM: Illegal transition (BOOKED -> UNQUALIFIED) is rejected");

  const illegalSelf = validateLeadTransition(LeadStage.OPPORTUNITY, LeadStage.OPPORTUNITY);
  assert(!illegalSelf.valid, "FSM: Transitioning to the same stage is rejected");

  // ---------------------------------------------------------------------------
  // TEST SUITE 2: MULTI-TENANT ISOLATION ON LEADS & LEAD 360
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 2: Multi-Tenant Lead Isolation ---");

  // Tenant A executing getLeadsList should NEVER return Tenant B's leads
  const listA = await getLeadsList(
    clientA.id,
    { id: adminA.id, role: adminA.role },
    { page: 1, pageSize: 50 }
  );
  assert(
    listA.leads.length > 0 && listA.leads.every((l) => l.clientId === clientA.id),
    "getLeadsList: Tenant A list only contains Tenant A leads"
  );
  assert(
    !listA.leads.some((l) => l.id === leadB.id),
    "getLeadsList: Tenant B lead is absent from Tenant A's lead list"
  );

  // Tenant A trying to get Tenant B's Lead 360 via ID manipulation
  let getCrossLeadThrew = false;
  try {
    await getLead360(clientA.id, leadB.id);
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) {
      getCrossLeadThrew = true;
    }
  }
  assert(
    getCrossLeadThrew,
    "getLead360: Direct URL/ID manipulation accessing Tenant B lead throws 404 under Tenant A"
  );

  // Tenant A trying to update Tenant B's lead
  let updateCrossLeadThrew = false;
  try {
    await updateLead(
      clientA.id,
      leadB.id,
      { firstName: "HackedName" },
      { id: adminA.id, role: adminA.role }
    );
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) {
      updateCrossLeadThrew = true;
    }
  }
  assert(
    updateCrossLeadThrew,
    "updateLead: Direct mutation on Tenant B lead throws 404 under Tenant A"
  );

  // Verify leadB was NOT modified
  await withTenantTransaction(clientB.id, async (tx) => {
    const verifiedLeadB = await tx.lead.findUnique({ where: { id: leadB.id } });
    assert(
      verifiedLeadB?.firstName === leadB.firstName,
      "Integrity check: Tenant B lead was completely unmodified by cross-tenant attempt"
    );
  });

  // ---------------------------------------------------------------------------
  // TEST SUITE 3: RBAC ENFORCEMENT ON LEAD OPERATIONS
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 3: Server-Side RBAC Enforcement ---");

  assert(
    hasPermission(UserRole.ADMIN, "LEADS_CREATE"),
    "RBAC: ADMIN role has LEADS_CREATE permission"
  );
  assert(
    hasPermission(UserRole.MANAGER, "LEADS_REASSIGN"),
    "RBAC: MANAGER role has LEADS_REASSIGN permission"
  );
  assert(
    !hasPermission(UserRole.SALES, "LEADS_REASSIGN"),
    "RBAC: SALES role does NOT have LEADS_REASSIGN permission"
  );
  assert(
    !hasPermission(UserRole.SALES, "BULK_OPERATIONS"),
    "RBAC: SALES role does NOT have BULK_OPERATIONS permission"
  );

  // Attempt reassignment with SALES role
  let salesReassignBlocked = false;
  try {
    await reassignLead(
      clientA.id,
      leadA.id,
      { assignedUserId: salesA.id },
      { id: salesA.id, role: UserRole.SALES }
    );
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 403) {
      salesReassignBlocked = true;
    }
  }
  assert(
    salesReassignBlocked,
    "reassignLead: Throws 403 Forbidden when invoked by unauthorized SALES role"
  );

  // Attempt bulk action with SALES role
  let salesBulkBlocked = false;
  try {
    await executeBulkLeadAction(
      clientA.id,
      { action: "REASSIGN", leadIds: [leadA.id], assignedUserId: salesA.id },
      { id: salesA.id, role: UserRole.SALES }
    );
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 403) {
      salesBulkBlocked = true;
    }
  }
  assert(
    salesBulkBlocked,
    "executeBulkLeadAction: Throws 403 Forbidden when invoked by unauthorized SALES role"
  );

  // ---------------------------------------------------------------------------
  // TEST SUITE 4: ASSIGNMENT INTEGRITY & CROSS-TENANT EMPLOYEE PROTECTION
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 4: Assignment Rules & Cross-Tenant Employee Protection ---");

  // Attempt to assign a Tenant A lead to a Tenant B user
  let crossTenantAssignBlocked = false;
  try {
    await reassignLead(
      clientA.id,
      leadA.id,
      { assignedUserId: userB.id, reason: "Cross-tenant attempt" },
      { id: adminA.id, role: UserRole.ADMIN }
    );
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 400) {
      crossTenantAssignBlocked = true;
    }
  }
  assert(
    crossTenantAssignBlocked,
    "reassignLead: Assignment to an employee from another tenant is rejected with 400"
  );

  // Valid reassignment within same tenant
  const reassignResult = await reassignLead(
    clientA.id,
    leadA.id,
    { assignedUserId: salesA.id, reason: "Rotational assignment" },
    { id: managerA.id, role: UserRole.MANAGER, name: `${managerA.firstName} ${managerA.lastName}` }
  );
  assert(
    reassignResult.assignedUserId === salesA.id,
    "reassignLead: Valid reassignment updates assignedUserId to target sales agent"
  );

  // Verify activity was created
  await withTenantTransaction(clientA.id, async (tx) => {
    const assignActivity = await tx.leadActivity.findFirst({
      where: { leadId: leadA.id, type: "REASSIGN" },
      orderBy: { createdAt: "desc" },
    });
    assert(
      assignActivity !== null && assignActivity.title === "Lead Reassigned",
      "reassignLead: Appends REASSIGN activity with audit details"
    );
  });

  // ---------------------------------------------------------------------------
  // TEST SUITE 5: TRANSACTIONAL FSM TRANSITIONS & AUDIT LOGGING
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 5: Transactional FSM Execution & Audit Logging ---");

  // Create a fresh test lead in INCOMING stage under Client A
  const testLead = await createLead(
    clientA.id,
    {
      firstName: "Aarav",
      lastName: "Patel",
      email: "aarav.patel@test.sell.do",
      phone: "+919876543210",
      source: "Google Ads",
      budgetMin: 8000000,
      budgetMax: 12000000,
      propertyType: "3 BHK",
    },
    { id: adminA.id, role: UserRole.ADMIN }
  );
  assert(testLead.stage === LeadStage.INCOMING, "createLead: Initializes in INCOMING stage");
  assert(testLead.crmId.startsWith("LD-"), "createLead: Formats sequential CRM ID (LD-xxxxx)");

  // 1. Valid Transition: INCOMING -> PROSPECT
  const trans1 = await executeLeadStageTransition(
    clientA.id,
    testLead.id,
    { targetStage: LeadStage.PROSPECT },
    { id: salesA.id, role: UserRole.SALES, name: "Sales Rep" }
  );
  assert(trans1.stage === LeadStage.PROSPECT, "executeLeadStageTransition: INCOMING -> PROSPECT succeeds");

  // Verify Audit Log
  await withTenantTransaction(clientA.id, async (tx) => {
    const audit1 = await tx.auditLog.findFirst({
      where: { entityId: testLead.id, action: "LEAD_STAGE_TRANSITION" },
      orderBy: { createdAt: "desc" },
    });
    assert(
      audit1 !== null && (audit1.metadata as Record<string, unknown>)?.toStage === LeadStage.PROSPECT,
      "executeLeadStageTransition: Records audit trail with previous and next stage"
    );
  });

  // 2. Illegal Transition: PROSPECT -> BOOKED
  let illegalTransitionThrew = false;
  try {
    await executeLeadStageTransition(
      clientA.id,
      testLead.id,
      { targetStage: LeadStage.BOOKED },
      { id: salesA.id, role: UserRole.SALES }
    );
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 400) {
      illegalTransitionThrew = true;
    }
  }
  assert(
    illegalTransitionThrew,
    "executeLeadStageTransition: Illegal direct transition (PROSPECT -> BOOKED) rejected with 400"
  );

  // Verify lead stage remained PROSPECT (atomicity)
  await withTenantTransaction(clientA.id, async (tx) => {
    const unchangedLead = await tx.lead.findUnique({ where: { id: testLead.id } });
    assert(
      unchangedLead?.stage === LeadStage.PROSPECT,
      "Integrity check: Lead stage unchanged following rejected illegal transition"
    );
  });

  // 3. Valid Transition: PROSPECT -> OPPORTUNITY (with Hot sub-stage)
  const trans2 = await executeLeadStageTransition(
    clientA.id,
    testLead.id,
    { targetStage: LeadStage.OPPORTUNITY, subStage: "HOT" },
    { id: salesA.id, role: UserRole.SALES }
  );
  assert(
    trans2.stage === LeadStage.OPPORTUNITY && trans2.subStage === "HOT",
    "executeLeadStageTransition: PROSPECT -> OPPORTUNITY (HOT) succeeds"
  );

  // 4. Valid Transition: OPPORTUNITY -> BOOKED
  const trans3 = await executeLeadStageTransition(
    clientA.id,
    testLead.id,
    { targetStage: LeadStage.BOOKED },
    { id: salesA.id, role: UserRole.SALES }
  );
  assert(trans3.stage === LeadStage.BOOKED, "executeLeadStageTransition: OPPORTUNITY -> BOOKED succeeds");

  // ---------------------------------------------------------------------------
  // TEST SUITE 6: INTERACTION NOTES & TIMELINE
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 6: Interaction Notes & Activity Timeline ---");

  const noteResult = await addLeadNote(
    clientA.id,
    testLead.id,
    "Client completed virtual walkthrough; interested in Tower 3 high-floor unit.",
    { id: salesA.id, role: UserRole.SALES, name: "Sales Rep" }
  );
  assert(
    noteResult.type === "NOTE" && noteResult.leadId === testLead.id,
    "addLeadNote: Successfully appends interaction note to lead activity stream"
  );

  // Empty note validation
  let emptyNoteThrew = false;
  try {
    await addLeadNote(clientA.id, testLead.id, "   ", {
      id: salesA.id,
      role: UserRole.SALES,
    });
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 400) {
      emptyNoteThrew = true;
    }
  }
  assert(emptyNoteThrew, "addLeadNote: Whitespace or empty note rejected with 400");

  // ---------------------------------------------------------------------------
  // TEST SUITE 7: LEAD 360 PROFILE & GROUND-TRUTH CONSISTENCY
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 7: Lead 360 Profile & Ground-Truth Consistency ---");

  const lead360 = await getLead360(clientA.id, testLead.id);
  assert(lead360.id === testLead.id, "getLead360: Returns exact lead profile");
  assert(
    lead360.activities.length >= 4,
    "getLead360: Timeline contains all historical activities (Creation, Transitions, Notes)"
  );
  assert(
    Array.isArray(lead360.siteVisits),
    "getLead360: Site visits collection returned as real array"
  );
  assert(
    Array.isArray(lead360.bookings),
    "getLead360: Bookings collection returned as real array"
  );
  assert(
    !("passwordHash" in (lead360 as unknown as Record<string, unknown>)),
    "getLead360: Data protection - zero sensitive credentials exposed in DTO"
  );

  // ---------------------------------------------------------------------------
  // TEST SUITE 8: BULK LEAD OPERATIONS
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST SUITE 8: Bulk Lead Operations ---");

  // Create two leads to test bulk reassign
  const bulkLead1 = await createLead(
    clientA.id,
    { firstName: "Bulk1", lastName: "Test", phone: "+919876543201" },
    { id: adminA.id, role: UserRole.ADMIN }
  );
  const bulkLead2 = await createLead(
    clientA.id,
    { firstName: "Bulk2", lastName: "Test", phone: "+919876543202" },
    { id: adminA.id, role: UserRole.ADMIN }
  );

  const bulkReassign = await executeBulkLeadAction(
    clientA.id,
    {
      action: "REASSIGN",
      leadIds: [bulkLead1.id, bulkLead2.id],
      assignedUserId: salesA.id,
      reason: "Bulk assignment batch",
    },
    { id: adminA.id, role: UserRole.ADMIN, name: "System Admin" }
  );
  assert(bulkReassign.count === 2, "executeBulkLeadAction: Successfully reassigns 2 leads in batch");

  // Verify leads in DB
  await withTenantTransaction(clientA.id, async (tx) => {
    const checkedLeads = await tx.lead.findMany({
      where: { id: { in: [bulkLead1.id, bulkLead2.id] } },
    });
    assert(
      checkedLeads.every((l) => l.assignedUserId === salesA.id),
      "executeBulkLeadAction: All target leads in DB updated to assignedUserId"
    );

    // Clean up test leads created during test
    await tx.leadActivity.deleteMany({
      where: { leadId: { in: [testLead.id, bulkLead1.id, bulkLead2.id] } },
    });
    await tx.auditLog.deleteMany({
      where: { entityId: { in: [testLead.id, bulkLead1.id, bulkLead2.id] } },
    });
    await tx.lead.deleteMany({
      where: { id: { in: [testLead.id, bulkLead1.id, bulkLead2.id] } },
    });
  });

  console.log("\n==========================================================");
  console.log(`PHASE 3 LEAD 360 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runLead360Tests()
  .catch((err) => {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
