import type {
  Activity,
  AnalyticsData,
  Company,
  Contact,
  DashboardSummary,
  Deal,
  DealPriority,
  DealStage,
  Lead,
  User,
  UserRole,
  Workspace,
} from '../../types/crm.ts';
import { dbStore } from './store.ts';
import { PrismaRepository } from './prismaRepository.ts';

export interface CrmRepository {
  readonly mode: 'postgres' | 'json';
  findUserWithPasswordByEmail(email: string): Promise<(User & { passwordHash: string }) | null>;
  findUserById(id: string): Promise<User | null>;
  findUserByIdOrEmail(identifier: string): Promise<User | null>;
  getUsers(workspaceId: string): Promise<User[]>;
  getWorkspace(id: string): Promise<Workspace | null>;
  createUser(userData: {
    email: string;
    passwordHash: string;
    name: string;
    role: UserRole;
    title: string;
    workspaceId: string;
    invitationTokenHash?: string;
    invitationExpiresAt?: Date;
  }): Promise<User>;
  hasPendingInvitation(email: string, workspaceId: string): Promise<boolean>;
  refreshPendingInvitation(
    email: string,
    workspaceId: string,
    tokenHash: string,
    expiresAt: Date,
    invitation: { name: string; role: UserRole; title: string }
  ): Promise<User | null>;
  completeInvitation(tokenHash: string, passwordHash: string): Promise<User | null>;
  createUserWithWorkspace(userData: {
    email: string;
    passwordHash: string;
    name: string;
    companyName?: string;
  }): Promise<{ user: User; workspace: Workspace }>;

  getLeads(
    workspaceId: string,
    options?: { search?: string; status?: string; source?: string }
  ): Promise<Lead[]>;
  createLead(
    leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
    currentUserId: string,
    currentUserName: string
  ): Promise<Lead>;
  updateLead(
    id: string,
    workspaceId: string,
    updates: Partial<
      Pick<
        Lead,
        | 'fullName'
        | 'email'
        | 'phone'
        | 'company'
        | 'jobTitle'
        | 'source'
        | 'status'
        | 'estimatedValue'
        | 'notes'
        | 'assignedToId'
      >
    >,
    currentUserId: string,
    currentUserName: string
  ): Promise<Lead | null>;
  deleteLead(
    id: string,
    workspaceId: string,
    currentUserId: string,
    currentUserName: string
  ): Promise<boolean>;
  convertLeadToDeal(
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
    currentUserId: string,
    currentUserName: string
  ): Promise<{ deal: Deal; company: Company; contact: Contact; lead: Lead } | null>;

  getCompanies(workspaceId: string, search?: string): Promise<Company[]>;
  createCompany(
    companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>,
    currentUserId: string,
    currentUserName: string
  ): Promise<Company>;
  updateCompany(
    id: string,
    workspaceId: string,
    updates: Partial<
      Pick<
        Company,
        'name' | 'industry' | 'website' | 'email' | 'phone' | 'size' | 'address' | 'notes' | 'ownerId'
      >
    >,
    currentUserId: string,
    currentUserName: string
  ): Promise<Company | null>;
  deleteCompany(
    id: string,
    workspaceId: string,
    currentUserId: string,
    currentUserName: string
  ): Promise<boolean>;

  getContacts(workspaceId: string, search?: string, companyId?: string): Promise<Contact[]>;
  createContact(
    contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>,
    currentUserId: string,
    currentUserName: string
  ): Promise<Contact>;
  updateContact(
    id: string,
    workspaceId: string,
    updates: Partial<
      Pick<Contact, 'firstName' | 'lastName' | 'email' | 'phone' | 'companyId' | 'jobTitle' | 'notes'>
    >,
    currentUserId: string,
    currentUserName: string
  ): Promise<Contact | null>;
  deleteContact(
    id: string,
    workspaceId: string,
    currentUserId: string,
    currentUserName: string
  ): Promise<boolean>;

  getDeals(
    workspaceId: string,
    options?: { search?: string; ownerId?: string; priority?: string }
  ): Promise<
    Array<Deal & { companyName?: string; ownerName?: string; ownerAvatar?: string; contactName?: string }>
  >;
  getDealById(
    id: string,
    workspaceId: string
  ): Promise<(Deal & { company?: Company; owner?: User | null; contact?: Contact }) | null>;
  createDeal(
    dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'lastActivityAt'>,
    currentUserId: string,
    currentUserName: string
  ): Promise<Deal>;
  updateDeal(
    id: string,
    workspaceId: string,
    updates: Partial<
      Pick<
        Deal,
        | 'title'
        | 'companyId'
        | 'contactId'
        | 'value'
        | 'stage'
        | 'probability'
        | 'expectedCloseDate'
        | 'ownerId'
        | 'priority'
        | 'description'
        | 'order'
      >
    >,
    currentUserId: string,
    currentUserName: string
  ): Promise<Deal | null>;
  updateDealStage(
    id: string,
    workspaceId: string,
    newStage: DealStage,
    newOrder: number | undefined,
    currentUserId: string,
    currentUserName: string
  ): Promise<Deal | null>;
  deleteDeal(
    id: string,
    workspaceId: string,
    currentUserId: string,
    currentUserName: string
  ): Promise<boolean>;

  getActivities(
    workspaceId: string,
    options?: { type?: string; completed?: boolean; search?: string }
  ): Promise<Array<Activity & { assignedToName?: string; entityLabel?: string }>>;
  createActivity(
    activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>,
    currentUserId: string,
    currentUserName: string
  ): Promise<Activity>;
  updateActivity(
    id: string,
    workspaceId: string,
    updates: Partial<
      Pick<
        Activity,
        | 'type'
        | 'title'
        | 'description'
        | 'completed'
        | 'dueDate'
        | 'assignedToId'
        | 'leadId'
        | 'contactId'
        | 'dealId'
        | 'companyId'
      >
    >,
    currentUserId: string,
    currentUserName: string
  ): Promise<Activity | null>;
  toggleActivityCompleted(
    id: string,
    workspaceId: string,
    currentUserId: string,
    currentUserName: string
  ): Promise<Activity | null>;
  deleteActivity(
    id: string,
    workspaceId: string,
    currentUserId: string,
    currentUserName: string
  ): Promise<boolean>;

  getDashboardSummary(workspaceId: string): Promise<DashboardSummary>;
  getAnalytics(workspaceId: string, range?: string): Promise<AnalyticsData>;
  getWorkspaceExport(workspaceId: string): Promise<Record<string, unknown>>;
  getEntityCounts(): Promise<Record<string, number>>;
  resetDemoData?(): Promise<unknown>;
}

class JsonStoreRepository implements CrmRepository {
  readonly mode = 'json' as const;

  async findUserWithPasswordByEmail(email: string) {
    return dbStore.findUserByEmail(email);
  }
  async findUserById(id: string) {
    return dbStore.findUserById(id);
  }
  async findUserByIdOrEmail(identifier: string) {
    return dbStore.findUserByIdOrEmail(identifier);
  }
  async getUsers(workspaceId: string) {
    return dbStore.getUsers(workspaceId);
  }
  async getWorkspace(id: string) {
    return dbStore.getWorkspace(id);
  }
  async createUser(userData: {
    email: string;
    passwordHash: string;
    name: string;
    role: UserRole;
    title: string;
    workspaceId: string;
    invitationTokenHash?: string;
    invitationExpiresAt?: Date;
  }) {
    return dbStore.createUser(userData);
  }
  async hasPendingInvitation(email: string, workspaceId: string) {
    return dbStore.hasPendingInvitation(email, workspaceId);
  }
  async refreshPendingInvitation(
    email: string,
    workspaceId: string,
    tokenHash: string,
    expiresAt: Date,
    invitation: { name: string; role: UserRole; title: string }
  ) {
    return dbStore.refreshPendingInvitation(email, workspaceId, tokenHash, expiresAt, invitation);
  }
  async completeInvitation(tokenHash: string, passwordHash: string) {
    return dbStore.completeInvitation(tokenHash, passwordHash);
  }
  async createUserWithWorkspace(userData: {
    email: string;
    passwordHash: string;
    name: string;
    companyName?: string;
  }) {
    return dbStore.createUserWithWorkspace(userData);
  }
  async getLeads(workspaceId: string, options?: { search?: string; status?: string; source?: string }) {
    return dbStore.getLeads(workspaceId, options);
  }
  async createLead(
    leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.createLead(leadData, currentUserId, currentUserName);
  }
  async updateLead(
    id: string,
    workspaceId: string,
    updates: Parameters<CrmRepository['updateLead']>[2],
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.updateLead(id, workspaceId, updates, currentUserId, currentUserName);
  }
  async deleteLead(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    return dbStore.deleteLead(id, workspaceId, currentUserId, currentUserName);
  }
  async convertLeadToDeal(
    leadId: string,
    workspaceId: string,
    dealData: Parameters<CrmRepository['convertLeadToDeal']>[2],
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.convertLeadToDeal(leadId, workspaceId, dealData, currentUserId, currentUserName);
  }
  async getCompanies(workspaceId: string, search?: string) {
    return dbStore.getCompanies(workspaceId, search);
  }
  async createCompany(
    companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>,
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.createCompany(companyData, currentUserId, currentUserName);
  }
  async updateCompany(
    id: string,
    workspaceId: string,
    updates: Parameters<CrmRepository['updateCompany']>[2],
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.updateCompany(id, workspaceId, updates, currentUserId, currentUserName);
  }
  async deleteCompany(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    return dbStore.deleteCompany(id, workspaceId, currentUserId, currentUserName);
  }
  async getContacts(workspaceId: string, search?: string, companyId?: string) {
    return dbStore.getContacts(workspaceId, search, companyId);
  }
  async createContact(
    contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>,
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.createContact(contactData, currentUserId, currentUserName);
  }
  async updateContact(
    id: string,
    workspaceId: string,
    updates: Parameters<CrmRepository['updateContact']>[2],
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.updateContact(id, workspaceId, updates, currentUserId, currentUserName);
  }
  async deleteContact(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    return dbStore.deleteContact(id, workspaceId, currentUserId, currentUserName);
  }
  async getDeals(workspaceId: string, options?: { search?: string; ownerId?: string; priority?: string }) {
    return dbStore.getDeals(workspaceId, options);
  }
  async getDealById(id: string, workspaceId: string) {
    return dbStore.getDealById(id, workspaceId);
  }
  async createDeal(
    dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'lastActivityAt'>,
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.createDeal(dealData, currentUserId, currentUserName);
  }
  async updateDeal(
    id: string,
    workspaceId: string,
    updates: Parameters<CrmRepository['updateDeal']>[2],
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.updateDeal(id, workspaceId, updates, currentUserId, currentUserName);
  }
  async updateDealStage(
    id: string,
    workspaceId: string,
    newStage: DealStage,
    newOrder: number | undefined,
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.updateDealStage(id, workspaceId, newStage, newOrder, currentUserId, currentUserName);
  }
  async deleteDeal(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    return dbStore.deleteDeal(id, workspaceId, currentUserId, currentUserName);
  }
  async getActivities(
    workspaceId: string,
    options?: { type?: string; completed?: boolean; search?: string }
  ) {
    return dbStore.getActivities(workspaceId, options);
  }
  async createActivity(
    activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>,
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.createActivity(activityData, currentUserId, currentUserName);
  }
  async updateActivity(
    id: string,
    workspaceId: string,
    updates: Parameters<CrmRepository['updateActivity']>[2],
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.updateActivity(id, workspaceId, updates, currentUserId, currentUserName);
  }
  async toggleActivityCompleted(
    id: string,
    workspaceId: string,
    currentUserId: string,
    currentUserName: string
  ) {
    return dbStore.toggleActivityCompleted(id, workspaceId, currentUserId, currentUserName);
  }
  async deleteActivity(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    return dbStore.deleteActivity(id, workspaceId, currentUserId, currentUserName);
  }
  async getDashboardSummary(workspaceId: string) {
    return dbStore.getDashboardSummary(workspaceId);
  }
  async getAnalytics(workspaceId: string, range?: string) {
    return dbStore.getAnalytics(workspaceId, range);
  }
  async getWorkspaceExport(workspaceId: string) {
    return dbStore.getWorkspaceExport(workspaceId);
  }
  async getEntityCounts() {
    return dbStore.getEntityCounts();
  }
  async resetDemoData() {
    return dbStore.resetDemoData();
  }
}

class PostgresCrmRepository extends PrismaRepository implements CrmRepository {
  readonly mode = 'postgres' as const;
}

const jsonRepo = new JsonStoreRepository();
const postgresRepo = new PostgresCrmRepository();

export function getRepository(): CrmRepository {
  return process.env.DATABASE_URL ? postgresRepo : jsonRepo;
}

export const crmRepo = getRepository();
