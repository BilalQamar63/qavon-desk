import { prisma } from './prisma.ts';
import type {
  Activity,
  AnalyticsData,
  AuditLog,
  Company,
  Contact,
  DashboardSummary,
  Deal,
  DealPriority,
  DealStage,
  Lead,
  LeadSource,
  LeadStatus,
  User,
  UserRole,
  Workspace,
} from '../../types/crm.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(val: string | undefined | null): val is string {
  return Boolean(val && UUID_REGEX.test(val));
}

function createHttpError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

function mapUser(u: {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  title: string | null;
  createdAt: Date;
}, workspaceId: string): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserRole,
    avatar: u.avatar || '',
    title: u.title || 'Sales Representative',
    workspaceId,
    createdAt: u.createdAt.toISOString(),
  };
}

function mapWorkspace(w: {
  id: string;
  name: string;
  slug: string;
  plan: string;
  currency: string;
  timezone: string;
  createdAt: Date;
}): Workspace {
  return {
    id: w.id,
    name: w.name,
    slug: w.slug,
    plan: (w.plan as Workspace['plan']) || 'Professional',
    currency: w.currency,
    timezone: w.timezone,
    createdAt: w.createdAt.toISOString(),
  };
}

function mapLead(l: any): Lead {
  return {
    id: l.id,
    workspaceId: l.workspaceId,
    fullName: l.fullName,
    email: l.email,
    phone: l.phone || '',
    company: l.company,
    jobTitle: l.jobTitle || '',
    source: (l.source as LeadSource) || 'Website',
    status: l.status as LeadStatus,
    assignedToId: l.assignedToId,
    notes: l.notes || '',
    estimatedValue: Number(l.estimatedValue ?? 0),
    convertedToDealId: l.convertedToDealId || undefined,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

function mapCompany(c: any): Company {
  return {
    id: c.id,
    workspaceId: c.workspaceId,
    name: c.name,
    industry: c.industry,
    website: c.website || '',
    email: c.email || '',
    phone: c.phone || '',
    size: c.size,
    ownerId: c.ownerId,
    address: c.address || '',
    notes: c.notes || '',
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function mapContact(c: any): Contact {
  return {
    id: c.id,
    workspaceId: c.workspaceId,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone || '',
    companyId: c.companyId,
    jobTitle: c.jobTitle || '',
    notes: c.notes || '',
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function mapDeal(d: any): Deal {
  return {
    id: d.id,
    workspaceId: d.workspaceId,
    title: d.title,
    companyId: d.companyId,
    contactId: d.contactId || undefined,
    value: Number(d.value ?? 0),
    stage: d.stage as DealStage,
    probability: d.probability,
    expectedCloseDate: d.expectedCloseDate.toISOString().split('T')[0],
    ownerId: d.ownerId,
    priority: d.priority as DealPriority,
    description: d.description || '',
    order: d.order,
    lastActivityAt: d.lastActivityAt.toISOString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

function mapActivity(a: any): Activity {
  return {
    id: a.id,
    workspaceId: a.workspaceId,
    type: a.type,
    title: a.title,
    description: a.description || '',
    completed: a.completed,
    dueDate: a.dueDate.toISOString(),
    assignedToId: a.assignedToId,
    leadId: a.leadId || undefined,
    contactId: a.contactId || undefined,
    dealId: a.dealId || undefined,
    companyId: a.companyId || undefined,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export class PrismaRepository {
  private async assertMemberInWorkspace(userId: string, workspaceId: string) {
    if (!isUuid(userId) || !isUuid(workspaceId)) {
      throw createHttpError('Assigned user does not belong to this workspace', 400);
    }
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) {
      throw createHttpError('Assigned user does not belong to this workspace', 400);
    }
  }

  private async logAudit(entry: {
    workspaceId: string;
    userId: string;
    action: string;
    entityType: AuditLog['entityType'];
    entityId: string;
    details: string;
  }) {
    await prisma.auditLog.create({
      data: {
        workspaceId: entry.workspaceId,
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details,
      },
    });
  }

  async findUserWithPasswordByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { memberships: { take: 1, orderBy: { joinedAt: 'asc' } } },
    });
    if (!user || user.memberships.length === 0) return null;
    const membership = user.memberships[0];
    return {
      ...mapUser({ ...user, role: membership.role }, membership.workspaceId),
      passwordHash: user.passwordHash,
    };
  }

  async findUserById(id: string): Promise<User | null> {
    if (!isUuid(id)) return null;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { memberships: { take: 1, orderBy: { joinedAt: 'asc' } } },
    });
    if (!user || user.memberships.length === 0) return null;
    const membership = user.memberships[0];
    return mapUser({ ...user, role: membership.role }, membership.workspaceId);
  }

  async findUserByIdOrEmail(identifier: string): Promise<User | null> {
    const clean = identifier.trim().toLowerCase();
    const demoAliasMap: Record<string, string> = {
      'usr-1': 'sarah.jenkins@acme.io',
      'usr-2': 'david.vance@acme.io',
      'usr-3': 'elena.rostova@acme.io',
    };
    const resolvedEmail = demoAliasMap[clean] || (clean.includes('@') ? clean : undefined);

    if (resolvedEmail) {
      const user = await prisma.user.findUnique({
        where: { email: resolvedEmail },
        include: { memberships: { take: 1, orderBy: { joinedAt: 'asc' } } },
      });
      if (!user || user.memberships.length === 0) return null;
      return mapUser({ ...user, role: user.memberships[0].role }, user.memberships[0].workspaceId);
    }

    return this.findUserById(identifier);
  }

  async getUsers(workspaceId: string): Promise<User[]> {
    if (!isUuid(workspaceId)) return [];
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map((m) => mapUser({ ...m.user, role: m.role }, workspaceId));
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    if (!isUuid(id)) return null;
    const ws = await prisma.workspace.findUnique({ where: { id } });
    return ws ? mapWorkspace(ws) : null;
  }

  async createUser(userData: {
    email: string;
    passwordHash: string;
    name: string;
    role: UserRole;
    title: string;
    workspaceId: string;
  }): Promise<User> {
    const email = userData.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw createHttpError('A user with this email already exists', 409);
    }

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: userData.passwordHash,
          name: userData.name.trim(),
          role: userData.role,
          title: userData.title.trim() || 'Account Executive',
          avatar: '',
        },
      });
      await tx.workspaceMember.create({
        data: {
          workspaceId: userData.workspaceId,
          userId: user.id,
          role: userData.role,
        },
      });
      return user;
    });

    return mapUser(created, userData.workspaceId);
  }

  async createUserWithWorkspace(userData: {
    email: string;
    passwordHash: string;
    name: string;
    companyName?: string;
  }): Promise<{ user: User; workspace: Workspace }> {
    const email = userData.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw createHttpError('A user with this email already exists', 409);
    }

    const workspaceName = userData.companyName?.trim() || `${userData.name.trim()}'s Workspace`;
    const baseSlug =
      workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'workspace';
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug,
          plan: 'Professional',
          currency: 'USD',
          timezone: 'America/New_York',
        },
      });
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: userData.passwordHash,
          name: userData.name.trim(),
          role: 'OWNER',
          title: 'Workspace Owner',
          avatar: '',
        },
      });
      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId: user.id,
          role: 'OWNER',
        },
      });
      await tx.auditLog.create({
        data: {
          workspaceId: ws.id,
          userId: user.id,
          action: 'WORKSPACE_CREATED',
          entityType: 'WORKSPACE',
          entityId: ws.id,
          details: `Created workspace "${ws.name}"`,
        },
      });
      return { ws, user };
    });

    return {
      user: mapUser(result.user, result.ws.id),
      workspace: mapWorkspace(result.ws),
    };
  }

  // --- Leads ---
  async getLeads(workspaceId: string, options?: { search?: string; status?: string; source?: string }): Promise<Lead[]> {
    if (!isUuid(workspaceId)) return [];
    const leads = await prisma.lead.findMany({
      where: {
        workspaceId,
        ...(options?.status && options.status !== 'ALL' ? { status: options.status as LeadStatus } : {}),
        ...(options?.source && options.source !== 'ALL' ? { source: options.source } : {}),
        ...(options?.search
          ? {
              OR: [
                { fullName: { contains: options.search, mode: 'insensitive' } },
                { email: { contains: options.search, mode: 'insensitive' } },
                { company: { contains: options.search, mode: 'insensitive' } },
                { jobTitle: { contains: options.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return leads.map(mapLead);
  }

  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>, currentUserId: string): Promise<Lead> {
    await this.assertMemberInWorkspace(leadData.assignedToId, leadData.workspaceId);

    const created = await prisma.lead.create({
      data: {
        workspaceId: leadData.workspaceId,
        fullName: leadData.fullName,
        email: leadData.email,
        phone: leadData.phone,
        company: leadData.company,
        jobTitle: leadData.jobTitle,
        source: leadData.source,
        status: leadData.status,
        estimatedValue: leadData.estimatedValue,
        notes: leadData.notes,
        assignedToId: leadData.assignedToId,
      },
    });

    await this.logAudit({
      workspaceId: leadData.workspaceId,
      userId: currentUserId,
      action: 'LEAD_CREATED',
      entityType: 'LEAD',
      entityId: created.id,
      details: `Created lead "${created.fullName}" at ${created.company}`,
    });

    return mapLead(created);
  }

  async updateLead(
    id: string,
    workspaceId: string,
    updates: Partial<Pick<Lead, 'fullName' | 'email' | 'phone' | 'company' | 'jobTitle' | 'source' | 'status' | 'estimatedValue' | 'notes' | 'assignedToId'>>,
    currentUserId: string
  ): Promise<Lead | null> {
    if (!isUuid(id) || !isUuid(workspaceId)) return null;
    const existing = await prisma.lead.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    if (updates.assignedToId) {
      await this.assertMemberInWorkspace(updates.assignedToId, workspaceId);
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(updates.fullName !== undefined ? { fullName: updates.fullName } : {}),
        ...(updates.email !== undefined ? { email: updates.email } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        ...(updates.company !== undefined ? { company: updates.company } : {}),
        ...(updates.jobTitle !== undefined ? { jobTitle: updates.jobTitle } : {}),
        ...(updates.source !== undefined ? { source: updates.source } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
        ...(updates.estimatedValue !== undefined ? { estimatedValue: updates.estimatedValue } : {}),
        ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        ...(updates.assignedToId !== undefined ? { assignedToId: updates.assignedToId } : {}),
      },
    });

    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: 'LEAD_UPDATED',
      entityType: 'LEAD',
      entityId: id,
      details: `Updated lead "${updated.fullName}" (${updated.status})`,
    });

    return mapLead(updated);
  }

  async deleteLead(id: string, workspaceId: string, currentUserId: string): Promise<boolean> {
    if (!isUuid(id) || !isUuid(workspaceId)) return false;
    const existing = await prisma.lead.findFirst({ where: { id, workspaceId } });
    if (!existing) return false;

    await prisma.lead.delete({ where: { id } });
    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: 'LEAD_DELETED',
      entityType: 'LEAD',
      entityId: id,
      details: `Deleted lead "${existing.fullName}" from ${existing.company}`,
    });
    return true;
  }

  async convertLeadToDeal(
    leadId: string,
    workspaceId: string,
    dealData: {
      title: string;
      value: number;
      stage: DealStage;
      probability: number;
      expectedCloseDate: string;
      ownerId: string;
      priority: DealPriority;
      description?: string;
    },
    currentUserId: string
  ) {
    if (!isUuid(leadId) || !isUuid(workspaceId)) return null;
    const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
    if (!lead) return null;

    await this.assertMemberInWorkspace(dealData.ownerId, workspaceId);

    const res = await prisma.$transaction(async (tx) => {
      let company = await tx.company.findFirst({
        where: { workspaceId, name: { equals: lead.company, mode: 'insensitive' } },
      });
      if (!company) {
        company = await tx.company.create({
          data: {
            workspaceId,
            name: lead.company,
            industry: 'General Business',
            website: `https://${lead.company.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`,
            email: lead.email,
            phone: lead.phone,
            size: '10-50 employees',
            ownerId: dealData.ownerId,
          },
        });
      }

      const nameParts = lead.fullName.split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Contact';

      let contact = await tx.contact.findFirst({
        where: { workspaceId, email: { equals: lead.email, mode: 'insensitive' } },
      });
      if (!contact) {
        contact = await tx.contact.create({
          data: {
            workspaceId,
            firstName,
            lastName,
            email: lead.email,
            phone: lead.phone,
            companyId: company.id,
            jobTitle: lead.jobTitle,
            notes: lead.notes,
          },
        });
      }

      const deal = await tx.deal.create({
        data: {
          workspaceId,
          title: dealData.title,
          companyId: company.id,
          contactId: contact.id,
          value: dealData.value,
          stage: dealData.stage,
          probability: dealData.probability,
          expectedCloseDate: new Date(dealData.expectedCloseDate),
          ownerId: dealData.ownerId,
          priority: dealData.priority,
          description: dealData.description,
          order: 0,
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: { status: 'QUALIFIED', convertedToDealId: deal.id },
      });

      await tx.auditLog.create({
        data: {
          workspaceId,
          userId: currentUserId,
          action: 'LEAD_CONVERTED',
          entityType: 'LEAD',
          entityId: lead.id,
          details: `Converted lead "${lead.fullName}" into deal "${deal.title}"`,
        },
      });

      return {
        deal: mapDeal(deal),
        company: mapCompany(company),
        contact: mapContact(contact),
        lead: mapLead(updatedLead),
      };
    });

    return res;
  }

  // --- Companies ---
  async getCompanies(workspaceId: string, search?: string): Promise<Company[]> {
    if (!isUuid(workspaceId)) return [];
    const companies = await prisma.company.findMany({
      where: {
        workspaceId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { industry: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
    return companies.map(mapCompany);
  }

  async createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>, currentUserId: string): Promise<Company> {
    await this.assertMemberInWorkspace(companyData.ownerId, companyData.workspaceId);

    const created = await prisma.company.create({
      data: {
        workspaceId: companyData.workspaceId,
        name: companyData.name,
        industry: companyData.industry,
        website: companyData.website,
        email: companyData.email,
        phone: companyData.phone,
        size: companyData.size,
        address: companyData.address,
        notes: companyData.notes,
        ownerId: companyData.ownerId,
      },
    });

    await this.logAudit({
      workspaceId: companyData.workspaceId,
      userId: currentUserId,
      action: 'COMPANY_CREATED',
      entityType: 'COMPANY',
      entityId: created.id,
      details: `Added company "${created.name}" (${created.industry})`,
    });

    return mapCompany(created);
  }

  async updateCompany(
    id: string,
    workspaceId: string,
    updates: Partial<Pick<Company, 'name' | 'industry' | 'website' | 'email' | 'phone' | 'size' | 'address' | 'notes' | 'ownerId'>>,
    currentUserId: string
  ): Promise<Company | null> {
    if (!isUuid(id) || !isUuid(workspaceId)) return null;
    const existing = await prisma.company.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    if (updates.ownerId) {
      await this.assertMemberInWorkspace(updates.ownerId, workspaceId);
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.industry !== undefined ? { industry: updates.industry } : {}),
        ...(updates.website !== undefined ? { website: updates.website } : {}),
        ...(updates.email !== undefined ? { email: updates.email } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        ...(updates.size !== undefined ? { size: updates.size } : {}),
        ...(updates.address !== undefined ? { address: updates.address } : {}),
        ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        ...(updates.ownerId !== undefined ? { ownerId: updates.ownerId } : {}),
      },
    });

    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: 'COMPANY_UPDATED',
      entityType: 'COMPANY',
      entityId: id,
      details: `Updated company "${updated.name}"`,
    });

    return mapCompany(updated);
  }

  async deleteCompany(id: string, workspaceId: string, currentUserId: string): Promise<boolean> {
    if (!isUuid(id) || !isUuid(workspaceId)) return false;
    const existing = await prisma.company.findFirst({ where: { id, workspaceId } });
    if (!existing) return false;

    await prisma.company.delete({ where: { id } });
    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: 'COMPANY_DELETED',
      entityType: 'COMPANY',
      entityId: id,
      details: `Deleted company "${existing.name}"`,
    });
    return true;
  }

  // --- Contacts ---
  async getContacts(workspaceId: string, search?: string, companyId?: string): Promise<Contact[]> {
    if (!isUuid(workspaceId)) return [];
    const contacts = await prisma.contact.findMany({
      where: {
        workspaceId,
        ...(companyId && companyId !== 'ALL' && isUuid(companyId) ? { companyId } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { jobTitle: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { lastName: 'asc' },
    });
    return contacts.map(mapContact);
  }

  async createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>, currentUserId: string): Promise<Contact> {
    if (!isUuid(contactData.companyId)) {
      throw createHttpError('Associated company not found in this workspace', 400);
    }
    const company = await prisma.company.findFirst({
      where: { id: contactData.companyId, workspaceId: contactData.workspaceId },
    });
    if (!company) {
      throw createHttpError('Associated company not found in this workspace', 400);
    }

    const created = await prisma.contact.create({
      data: {
        workspaceId: contactData.workspaceId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        companyId: contactData.companyId,
        jobTitle: contactData.jobTitle,
        notes: contactData.notes,
      },
    });

    await this.logAudit({
      workspaceId: contactData.workspaceId,
      userId: currentUserId,
      action: 'CONTACT_CREATED',
      entityType: 'CONTACT',
      entityId: created.id,
      details: `Created contact "${created.firstName} ${created.lastName}"`,
    });

    return mapContact(created);
  }

  async updateContact(
    id: string,
    workspaceId: string,
    updates: Partial<Pick<Contact, 'firstName' | 'lastName' | 'email' | 'phone' | 'companyId' | 'jobTitle' | 'notes'>>,
    currentUserId: string
  ): Promise<Contact | null> {
    if (!isUuid(id) || !isUuid(workspaceId)) return null;
    const existing = await prisma.contact.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    if (updates.companyId) {
      if (!isUuid(updates.companyId)) {
        throw createHttpError('Associated company not found in this workspace', 400);
      }
      const company = await prisma.company.findFirst({
        where: { id: updates.companyId, workspaceId },
      });
      if (!company) {
        throw createHttpError('Associated company not found in this workspace', 400);
      }
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        ...(updates.firstName !== undefined ? { firstName: updates.firstName } : {}),
        ...(updates.lastName !== undefined ? { lastName: updates.lastName } : {}),
        ...(updates.email !== undefined ? { email: updates.email } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        ...(updates.companyId !== undefined ? { companyId: updates.companyId } : {}),
        ...(updates.jobTitle !== undefined ? { jobTitle: updates.jobTitle } : {}),
        ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      },
    });

    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: 'CONTACT_UPDATED',
      entityType: 'CONTACT',
      entityId: id,
      details: `Updated contact "${updated.firstName} ${updated.lastName}"`,
    });

    return mapContact(updated);
  }

  async deleteContact(id: string, workspaceId: string, currentUserId: string): Promise<boolean> {
    if (!isUuid(id) || !isUuid(workspaceId)) return false;
    const existing = await prisma.contact.findFirst({ where: { id, workspaceId } });
    if (!existing) return false;

    await prisma.contact.delete({ where: { id } });
    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: 'CONTACT_DELETED',
      entityType: 'CONTACT',
      entityId: id,
      details: `Deleted contact "${existing.firstName} ${existing.lastName}"`,
    });
    return true;
  }

  // --- Deals ---
  async getDeals(workspaceId: string, options?: { search?: string; ownerId?: string; priority?: string }) {
    if (!isUuid(workspaceId)) return [];
    const deals = await prisma.deal.findMany({
      where: {
        workspaceId,
        ...(options?.ownerId && options.ownerId !== 'ALL' && isUuid(options.ownerId)
          ? { ownerId: options.ownerId }
          : {}),
        ...(options?.priority && options.priority !== 'ALL'
          ? { priority: options.priority as DealPriority }
          : {}),
        ...(options?.search
          ? {
              OR: [
                { title: { contains: options.search, mode: 'insensitive' } },
                { company: { name: { contains: options.search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        company: { select: { name: true } },
        owner: { select: { name: true, avatar: true } },
        contact: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return deals.map((d) => ({
      ...mapDeal(d),
      companyName: d.company?.name || 'Unknown Company',
      ownerName: d.owner?.name || 'Unassigned',
      ownerAvatar: d.owner?.avatar || undefined,
      contactName: d.contact ? `${d.contact.firstName} ${d.contact.lastName}` : undefined,
    }));
  }

  async getDealById(id: string, workspaceId: string) {
    if (!isUuid(id) || !isUuid(workspaceId)) return null;
    const deal = await prisma.deal.findFirst({
      where: { id, workspaceId },
      include: { company: true, owner: true, contact: true },
    });
    if (!deal) return null;

    return {
      ...mapDeal(deal),
      company: deal.company ? mapCompany(deal.company) : undefined,
      owner: deal.owner ? mapUser(deal.owner, workspaceId) : undefined,
      contact: deal.contact ? mapContact(deal.contact) : undefined,
    };
  }

  async createDeal(dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'lastActivityAt'>, currentUserId: string): Promise<Deal> {
    if (!isUuid(dealData.companyId)) {
      throw createHttpError('Associated company not found in this workspace', 400);
    }
    const company = await prisma.company.findFirst({
      where: { id: dealData.companyId, workspaceId: dealData.workspaceId },
    });
    if (!company) {
      throw createHttpError('Associated company not found in this workspace', 400);
    }
    await this.assertMemberInWorkspace(dealData.ownerId, dealData.workspaceId);

    if (dealData.contactId) {
      if (!isUuid(dealData.contactId)) {
        throw createHttpError('Associated contact not found in this workspace', 400);
      }
      const contact = await prisma.contact.findFirst({
        where: { id: dealData.contactId, workspaceId: dealData.workspaceId },
      });
      if (!contact) {
        throw createHttpError('Associated contact not found in this workspace', 400);
      }
    }

    const created = await prisma.deal.create({
      data: {
        workspaceId: dealData.workspaceId,
        title: dealData.title,
        companyId: dealData.companyId,
        contactId: dealData.contactId || null,
        value: dealData.value,
        stage: dealData.stage,
        probability: dealData.probability,
        expectedCloseDate: new Date(dealData.expectedCloseDate),
        ownerId: dealData.ownerId,
        priority: dealData.priority,
        description: dealData.description,
        order: dealData.order ?? 0,
      },
    });

    await this.logAudit({
      workspaceId: dealData.workspaceId,
      userId: currentUserId,
      action: 'DEAL_CREATED',
      entityType: 'DEAL',
      entityId: created.id,
      details: `Created deal "${created.title}" in ${created.stage}`,
    });

    return mapDeal(created);
  }

  async updateDeal(
    id: string,
    workspaceId: string,
    updates: Partial<Pick<Deal, 'title' | 'companyId' | 'contactId' | 'value' | 'stage' | 'probability' | 'expectedCloseDate' | 'ownerId' | 'priority' | 'description' | 'order'>>,
    currentUserId: string
  ): Promise<Deal | null> {
    if (!isUuid(id) || !isUuid(workspaceId)) return null;
    const existing = await prisma.deal.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    if (updates.companyId) {
      if (!isUuid(updates.companyId)) throw createHttpError('Associated company not found', 400);
      const company = await prisma.company.findFirst({ where: { id: updates.companyId, workspaceId } });
      if (!company) throw createHttpError('Associated company not found in this workspace', 400);
    }
    if (updates.ownerId) {
      await this.assertMemberInWorkspace(updates.ownerId, workspaceId);
    }
    if (updates.contactId) {
      if (!isUuid(updates.contactId)) throw createHttpError('Associated contact not found', 400);
      const contact = await prisma.contact.findFirst({ where: { id: updates.contactId, workspaceId } });
      if (!contact) throw createHttpError('Associated contact not found in this workspace', 400);
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.companyId !== undefined ? { companyId: updates.companyId } : {}),
        ...(updates.contactId !== undefined ? { contactId: updates.contactId || null } : {}),
        ...(updates.value !== undefined ? { value: updates.value } : {}),
        ...(updates.stage !== undefined ? { stage: updates.stage } : {}),
        ...(updates.probability !== undefined ? { probability: updates.probability } : {}),
        ...(updates.expectedCloseDate !== undefined
          ? { expectedCloseDate: new Date(updates.expectedCloseDate) }
          : {}),
        ...(updates.ownerId !== undefined ? { ownerId: updates.ownerId } : {}),
        ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.order !== undefined ? { order: updates.order } : {}),
        lastActivityAt: new Date(),
      },
    });

    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: updates.stage && updates.stage !== existing.stage ? 'DEAL_MOVED' : 'DEAL_UPDATED',
      entityType: 'DEAL',
      entityId: id,
      details: `Updated deal "${updated.title}"`,
    });

    return mapDeal(updated);
  }

  async updateDealStage(
    id: string,
    workspaceId: string,
    newStage: DealStage,
    newOrder: number | undefined,
    currentUserId: string
  ): Promise<Deal | null> {
    if (!isUuid(id) || !isUuid(workspaceId)) return null;
    const existing = await prisma.deal.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    const probMap: Record<DealStage, number> = {
      NEW_OPPORTUNITY: 20,
      QUALIFIED: 40,
      PROPOSAL_SENT: 65,
      NEGOTIATION: 85,
      WON: 100,
      LOST: 0,
    };

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        stage: newStage,
        probability: probMap[newStage],
        ...(typeof newOrder === 'number' ? { order: newOrder } : {}),
        lastActivityAt: new Date(),
      },
    });

    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: newStage === 'WON' ? 'DEAL_WON' : newStage === 'LOST' ? 'DEAL_LOST' : 'DEAL_MOVED',
      entityType: 'DEAL',
      entityId: id,
      details: `Moved deal "${updated.title}" from ${existing.stage} to ${newStage}`,
    });

    return mapDeal(updated);
  }

  async deleteDeal(id: string, workspaceId: string, currentUserId: string): Promise<boolean> {
    if (!isUuid(id) || !isUuid(workspaceId)) return false;
    const existing = await prisma.deal.findFirst({ where: { id, workspaceId } });
    if (!existing) return false;

    await prisma.deal.delete({ where: { id } });
    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: 'DEAL_DELETED',
      entityType: 'DEAL',
      entityId: id,
      details: `Deleted deal "${existing.title}"`,
    });
    return true;
  }

  // --- Activities ---
  async getActivities(workspaceId: string, options?: { type?: string; completed?: boolean; search?: string }) {
    if (!isUuid(workspaceId)) return [];
    const activities = await prisma.activity.findMany({
      where: {
        workspaceId,
        ...(options?.type && options.type !== 'ALL' ? { type: options.type as Activity['type'] } : {}),
        ...(typeof options?.completed === 'boolean' ? { completed: options.completed } : {}),
        ...(options?.search
          ? {
              OR: [
                { title: { contains: options.search, mode: 'insensitive' } },
                { description: { contains: options.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        assignedTo: { select: { name: true } },
        deal: { select: { title: true } },
        company: { select: { name: true } },
        lead: { select: { fullName: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return activities.map((a) => {
      let entityLabel = '';
      if (a.deal) entityLabel = `Deal: ${a.deal.title}`;
      else if (a.company) entityLabel = `Company: ${a.company.name}`;
      else if (a.lead) entityLabel = `Lead: ${a.lead.fullName}`;

      return {
        ...mapActivity(a),
        assignedToName: a.assignedTo?.name || 'Unassigned',
        entityLabel,
      };
    });
  }

  private async assertOptionalActivityLinksInWorkspace(
    workspaceId: string,
    links: { leadId?: string | null; contactId?: string | null; dealId?: string | null; companyId?: string | null }
  ) {
    if (links.leadId) {
      if (!isUuid(links.leadId)) throw createHttpError('Associated lead not found in this workspace', 400);
      const lead = await prisma.lead.findFirst({ where: { id: links.leadId, workspaceId } });
      if (!lead) throw createHttpError('Associated lead not found in this workspace', 400);
    }
    if (links.contactId) {
      if (!isUuid(links.contactId)) throw createHttpError('Associated contact not found in this workspace', 400);
      const contact = await prisma.contact.findFirst({ where: { id: links.contactId, workspaceId } });
      if (!contact) throw createHttpError('Associated contact not found in this workspace', 400);
    }
    if (links.dealId) {
      if (!isUuid(links.dealId)) throw createHttpError('Associated deal not found in this workspace', 400);
      const deal = await prisma.deal.findFirst({ where: { id: links.dealId, workspaceId } });
      if (!deal) throw createHttpError('Associated deal not found in this workspace', 400);
    }
    if (links.companyId) {
      if (!isUuid(links.companyId)) throw createHttpError('Associated company not found in this workspace', 400);
      const company = await prisma.company.findFirst({ where: { id: links.companyId, workspaceId } });
      if (!company) throw createHttpError('Associated company not found in this workspace', 400);
    }
  }

  async createActivity(activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>, currentUserId: string): Promise<Activity> {
    await this.assertMemberInWorkspace(activityData.assignedToId, activityData.workspaceId);
    await this.assertOptionalActivityLinksInWorkspace(activityData.workspaceId, activityData);

    const created = await prisma.activity.create({
      data: {
        workspaceId: activityData.workspaceId,
        type: activityData.type,
        title: activityData.title,
        description: activityData.description,
        completed: false,
        dueDate: new Date(activityData.dueDate),
        assignedToId: activityData.assignedToId,
        leadId: activityData.leadId || null,
        contactId: activityData.contactId || null,
        dealId: activityData.dealId || null,
        companyId: activityData.companyId || null,
      },
    });

    await this.logAudit({
      workspaceId: activityData.workspaceId,
      userId: currentUserId,
      action: 'ACTIVITY_CREATED',
      entityType: 'ACTIVITY',
      entityId: created.id,
      details: `Scheduled ${created.type.toLowerCase()}: "${created.title}"`,
    });

    return mapActivity(created);
  }

  async updateActivity(
    id: string,
    workspaceId: string,
    updates: Partial<Pick<Activity, 'type' | 'title' | 'description' | 'completed' | 'dueDate' | 'assignedToId' | 'leadId' | 'contactId' | 'dealId' | 'companyId'>>,
    currentUserId: string
  ): Promise<Activity | null> {
    if (!isUuid(id) || !isUuid(workspaceId)) return null;
    const existing = await prisma.activity.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    if (updates.assignedToId) {
      await this.assertMemberInWorkspace(updates.assignedToId, workspaceId);
    }
    await this.assertOptionalActivityLinksInWorkspace(workspaceId, updates);

    const updated = await prisma.activity.update({
      where: { id },
      data: {
        ...(updates.type !== undefined ? { type: updates.type } : {}),
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.completed !== undefined ? { completed: updates.completed } : {}),
        ...(updates.dueDate !== undefined ? { dueDate: new Date(updates.dueDate) } : {}),
        ...(updates.assignedToId !== undefined ? { assignedToId: updates.assignedToId } : {}),
        ...(updates.leadId !== undefined ? { leadId: updates.leadId && isUuid(updates.leadId) ? updates.leadId : null } : {}),
        ...(updates.contactId !== undefined ? { contactId: updates.contactId && isUuid(updates.contactId) ? updates.contactId : null } : {}),
        ...(updates.dealId !== undefined ? { dealId: updates.dealId && isUuid(updates.dealId) ? updates.dealId : null } : {}),
        ...(updates.companyId !== undefined ? { companyId: updates.companyId && isUuid(updates.companyId) ? updates.companyId : null } : {}),
      },
    });

    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: 'ACTIVITY_UPDATED',
      entityType: 'ACTIVITY',
      entityId: id,
      details: `Updated activity "${updated.title}"`,
    });

    return mapActivity(updated);
  }

  async toggleActivityCompleted(id: string, workspaceId: string, currentUserId: string): Promise<Activity | null> {
    if (!isUuid(id) || !isUuid(workspaceId)) return null;
    const existing = await prisma.activity.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    const updated = await prisma.activity.update({
      where: { id },
      data: { completed: !existing.completed },
    });

    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: updated.completed ? 'ACTIVITY_COMPLETED' : 'ACTIVITY_REOPENED',
      entityType: 'ACTIVITY',
      entityId: id,
      details: `${updated.completed ? 'Completed' : 'Re-opened'} activity "${updated.title}"`,
    });

    return mapActivity(updated);
  }

  async deleteActivity(id: string, workspaceId: string, currentUserId: string): Promise<boolean> {
    if (!isUuid(id) || !isUuid(workspaceId)) return false;
    const existing = await prisma.activity.findFirst({ where: { id, workspaceId } });
    if (!existing) return false;

    await prisma.activity.delete({ where: { id } });
    await this.logAudit({
      workspaceId,
      userId: currentUserId,
      action: 'ACTIVITY_DELETED',
      entityType: 'ACTIVITY',
      entityId: id,
      details: `Deleted activity "${existing.title}"`,
    });
    return true;
  }

  // --- Dashboard & Analytics ---
  async getDashboardSummary(workspaceId: string): Promise<DashboardSummary> {
    const [deals, leads, upcoming, logs] = await Promise.all([
      this.getDeals(workspaceId),
      this.getLeads(workspaceId),
      this.getActivities(workspaceId, { completed: false }),
      isUuid(workspaceId)
        ? prisma.auditLog.findMany({
            where: { workspaceId },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 8,
          })
        : Promise.resolve([]),
    ]);

    const activeDeals = deals.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST');
    const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
    const wonDeals = deals.filter((d) => d.stage === 'WON');
    const lostDeals = deals.filter((d) => d.stage === 'LOST');
    const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const closedCount = wonDeals.length + lostDeals.length;
    const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 0;
    const averageDealValue =
      deals.length > 0 ? Math.round(deals.reduce((sum, d) => sum + d.value, 0) / deals.length) : 0;
    const newLeadsCount = leads.filter((l) => l.status === 'NEW').length;

    const stageOrder: Array<{ stage: DealStage; label: string }> = [
      { stage: 'NEW_OPPORTUNITY', label: 'New Opportunity' },
      { stage: 'QUALIFIED', label: 'Qualified' },
      { stage: 'PROPOSAL_SENT', label: 'Proposal Sent' },
      { stage: 'NEGOTIATION', label: 'Negotiation' },
      { stage: 'WON', label: 'Won' },
      { stage: 'LOST', label: 'Lost' },
    ];

    const stageSummaries = stageOrder.map(({ stage, label }) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return {
        stage,
        label,
        count: stageDeals.length,
        totalValue: stageDeals.reduce((sum, d) => sum + d.value, 0),
      };
    });

    return {
      totalPipelineValue,
      activeDealsCount: activeDeals.length,
      newLeadsCount,
      wonRevenue,
      wonDealsCount: wonDeals.length,
      winRate,
      averageDealValue,
      pipelineChangePct: 14.8,
      activeDealsChangePct: 8.3,
      leadsChangePct: 18.2,
      wonChangePct: 24.5,
      recentDeals: deals.slice(0, 5),
      upcomingActivities: upcoming.slice(0, 5),
      recentAuditLogs: logs.map((l) => ({
        id: l.id,
        workspaceId: l.workspaceId,
        userId: l.userId,
        userName: l.user?.name || 'System',
        action: l.action,
        entityType: l.entityType as AuditLog['entityType'],
        entityId: l.entityId,
        details: l.details,
        createdAt: l.createdAt.toISOString(),
      })),
      stageSummaries,
    };
  }

  async getAnalytics(workspaceId: string, _range = '30d'): Promise<AnalyticsData> {
    const [deals, leads, activities, users] = await Promise.all([
      this.getDeals(workspaceId),
      this.getLeads(workspaceId),
      this.getActivities(workspaceId),
      this.getUsers(workspaceId),
    ]);

    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const activeDealsTotal = deals
      .filter((d) => d.stage !== 'WON' && d.stage !== 'LOST')
      .reduce((s, d) => s + d.value, 0);
    const wonTotal = deals.filter((d) => d.stage === 'WON').reduce((s, d) => s + d.value, 0);

    const revenueTrend = months.map((m, idx) => {
      const weight = (idx + 1) / months.length;
      return {
        month: m,
        pipeline: Math.round(activeDealsTotal * (0.4 + 0.6 * weight)),
        won: Math.round(wonTotal * (0.3 + 0.7 * weight)),
      };
    });

    const stageLabels: Record<DealStage, string> = {
      NEW_OPPORTUNITY: 'New Opportunity',
      QUALIFIED: 'Qualified',
      PROPOSAL_SENT: 'Proposal Sent',
      NEGOTIATION: 'Negotiation',
      WON: 'Won',
      LOST: 'Lost',
    };

    const stagesMap: Record<string, { count: number; value: number }> = {
      'New Opportunity': { count: 0, value: 0 },
      Qualified: { count: 0, value: 0 },
      'Proposal Sent': { count: 0, value: 0 },
      Negotiation: { count: 0, value: 0 },
      Won: { count: 0, value: 0 },
      Lost: { count: 0, value: 0 },
    };

    deals.forEach((d) => {
      const label = stageLabels[d.stage];
      if (label && stagesMap[label]) {
        stagesMap[label].count += 1;
        stagesMap[label].value += d.value;
      }
    });

    const stageBreakdown = Object.entries(stagesMap).map(([stage, stats]) => ({
      stage,
      count: stats.count,
      value: stats.value,
    }));

    const wonDeals = deals.filter((d) => d.stage === 'WON');
    const lostDeals = deals.filter((d) => d.stage === 'LOST');
    const wonCount = wonDeals.length;
    const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const lostCount = lostDeals.length;
    const lostValue = lostDeals.reduce((sum, d) => sum + d.value, 0);
    const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

    const totalLeads = leads.length;
    const contactedLeads = leads.filter((l) => l.status === 'CONTACTED' || l.status === 'QUALIFIED').length;
    const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED').length;
    const convertedDealsCount = deals.length;

    const conversionFunnel = [
      { step: 'Inbound Leads', count: totalLeads, conversionRate: totalLeads > 0 ? 100 : 0 },
      {
        step: 'Contacted',
        count: contactedLeads,
        conversionRate: totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0,
      },
      {
        step: 'Qualified',
        count: qualifiedLeads,
        conversionRate: totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0,
      },
      {
        step: 'Opportunities Created',
        count: convertedDealsCount,
        conversionRate: totalLeads > 0 ? Math.round((convertedDealsCount / totalLeads) * 100) : 0,
      },
      {
        step: 'Deals Won',
        count: wonCount,
        conversionRate: totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0,
      },
    ];

    const repPerformance = users.map((user) => {
      const repDeals = deals.filter((d) => d.ownerId === user.id);
      const repWonDeals = repDeals.filter((d) => d.stage === 'WON');
      const repActiveDeals = repDeals.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST');
      const repActivities = activities.filter((a) => a.assignedToId === user.id && a.completed);

      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        dealsWon: repWonDeals.length,
        revenueWon: repWonDeals.reduce((sum, d) => sum + d.value, 0),
        activePipeline: repActiveDeals.reduce((sum, d) => sum + d.value, 0),
        activitiesCompleted: repActivities.length,
      };
    });

    const closedDeals = deals.filter((d) => d.stage === 'WON' || d.stage === 'LOST');
    let avgDealCycleDays = 28;
    if (closedDeals.length > 0) {
      const totalDays = closedDeals.reduce((sum, d) => {
        const start = new Date(d.createdAt).getTime();
        const end = new Date(d.lastActivityAt || d.updatedAt).getTime();
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        return sum + days;
      }, 0);
      avgDealCycleDays = Math.round(totalDays / closedDeals.length);
    }

    return {
      revenueTrend,
      stageBreakdown,
      wonVsLost: { wonCount, wonValue, lostCount, lostValue, winRate },
      conversionFunnel,
      repPerformance,
      keyMetrics: {
        avgDealCycleDays,
        avgDealSize:
          deals.length > 0
            ? Math.round(deals.reduce((sum, d) => sum + d.value, 0) / deals.length)
            : 0,
        totalOpportunities: deals.length,
        leadToWonRate: totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0,
      },
    };
  }

  async getWorkspaceExport(workspaceId: string) {
    const [workspace, users, companies, contacts, leads, deals, activities] = await Promise.all([
      this.getWorkspace(workspaceId),
      this.getUsers(workspaceId),
      this.getCompanies(workspaceId),
      this.getContacts(workspaceId),
      this.getLeads(workspaceId),
      this.getDeals(workspaceId),
      this.getActivities(workspaceId),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      workspace,
      users,
      companies,
      contacts,
      leads,
      deals,
      activities,
    };
  }

  async getEntityCounts() {
    const [workspaces, users, leads, companies, contacts, deals, activities, auditLogs] =
      await Promise.all([
        prisma.workspace.count(),
        prisma.user.count(),
        prisma.lead.count(),
        prisma.company.count(),
        prisma.contact.count(),
        prisma.deal.count(),
        prisma.activity.count(),
        prisma.auditLog.count(),
      ]);
    return { workspaces, users, leads, companies, contacts, deals, activities, auditLogs };
  }
}
