/**
 * Qavon Desk - Database Seed Script for Prisma / PostgreSQL
 * Idempotently populates workspace, users with real bcrypt password hashes,
 * workspace memberships, companies, contacts, leads, deals, activities, and audit logs.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function runSeed() {
  console.log('Seeding Qavon Desk PostgreSQL database via Prisma...');

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Cloud Dynamics',
      slug: 'acme-corp',
      plan: 'Professional',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'sarah.jenkins@acme.io' },
    update: {},
    create: {
      email: 'sarah.jenkins@acme.io',
      name: 'Sarah Jenkins',
      role: 'OWNER',
      title: 'VP of Global Sales',
      passwordHash,
      avatar: '',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'david.vance@acme.io' },
    update: {},
    create: {
      email: 'david.vance@acme.io',
      name: 'David Vance',
      role: 'ADMIN',
      title: 'Sales Operations Lead',
      passwordHash,
      avatar: '',
    },
  });

  const salesRep = await prisma.user.upsert({
    where: { email: 'elena.rostova@acme.io' },
    update: {},
    create: {
      email: 'elena.rostova@acme.io',
      name: 'Elena Rostova',
      role: 'SALES_REP',
      title: 'Senior Account Executive',
      passwordHash,
      avatar: '',
    },
  });

  for (const member of [
    { userId: owner.id, role: 'OWNER' as const },
    { userId: admin.id, role: 'ADMIN' as const },
    { userId: salesRep.id, role: 'SALES_REP' as const },
  ]) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: member.userId,
        },
      },
      update: { role: member.role },
      create: {
        workspaceId: workspace.id,
        userId: member.userId,
        role: member.role,
      },
    });
  }

  const existingCompanyCount = await prisma.company.count({
    where: { workspaceId: workspace.id },
  });

  if (existingCompanyCount === 0) {
    const company1 = await prisma.company.create({
      data: {
        workspaceId: workspace.id,
        name: 'CloudScale Analytics',
        industry: 'Enterprise Software',
        website: 'https://cloudscale.io',
        email: 'contact@cloudscale.io',
        phone: '+1 (415) 890-2341',
        size: '250-500 employees',
        ownerId: owner.id,
        address: '500 Howard St, San Francisco, CA',
        notes: 'Series C cloud infrastructure observability provider.',
      },
    });

    const company2 = await prisma.company.create({
      data: {
        workspaceId: workspace.id,
        name: 'Apex FinTech Systems',
        industry: 'Financial Services',
        website: 'https://apexfintech.com',
        email: 'procurement@apexfintech.com',
        phone: '+1 (212) 555-0198',
        size: '100-250 employees',
        ownerId: salesRep.id,
        address: '140 Broadway, New York, NY',
        notes: 'High-frequency trading middleware and portfolio compliance engines.',
      },
    });

    const contact1 = await prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        companyId: company1.id,
        firstName: 'Marcus',
        lastName: 'Chen',
        email: 'marcus.chen@cloudscale.io',
        phone: '+1 (415) 890-2342',
        jobTitle: 'Chief Technology Officer',
      },
    });

    const contact2 = await prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        companyId: company2.id,
        firstName: 'Jonathan',
        lastName: 'Sterling',
        email: 'jsterling@apexfintech.com',
        phone: '+1 (212) 555-0199',
        jobTitle: 'Head of Quantitative Infrastructure',
      },
    });

    const lead1 = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        fullName: 'Benjamin Hayes',
        email: 'b.hayes@vertexrobotics.ai',
        phone: '+1 (408) 555-0182',
        company: 'Vertex Robotics',
        jobTitle: 'Head of Autonomous Systems',
        source: 'Website',
        status: 'NEW',
        estimatedValue: 48000,
        assignedToId: salesRep.id,
        notes: 'Inbound demo request submitted through product comparison page.',
      },
    });

    const deal1 = await prisma.deal.create({
      data: {
        workspaceId: workspace.id,
        companyId: company1.id,
        contactId: contact1.id,
        title: 'Enterprise Pipeline Observability Expansion',
        value: 65000,
        stage: 'NEW_OPPORTUNITY',
        probability: 25,
        expectedCloseDate: new Date('2026-05-15'),
        ownerId: owner.id,
        priority: 'HIGH',
        description: 'Expansion of Qavon Desk telemetry across 240 internal developers.',
      },
    });

    await prisma.deal.create({
      data: {
        workspaceId: workspace.id,
        companyId: company2.id,
        contactId: contact2.id,
        title: 'Multi-Asset Trading CRM Migration',
        value: 110000,
        stage: 'QUALIFIED',
        probability: 45,
        expectedCloseDate: new Date('2026-04-30'),
        ownerId: salesRep.id,
        priority: 'HIGH',
        description: 'Replacement of legacy CRM with sub-second API sync.',
      },
    });

    await prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        type: 'CALL',
        title: 'Review MSA redlines with CloudScale legal counsel',
        description: 'Finalize indemnity cap before contract signature.',
        completed: false,
        dueDate: new Date(Date.now() + 2 * 86400000),
        assignedToId: owner.id,
        companyId: company1.id,
        dealId: deal1.id,
      },
    });

    await prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        type: 'FOLLOW_UP',
        title: 'Follow up with Benjamin Hayes at Vertex Robotics',
        description: 'Confirm sandbox API credentials were received.',
        completed: false,
        dueDate: new Date(Date.now() - 86400000),
        assignedToId: salesRep.id,
        leadId: lead1.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: owner.id,
        action: 'WORKSPACE_SEEDED',
        entityType: 'WORKSPACE',
        entityId: workspace.id,
        details: `Initialized workspace "${workspace.name}" with sample B2B pipeline data`,
      },
    });
  }

  console.log(`Seeded workspace: ${workspace.name} with PostgreSQL models.`);
}

if (process.argv[1]?.includes('seed.ts')) {
  runSeed()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
