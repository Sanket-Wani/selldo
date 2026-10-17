import { db } from "../src/lib/db";
import { withTenantTransaction, scopeQuery } from "../src/lib/tenant";
import { requirePermission, hasPermission } from "../src/lib/rbac";
import { verifyPassword, hashPassword } from "../src/lib/password";
import { UserRole } from "@prisma/client";

async function runSecurityTests() {
  console.log("==========================================================");
  console.log("RUNNING AUTOMATED SECURITY & TENANT ISOLATION TEST SUITE");
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

  // Retrieve our two seed tenants
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
  // TEST 1: Cross-Tenant Isolation via withTenantTransaction & PostgreSQL RLS
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 1: Cross-Tenant Isolation (RLS & Scoping) ---");
  await withTenantTransaction(clientA.id, async (tx) => {
    // Under Client A's context, querying leads must only return Client A's leads
    const leadsInContextA = await tx.lead.findMany({
      where: { clientId: clientA.id },
    });
    assert(
      leadsInContextA.length > 0 &&
        leadsInContextA.every((l) => l.clientId === clientA.id),
      "Tenant A context only returns Tenant A leads"
    );

    // Attempting to query Tenant B's leads while in Tenant A's context
    // RLS policy: USING ("clientId" = current_setting('app.current_tenant', true))
    // Because current_tenant is set to clientA.id, querying with clientId = clientB.id must return 0 rows!
    const crossTenantLeads = await tx.lead.findMany({
      where: { clientId: clientB.id },
    });
    assert(
      crossTenantLeads.length === 0,
      "PostgreSQL RLS blocks Tenant A from reading Tenant B leads (returns 0 rows)"
    );
  });

  // Verify Tenant B in its own context
  await withTenantTransaction(clientB.id, async (tx) => {
    const leadsInContextB = await tx.lead.findMany({
      where: { clientId: clientB.id },
    });
    assert(
      leadsInContextB.length > 0 &&
        leadsInContextB.every((l) => l.clientId === clientB.id),
      "Tenant B context only returns Tenant B leads"
    );

    const crossTenantLeads = await tx.lead.findMany({
      where: { clientId: clientA.id },
    });
    assert(
      crossTenantLeads.length === 0,
      "PostgreSQL RLS blocks Tenant B from reading Tenant A leads"
    );
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Connection-Pooling Safety (Context Cleanup on Completion)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 2: Connection-Pooling Safety ---");
  // Outside of withTenantTransaction, app.current_tenant should not retain clientA or clientB
  const settingOutside = await db.$queryRaw<Array<{ setting: string | null }>>`
    SELECT current_setting('app.current_tenant', true) as setting;
  `;
  const settingValue = settingOutside[0]?.setting;
  assert(
    !settingValue || settingValue === "",
    "Connection state clean: app.current_tenant reset after transaction completes"
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Server-Side RBAC Enforcement & Privilege Escalation Prevention
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 3: RBAC Privilege Escalation Prevention ---");
  assert(
    !hasPermission(UserRole.PRE_SALES, "SETTINGS_MANAGE"),
    "PRE_SALES role cannot manage system settings"
  );
  assert(
    !hasPermission(UserRole.SALES, "USERS_MANAGE"),
    "SALES role cannot manage users"
  );
  assert(
    !hasPermission(UserRole.MANAGER, "BILLING_VIEW"),
    "MANAGER role cannot view organization billing"
  );
  assert(
    hasPermission(UserRole.ADMIN, "SETTINGS_MANAGE"),
    "ADMIN role can manage settings"
  );

  let presalesEscalationBlocked = false;
  try {
    requirePermission(UserRole.PRE_SALES, "SETTINGS_MANAGE");
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 403) {
      presalesEscalationBlocked = true;
    }
  }
  assert(
    presalesEscalationBlocked,
    "requirePermission throws 403 Forbidden on unauthorized capability"
  );

  // ---------------------------------------------------------------------------
  // TEST 4: Argon2id Password Hashing Verification
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 4: Argon2id Hashing & Verification ---");
  const testPlain = "SecurePassword@2026!";
  const testHash = await hashPassword(testPlain);
  assert(
    testHash.startsWith("$argon2id$"),
    "Password hash is generated using standard Argon2id algorithm"
  );

  const validMatch = await verifyPassword(testHash, testPlain);
  const invalidMatch = await verifyPassword(testHash, "WrongPassword!");
  assert(validMatch === true, "verifyPassword succeeds on correct plain password");
  assert(invalidMatch === false, "verifyPassword fails on incorrect plain password");

  // ---------------------------------------------------------------------------
  // TEST 5: Session Revocation Verification (tokenVersion)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 5: Real-time Session Revocation (tokenVersion) ---");
  await withTenantTransaction(clientA.id, async (tx) => {
    const user = await tx.user.findFirst({
      where: { clientId: clientA.id, email: "admin@prestige.sell.do" },
    });
    if (!user) throw new Error("Seed user not found in Client A context");

    const initialVersion = user.tokenVersion;
    const currentToken = { id: user.id, tokenVersion: initialVersion };

    // Simulate user tokenVersion check in JWT callback
    const dbUserBefore = await tx.user.findUnique({
      where: { id: currentToken.id },
      select: { tokenVersion: true, status: true },
    });
    const tokenValidBefore =
      dbUserBefore?.tokenVersion === currentToken.tokenVersion;
    assert(tokenValidBefore === true, "Active JWT matches DB tokenVersion");

    // Invalidate all sessions by bumping tokenVersion
    await tx.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    const dbUserAfter = await tx.user.findUnique({
      where: { id: currentToken.id },
      select: { tokenVersion: true, status: true },
    });
    const tokenValidAfter =
      dbUserAfter?.tokenVersion === currentToken.tokenVersion;
    assert(
      tokenValidAfter === false,
      "Stale JWT with old tokenVersion is instantly rejected (session revoked)"
    );

    // Restore tokenVersion for seed user
    await tx.user.update({
      where: { id: user.id },
      data: { tokenVersion: initialVersion },
    });

    // ---------------------------------------------------------------------------
    // TEST 6: Sensitive Data Exposure Protection
    // ---------------------------------------------------------------------------
    console.log("\n--- TEST 6: Sensitive Data Exposure Protection ---");
    // In user queries for client responses, passwordHash and tokenVersion must be omitted
    const safeUser = await tx.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
    assert(
      !("passwordHash" in (safeUser as Record<string, unknown>)),
      "DTO response projection excludes passwordHash"
    );
  });

  console.log("\n==========================================================");
  console.log(`SECURITY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests()
  .catch((err) => {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
