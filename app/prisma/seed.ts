import { UserRole, LeadStage, BookingStatus, UnitStatus } from "@prisma/client";
import * as argon2 from "@node-rs/argon2";
import { db } from "../src/lib/db";
import { withTenantTransaction } from "../src/lib/tenant";

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
  console.log("Seeding Sell.do database with rich multi-tenant synthetic data...");

  // 1. Tenants (Clients table has no RLS as it is the registry)
  const clientA = await db.client.upsert({
    where: { domain: "prestige.sell.do" },
    update: {},
    create: {
      name: "Prestige Estates",
      domain: "prestige.sell.do",
      currency: "INR",
    },
  });

  const clientB = await db.client.upsert({
    where: { domain: "sobha.sell.do" },
    update: {},
    create: {
      name: "Sobha Developers",
      domain: "sobha.sell.do",
      currency: "INR",
    },
  });

  const passwordHash = await hashPw("Password@123");
  const now = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // =========================================================================
  // TENANT A: PRESTIGE ESTATES (Scoped with withTenantTransaction)
  // =========================================================================
  await withTenantTransaction(clientA.id, async (tx) => {
    console.log("Seeding Tenant A (Prestige Estates) within RLS context...");

    // Teams
    const teamPresales = await tx.team.upsert({
      where: { id: "team-presales-a" },
      update: {},
      create: {
        id: "team-presales-a",
        clientId: clientA.id,
        name: "Pre-Sales Inbound",
        department: "Pre-Sales",
      },
    });

    const teamSales = await tx.team.upsert({
      where: { id: "team-sales-a" },
      update: {},
      create: {
        id: "team-sales-a",
        clientId: clientA.id,
        name: "Direct Sales",
        department: "Sales",
      },
    });

    // Users
    await tx.user.upsert({
      where: { clientId_email: { clientId: clientA.id, email: "admin@prestige.sell.do" } },
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

    await tx.user.upsert({
      where: { clientId_email: { clientId: clientA.id, email: "manager@prestige.sell.do" } },
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

    const presalesA = await tx.user.upsert({
      where: { clientId_email: { clientId: clientA.id, email: "presales@prestige.sell.do" } },
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

    await tx.user.upsert({
      where: { clientId_email: { clientId: clientA.id, email: "sales@prestige.sell.do" } },
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

    // Projects
    const projectA1 = await tx.project.upsert({
      where: { clientId_code: { clientId: clientA.id, code: "PFC-01" } },
      update: {},
      create: {
        clientId: clientA.id,
        name: "Prestige Falcon City",
        code: "PFC-01",
        reraId: "PRM/KA/RERA/1251/310/PR/170915/000244",
        location: "Kanakapura Road, Bangalore",
      },
    });

    const projectA2 = await tx.project.upsert({
      where: { clientId_code: { clientId: clientA.id, code: "PLH-02" } },
      update: {},
      create: {
        clientId: clientA.id,
        name: "Prestige Lakeside Habitat",
        code: "PLH-02",
        reraId: "PRM/KA/RERA/1251/310/PR/170918/000492",
        location: "Varthur, Whitefield",
      },
    });

    // Towers & Units
    const towerA = await tx.tower.upsert({
      where: { id: "tower-a-pfc" },
      update: {},
      create: {
        id: "tower-a-pfc",
        clientId: clientA.id,
        projectId: projectA1.id,
        name: "Tower 1",
        floorsCount: 24,
      },
    });

    const unitA1 = await tx.projectUnit.upsert({
      where: { clientId_projectId_unitNumber: { clientId: clientA.id, projectId: projectA1.id, unitNumber: "101" } },
      update: {},
      create: {
        clientId: clientA.id,
        projectId: projectA1.id,
        towerId: towerA.id,
        unitNumber: "101",
        floor: 1,
        configuration: "2 BHK",
        superBuiltUpArea: 1250,
        carpetArea: 950,
        basePrice: 11500000,
        status: UnitStatus.BOOKED,
      },
    });

    const unitA2 = await tx.projectUnit.upsert({
      where: { clientId_projectId_unitNumber: { clientId: clientA.id, projectId: projectA1.id, unitNumber: "502" } },
      update: {},
      create: {
        clientId: clientA.id,
        projectId: projectA1.id,
        towerId: towerA.id,
        unitNumber: "502",
        floor: 5,
        configuration: "3 BHK",
        superBuiltUpArea: 1680,
        carpetArea: 1320,
        basePrice: 16500000,
        status: UnitStatus.BOOKED,
      },
    });

    await tx.projectUnit.upsert({
      where: { clientId_projectId_unitNumber: { clientId: clientA.id, projectId: projectA1.id, unitNumber: "804" } },
      update: {},
      create: {
        clientId: clientA.id,
        projectId: projectA1.id,
        towerId: towerA.id,
        unitNumber: "804",
        floor: 8,
        configuration: "3 BHK",
        superBuiltUpArea: 1720,
        carpetArea: 1350,
        basePrice: 17200000,
        status: UnitStatus.AVAILABLE,
      },
    });

    // Campaigns
    await tx.campaign.upsert({
      where: { id: "camp-google-a" },
      update: {},
      create: {
        id: "camp-google-a",
        clientId: clientA.id,
        name: "Google Search High Intent",
        source: "Google Ads",
        budget: 500000,
        spend: 235000,
        status: "Active",
      },
    });

    await tx.campaign.upsert({
      where: { id: "camp-meta-a" },
      update: {},
      create: {
        id: "camp-meta-a",
        clientId: clientA.id,
        name: "Meta Retargeting Campaign",
        source: "Meta Ads",
        budget: 350000,
        spend: 180000,
        status: "Active",
      },
    });

    // Synthetic Leads for Tenant A
    const leadSeeds = [
      // Today (0 days ago)
      { daysAgo: 0, crmId: "LD-10101", name: "Rahul Sharma", email: "rahul.s@example.com", phone: "+91 98201 11001", stage: LeadStage.INCOMING, source: "Google Ads", proj: projectA1.id },
      { daysAgo: 0, crmId: "LD-10102", name: "Pooja Hegde", email: "pooja.h@example.com", phone: "+91 98201 11002", stage: LeadStage.INCOMING, source: "Meta Ads", proj: projectA1.id },
      { daysAgo: 0, crmId: "LD-10103", name: "Devendra Verma", email: "devendra.v@example.com", phone: "+91 98201 11003", stage: LeadStage.PROSPECT, source: "Direct Walk-in", proj: projectA2.id },
      // Past 3 days
      { daysAgo: 1, crmId: "LD-10104", name: "Kavita Rao", email: "kavita.r@example.com", phone: "+91 98201 11004", stage: LeadStage.PROSPECT, source: "Google Ads", proj: projectA1.id },
      { daysAgo: 2, crmId: "LD-10105", name: "Sunil Narang", email: "sunil.n@example.com", phone: "+91 98201 11005", stage: LeadStage.OPPORTUNITY, source: "Channel Partner", proj: projectA1.id },
      { daysAgo: 2, crmId: "LD-10106", name: "Alok Mukherjee", email: "alok.m@example.com", phone: "+91 98201 11006", stage: LeadStage.INCOMING, source: "Meta Ads", proj: projectA2.id },
      { daysAgo: 3, crmId: "LD-10107", name: "Meera Nair", email: "meera.n@example.com", phone: "+91 98201 11007", stage: LeadStage.OPPORTUNITY, source: "Google Ads", proj: projectA1.id },
      // Past 7 days
      { daysAgo: 4, crmId: "LD-10108", name: "Siddharth Das", email: "siddharth.d@example.com", phone: "+91 98201 11008", stage: LeadStage.PROSPECT, source: "Referral", proj: projectA2.id },
      { daysAgo: 5, crmId: "LD-10109", name: "Nisha Patel", email: "nisha.p@example.com", phone: "+91 98201 11009", stage: LeadStage.BOOKED, source: "Channel Partner", proj: projectA1.id },
      { daysAgo: 6, crmId: "LD-10110", name: "Arjun Reddy", email: "arjun.r@example.com", phone: "+91 98201 11010", stage: LeadStage.UNQUALIFIED, source: "Meta Ads", proj: projectA1.id },
      { daysAgo: 7, crmId: "LD-10111", name: "Deepak Chopra", email: "deepak.c@example.com", phone: "+91 98201 11011", stage: LeadStage.OPPORTUNITY, source: "Google Ads", proj: projectA2.id },
      // Past 14 days
      { daysAgo: 9, crmId: "LD-10112", name: "Sneha Kulkarni", email: "sneha.k@example.com", phone: "+91 98201 11012", stage: LeadStage.PROSPECT, source: "Direct Walk-in", proj: projectA1.id },
      { daysAgo: 11, crmId: "LD-10113", name: "Manoj Bajpayee", email: "manoj.b@example.com", phone: "+91 98201 11013", stage: LeadStage.BOOKED, source: "Google Ads", proj: projectA1.id },
      { daysAgo: 13, crmId: "LD-10114", name: "Tanvi Shah", email: "tanvi.s@example.com", phone: "+91 98201 11014", stage: LeadStage.LOST, source: "Meta Ads", proj: projectA2.id },
      // Past 21 days
      { daysAgo: 16, crmId: "LD-10115", name: "Gaurav Kapur", email: "gaurav.k@example.com", phone: "+91 98201 11015", stage: LeadStage.PROSPECT, source: "Google Ads", proj: projectA1.id },
      { daysAgo: 18, crmId: "LD-10116", name: "Harish Pillai", email: "harish.p@example.com", phone: "+91 98201 11016", stage: LeadStage.OPPORTUNITY, source: "Channel Partner", proj: projectA2.id },
      { daysAgo: 20, crmId: "LD-10117", name: "Richa Chadha", email: "richa.c@example.com", phone: "+91 98201 11017", stage: LeadStage.UNQUALIFIED, source: "Direct Walk-in", proj: projectA1.id },
      // Past 28 days
      { daysAgo: 24, crmId: "LD-10118", name: "Anand Rathi", email: "anand.r@example.com", phone: "+91 98201 11018", stage: LeadStage.PROSPECT, source: "Google Ads", proj: projectA1.id },
      { daysAgo: 27, crmId: "LD-10119", name: "Farhan Akhtar", email: "farhan.a@example.com", phone: "+91 98201 11019", stage: LeadStage.OPPORTUNITY, source: "Referral", proj: projectA2.id },
      { daysAgo: 29, crmId: "LD-10120", name: "Ramesh Sippy", email: "ramesh.s@example.com", phone: "+91 98201 11020", stage: LeadStage.LOST, source: "Meta Ads", proj: projectA1.id },
      // Historical (>30 days ago)
      { daysAgo: 35, crmId: "LD-10121", name: "Shabana Azmi", email: "shabana.a@example.com", phone: "+91 98201 11021", stage: LeadStage.BOOKED, source: "Google Ads", proj: projectA1.id },
      { daysAgo: 40, crmId: "LD-10122", name: "Javed Akhtar", email: "javed.a@example.com", phone: "+91 98201 11022", stage: LeadStage.PROSPECT, source: "Direct Walk-in", proj: projectA2.id },
      { daysAgo: 45, crmId: "LD-10123", name: "Zoya Akhtar", email: "zoya.a@example.com", phone: "+91 98201 11023", stage: LeadStage.OPPORTUNITY, source: "Channel Partner", proj: projectA1.id },
    ];

    for (const s of leadSeeds) {
      const createdDate = new Date(now.getTime() - s.daysAgo * DAY_MS);
      const [firstName, ...lastParts] = s.name.split(" ");
      const lastName = lastParts.join(" ") || "Doe";

      const lead = await tx.lead.upsert({
        where: { clientId_crmId: { clientId: clientA.id, crmId: s.crmId } },
        update: {
          stage: s.stage,
          createdAt: createdDate,
        },
        create: {
          clientId: clientA.id,
          crmId: s.crmId,
          firstName,
          lastName,
          email: s.email,
          phone: s.phone,
          stage: s.stage,
          source: s.source,
          projectId: s.proj,
          assignedUserId: presalesA.id,
          teamId: teamPresales.id,
          createdAt: createdDate,
          updatedAt: createdDate,
        },
      });

      // Site visits
      if (s.stage === LeadStage.OPPORTUNITY || s.stage === LeadStage.BOOKED) {
        await tx.siteVisit.upsert({
          where: { id: `sv-${s.crmId}` },
          update: {},
          create: {
            id: `sv-${s.crmId}`,
            clientId: clientA.id,
            leadId: lead.id,
            projectId: s.proj,
            scheduledStartTime: new Date(createdDate.getTime() + 2 * DAY_MS),
            scheduledEndTime: new Date(createdDate.getTime() + 2 * DAY_MS + 3600000),
            conductedAt: s.stage === LeadStage.BOOKED ? new Date(createdDate.getTime() + 2 * DAY_MS) : null,
            status: s.stage === LeadStage.BOOKED ? "CONDUCTED" : "SCHEDULED",
            feedbackRating: s.stage === LeadStage.BOOKED ? 5 : 4,
            createdAt: createdDate,
          },
        });
      }

      // Followups
      if (s.stage === LeadStage.PROSPECT || s.stage === LeadStage.OPPORTUNITY) {
        const isPast = s.daysAgo > 5;
        await tx.followup.upsert({
          where: { id: `fu-${s.crmId}` },
          update: {},
          create: {
            id: `fu-${s.crmId}`,
            clientId: clientA.id,
            leadId: lead.id,
            userId: presalesA.id,
            scheduledAt: isPast ? new Date(createdDate.getTime() + 1 * DAY_MS) : new Date(now.getTime() + 1 * DAY_MS),
            status: isPast ? "OVERDUE" : "PENDING",
            notes: "Follow up on brochure and pricing discussion",
            createdAt: createdDate,
          },
        });
      }
    }

    // Bookings
    const bookedLead1 = await tx.lead.findFirst({ where: { clientId: clientA.id, crmId: "LD-10109" } });
    if (bookedLead1) {
      await tx.booking.upsert({
        where: { clientId_bookingId: { clientId: clientA.id, bookingId: "BK-1001" } },
        update: {},
        create: {
          clientId: clientA.id,
          bookingId: "BK-1001",
          leadId: bookedLead1.id,
          projectId: projectA1.id,
          unitId: unitA1.id,
          applicantName: "Nisha Patel",
          agreementValue: 12500000,
          bookingAmount: 500000,
          status: BookingStatus.CONFIRMED,
          createdAt: new Date(now.getTime() - 5 * DAY_MS),
        },
      });
    }

    const bookedLead2 = await tx.lead.findFirst({ where: { clientId: clientA.id, crmId: "LD-10113" } });
    if (bookedLead2) {
      await tx.booking.upsert({
        where: { clientId_bookingId: { clientId: clientA.id, bookingId: "BK-1002" } },
        update: {},
        create: {
          clientId: clientA.id,
          bookingId: "BK-1002",
          leadId: bookedLead2.id,
          projectId: projectA1.id,
          unitId: unitA2.id,
          applicantName: "Manoj Bajpayee",
          agreementValue: 17500000,
          bookingAmount: 1000000,
          status: BookingStatus.CONFIRMED,
          createdAt: new Date(now.getTime() - 11 * DAY_MS),
        },
      });
    }
  });

  // =========================================================================
  // TENANT B: SOBHA DEVELOPERS (Scoped with withTenantTransaction)
  // =========================================================================
  await withTenantTransaction(clientB.id, async (tx) => {
    console.log("Seeding Tenant B (Sobha Developers) within RLS context...");

    const adminB = await tx.user.upsert({
      where: { clientId_email: { clientId: clientB.id, email: "admin@sobha.sell.do" } },
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

    const projectB1 = await tx.project.upsert({
      where: { clientId_code: { clientId: clientB.id, code: "SDA-01" } },
      update: {},
      create: {
        clientId: clientB.id,
        name: "Sobha Dream Acres",
        code: "SDA-01",
        reraId: "PRM/KA/RERA/1251/310/PR/170916/000311",
        location: "Panathur, Bangalore",
      },
    });

    await tx.lead.upsert({
      where: { clientId_crmId: { clientId: clientB.id, crmId: "LD-20101" } },
      update: {},
      create: {
        clientId: clientB.id,
        crmId: "LD-20101",
        firstName: "Rohan",
        lastName: "Mehta",
        email: "rohan.mehta@example.com",
        phone: "+91 98765 43210",
        stage: LeadStage.INCOMING,
        assignedUserId: adminB.id,
        projectId: projectB1.id,
        source: "Direct Walk-in",
        createdAt: new Date(now.getTime() - 2 * DAY_MS),
      },
    });

    await tx.lead.upsert({
      where: { clientId_crmId: { clientId: clientB.id, crmId: "LD-20102" } },
      update: {},
      create: {
        clientId: clientB.id,
        crmId: "LD-20102",
        firstName: "Aakash",
        lastName: "Bansal",
        email: "aakash.b@example.com",
        phone: "+91 98765 43211",
        stage: LeadStage.OPPORTUNITY,
        assignedUserId: adminB.id,
        projectId: projectB1.id,
        source: "Google Ads",
        createdAt: new Date(now.getTime() - 10 * DAY_MS),
      },
    });
  });

  console.log("All tenant synthetic data seeded successfully within RLS boundaries!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
