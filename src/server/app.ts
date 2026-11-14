import express, { Request, Response, NextFunction } from 'express';
import { crmRepo } from './db/repository.ts';
import { isPostgresConnected } from './db/prisma.ts';
import {
  requireAuth,
  requireRole,
  generateToken,
  hashPassword,
  comparePassword,
  isDemoModeEnabled,
  AuthRequest,
} from './auth.ts';
import {
  loginSchema,
  registerSchema,
  switchRoleSchema,
  leadCreateSchema,
  leadUpdateSchema,
  leadConvertSchema,
  companyCreateSchema,
  companyUpdateSchema,
  contactCreateSchema,
  contactUpdateSchema,
  dealCreateSchema,
  dealUpdateSchema,
  dealStageUpdateSchema,
  activityCreateSchema,
  activityUpdateSchema,
  teamInviteSchema,
  formatZodError,
} from './validation.ts';

function handleRouteError(res: Response, err: unknown, fallbackMessage: string) {
  const status =
    typeof err === 'object' && err !== null && 'status' in err && typeof (err as any).status === 'number'
      ? (err as any).status
      : 500;
  if (status >= 500) {
    console.error(`${fallbackMessage}:`, err);
  }
  const message =
    status < 500 && err instanceof Error && err.message ? err.message : fallbackMessage;
  return res.status(status).json({ error: message });
}

function getParamId(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Malformed JSON request body' });
    }
    return next(err);
  });

  // ----------------------------------------------------
  // AUTH ROUTES
  // ----------------------------------------------------
  app.get('/api/auth/config', (_req, res) => {
    res.json({ demoMode: isDemoModeEnabled() });
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const user = await crmRepo.findUserWithPasswordByEmail(parsed.data.email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const passwordValid = await comparePassword(parsed.data.password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const { passwordHash: _, ...safeUser } = user;
      const token = generateToken(safeUser);
      return res.json({ user: safeUser, token });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to authenticate');
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const passwordHash = await hashPassword(parsed.data.password);
      const { user } = await crmRepo.createUserWithWorkspace({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        companyName: parsed.data.companyName,
      });

      const token = generateToken(user);
      return res.status(201).json({ user, token });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to create user account');
    }
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const user = await crmRepo.findUserById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      const token = generateToken(user);
      return res.json({ user, token });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to retrieve current session');
    }
  });

  app.post('/api/auth/demo-session', async (_req, res) => {
    try {
      if (!isDemoModeEnabled()) {
        return res.status(403).json({ error: 'Demo mode is disabled in this environment.' });
      }
      const demoUser = await crmRepo.findUserByIdOrEmail('usr-1');
      if (!demoUser) {
        return res.status(404).json({ error: 'Demo account not found. Seed the database first.' });
      }
      const token = generateToken(demoUser);
      return res.json({ user: demoUser, token });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to start demo session');
    }
  });

  app.post('/api/auth/switch-role', async (req, res) => {
    try {
      if (!isDemoModeEnabled()) {
        return res.status(403).json({ error: 'Role switcher is only available when demo mode is enabled.' });
      }
      const parsed = switchRoleSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const identifier = parsed.data.userId || parsed.data.email || 'usr-1';
      const targetUser = await crmRepo.findUserByIdOrEmail(identifier);
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user role not found' });
      }
      const token = generateToken(targetUser);
      return res.json({ user: targetUser, token });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to switch role');
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ success: true, message: 'Signed out successfully' });
  });

  // ----------------------------------------------------
  // DASHBOARD ROUTES
  // ----------------------------------------------------
  app.get('/api/dashboard/summary', requireAuth, async (req: AuthRequest, res) => {
    try {
      const summary = await crmRepo.getDashboardSummary(req.user!.workspaceId);
      return res.json(summary);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to retrieve dashboard metrics');
    }
  });

  // ----------------------------------------------------
  // LEADS ROUTES
  // ----------------------------------------------------
  app.get('/api/leads', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { search, status, source } = req.query as {
        search?: string;
        status?: string;
        source?: string;
      };
      const leads = await crmRepo.getLeads(req.user!.workspaceId, { search, status, source });
      return res.json(leads);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to load leads');
    }
  });

  app.post('/api/leads', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = leadCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const lead = await crmRepo.createLead(
        {
          workspaceId: req.user!.workspaceId,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          company: parsed.data.company,
          jobTitle: parsed.data.jobTitle,
          source: parsed.data.source,
          status: parsed.data.status,
          estimatedValue: parsed.data.estimatedValue,
          notes: parsed.data.notes,
          assignedToId: parsed.data.assignedToId || req.user!.id,
        },
        req.user!.id,
        req.user!.name
      );
      return res.status(201).json(lead);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to create lead');
    }
  });

  app.put('/api/leads/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = leadUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const updated = await crmRepo.updateLead(
        getParamId(req),
        req.user!.workspaceId,
        parsed.data,
        req.user!.id,
        req.user!.name
      );
      if (!updated) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.json(updated);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update lead');
    }
  });

  app.delete('/api/leads/:id', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
      const deleted = await crmRepo.deleteLead(
        getParamId(req),
        req.user!.workspaceId,
        req.user!.id,
        req.user!.name
      );
      if (!deleted) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.json({ success: true, message: 'Lead deleted successfully' });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to delete lead');
    }
  });

  app.post('/api/leads/:id/convert', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = leadConvertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const result = await crmRepo.convertLeadToDeal(
        getParamId(req),
        req.user!.workspaceId,
        {
          title: parsed.data.title,
          value: parsed.data.value,
          stage: parsed.data.stage,
          probability: parsed.data.probability,
          expectedCloseDate: parsed.data.expectedCloseDate,
          ownerId: parsed.data.ownerId || req.user!.id,
          priority: parsed.data.priority,
          description: parsed.data.description,
        },
        req.user!.id,
        req.user!.name
      );
      if (!result) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.status(201).json(result);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to convert lead into deal');
    }
  });

  // ----------------------------------------------------
  // COMPANIES ROUTES
  // ----------------------------------------------------
  app.get('/api/companies', requireAuth, async (req: AuthRequest, res) => {
    try {
      const search = req.query.search as string | undefined;
      const companies = await crmRepo.getCompanies(req.user!.workspaceId, search);
      return res.json(companies);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to load companies');
    }
  });

  app.post('/api/companies', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = companyCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const company = await crmRepo.createCompany(
        {
          workspaceId: req.user!.workspaceId,
          name: parsed.data.name,
          industry: parsed.data.industry,
          website: parsed.data.website,
          email: parsed.data.email,
          phone: parsed.data.phone,
          size: parsed.data.size,
          address: parsed.data.address,
          notes: parsed.data.notes,
          ownerId: parsed.data.ownerId || req.user!.id,
        },
        req.user!.id,
        req.user!.name
      );
      return res.status(201).json(company);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to create company');
    }
  });

  app.put('/api/companies/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = companyUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const updated = await crmRepo.updateCompany(
        getParamId(req),
        req.user!.workspaceId,
        parsed.data,
        req.user!.id,
        req.user!.name
      );
      if (!updated) {
        return res.status(404).json({ error: 'Company not found' });
      }
      return res.json(updated);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update company');
    }
  });

  app.delete('/api/companies/:id', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
      const deleted = await crmRepo.deleteCompany(
        getParamId(req),
        req.user!.workspaceId,
        req.user!.id,
        req.user!.name
      );
      if (!deleted) {
        return res.status(404).json({ error: 'Company not found' });
      }
      return res.json({ success: true, message: 'Company deleted' });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to delete company');
    }
  });

  // ----------------------------------------------------
  // CONTACTS ROUTES
  // ----------------------------------------------------
  app.get('/api/contacts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { search, companyId } = req.query as { search?: string; companyId?: string };
      const contacts = await crmRepo.getContacts(req.user!.workspaceId, search, companyId);
      return res.json(contacts);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to load contacts');
    }
  });

  app.post('/api/contacts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = contactCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const contact = await crmRepo.createContact(
        {
          workspaceId: req.user!.workspaceId,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          companyId: parsed.data.companyId,
          jobTitle: parsed.data.jobTitle,
          notes: parsed.data.notes,
        },
        req.user!.id,
        req.user!.name
      );
      return res.status(201).json(contact);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to create contact');
    }
  });

  app.put('/api/contacts/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = contactUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const updated = await crmRepo.updateContact(
        getParamId(req),
        req.user!.workspaceId,
        parsed.data,
        req.user!.id,
        req.user!.name
      );
      if (!updated) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      return res.json(updated);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update contact');
    }
  });

  app.delete('/api/contacts/:id', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
      const deleted = await crmRepo.deleteContact(
        getParamId(req),
        req.user!.workspaceId,
        req.user!.id,
        req.user!.name
      );
      if (!deleted) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      return res.json({ success: true, message: 'Contact deleted' });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to delete contact');
    }
  });

  // ----------------------------------------------------
  // DEALS & KANBAN PIPELINE ROUTES
  // ----------------------------------------------------
  app.get('/api/deals', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { search, ownerId, priority } = req.query as {
        search?: string;
        ownerId?: string;
        priority?: string;
      };
      const deals = await crmRepo.getDeals(req.user!.workspaceId, { search, ownerId, priority });
      return res.json(deals);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to load deals');
    }
  });

  app.get('/api/deals/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const deal = await crmRepo.getDealById(getParamId(req), req.user!.workspaceId);
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      return res.json(deal);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to load deal');
    }
  });

  app.post('/api/deals', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = dealCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const defaultClose = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      const deal = await crmRepo.createDeal(
        {
          workspaceId: req.user!.workspaceId,
          title: parsed.data.title,
          companyId: parsed.data.companyId,
          contactId: parsed.data.contactId || undefined,
          value: parsed.data.value,
          stage: parsed.data.stage,
          probability: parsed.data.probability,
          expectedCloseDate: parsed.data.expectedCloseDate || defaultClose,
          ownerId: parsed.data.ownerId || req.user!.id,
          priority: parsed.data.priority,
          description: parsed.data.description,
          order: 0,
        },
        req.user!.id,
        req.user!.name
      );
      return res.status(201).json(deal);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to create deal');
    }
  });

  app.put('/api/deals/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = dealUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const updates = {
        ...parsed.data,
        contactId: parsed.data.contactId === null ? undefined : parsed.data.contactId,
      };
      const updated = await crmRepo.updateDeal(
        getParamId(req),
        req.user!.workspaceId,
        updates,
        req.user!.id,
        req.user!.name
      );
      if (!updated) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      return res.json(updated);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update deal');
    }
  });

  app.patch('/api/deals/:id/stage', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = dealStageUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const updated = await crmRepo.updateDealStage(
        getParamId(req),
        req.user!.workspaceId,
        parsed.data.stage,
        parsed.data.order,
        req.user!.id,
        req.user!.name
      );
      if (!updated) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      return res.json(updated);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update deal stage');
    }
  });

  app.delete('/api/deals/:id', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
      const deleted = await crmRepo.deleteDeal(
        getParamId(req),
        req.user!.workspaceId,
        req.user!.id,
        req.user!.name
      );
      if (!deleted) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      return res.json({ success: true, message: 'Deal deleted successfully' });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to delete deal');
    }
  });

  // ----------------------------------------------------
  // ACTIVITIES ROUTES
  // ----------------------------------------------------
  app.get('/api/activities', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { type, completed, search } = req.query as {
        type?: string;
        completed?: string;
        search?: string;
      };
      const completedBool = completed === 'true' ? true : completed === 'false' ? false : undefined;
      const activities = await crmRepo.getActivities(req.user!.workspaceId, {
        type,
        completed: completedBool,
        search,
      });
      return res.json(activities);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to load activities');
    }
  });

  app.post('/api/activities', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = activityCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const activity = await crmRepo.createActivity(
        {
          workspaceId: req.user!.workspaceId,
          type: parsed.data.type,
          title: parsed.data.title,
          description: parsed.data.description,
          completed: false,
          dueDate: parsed.data.dueDate,
          assignedToId: parsed.data.assignedToId || req.user!.id,
          leadId: parsed.data.leadId || undefined,
          contactId: parsed.data.contactId || undefined,
          dealId: parsed.data.dealId || undefined,
          companyId: parsed.data.companyId || undefined,
        },
        req.user!.id,
        req.user!.name
      );
      return res.status(201).json(activity);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to create activity');
    }
  });

  app.put('/api/activities/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = activityUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const updates = {
        ...parsed.data,
        leadId: parsed.data.leadId === null ? undefined : parsed.data.leadId,
        contactId: parsed.data.contactId === null ? undefined : parsed.data.contactId,
        dealId: parsed.data.dealId === null ? undefined : parsed.data.dealId,
        companyId: parsed.data.companyId === null ? undefined : parsed.data.companyId,
      };
      const updated = await crmRepo.updateActivity(
        getParamId(req),
        req.user!.workspaceId,
        updates,
        req.user!.id,
        req.user!.name
      );
      if (!updated) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      return res.json(updated);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update activity');
    }
  });

  app.patch('/api/activities/:id/toggle', requireAuth, async (req: AuthRequest, res) => {
    try {
      const toggled = await crmRepo.toggleActivityCompleted(
        getParamId(req),
        req.user!.workspaceId,
        req.user!.id,
        req.user!.name
      );
      if (!toggled) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      return res.json(toggled);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to update activity status');
    }
  });

  app.delete('/api/activities/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const deleted = await crmRepo.deleteActivity(
        getParamId(req),
        req.user!.workspaceId,
        req.user!.id,
        req.user!.name
      );
      if (!deleted) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      return res.json({ success: true, message: 'Activity deleted' });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to delete activity');
    }
  });

  // ----------------------------------------------------
  // REPORTS & ANALYTICS
  // ----------------------------------------------------
  app.get('/api/analytics', requireAuth, async (req: AuthRequest, res) => {
    try {
      const range = (req.query.range as string) || '30d';
      const analytics = await crmRepo.getAnalytics(req.user!.workspaceId, range);
      return res.json(analytics);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to compute analytics');
    }
  });

  // ----------------------------------------------------
  // TEAM & WORKSPACE
  // ----------------------------------------------------
  app.get('/api/team', requireAuth, async (req: AuthRequest, res) => {
    try {
      const [users, workspace] = await Promise.all([
        crmRepo.getUsers(req.user!.workspaceId),
        crmRepo.getWorkspace(req.user!.workspaceId),
      ]);
      return res.json({ users, workspace });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to retrieve team members');
    }
  });

  app.post('/api/team/invite', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
      const parsed = teamInviteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      if (parsed.data.role === 'OWNER' && req.user!.role !== 'OWNER') {
        return res.status(403).json({ error: 'Only workspace owners can invite another owner.' });
      }

      const defaultHash = await hashPassword('password123');
      const newUser = await crmRepo.createUser({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: defaultHash,
        role: parsed.data.role,
        title: parsed.data.title || 'Account Executive',
        workspaceId: req.user!.workspaceId,
      });

      return res.status(201).json(newUser);
    } catch (err) {
      return handleRouteError(res, err, 'Failed to invite team member');
    }
  });

  // ----------------------------------------------------
  // SYSTEM & DEMO CONTROLS
  // ----------------------------------------------------
  app.post('/api/system/reset-demo', requireAuth, requireRole(['OWNER', 'ADMIN']), async (_req, res) => {
    try {
      if (!isDemoModeEnabled()) {
        return res.status(403).json({ error: 'Demo reset is disabled in production.' });
      }
      if (!crmRepo.resetDemoData) {
        return res.status(400).json({
          error: 'Demo reset is unavailable when connected to PostgreSQL. Run prisma/seed.ts instead.',
        });
      }
      await crmRepo.resetDemoData();
      return res.json({ success: true, message: 'Demo data restored successfully' });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to reset demo data');
    }
  });

  app.get('/api/system/export', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
      const workspaceExport = await crmRepo.getWorkspaceExport(req.user!.workspaceId);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="qavon-desk-export.json"');
      return res.send(JSON.stringify(workspaceExport, null, 2));
    } catch (err) {
      return handleRouteError(res, err, 'Failed to export workspace data');
    }
  });

  app.get('/api/system/status', async (_req, res) => {
    try {
      const postgresActive = await isPostgresConnected();
      const entityCounts = await crmRepo.getEntityCounts();
      return res.json({
        status: 'online',
        databaseEngine: postgresActive
          ? 'PostgreSQL (Prisma ORM connected)'
          : 'Relational JSON Store (Prisma Schema ready)',
        databaseConfigured: postgresActive,
        demoMode: isDemoModeEnabled(),
        prismaModels: [
          'User',
          'Workspace',
          'WorkspaceMember',
          'Lead',
          'Company',
          'Contact',
          'Deal',
          'Activity',
          'AuditLog',
        ],
        workspaceIsolation: 'active',
        entityCounts,
      });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to check system status');
    }
  });

  // Catch-all 404 for unknown API endpoints
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Global error safety net (avoids stack leaks)
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    return handleRouteError(res, err, 'Internal server error');
  });

  return app;
}
