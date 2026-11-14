export type UserRole = 'OWNER' | 'ADMIN' | 'SALES_REP';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  title: string;
  workspaceId: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: 'Starter' | 'Professional' | 'Enterprise';
  currency: string;
  timezone: string;
  createdAt: string;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED';
export type LeadSource = 'Website' | 'Referral' | 'LinkedIn' | 'Outbound' | 'Event' | 'Partner';

export interface Lead {
  id: string;
  workspaceId: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  source: LeadSource;
  status: LeadStatus;
  assignedToId: string;
  notes?: string;
  estimatedValue: number;
  convertedToDealId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  workspaceId: string;
  name: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  size: string;
  ownerId: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  workspaceId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string;
  jobTitle: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DealStage =
  | 'NEW_OPPORTUNITY'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export type DealPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Deal {
  id: string;
  workspaceId: string;
  title: string;
  companyId: string;
  contactId?: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string;
  ownerId: string;
  priority: DealPriority;
  description?: string;
  order: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'CALL' | 'MEETING' | 'EMAIL' | 'TASK' | 'FOLLOW_UP';

export interface Activity {
  id: string;
  workspaceId: string;
  type: ActivityType;
  title: string;
  description?: string;
  completed: boolean;
  dueDate: string;
  assignedToId: string;
  leadId?: string;
  contactId?: string;
  dealId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'LEAD' | 'DEAL' | 'COMPANY' | 'CONTACT' | 'ACTIVITY' | 'WORKSPACE';
  entityId: string;
  details: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalPipelineValue: number;
  activeDealsCount: number;
  newLeadsCount: number;
  wonRevenue: number;
  wonDealsCount: number;
  winRate: number;
  averageDealValue: number;
  pipelineChangePct: number;
  activeDealsChangePct: number;
  leadsChangePct: number;
  wonChangePct: number;
  recentDeals: Array<Deal & { companyName?: string; ownerName?: string }>;
  upcomingActivities: Array<Activity & { assignedToName?: string; entityLabel?: string }>;
  recentAuditLogs: AuditLog[];
  stageSummaries: Array<{
    stage: DealStage;
    label: string;
    count: number;
    totalValue: number;
  }>;
}

export interface AnalyticsData {
  revenueTrend: Array<{
    month: string;
    pipeline: number;
    won: number;
  }>;
  stageBreakdown: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  wonVsLost: {
    wonCount: number;
    wonValue: number;
    lostCount: number;
    lostValue: number;
    winRate: number;
  };
  conversionFunnel: Array<{
    step: string;
    count: number;
    conversionRate: number;
  }>;
  repPerformance: Array<{
    id: string;
    name: string;
    avatar: string;
    dealsWon: number;
    revenueWon: number;
    activePipeline: number;
    activitiesCompleted: number;
  }>;
  keyMetrics: {
    avgDealCycleDays: number;
    avgDealSize: number;
    totalOpportunities: number;
    leadToWonRate: number;
  };
}
