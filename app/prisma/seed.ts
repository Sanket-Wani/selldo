import { UserRole } from "@prisma/client";
import * as argon2 from "@node-rs/argon2";
import { db } from "../src/lib/db";

async function hashPw(password: string): Promise<string> {
  return argon2.hash(password, {
    memoryCost: 65536,
    timeCost: 3,
    outputLen: 32,
    parallelism: 4,
    algorithm: 2, // Argon2id
  });
}

async function main() {
  console.log("Starting Sell.do seed script...");

  // 1. Create Tenant A: Prestige Estates
  const clientA = await db.client.upsert({
    where: { domain: "prestige.sell.do" },
    update: {},
    create: {
      name: "Prestige Estates",
      domain: "prestige.sell.do",
      currency: "INR",
    },
  });

  // 2. Create Tenant B: Sobha Developers (for cross-tenant testing)
  const clientB = await db.client.upsert({
    where: { domain: "sobha.sell.do" },
    update: {},
    create: {
      name: "Sobha Developers",
      domain: "sobha.sell.do",
      currency: "INR",
    },
  });

  // 3. Teams in Tenant A
  const teamPresales = await db.team.create({
    data: {
      clientId: clientA.id,
      name: "Pre-Sales Inbound",
      department: "Pre-Sales",
    },
  });

  const teamSales = await db.team.create({
    data: {
      clientId: clientA.id,
      name: "Direct Sales",
      department: "Sales",
    },
  });

  // 4. Default Password
  const passwordHash = await hashPw("Password@123");

  // 5. Users in Tenant A
  const adminA = await db.user.upsert({
    where: {
      clientId_email: { clientId: clientA.id, email: "admin@prestige.sell.do" },
    },
    update: { passwordHash },
    create: {
      clientId: clientA.id,
      email: "admin@prestige.sell.do",
      passwordHash,
      firstName: "Rajesh",
      lastName: "Menon",
      role: UserRole.ADMIN,
    },
  });

  const managerA = await db.user.upsert({
    where: {
      clientId_email: { clientId: clientA.id, email: "manager@prestige.sell.do" },
    },
    update: { passwordHash },
    create: {
      clientId: clientA.id,
      email: "manager@prestige.sell.do",
      passwordHash,
      firstName: "Anita",
      lastName: "Deshmukh",
      role: UserRole.MANAGER,
    },
  });

  const presalesA = await db.user.upsert({
    where: {
      clientId_email: { clientId: clientA.id, email: "presales@prestige.sell.do" },
    },
    update: { passwordHash },
    create: {
      clientId: clientA.id,
      email: "presales@prestige.sell.do",
      passwordHash,
      firstName: "Karan",
      lastName: "Sharma",
      role: UserRole.PRE_SALES,
      teamId: teamPresales.id,
    },
  });

  const salesA = await db.user.upsert({
    where: {
      clientId_email: { clientId: clientA.id, email: "sales@prestige.sell.do" },
    },
    update: { passwordHash },
    create: {
      clientId: clientA.id,
      email: "sales@prestige.sell.do",
      passwordHash,
      firstName: "Vikram",
      lastName: "Singhania",
      role: UserRole.SALES,
      teamId: teamSales.id,
    },
  });

  // 6. Users in Tenant B
  const adminB = await db.user.upsert({
    where: {
      clientId_email: { clientId: clientB.id, email: "admin@sobha.sell.do" },
    },
    update: { passwordHash },
    create: {
      clientId: clientB.id,
      email: "admin@sobha.sell.do",
      passwordHash,
      firstName: "Priya",
      lastName: "Iyer",
      role: UserRole.ADMIN,
    },
  });

  // 7. Projects
  const projectA = await db.project.upsert({
    where: {
      clientId_code: { clientId: clientA.id, code: "PFC-01" },
    },
    update: {},
    create: {
      clientId: clientA.id,
      name: "Prestige Falcon City",
      code: "PFC-01",
      reraId: "PRM/KA/RERA/1251/310/PR/170915/000244",
      location: "Kanakapura Road, Bangalore",
    },
  });

  const projectB = await db.project.upsert({
    where: {
      clientId_code: { clientId: clientB.id, code: "SDA-01" },
    },
    update: {},
    create: {
      clientId: clientB.id,
      name: "Sobha Dream Acres",
      code: "SDA-01",
      reraId: "PRM/KA/RERA/1251/310/PR/170916/000311",
      location: "Panathur, Bangalore",
    },
  });

  // 8. Sample Leads for Tenant A
  await db.lead.upsert({
    where: {
      clientId_crmId: { clientId: clientA.id, crmId: "LD-10001" },
    },
    update: {},
    create: {
      clientId: clientA.id,
      crmId: "LD-10001",
      firstName: "Amitabh",
      lastName: "Sen",
      email: "amitabh.sen@example.com",
      phone: "+91 98201 12345",
      stage: "PROSPECT",
      assignedUserId: presalesA.id,
      teamId: teamPresales.id,
      projectId: projectA.id,
      source: "Google Ads",
      propertyType: "3 BHK",
      budgetMin: 12000000,
      budgetMax: 15000000,
    },
  });

  // 9. Sample Leads for Tenant B
  await db.lead.upsert({
    where: {
      clientId_crmId: { clientId: clientB.id, crmId: "LD-20001" },
    },
    update: {},
    create: {
      clientId: clientB.id,
      crmId: "LD-20001",
      firstName: "Rohan",
      lastName: "Mehta",
      email: "rohan.mehta@example.com",
      phone: "+91 98765 43210",
      stage: "INCOMING",
      assignedUserId: adminB.id,
      projectId: projectB.id,
      source: "Direct Walk-in",
      propertyType: "2 BHK",
      budgetMin: 8000000,
      budgetMax: 9500000,
    },
  });

  console.log("Seed completed successfully!");
  console.log("Tenant A: Prestige Estates (admin@prestige.sell.do / Password@123)");
  console.log("Tenant B: Sobha Developers (admin@sobha.sell.do / Password@123)");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
