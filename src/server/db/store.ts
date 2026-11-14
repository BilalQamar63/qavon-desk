import fs from 'fs';
import path from 'path';
import {
  User,
  Workspace,
  Lead,
  Company,
  Contact,
  Deal,
  DealStage,
  Activity,
  AuditLog,
  DashboardSummary,
  AnalyticsData,
  UserRole,
} from '../../types/crm.ts';

const PRIMARY_DATA_DIR = path.resolve(process.cwd(), 'data');
const FALLBACK_DATA_DIR = path.resolve('/tmp', 'qavon_desk_data');
const DEMO_PASSWORD_HASH = '$2b$10$leqMvpKMN48cNUQUgxZLk.JYzjebTFgEr1Z8XMnocCdAKnKQysCIO'; // "password123"
const LEGACY_PLACEHOLDER_HASH = '$2a$10$fG6T5R3W4E2Q1Y8U9I0O.eQ8x5a3b2c1d4e5f6g7h8i9j0k1l2m3n';

function createHttpError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

export interface DatabaseSchema {
  workspaces: Workspace[];
  users: Array<User & { passwordHash: string }>;
  leads: Lead[];
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  auditLogs: AuditLog[];
}

function generateInitialData(): DatabaseSchema {
  const workspaceId = 'ws-acme-1';

  const workspace: Workspace = {
    id: workspaceId,
    name: 'Acme Cloud Dynamics',
    slug: 'acme-corp',
    plan: 'Professional',
    currency: 'USD',
    timezone: 'America/New_York',
    createdAt: '2026-01-15T09:00:00Z',
  };

  const users: Array<User & { passwordHash: string }> = [
    {
      id: 'usr-1',
      email: 'sarah.jenkins@acme.io',
      name: 'Sarah Jenkins',
      role: 'OWNER',
      title: 'VP of Global Sales',
      avatar: '',
      workspaceId,
      createdAt: '2026-01-15T09:00:00Z',
      passwordHash: DEMO_PASSWORD_HASH,
    },
    {
      id: 'usr-2',
      email: 'david.vance@acme.io',
      name: 'David Vance',
      role: 'ADMIN',
      title: 'Sales Operations Lead',
      avatar: '',
      workspaceId,
      createdAt: '2026-01-16T10:00:00Z',
      passwordHash: DEMO_PASSWORD_HASH,
    },
    {
      id: 'usr-3',
      email: 'elena.rostova@acme.io',
      name: 'Elena Rostova',
      role: 'SALES_REP',
      title: 'Senior Account Executive',
      avatar: '',
      workspaceId,
      createdAt: '2026-01-20T11:00:00Z',
      passwordHash: DEMO_PASSWORD_HASH,
    },
  ];

  const companies: Company[] = [
    {
      id: 'cmp-1',
      workspaceId,
      name: 'CloudScale Analytics',
      industry: 'Enterprise Software',
      website: 'https://cloudscale.io',
      email: 'contact@cloudscale.io',
      phone: '+1 (415) 890-2341',
      size: '250-500 employees',
      address: '500 Howard St, San Francisco, CA',
      ownerId: 'usr-1',
      notes: 'Series C cloud infrastructure observability provider. Looking to unify revenue pipelines.',
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'cmp-2',
      workspaceId,
      name: 'Apex FinTech Systems',
      industry: 'Financial Services',
      website: 'https://apexfintech.com',
      email: 'procurement@apexfintech.com',
      phone: '+1 (212) 555-0198',
      size: '100-250 employees',
      address: '140 Broadway, New York, NY',
      ownerId: 'usr-3',
      notes: 'High-frequency trading middleware and portfolio compliance engines.',
      createdAt: '2026-02-05T14:30:00Z',
      updatedAt: '2026-03-02T11:20:00Z',
    },
    {
      id: 'cmp-3',
      workspaceId,
      name: 'BioGen Discovery',
      industry: 'Biotechnology & Health',
      website: 'https://biogendiscovery.org',
      email: 'partnerships@biogen.org',
      phone: '+1 (617) 555-8832',
      size: '50-100 employees',
      address: '200 Cambridge St, Boston, MA',
      ownerId: 'usr-3',
      notes: 'Genomics data processing and clinical assay automation laboratory.',
      createdAt: '2026-02-10T09:15:00Z',
      updatedAt: '2026-03-05T16:00:00Z',
    },
    {
      id: 'cmp-4',
      workspaceId,
      name: 'Nexus Logistics Global',
      industry: 'Supply Chain & Freight',
      website: 'https://nexuslogistics.com',
      email: 'operations@nexuslogistics.com',
      phone: '+1 (312) 555-7744',
      size: '500+ employees',
      address: '300 N LaSalle, Chicago, IL',
      ownerId: 'usr-1',
      notes: 'Intermodal freight management network across North America and Europe.',
      createdAt: '2026-02-12T11:45:00Z',
      updatedAt: '2026-03-08T14:10:00Z',
    },
    {
      id: 'cmp-5',
      workspaceId,
      name: 'CyberShield Solutions',
      industry: 'Cybersecurity',
      website: 'https://cybershield.security',
      email: 'secops@cybershield.security',
      phone: '+1 (512) 555-3211',
      size: '50-100 employees',
      address: '100 Congress Ave, Austin, TX',
      ownerId: 'usr-2',
      notes: 'Zero-trust enterprise identity and perimeter defense solutions.',
      createdAt: '2026-02-18T13:20:00Z',
      updatedAt: '2026-03-10T12:00:00Z',
    },
    {
      id: 'cmp-6',
      workspaceId,
      name: 'OmniHealth Networks',
      industry: 'Healthcare Technology',
      website: 'https://omnihealth.net',
      email: 'info@omnihealth.net',
      phone: '+1 (206) 555-9081',
      size: '250-500 employees',
      address: '1201 3rd Ave, Seattle, WA',
      ownerId: 'usr-3',
      notes: 'Telehealth patient portal and regional clinic coordination network.',
      createdAt: '2026-02-22T10:10:00Z',
      updatedAt: '2026-03-12T15:30:00Z',
    },
    {
      id: 'cmp-7',
      workspaceId,
      name: 'Quantum Retail Group',
      industry: 'Omnichannel Retail',
      website: 'https://quantumretail.co',
      email: 'vendor-ops@quantumretail.co',
      phone: '+1 (612) 555-4309',
      size: '500+ employees',
      address: '800 Nicollet Mall, Minneapolis, MN',
      ownerId: 'usr-1',
      notes: 'Modernized retail POS and inventory sync platform for 120 storefronts.',
      createdAt: '2026-02-25T16:00:00Z',
      updatedAt: '2026-03-14T09:45:00Z',
    },
    {
      id: 'cmp-8',
      workspaceId,
      name: 'Stratos Aerospace Corp',
      industry: 'Aerospace & Defense',
      website: 'https://stratosaero.com',
      email: 'contracts@stratosaero.com',
      phone: '+1 (303) 555-6677',
      size: '500+ employees',
      address: '1801 California St, Denver, CO',
      ownerId: 'usr-2',
      notes: 'Avionics testing software and satellite payload telemetry sensors.',
      createdAt: '2026-03-01T08:30:00Z',
      updatedAt: '2026-03-15T11:15:00Z',
    },
  ];

  const contacts: Contact[] = [
    {
      id: 'cnt-1',
      workspaceId,
      firstName: 'Marcus',
      lastName: 'Chen',
      email: 'marcus.chen@cloudscale.io',
      phone: '+1 (415) 890-2342',
      companyId: 'cmp-1',
      jobTitle: 'Chief Technology Officer',
      notes: 'Key technical decision maker. Enforces SSO, SOC2, and API stability.',
      createdAt: '2026-02-01T10:30:00Z',
      updatedAt: '2026-03-01T10:30:00Z',
    },
    {
      id: 'cnt-2',
      workspaceId,
      firstName: 'Jessica',
      lastName: 'Alvarez',
      email: 'j.alvarez@cloudscale.io',
      phone: '+1 (415) 890-2345',
      companyId: 'cmp-1',
      jobTitle: 'VP of Product Engineering',
      notes: 'Manages 45 product engineers. Championing the platform migration.',
      createdAt: '2026-02-02T11:00:00Z',
      updatedAt: '2026-03-01T10:30:00Z',
    },
    {
      id: 'cnt-3',
      workspaceId,
      firstName: 'Jonathan',
      lastName: 'Sterling',
      email: 'jsterling@apexfintech.com',
      phone: '+1 (212) 555-0199',
      companyId: 'cmp-2',
      jobTitle: 'Head of Quantitative Infrastructure',
      notes: 'Focused on low latency and automated SLA guarantees.',
      createdAt: '2026-02-06T15:00:00Z',
      updatedAt: '2026-03-02T11:20:00Z',
    },
    {
      id: 'cnt-4',
      workspaceId,
      firstName: 'Dr. Aris',
      lastName: 'Thorne',
      email: 'athorne@biogen.org',
      phone: '+1 (617) 555-8833',
      companyId: 'cmp-3',
      jobTitle: 'Director of Bio-informatics',
      notes: 'Evaluated our SDK during the annual Cambridge LifeSci Summit.',
      createdAt: '2026-02-11T09:30:00Z',
      updatedAt: '2026-03-05T16:00:00Z',
    },
    {
      id: 'cnt-5',
      workspaceId,
      firstName: 'Michael',
      lastName: 'O\'Connor',
      email: 'm.oconnor@nexuslogistics.com',
      phone: '+1 (312) 555-7745',
      companyId: 'cmp-4',
      jobTitle: 'Chief Operating Officer',
      notes: 'Wants cross-border route optimization and dispatch CRM synchronization.',
      createdAt: '2026-02-13T12:00:00Z',
      updatedAt: '2026-03-08T14:10:00Z',
    },
    {
      id: 'cnt-6',
      workspaceId,
      firstName: 'Rachel',
      lastName: 'Greenberg',
      email: 'rachel@cybershield.security',
      phone: '+1 (512) 555-3212',
      companyId: 'cmp-5',
      jobTitle: 'VP of Enterprise Solutions',
      notes: 'Former CISO at Fortinet. Requires custom SLA contracts.',
      createdAt: '2026-02-19T14:00:00Z',
      updatedAt: '2026-03-10T12:00:00Z',
    },
    {
      id: 'cnt-7',
      workspaceId,
      firstName: 'Dr. Evelyn',
      lastName: 'Reed',
      email: 'ereed@omnihealth.net',
      phone: '+1 (206) 555-9082',
      companyId: 'cmp-6',
      jobTitle: 'Chief Medical Information Officer',
      notes: 'Focuses on HIPAA compliance and seamless physician onboarding.',
      createdAt: '2026-02-23T10:45:00Z',
      updatedAt: '2026-03-12T15:30:00Z',
    },
    {
      id: 'cnt-8',
      workspaceId,
      firstName: 'Siddharth',
      lastName: 'Patel',
      email: 'spatel@quantumretail.co',
      phone: '+1 (612) 555-4310',
      companyId: 'cmp-7',
      jobTitle: 'Director of Omnichannel Tech',
      notes: 'Leading their 2026 point-of-sale transformation across store chains.',
      createdAt: '2026-02-26T16:30:00Z',
      updatedAt: '2026-03-14T09:45:00Z',
    },
    {
      id: 'cnt-9',
      workspaceId,
      firstName: 'Col. Thomas',
      lastName: 'West',
      email: 'twest@stratosaero.com',
      phone: '+1 (303) 555-6678',
      companyId: 'cmp-8',
      jobTitle: 'VP of Commercial Programs',
      notes: 'Leading commercial avionics vendor procurement.',
      createdAt: '2026-03-02T09:00:00Z',
      updatedAt: '2026-03-15T11:15:00Z',
    },
    {
      id: 'cnt-10',
      workspaceId,
      firstName: 'Sophia',
      lastName: 'Kim',
      email: 'sophia.kim@apexfintech.com',
      phone: '+1 (212) 555-0205',
      companyId: 'cmp-2',
      jobTitle: 'VP of Strategic Partnerships',
      notes: 'Coordinates joint co-selling and revenue-sharing terms.',
      createdAt: '2026-03-03T11:30:00Z',
      updatedAt: '2026-03-15T14:00:00Z',
    },
    {
      id: 'cnt-11',
      workspaceId,
      firstName: 'Daniel',
      lastName: 'Morales',
      email: 'dmorales@nexuslogistics.com',
      phone: '+1 (312) 555-7750',
      companyId: 'cmp-4',
      jobTitle: 'Director of Fleet Technology',
      notes: 'Oversees in-cab telematics and mobile driver apps.',
      createdAt: '2026-03-04T13:15:00Z',
      updatedAt: '2026-03-16T10:00:00Z',
    },
    {
      id: 'cnt-12',
      workspaceId,
      firstName: 'Camilla',
      lastName: 'Lindqvist',
      email: 'camilla@cloudscale.io',
      phone: '+1 (415) 890-2348',
      companyId: 'cmp-1',
      jobTitle: 'VP of Business Development',
      notes: 'Handles vendor consolidation and global enterprise agreements.',
      createdAt: '2026-03-06T15:20:00Z',
      updatedAt: '2026-03-16T16:00:00Z',
    },
  ];

  const leads: Lead[] = [
    {
      id: 'led-1',
      workspaceId,
      fullName: 'Benjamin Hayes',
      email: 'b.hayes@vertexrobotics.ai',
      phone: '+1 (408) 555-0182',
      company: 'Vertex Robotics',
      jobTitle: 'Head of Autonomous Systems',
      source: 'Website',
      status: 'NEW',
      assignedToId: 'usr-3',
      estimatedValue: 48000,
      notes: 'Inbound demo request submitted through product comparison page. Interested in API scale.',
      createdAt: '2026-03-10T14:22:00Z',
      updatedAt: '2026-03-10T14:22:00Z',
    },
    {
      id: 'led-2',
      workspaceId,
      fullName: 'Natasha Roman',
      email: 'nroman@aerovanguard.com',
      phone: '+1 (206) 555-7834',
      company: 'AeroVanguard Propulsion',
      jobTitle: 'Director of Flight Software',
      source: 'Referral',
      status: 'CONTACTED',
      assignedToId: 'usr-1',
      estimatedValue: 65000,
      notes: 'Referred by Stratos Aerospace. Sent preliminary one-pager on high-reliability cloud sync.',
      createdAt: '2026-03-08T09:15:00Z',
      updatedAt: '2026-03-11T16:00:00Z',
    },
    {
      id: 'led-3',
      workspaceId,
      fullName: 'Kavita Rao',
      email: 'k.rao@solarsync.energy',
      phone: '+1 (602) 555-3490',
      company: 'SolarSync Power',
      jobTitle: 'VP of Commercial Operations',
      source: 'LinkedIn',
      status: 'QUALIFIED',
      assignedToId: 'usr-3',
      estimatedValue: 72000,
      notes: 'Completed qualification call. Budget approved for Q2 deployment across 14 solar facilities.',
      createdAt: '2026-03-05T11:00:00Z',
      updatedAt: '2026-03-12T10:30:00Z',
    },
    {
      id: 'led-4',
      workspaceId,
      fullName: 'Tariq Al-Mansoor',
      email: 'tariq@gulfdata.ae',
      phone: '+971 4 555 8921',
      company: 'Gulf Data Stream',
      jobTitle: 'Managing Director',
      source: 'Event',
      status: 'CONTACTED',
      assignedToId: 'usr-2',
      estimatedValue: 95000,
      notes: 'Met at Dubai Tech Summit. Reviewing cross-border data residency requirements.',
      createdAt: '2026-03-06T15:45:00Z',
      updatedAt: '2026-03-09T13:20:00Z',
    },
    {
      id: 'led-5',
      workspaceId,
      fullName: 'Claire Beaumont',
      email: 'cbeaumont@lumierehealth.fr',
      phone: '+33 1 42 68 55 00',
      company: 'Lumiere Diagnostics',
      jobTitle: 'Chief Medical Officer',
      source: 'Website',
      status: 'NEW',
      assignedToId: 'usr-3',
      estimatedValue: 38000,
      notes: 'Downloaded whitepaper on medical record latency reduction.',
      createdAt: '2026-03-11T08:00:00Z',
      updatedAt: '2026-03-11T08:00:00Z',
    },
    {
      id: 'led-6',
      workspaceId,
      fullName: 'Gregory Powell',
      email: 'gpowell@titanhaul.com',
      phone: '+1 (313) 555-4411',
      company: 'Titan Haul Logistics',
      jobTitle: 'Fleet Telematics Manager',
      source: 'Outbound',
      status: 'QUALIFIED',
      assignedToId: 'usr-1',
      estimatedValue: 54000,
      notes: 'Looking to replace legacy Salesforce instance with a fast, modern B2B pipeline.',
      createdAt: '2026-03-03T10:15:00Z',
      updatedAt: '2026-03-13T11:00:00Z',
    },
    {
      id: 'led-7',
      workspaceId,
      fullName: 'Amara Okafor',
      email: 'amara@pulsepay.ng',
      phone: '+234 1 555 6789',
      company: 'PulsePay Africa',
      jobTitle: 'Head of Growth',
      source: 'Partner',
      status: 'NEW',
      assignedToId: 'usr-3',
      estimatedValue: 32000,
      notes: 'Partner referral through African FinTech accelerator. Exploring regional sandbox pilot.',
      createdAt: '2026-03-12T13:10:00Z',
      updatedAt: '2026-03-12T13:10:00Z',
    },
    {
      id: 'led-8',
      workspaceId,
      fullName: 'Lars Lindemann',
      email: 'lars@berlinmicro.de',
      phone: '+49 30 555 2311',
      company: 'Berlin Micro Optics',
      jobTitle: 'Procurement Director',
      source: 'Website',
      status: 'UNQUALIFIED',
      assignedToId: 'usr-2',
      estimatedValue: 12000,
      notes: 'Seeking hardware distribution only; does not match our SaaS software integration profile.',
      createdAt: '2026-03-01T12:00:00Z',
      updatedAt: '2026-03-04T15:00:00Z',
    },
    {
      id: 'led-9',
      workspaceId,
      fullName: 'Hannah Vance',
      email: 'hvance@cascadeagri.com',
      phone: '+1 (509) 555-9034',
      company: 'Cascade Precision Agriculture',
      jobTitle: 'Chief Information Officer',
      source: 'Outbound',
      status: 'CONTACTED',
      assignedToId: 'usr-3',
      estimatedValue: 44000,
      notes: 'Interested in field telemetry sync with offline-first client capabilities.',
      createdAt: '2026-03-07T16:20:00Z',
      updatedAt: '2026-03-10T14:00:00Z',
    },
    {
      id: 'led-10',
      workspaceId,
      fullName: 'Diego Vasquez',
      email: 'd.vasquez@andinaenergy.cl',
      phone: '+56 2 555 1290',
      company: 'Andina Renewable Energy',
      jobTitle: 'VP Infrastructure',
      source: 'LinkedIn',
      status: 'QUALIFIED',
      assignedToId: 'usr-1',
      estimatedValue: 88000,
      notes: 'Fast-growing hydro-solar grid operator. Ready for RFP in early April.',
      createdAt: '2026-03-04T09:30:00Z',
      updatedAt: '2026-03-14T11:45:00Z',
    },
    {
      id: 'led-11',
      workspaceId,
      fullName: 'Mei-Ling Zhou',
      email: 'mlzhou@taipeisemi.tw',
      phone: '+886 2 555 3481',
      company: 'Taipei Silicon Systems',
      jobTitle: 'Director of Wafer Operations',
      source: 'Event',
      status: 'NEW',
      assignedToId: 'usr-2',
      estimatedValue: 110000,
      notes: 'High-value enterprise semiconductor lead from Semicon West. Follow-up meeting scheduled.',
      createdAt: '2026-03-11T17:00:00Z',
      updatedAt: '2026-03-11T17:00:00Z',
    },
    {
      id: 'led-12',
      workspaceId,
      fullName: 'Patrick Murphy',
      email: 'pmurphy@dublinfin.ie',
      phone: '+353 1 555 8923',
      company: 'Dublin Financial Cloud',
      jobTitle: 'Chief Compliance Officer',
      source: 'Website',
      status: 'CONTACTED',
      assignedToId: 'usr-3',
      estimatedValue: 56000,
      notes: 'Requesting GDPR DPA and ISO 27001 documentation pack.',
      createdAt: '2026-03-09T11:15:00Z',
      updatedAt: '2026-03-12T09:30:00Z',
    },
    {
      id: 'led-13',
      workspaceId,
      fullName: 'Evelyn St. Clair',
      email: 'evelyn@stclaircreative.co.uk',
      phone: '+44 20 7946 0912',
      company: 'St. Clair Global Agency',
      jobTitle: 'Managing Partner',
      source: 'Referral',
      status: 'NEW',
      assignedToId: 'usr-1',
      estimatedValue: 28000,
      notes: 'Agency partnership seeking white-label reporting for 18 brand clients.',
      createdAt: '2026-03-12T14:00:00Z',
      updatedAt: '2026-03-12T14:00:00Z',
    },
    {
      id: 'led-14',
      workspaceId,
      fullName: 'Brian Holmgren',
      email: 'brian@nordicsecurity.se',
      phone: '+46 8 555 1209',
      company: 'Nordic Securitas',
      jobTitle: 'Security Systems Architect',
      source: 'LinkedIn',
      status: 'QUALIFIED',
      assignedToId: 'usr-3',
      estimatedValue: 62000,
      notes: 'Technical evaluation passed. Moving to commercial agreement review next week.',
      createdAt: '2026-03-05T13:00:00Z',
      updatedAt: '2026-03-13T15:30:00Z',
    },
  ];

  const deals: Deal[] = [
    // 1. NEW_OPPORTUNITY
    {
      id: 'del-1',
      workspaceId,
      title: 'Enterprise Pipeline Observability Expansion',
      companyId: 'cmp-1',
      contactId: 'cnt-1',
      value: 65000,
      stage: 'NEW_OPPORTUNITY',
      probability: 25,
      expectedCloseDate: '2026-05-15',
      ownerId: 'usr-1',
      priority: 'HIGH',
      description: 'Expansion of Qavon Desk telemetry across 240 internal developers and product teams.',
      order: 0,
      lastActivityAt: '2026-03-10T14:00:00Z',
      createdAt: '2026-02-15T10:00:00Z',
      updatedAt: '2026-03-10T14:00:00Z',
    },
    {
      id: 'del-2',
      workspaceId,
      title: 'Digital Health Telemetry Pilot',
      companyId: 'cmp-6',
      contactId: 'cnt-7',
      value: 42000,
      stage: 'NEW_OPPORTUNITY',
      probability: 20,
      expectedCloseDate: '2026-05-30',
      ownerId: 'usr-3',
      priority: 'MEDIUM',
      description: 'Initial pilot deployment across 3 regional clinics with automated patient follow-ups.',
      order: 1,
      lastActivityAt: '2026-03-11T11:00:00Z',
      createdAt: '2026-02-28T15:00:00Z',
      updatedAt: '2026-03-11T11:00:00Z',
    },
    {
      id: 'del-3',
      workspaceId,
      title: 'Avionics Telemetry Integration Phase 1',
      companyId: 'cmp-8',
      contactId: 'cnt-9',
      value: 85000,
      stage: 'NEW_OPPORTUNITY',
      probability: 30,
      expectedCloseDate: '2026-06-15',
      ownerId: 'usr-2',
      priority: 'HIGH',
      description: 'Hardware test rig data capture and automated certification audit reporting.',
      order: 2,
      lastActivityAt: '2026-03-12T16:00:00Z',
      createdAt: '2026-03-01T09:30:00Z',
      updatedAt: '2026-03-12T16:00:00Z',
    },

    // 2. QUALIFIED
    {
      id: 'del-4',
      workspaceId,
      title: 'Multi-Asset Trading CRM Migration',
      companyId: 'cmp-2',
      contactId: 'cnt-3',
      value: 110000,
      stage: 'QUALIFIED',
      probability: 45,
      expectedCloseDate: '2026-04-30',
      ownerId: 'usr-3',
      priority: 'HIGH',
      description: 'Replacement of legacy CRM with sub-second API sync and compliance event logging.',
      order: 0,
      lastActivityAt: '2026-03-13T10:15:00Z',
      createdAt: '2026-02-10T11:00:00Z',
      updatedAt: '2026-03-13T10:15:00Z',
    },
    {
      id: 'del-5',
      workspaceId,
      title: 'Omnichannel Store POS Sync Engine',
      companyId: 'cmp-7',
      contactId: 'cnt-8',
      value: 75000,
      stage: 'QUALIFIED',
      probability: 40,
      expectedCloseDate: '2026-05-20',
      ownerId: 'usr-1',
      priority: 'MEDIUM',
      description: 'Syncing in-store VIP customer profiles with digital sales pipelines across 120 stores.',
      order: 1,
      lastActivityAt: '2026-03-09T14:30:00Z',
      createdAt: '2026-02-25T14:00:00Z',
      updatedAt: '2026-03-09T14:30:00Z',
    },
    {
      id: 'del-6',
      workspaceId,
      title: 'Bio-Assay Pipeline Automation Suite',
      companyId: 'cmp-3',
      contactId: 'cnt-4',
      value: 58000,
      stage: 'QUALIFIED',
      probability: 50,
      expectedCloseDate: '2026-04-25',
      ownerId: 'usr-3',
      priority: 'MEDIUM',
      description: 'Tracking clinical assay batch milestones and pharma partner collaboration.',
      order: 2,
      lastActivityAt: '2026-03-12T13:45:00Z',
      createdAt: '2026-02-18T10:30:00Z',
      updatedAt: '2026-03-12T13:45:00Z',
    },

    // 3. PROPOSAL_SENT
    {
      id: 'del-7',
      workspaceId,
      title: 'Global Intermodal Dispatch Platform',
      companyId: 'cmp-4',
      contactId: 'cnt-5',
      value: 145000,
      stage: 'PROPOSAL_SENT',
      probability: 65,
      expectedCloseDate: '2026-04-15',
      ownerId: 'usr-1',
      priority: 'HIGH',
      description: 'Complete sales and operations dispatch suite covering rail, road, and maritime terminals.',
      order: 0,
      lastActivityAt: '2026-03-14T09:00:00Z',
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-03-14T09:00:00Z',
    },
    {
      id: 'del-8',
      workspaceId,
      title: 'Enterprise Perimeter Zero-Trust Rollout',
      companyId: 'cmp-5',
      contactId: 'cnt-6',
      value: 92000,
      stage: 'PROPOSAL_SENT',
      probability: 60,
      expectedCloseDate: '2026-04-10',
      ownerId: 'usr-2',
      priority: 'HIGH',
      description: 'Securing sales operations portals with SSO, hardware keys, and audit event retention.',
      order: 1,
      lastActivityAt: '2026-03-13T16:20:00Z',
      createdAt: '2026-02-01T15:00:00Z',
      updatedAt: '2026-03-13T16:20:00Z',
    },
    {
      id: 'del-9',
      workspaceId,
      title: 'North American Regional Logistics Modernization',
      companyId: 'cmp-4',
      contactId: 'cnt-11',
      value: 88000,
      stage: 'PROPOSAL_SENT',
      probability: 70,
      expectedCloseDate: '2026-04-18',
      ownerId: 'usr-1',
      priority: 'MEDIUM',
      description: 'Mobile field quoting tool for logistics fleet managers and field brokers.',
      order: 2,
      lastActivityAt: '2026-03-11T15:00:00Z',
      createdAt: '2026-02-12T11:00:00Z',
      updatedAt: '2026-03-11T15:00:00Z',
    },
    {
      id: 'del-10',
      workspaceId,
      title: 'Algorithmic Trading Compliance Suite',
      companyId: 'cmp-2',
      contactId: 'cnt-10',
      value: 85000,
      stage: 'PROPOSAL_SENT',
      probability: 65,
      expectedCloseDate: '2026-04-20',
      ownerId: 'usr-3',
      priority: 'MEDIUM',
      description: 'Securities trading audit trail integration and counterparty compliance checks.',
      order: 3,
      lastActivityAt: '2026-03-14T11:00:00Z',
      createdAt: '2026-02-14T14:00:00Z',
      updatedAt: '2026-03-14T11:00:00Z',
    },

    // 4. NEGOTIATION
    {
      id: 'del-11',
      workspaceId,
      title: 'Global Engineering Telemetry Multi-Year Agreement',
      companyId: 'cmp-1',
      contactId: 'cnt-2',
      value: 175000,
      stage: 'NEGOTIATION',
      probability: 80,
      expectedCloseDate: '2026-03-31',
      ownerId: 'usr-1',
      priority: 'HIGH',
      description: '3-year master services agreement for 500 enterprise seats. Legal finalizing MSA terms.',
      order: 0,
      lastActivityAt: '2026-03-14T17:30:00Z',
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-03-14T17:30:00Z',
    },
    {
      id: 'del-12',
      workspaceId,
      title: 'Healthcare Enterprise Patient Pipeline System',
      companyId: 'cmp-6',
      contactId: 'cnt-7',
      value: 125000,
      stage: 'NEGOTIATION',
      probability: 85,
      expectedCloseDate: '2026-04-05',
      ownerId: 'usr-3',
      priority: 'HIGH',
      description: 'Full HIPAA Business Associate Agreement (BAA) signed. Procurement doing final price tier sign-off.',
      order: 1,
      lastActivityAt: '2026-03-13T11:45:00Z',
      createdAt: '2026-01-18T13:00:00Z',
      updatedAt: '2026-03-13T11:45:00Z',
    },
    {
      id: 'del-13',
      workspaceId,
      title: 'Aerospace Flight Readiness CRM Integration',
      companyId: 'cmp-8',
      contactId: 'cnt-9',
      value: 80000,
      stage: 'NEGOTIATION',
      probability: 75,
      expectedCloseDate: '2026-04-08',
      ownerId: 'usr-2',
      priority: 'MEDIUM',
      description: 'Security clearance review passed. Adjusting payment schedule to quarterly milestone billing.',
      order: 2,
      lastActivityAt: '2026-03-12T14:15:00Z',
      createdAt: '2026-02-05T10:00:00Z',
      updatedAt: '2026-03-12T14:15:00Z',
    },

    // 5. WON
    {
      id: 'del-14',
      workspaceId,
      title: 'Enterprise Cyber Defense Master Contract',
      companyId: 'cmp-5',
      contactId: 'cnt-6',
      value: 210000,
      stage: 'WON',
      probability: 100,
      expectedCloseDate: '2026-02-28',
      ownerId: 'usr-2',
      priority: 'HIGH',
      description: 'Successfully closed! 2-year deal for enterprise-wide threat telemetry pipeline.',
      order: 0,
      lastActivityAt: '2026-02-28T18:00:00Z',
      createdAt: '2026-01-05T11:00:00Z',
      updatedAt: '2026-02-28T18:00:00Z',
    },
    {
      id: 'del-15',
      workspaceId,
      title: 'National Retail VIP Pipeline Deployment',
      companyId: 'cmp-7',
      contactId: 'cnt-8',
      value: 165000,
      stage: 'WON',
      probability: 100,
      expectedCloseDate: '2026-03-01',
      ownerId: 'usr-1',
      priority: 'HIGH',
      description: 'Won against competitor. Full onboarding initiated for 6 regional directorates.',
      order: 1,
      lastActivityAt: '2026-03-01T15:30:00Z',
      createdAt: '2026-01-15T14:00:00Z',
      updatedAt: '2026-03-01T15:30:00Z',
    },
    {
      id: 'del-16',
      workspaceId,
      title: 'Bio-Informatics Research Laboratory License',
      companyId: 'cmp-3',
      contactId: 'cnt-4',
      value: 120000,
      stage: 'WON',
      probability: 100,
      expectedCloseDate: '2026-03-05',
      ownerId: 'usr-3',
      priority: 'MEDIUM',
      description: 'Annual enterprise lab license signed with automatic renewal clause.',
      order: 2,
      lastActivityAt: '2026-03-05T17:00:00Z',
      createdAt: '2026-01-22T09:30:00Z',
      updatedAt: '2026-03-05T17:00:00Z',
    },

    // 6. LOST
    {
      id: 'del-17',
      workspaceId,
      title: 'Mid-Market Freight Terminal Pilot',
      companyId: 'cmp-4',
      contactId: 'cnt-11',
      value: 65000,
      stage: 'LOST',
      probability: 0,
      expectedCloseDate: '2026-02-15',
      ownerId: 'usr-3',
      priority: 'LOW',
      description: 'Lost to incumbent internal IT build due to temporary capex freeze.',
      order: 0,
      lastActivityAt: '2026-02-15T16:00:00Z',
      createdAt: '2026-01-08T10:00:00Z',
      updatedAt: '2026-02-15T16:00:00Z',
    },
    {
      id: 'del-18',
      workspaceId,
      title: 'Commodity Trading Risk Gateway',
      companyId: 'cmp-2',
      contactId: 'cnt-10',
      value: 110000,
      stage: 'LOST',
      probability: 0,
      expectedCloseDate: '2026-02-20',
      ownerId: 'usr-2',
      priority: 'MEDIUM',
      description: 'Client postponed cloud migration to Q4 2026 due to regulatory compliance restructuring.',
      order: 1,
      lastActivityAt: '2026-02-20T14:30:00Z',
      createdAt: '2026-01-12T13:00:00Z',
      updatedAt: '2026-02-20T14:30:00Z',
    },
  ];

  const activities: Activity[] = [
    {
      id: 'act-1',
      workspaceId,
      type: 'CALL',
      title: 'Review MSA redlines with CloudScale legal counsel',
      description: 'Finalize indemnity cap and service level credits before contract signature.',
      completed: false,
      dueDate: '2026-03-13T10:00:00Z',
      assignedToId: 'usr-1',
      companyId: 'cmp-1',
      dealId: 'del-11',
      createdAt: '2026-03-10T11:00:00Z',
      updatedAt: '2026-03-10T11:00:00Z',
    },
    {
      id: 'act-2',
      workspaceId,
      type: 'MEETING',
      title: 'Quarterly pipeline sync with OmniHealth VP',
      description: 'Demonstrate custom deal stages and automated follow-up scheduling.',
      completed: false,
      dueDate: '2026-03-14T15:30:00Z',
      assignedToId: 'usr-3',
      companyId: 'cmp-6',
      contactId: 'cnt-7',
      dealId: 'del-12',
      createdAt: '2026-03-11T09:00:00Z',
      updatedAt: '2026-03-11T09:00:00Z',
    },
    {
      id: 'act-3',
      workspaceId,
      type: 'FOLLOW_UP',
      title: 'Overdue: Send security architecture whitepaper to Apex FinTech',
      description: 'Jonathan Sterling requested SOC2 Type II report and penetration test executive summary.',
      completed: false,
      dueDate: '2026-03-08T17:00:00Z', // Overdue
      assignedToId: 'usr-3',
      companyId: 'cmp-2',
      contactId: 'cnt-3',
      dealId: 'del-4',
      createdAt: '2026-03-06T14:00:00Z',
      updatedAt: '2026-03-06T14:00:00Z',
    },
    {
      id: 'act-4',
      workspaceId,
      type: 'EMAIL',
      title: 'Dispatch proposal pricing breakdown to Nexus Logistics COO',
      description: 'Send revised multi-tier terminal pricing schedule for 14 freight yards.',
      completed: false,
      dueDate: '2026-03-15T12:00:00Z',
      assignedToId: 'usr-1',
      companyId: 'cmp-4',
      contactId: 'cnt-5',
      dealId: 'del-7',
      createdAt: '2026-03-12T10:00:00Z',
      updatedAt: '2026-03-12T10:00:00Z',
    },
    {
      id: 'act-5',
      workspaceId,
      type: 'TASK',
      title: 'Prepare executive KPI presentation for Monday board review',
      description: 'Aggregate monthly won revenue ($495k) and conversion rate trends.',
      completed: false,
      dueDate: '2026-03-16T09:00:00Z',
      assignedToId: 'usr-2',
      createdAt: '2026-03-12T14:00:00Z',
      updatedAt: '2026-03-12T14:00:00Z',
    },
    {
      id: 'act-6',
      workspaceId,
      type: 'CALL',
      title: 'Overdue: Follow-up with Benjamin Hayes at Vertex Robotics',
      description: 'Confirm their engineering team received the sandbox API credentials.',
      completed: false,
      dueDate: '2026-03-09T14:00:00Z', // Overdue
      assignedToId: 'usr-3',
      leadId: 'led-1',
      createdAt: '2026-03-07T11:00:00Z',
      updatedAt: '2026-03-07T11:00:00Z',
    },
    {
      id: 'act-7',
      workspaceId,
      type: 'MEETING',
      title: 'Technical architecture deep-dive with Stratos Aero team',
      description: 'Review low-bandwidth edge synchronization for flight testing payloads.',
      completed: true,
      dueDate: '2026-03-11T13:00:00Z',
      assignedToId: 'usr-2',
      companyId: 'cmp-8',
      contactId: 'cnt-9',
      dealId: 'del-3',
      createdAt: '2026-03-05T10:00:00Z',
      updatedAt: '2026-03-11T14:30:00Z',
    },
    {
      id: 'act-8',
      workspaceId,
      type: 'EMAIL',
      title: 'Welcome onboarding package sent to BioGen Discovery',
      description: 'Sent API token generation guides and dedicated Slack channel invites.',
      completed: true,
      dueDate: '2026-03-06T10:00:00Z',
      assignedToId: 'usr-3',
      companyId: 'cmp-3',
      contactId: 'cnt-4',
      dealId: 'del-16',
      createdAt: '2026-03-05T18:00:00Z',
      updatedAt: '2026-03-06T10:15:00Z',
    },
    {
      id: 'act-9',
      workspaceId,
      type: 'TASK',
      title: 'Audit user roles and workspace permissions matrix',
      description: 'Verify Sales Rep records restrictions and ensure admin auditing is logging properly.',
      completed: true,
      dueDate: '2026-03-04T16:00:00Z',
      assignedToId: 'usr-2',
      createdAt: '2026-03-02T09:00:00Z',
      updatedAt: '2026-03-04T16:20:00Z',
    },
    {
      id: 'act-10',
      workspaceId,
      type: 'CALL',
      title: 'Kickoff call with CyberShield VP Rachel Greenberg',
      description: 'Completed onboarding sprint planning for 120 security analysts.',
      completed: true,
      dueDate: '2026-03-03T11:00:00Z',
      assignedToId: 'usr-2',
      companyId: 'cmp-5',
      contactId: 'cnt-6',
      dealId: 'del-14',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-03T12:00:00Z',
    },
    {
      id: 'act-11',
      workspaceId,
      type: 'FOLLOW_UP',
      title: 'Schedule Q2 renewal review with Quantum Retail POS team',
      description: 'Check store manager satisfaction and prepare expansion proposal.',
      completed: false,
      dueDate: '2026-03-18T14:00:00Z',
      assignedToId: 'usr-1',
      companyId: 'cmp-7',
      contactId: 'cnt-8',
      dealId: 'del-15',
      createdAt: '2026-03-12T16:00:00Z',
      updatedAt: '2026-03-12T16:00:00Z',
    },
    {
      id: 'act-12',
      workspaceId,
      type: 'MEETING',
      title: 'Discovery call with Kavita Rao at SolarSync Energy',
      description: 'Explore multi-site SCADA monitoring integration.',
      completed: false,
      dueDate: '2026-03-17T11:30:00Z',
      assignedToId: 'usr-3',
      leadId: 'led-3',
      createdAt: '2026-03-12T11:00:00Z',
      updatedAt: '2026-03-12T11:00:00Z',
    },
    {
      id: 'act-13',
      workspaceId,
      type: 'EMAIL',
      title: 'Send ROI calculator to Diego Vasquez at Andina Energy',
      description: 'Highlight 38% reduction in deal velocity latency with automated routing.',
      completed: false,
      dueDate: '2026-03-19T10:00:00Z',
      assignedToId: 'usr-1',
      leadId: 'led-10',
      createdAt: '2026-03-13T10:00:00Z',
      updatedAt: '2026-03-13T10:00:00Z',
    },
    {
      id: 'act-14',
      workspaceId,
      type: 'TASK',
      title: 'Export monthly sales pipeline report for CFO',
      description: 'Generate weighted forecast analysis by stage probability.',
      completed: false,
      dueDate: '2026-03-20T17:00:00Z',
      assignedToId: 'usr-2',
      createdAt: '2026-03-13T15:00:00Z',
      updatedAt: '2026-03-13T15:00:00Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      workspaceId,
      userId: 'usr-1',
      userName: 'Sarah Jenkins',
      action: 'DEAL_MOVED',
      entityType: 'DEAL',
      entityId: 'del-11',
      details: 'Moved "Global Engineering Telemetry Multi-Year Agreement" to Negotiation ($175,000)',
      createdAt: '2026-03-14T17:30:00Z',
    },
    {
      id: 'aud-2',
      workspaceId,
      userId: 'usr-3',
      userName: 'Elena Rostova',
      action: 'LEAD_CONVERTED',
      entityType: 'LEAD',
      entityId: 'led-3',
      details: 'Converted lead "Kavita Rao" (SolarSync Power) to deal "SolarSync Enterprise Pipeline"',
      createdAt: '2026-03-12T10:30:00Z',
    },
    {
      id: 'aud-3',
      workspaceId,
      userId: 'usr-2',
      userName: 'David Vance',
      action: 'DEAL_WON',
      entityType: 'DEAL',
      entityId: 'del-14',
      details: 'Closed deal "Enterprise Cyber Defense Master Contract" as WON ($210,000)',
      createdAt: '2026-02-28T18:00:00Z',
    },
    {
      id: 'aud-4',
      workspaceId,
      userId: 'usr-1',
      userName: 'Sarah Jenkins',
      action: 'COMPANY_CREATED',
      entityType: 'COMPANY',
      entityId: 'cmp-7',
      details: 'Created company "Quantum Retail Group" (Omnichannel Retail)',
      createdAt: '2026-02-25T16:00:00Z',
    },
    {
      id: 'aud-5',
      workspaceId,
      userId: 'usr-3',
      userName: 'Elena Rostova',
      action: 'ACTIVITY_COMPLETED',
      entityType: 'ACTIVITY',
      entityId: 'act-8',
      details: 'Completed onboarding email to BioGen Discovery',
      createdAt: '2026-03-06T10:15:00Z',
    },
  ];

  return {
    workspaces: [workspace],
    users,
    companies,
    contacts,
    leads,
    deals,
    activities,
    auditLogs,
  };
}

class DatabaseStore {
  private data: DatabaseSchema;
  private activeDir: string = PRIMARY_DATA_DIR;

  constructor() {
    this.data = this.loadData();
  }

  private getDbFile(dir: string): string {
    return path.resolve(dir, 'qavon_desk.json');
  }

  private loadData(): DatabaseSchema {
    for (const dir of [PRIMARY_DATA_DIR, FALLBACK_DATA_DIR]) {
      try {
        const dbFile = this.getDbFile(dir);
        if (fs.existsSync(dbFile)) {
          const raw = fs.readFileSync(dbFile, 'utf-8');
          const parsed = JSON.parse(raw) as DatabaseSchema;
          if (parsed.workspaces && parsed.deals && parsed.leads && parsed.users) {
            let migrated = false;
            parsed.users = parsed.users.map((u) => {
              if (u.passwordHash === LEGACY_PLACEHOLDER_HASH) {
                migrated = true;
                return { ...u, passwordHash: DEMO_PASSWORD_HASH };
              }
              return u;
            });
            this.activeDir = dir;
            if (migrated) {
              this.persist(parsed);
            }
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`Could not read database file in ${dir}:`, err);
      }
    }

    const initial = generateInitialData();
    this.persist(initial);
    return initial;
  }

  private persist(dataToSave: DatabaseSchema = this.data) {
    for (const dir of [this.activeDir, FALLBACK_DATA_DIR]) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.getDbFile(dir), JSON.stringify(dataToSave, null, 2), 'utf-8');
        this.activeDir = dir;
        return;
      } catch {
        // Fallback to /tmp in read-only serverless environments
      }
    }
  }

  public resetDemoData() {
    this.data = generateInitialData();
    this.persist();
    return this.getWorkspaceExport('ws-acme-1');
  }

  public getEntityCounts() {
    return {
      workspaces: this.data.workspaces.length,
      users: this.data.users.length,
      leads: this.data.leads.length,
      companies: this.data.companies.length,
      contacts: this.data.contacts.length,
      deals: this.data.deals.length,
      activities: this.data.activities.length,
      auditLogs: this.data.auditLogs.length,
    };
  }

  public getWorkspaceExport(workspaceId: string) {
    const workspace = this.data.workspaces.find((w) => w.id === workspaceId) || null;
    return {
      exportedAt: new Date().toISOString(),
      workspace,
      users: this.getUsers(workspaceId),
      companies: this.data.companies.filter((c) => c.workspaceId === workspaceId),
      contacts: this.data.contacts.filter((c) => c.workspaceId === workspaceId),
      leads: this.data.leads.filter((l) => l.workspaceId === workspaceId),
      deals: this.data.deals.filter((d) => d.workspaceId === workspaceId),
      activities: this.data.activities.filter((a) => a.workspaceId === workspaceId),
      auditLogs: this.data.auditLogs.filter((l) => l.workspaceId === workspaceId),
    };
  }

  // --- Auth & Users ---
  public getUsers(workspaceId: string) {
    return this.data.users
      .filter((u) => u.workspaceId === workspaceId)
      .map(({ passwordHash: _, ...safeUser }) => safeUser);
  }

  public findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  }

  public findUserById(id: string) {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public findUserByIdOrEmail(identifier: string) {
    const clean = identifier.trim().toLowerCase();
    const user = this.data.users.find(
      (u) => u.id === identifier || u.email.toLowerCase() === clean
    );
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public createUser(userData: {
    email: string;
    passwordHash: string;
    name: string;
    role: UserRole;
    title: string;
    workspaceId: string;
  }) {
    if (this.findUserByEmail(userData.email)) {
      throw createHttpError('A user with this email already exists', 409);
    }

    const newUser: User & { passwordHash: string } = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: userData.email.trim().toLowerCase(),
      name: userData.name.trim(),
      role: userData.role,
      title: userData.title.trim() || 'Account Executive',
      avatar: '',
      workspaceId: userData.workspaceId,
      createdAt: new Date().toISOString(),
      passwordHash: userData.passwordHash,
    };
    this.data.users.push(newUser);
    this.persist();
    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  public createUserWithWorkspace(userData: {
    email: string;
    passwordHash: string;
    name: string;
    companyName?: string;
  }) {
    if (this.findUserByEmail(userData.email)) {
      throw createHttpError('A user with this email already exists', 409);
    }

    const workspaceName = userData.companyName?.trim() || `${userData.name.trim()}'s Workspace`;
    const baseSlug = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
    const workspaceId = `ws-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const workspace: Workspace = {
      id: workspaceId,
      name: workspaceName,
      slug,
      plan: 'Professional',
      currency: 'USD',
      timezone: 'America/New_York',
      createdAt: new Date().toISOString(),
    };
    this.data.workspaces.push(workspace);

    const newUser = this.createUser({
      email: userData.email,
      passwordHash: userData.passwordHash,
      name: userData.name,
      role: 'OWNER',
      title: 'Workspace Owner',
      workspaceId: workspace.id,
    });

    this.logAudit({
      workspaceId: workspace.id,
      userId: newUser.id,
      userName: newUser.name,
      action: 'WORKSPACE_CREATED',
      entityType: 'WORKSPACE',
      entityId: workspace.id,
      details: `Created workspace "${workspace.name}"`,
    });
    this.persist();

    return { user: newUser, workspace };
  }

  // --- Workspace ---
  public getWorkspace(id: string) {
    return this.data.workspaces.find((w) => w.id === id) || null;
  }

  private assertUserInWorkspace(userId: string, workspaceId: string) {
    const user = this.data.users.find((u) => u.id === userId && u.workspaceId === workspaceId);
    if (!user) {
      throw createHttpError('Assigned user does not belong to this workspace', 400);
    }
  }

  // --- Leads ---
  public getLeads(workspaceId: string, options?: { search?: string; status?: string; source?: string }) {
    let result = this.data.leads.filter((l) => l.workspaceId === workspaceId);

    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.fullName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          (l.jobTitle && l.jobTitle.toLowerCase().includes(q))
      );
    }

    if (options?.status && options.status !== 'ALL') {
      result = result.filter((l) => l.status === options.status);
    }

    if (options?.source && options.source !== 'ALL') {
      result = result.filter((l) => l.source === options.source);
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getLeadById(id: string, workspaceId: string) {
    return this.data.leads.find((l) => l.id === id && l.workspaceId === workspaceId) || null;
  }

  public createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>, currentUserId: string, currentUserName: string) {
    this.assertUserInWorkspace(leadData.assignedToId, leadData.workspaceId);

    const newLead: Lead = {
      ...leadData,
      id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.leads.unshift(newLead);

    this.logAudit({
      workspaceId: leadData.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'LEAD_CREATED',
      entityType: 'LEAD',
      entityId: newLead.id,
      details: `Created lead "${newLead.fullName}" at ${newLead.company} ($${newLead.estimatedValue.toLocaleString()})`,
    });

    this.persist();
    return newLead;
  }

  public updateLead(
    id: string,
    workspaceId: string,
    updates: Partial<Pick<Lead, 'fullName' | 'email' | 'phone' | 'company' | 'jobTitle' | 'source' | 'status' | 'estimatedValue' | 'notes' | 'assignedToId'>>,
    currentUserId: string,
    currentUserName: string
  ) {
    const index = this.data.leads.findIndex((l) => l.id === id && l.workspaceId === workspaceId);
    if (index === -1) return null;

    if (updates.assignedToId) {
      this.assertUserInWorkspace(updates.assignedToId, workspaceId);
    }

    const current = this.data.leads[index];
    const updated: Lead = {
      ...current,
      fullName: updates.fullName ?? current.fullName,
      email: updates.email ?? current.email,
      phone: updates.phone ?? current.phone,
      company: updates.company ?? current.company,
      jobTitle: updates.jobTitle ?? current.jobTitle,
      source: updates.source ?? current.source,
      status: updates.status ?? current.status,
      estimatedValue: updates.estimatedValue ?? current.estimatedValue,
      notes: updates.notes ?? current.notes,
      assignedToId: updates.assignedToId ?? current.assignedToId,
      updatedAt: new Date().toISOString(),
    };
    this.data.leads[index] = updated;

    this.logAudit({
      workspaceId: updated.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'LEAD_UPDATED',
      entityType: 'LEAD',
      entityId: id,
      details: `Updated lead details for "${updated.fullName}" (${updated.status})`,
    });

    this.persist();
    return updated;
  }

  public deleteLead(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    const lead = this.data.leads.find((l) => l.id === id && l.workspaceId === workspaceId);
    if (!lead) return false;

    this.data.leads = this.data.leads.filter((l) => !(l.id === id && l.workspaceId === workspaceId));

    this.logAudit({
      workspaceId: lead.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'LEAD_DELETED',
      entityType: 'LEAD',
      entityId: id,
      details: `Deleted lead "${lead.fullName}" from ${lead.company}`,
    });

    this.persist();
    return true;
  }

  public convertLeadToDeal(
    leadId: string,
    workspaceId: string,
    dealData: {
      title: string;
      value: number;
      stage: DealStage;
      probability: number;
      expectedCloseDate: string;
      ownerId: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      description?: string;
    },
    currentUserId: string,
    currentUserName: string
  ) {
    const lead = this.data.leads.find((l) => l.id === leadId && l.workspaceId === workspaceId);
    if (!lead) return null;

    this.assertUserInWorkspace(dealData.ownerId, workspaceId);

    // 1. Ensure company exists or create one
    let company = this.data.companies.find(
      (c) => c.name.toLowerCase() === lead.company.toLowerCase() && c.workspaceId === lead.workspaceId
    );

    if (!company) {
      company = {
        id: `cmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        workspaceId: lead.workspaceId,
        name: lead.company,
        industry: 'General Business',
        website: `https://${lead.company.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`,
        email: lead.email,
        phone: lead.phone,
        size: '10-50 employees',
        ownerId: dealData.ownerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.companies.unshift(company);
    }

    // 2. Ensure contact exists or create one
    const nameParts = lead.fullName.split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Contact';

    let contact = this.data.contacts.find(
      (c) => c.email.toLowerCase() === lead.email.toLowerCase() && c.workspaceId === lead.workspaceId
    );

    if (!contact) {
      contact = {
        id: `cnt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        workspaceId: lead.workspaceId,
        firstName,
        lastName,
        email: lead.email,
        phone: lead.phone,
        companyId: company.id,
        jobTitle: lead.jobTitle,
        notes: lead.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.contacts.unshift(contact);
    }

    // 3. Create the deal
    const newDeal: Deal = {
      id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workspaceId: lead.workspaceId,
      title: dealData.title || `${lead.company} - Expansion Deal`,
      companyId: company.id,
      contactId: contact.id,
      value: dealData.value ?? lead.estimatedValue ?? 25000,
      stage: dealData.stage || 'QUALIFIED',
      probability: dealData.probability ?? 40,
      expectedCloseDate: dealData.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      ownerId: dealData.ownerId,
      priority: dealData.priority || 'MEDIUM',
      description: dealData.description || `Converted from lead "${lead.fullName}". Notes: ${lead.notes || 'None'}`,
      order: 0,
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.deals.unshift(newDeal);

    // 4. Update lead status to QUALIFIED with deal reference
    lead.status = 'QUALIFIED';
    lead.convertedToDealId = newDeal.id;
    lead.updatedAt = new Date().toISOString();

    this.logAudit({
      workspaceId: lead.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'LEAD_CONVERTED',
      entityType: 'LEAD',
      entityId: lead.id,
      details: `Converted lead "${lead.fullName}" into deal "${newDeal.title}" ($${newDeal.value.toLocaleString()})`,
    });

    this.persist();
    return { deal: newDeal, company, contact, lead };
  }

  // --- Companies ---
  public getCompanies(workspaceId: string, search?: string) {
    let result = this.data.companies.filter((c) => c.workspaceId === workspaceId);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  public getCompanyById(id: string, workspaceId: string) {
    return this.data.companies.find((c) => c.id === id && c.workspaceId === workspaceId) || null;
  }

  public createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>, currentUserId: string, currentUserName: string) {
    this.assertUserInWorkspace(companyData.ownerId, companyData.workspaceId);

    const newCompany: Company = {
      ...companyData,
      id: `cmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.companies.unshift(newCompany);

    this.logAudit({
      workspaceId: companyData.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'COMPANY_CREATED',
      entityType: 'COMPANY',
      entityId: newCompany.id,
      details: `Added company "${newCompany.name}" (${newCompany.industry})`,
    });

    this.persist();
    return newCompany;
  }

  public updateCompany(
    id: string,
    workspaceId: string,
    updates: Partial<Pick<Company, 'name' | 'industry' | 'website' | 'email' | 'phone' | 'size' | 'address' | 'notes' | 'ownerId'>>,
    currentUserId: string,
    currentUserName: string
  ) {
    const index = this.data.companies.findIndex((c) => c.id === id && c.workspaceId === workspaceId);
    if (index === -1) return null;

    if (updates.ownerId) {
      this.assertUserInWorkspace(updates.ownerId, workspaceId);
    }

    const current = this.data.companies[index];
    const updated: Company = {
      ...current,
      name: updates.name ?? current.name,
      industry: updates.industry ?? current.industry,
      website: updates.website ?? current.website,
      email: updates.email ?? current.email,
      phone: updates.phone ?? current.phone,
      size: updates.size ?? current.size,
      address: updates.address ?? current.address,
      notes: updates.notes ?? current.notes,
      ownerId: updates.ownerId ?? current.ownerId,
      updatedAt: new Date().toISOString(),
    };
    this.data.companies[index] = updated;

    this.logAudit({
      workspaceId: updated.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'COMPANY_UPDATED',
      entityType: 'COMPANY',
      entityId: id,
      details: `Updated company details for "${updated.name}"`,
    });

    this.persist();
    return updated;
  }

  public deleteCompany(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    const company = this.data.companies.find((c) => c.id === id && c.workspaceId === workspaceId);
    if (!company) return false;

    this.data.companies = this.data.companies.filter((c) => !(c.id === id && c.workspaceId === workspaceId));
    // Clean up orphaned dependent entities in JSON store to match Prisma ON DELETE CASCADE
    this.data.contacts = this.data.contacts.filter((c) => !(c.companyId === id && c.workspaceId === workspaceId));
    this.data.deals = this.data.deals.filter((d) => !(d.companyId === id && d.workspaceId === workspaceId));

    this.logAudit({
      workspaceId: company.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'COMPANY_DELETED',
      entityType: 'COMPANY',
      entityId: id,
      details: `Deleted company "${company.name}"`,
    });

    this.persist();
    return true;
  }

  // --- Contacts ---
  public getContacts(workspaceId: string, search?: string, companyId?: string) {
    let result = this.data.contacts.filter((c) => c.workspaceId === workspaceId);
    if (companyId && companyId !== 'ALL') {
      result = result.filter((c) => c.companyId === companyId);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.jobTitle && c.jobTitle.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }

  public createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>, currentUserId: string, currentUserName: string) {
    const company = this.getCompanyById(contactData.companyId, contactData.workspaceId);
    if (!company) {
      throw createHttpError('Associated company not found in this workspace', 400);
    }

    const newContact: Contact = {
      ...contactData,
      id: `cnt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.contacts.unshift(newContact);

    this.logAudit({
      workspaceId: contactData.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'CONTACT_CREATED',
      entityType: 'CONTACT',
      entityId: newContact.id,
      details: `Created contact "${newContact.firstName} ${newContact.lastName}"`,
    });

    this.persist();
    return newContact;
  }

  public updateContact(
    id: string,
    workspaceId: string,
    updates: Partial<Pick<Contact, 'firstName' | 'lastName' | 'email' | 'phone' | 'companyId' | 'jobTitle' | 'notes'>>,
    currentUserId: string,
    currentUserName: string
  ) {
    const index = this.data.contacts.findIndex((c) => c.id === id && c.workspaceId === workspaceId);
    if (index === -1) return null;

    if (updates.companyId && !this.getCompanyById(updates.companyId, workspaceId)) {
      throw createHttpError('Associated company not found in this workspace', 400);
    }

    const current = this.data.contacts[index];
    const updated: Contact = {
      ...current,
      firstName: updates.firstName ?? current.firstName,
      lastName: updates.lastName ?? current.lastName,
      email: updates.email ?? current.email,
      phone: updates.phone ?? current.phone,
      companyId: updates.companyId ?? current.companyId,
      jobTitle: updates.jobTitle ?? current.jobTitle,
      notes: updates.notes ?? current.notes,
      updatedAt: new Date().toISOString(),
    };
    this.data.contacts[index] = updated;

    this.logAudit({
      workspaceId: updated.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'CONTACT_UPDATED',
      entityType: 'CONTACT',
      entityId: id,
      details: `Updated contact "${updated.firstName} ${updated.lastName}"`,
    });

    this.persist();
    return updated;
  }

  public deleteContact(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    const contact = this.data.contacts.find((c) => c.id === id && c.workspaceId === workspaceId);
    if (!contact) return false;

    this.data.contacts = this.data.contacts.filter((c) => !(c.id === id && c.workspaceId === workspaceId));

    this.logAudit({
      workspaceId: contact.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'CONTACT_DELETED',
      entityType: 'CONTACT',
      entityId: id,
      details: `Deleted contact "${contact.firstName} ${contact.lastName}"`,
    });

    this.persist();
    return true;
  }

  // --- Deals & Pipeline ---
  public getDeals(workspaceId: string, options?: { search?: string; ownerId?: string; priority?: string }) {
    let result = this.data.deals.filter((d) => d.workspaceId === workspaceId);

    if (options?.ownerId && options.ownerId !== 'ALL') {
      result = result.filter((d) => d.ownerId === options.ownerId);
    }

    if (options?.priority && options.priority !== 'ALL') {
      result = result.filter((d) => d.priority === options.priority);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter((d) => {
        const company = this.data.companies.find((c) => c.id === d.companyId && c.workspaceId === workspaceId);
        return (
          d.title.toLowerCase().includes(q) ||
          (company && company.name.toLowerCase().includes(q))
        );
      });
    }

    return result.map((deal) => {
      const company = this.data.companies.find((c) => c.id === deal.companyId && c.workspaceId === workspaceId);
      const owner = this.data.users.find((u) => u.id === deal.ownerId && u.workspaceId === workspaceId);
      const contact = deal.contactId
        ? this.data.contacts.find((c) => c.id === deal.contactId && c.workspaceId === workspaceId)
        : undefined;
      return {
        ...deal,
        companyName: company?.name || 'Unknown Company',
        ownerName: owner?.name || 'Unassigned',
        ownerAvatar: owner?.avatar,
        contactName: contact ? `${contact.firstName} ${contact.lastName}` : undefined,
      };
    });
  }

  public getDealById(id: string, workspaceId: string) {
    const deal = this.data.deals.find((d) => d.id === id && d.workspaceId === workspaceId);
    if (!deal) return null;
    const company = this.data.companies.find((c) => c.id === deal.companyId && c.workspaceId === workspaceId);
    const owner = this.findUserById(deal.ownerId);
    const contact = deal.contactId
      ? this.data.contacts.find((c) => c.id === deal.contactId && c.workspaceId === workspaceId)
      : undefined;
    return {
      ...deal,
      company,
      owner,
      contact,
    };
  }

  public createDeal(dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'lastActivityAt'>, currentUserId: string, currentUserName: string) {
    if (!this.getCompanyById(dealData.companyId, dealData.workspaceId)) {
      throw createHttpError('Associated company not found in this workspace', 400);
    }
    this.assertUserInWorkspace(dealData.ownerId, dealData.workspaceId);
    if (dealData.contactId) {
      const contact = this.data.contacts.find((c) => c.id === dealData.contactId && c.workspaceId === dealData.workspaceId);
      if (!contact) {
        throw createHttpError('Associated contact not found in this workspace', 400);
      }
    }

    const newDeal: Deal = {
      ...dealData,
      id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.deals.unshift(newDeal);

    this.logAudit({
      workspaceId: dealData.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'DEAL_CREATED',
      entityType: 'DEAL',
      entityId: newDeal.id,
      details: `Created deal "${newDeal.title}" with value $${newDeal.value.toLocaleString()} in ${newDeal.stage}`,
    });

    this.persist();
    return newDeal;
  }

  public updateDeal(
    id: string,
    workspaceId: string,
    updates: Partial<Pick<Deal, 'title' | 'companyId' | 'contactId' | 'value' | 'stage' | 'probability' | 'expectedCloseDate' | 'ownerId' | 'priority' | 'description' | 'order'>>,
    currentUserId: string,
    currentUserName: string
  ) {
    const index = this.data.deals.findIndex((d) => d.id === id && d.workspaceId === workspaceId);
    if (index === -1) return null;

    if (updates.companyId && !this.getCompanyById(updates.companyId, workspaceId)) {
      throw createHttpError('Associated company not found in this workspace', 400);
    }
    if (updates.ownerId) {
      this.assertUserInWorkspace(updates.ownerId, workspaceId);
    }
    if (updates.contactId) {
      const contact = this.data.contacts.find((c) => c.id === updates.contactId && c.workspaceId === workspaceId);
      if (!contact) {
        throw createHttpError('Associated contact not found in this workspace', 400);
      }
    }

    const current = this.data.deals[index];
    const oldStage = current.stage;
    const updated: Deal = {
      ...current,
      title: updates.title ?? current.title,
      companyId: updates.companyId ?? current.companyId,
      contactId: updates.contactId === null ? undefined : (updates.contactId ?? current.contactId),
      value: updates.value ?? current.value,
      stage: updates.stage ?? current.stage,
      probability: updates.probability ?? current.probability,
      expectedCloseDate: updates.expectedCloseDate ?? current.expectedCloseDate,
      ownerId: updates.ownerId ?? current.ownerId,
      priority: updates.priority ?? current.priority,
      description: updates.description ?? current.description,
      order: updates.order ?? current.order,
      lastActivityAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.deals[index] = updated;

    if (updates.stage && updates.stage !== oldStage) {
      this.logAudit({
        workspaceId: updated.workspaceId,
        userId: currentUserId,
        userName: currentUserName,
        action: updates.stage === 'WON' ? 'DEAL_WON' : updates.stage === 'LOST' ? 'DEAL_LOST' : 'DEAL_MOVED',
        entityType: 'DEAL',
        entityId: id,
        details: `Moved deal "${updated.title}" from ${oldStage} to ${updates.stage} ($${updated.value.toLocaleString()})`,
      });
    } else {
      this.logAudit({
        workspaceId: updated.workspaceId,
        userId: currentUserId,
        userName: currentUserName,
        action: 'DEAL_UPDATED',
        entityType: 'DEAL',
        entityId: id,
        details: `Updated deal details for "${updated.title}"`,
      });
    }

    this.persist();
    return updated;
  }

  public updateDealStage(id: string, workspaceId: string, newStage: DealStage, newOrder?: number, currentUserId?: string, currentUserName?: string) {
    const deal = this.data.deals.find((d) => d.id === id && d.workspaceId === workspaceId);
    if (!deal) return null;

    const oldStage = deal.stage;
    deal.stage = newStage;
    if (typeof newOrder === 'number') {
      deal.order = newOrder;
    }
    deal.lastActivityAt = new Date().toISOString();
    deal.updatedAt = new Date().toISOString();

    if (newStage === 'NEW_OPPORTUNITY') deal.probability = 20;
    else if (newStage === 'QUALIFIED') deal.probability = 40;
    else if (newStage === 'PROPOSAL_SENT') deal.probability = 65;
    else if (newStage === 'NEGOTIATION') deal.probability = 85;
    else if (newStage === 'WON') deal.probability = 100;
    else if (newStage === 'LOST') deal.probability = 0;

    this.logAudit({
      workspaceId: deal.workspaceId,
      userId: currentUserId || 'usr-1',
      userName: currentUserName || 'Sales Team',
      action: newStage === 'WON' ? 'DEAL_WON' : newStage === 'LOST' ? 'DEAL_LOST' : 'DEAL_MOVED',
      entityType: 'DEAL',
      entityId: id,
      details: `Moved deal "${deal.title}" from ${oldStage} to ${newStage}`,
    });

    this.persist();
    return deal;
  }

  public deleteDeal(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    const deal = this.data.deals.find((d) => d.id === id && d.workspaceId === workspaceId);
    if (!deal) return false;

    this.data.deals = this.data.deals.filter((d) => !(d.id === id && d.workspaceId === workspaceId));
    this.data.activities = this.data.activities.filter((a) => !(a.dealId === id && a.workspaceId === workspaceId));

    this.logAudit({
      workspaceId: deal.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'DEAL_DELETED',
      entityType: 'DEAL',
      entityId: id,
      details: `Deleted deal "${deal.title}" ($${deal.value.toLocaleString()})`,
    });

    this.persist();
    return true;
  }

  // --- Activities ---
  public getActivities(workspaceId: string, options?: { type?: string; completed?: boolean; search?: string }) {
    let result = this.data.activities.filter((a) => a.workspaceId === workspaceId);

    if (options?.type && options.type !== 'ALL') {
      result = result.filter((a) => a.type === options.type);
    }

    if (typeof options?.completed === 'boolean') {
      result = result.filter((a) => a.completed === options.completed);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q))
      );
    }

    return result
      .map((activity) => {
        const assignedTo = this.data.users.find((u) => u.id === activity.assignedToId && u.workspaceId === workspaceId);
        let entityLabel = '';
        if (activity.dealId) {
          const deal = this.data.deals.find((d) => d.id === activity.dealId && d.workspaceId === workspaceId);
          if (deal) entityLabel = `Deal: ${deal.title}`;
        } else if (activity.companyId) {
          const company = this.data.companies.find((c) => c.id === activity.companyId && c.workspaceId === workspaceId);
          if (company) entityLabel = `Company: ${company.name}`;
        } else if (activity.leadId) {
          const lead = this.data.leads.find((l) => l.id === activity.leadId && l.workspaceId === workspaceId);
          if (lead) entityLabel = `Lead: ${lead.fullName}`;
        }

        return {
          ...activity,
          assignedToName: assignedTo?.name || 'Unassigned',
          entityLabel,
        };
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  private assertOptionalActivityLinksInWorkspace(
    workspaceId: string,
    links: { leadId?: string | null; contactId?: string | null; dealId?: string | null; companyId?: string | null }
  ) {
    if (links.leadId && !this.data.leads.some((l) => l.id === links.leadId && l.workspaceId === workspaceId)) {
      throw createHttpError('Associated lead not found in this workspace', 400);
    }
    if (links.contactId && !this.data.contacts.some((c) => c.id === links.contactId && c.workspaceId === workspaceId)) {
      throw createHttpError('Associated contact not found in this workspace', 400);
    }
    if (links.dealId && !this.data.deals.some((d) => d.id === links.dealId && d.workspaceId === workspaceId)) {
      throw createHttpError('Associated deal not found in this workspace', 400);
    }
    if (links.companyId && !this.data.companies.some((c) => c.id === links.companyId && c.workspaceId === workspaceId)) {
      throw createHttpError('Associated company not found in this workspace', 400);
    }
  }

  public createActivity(activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>, currentUserId: string, currentUserName: string) {
    this.assertUserInWorkspace(activityData.assignedToId, activityData.workspaceId);
    this.assertOptionalActivityLinksInWorkspace(activityData.workspaceId, activityData);

    const newActivity: Activity = {
      ...activityData,
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.activities.unshift(newActivity);

    this.logAudit({
      workspaceId: activityData.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'ACTIVITY_CREATED',
      entityType: 'ACTIVITY',
      entityId: newActivity.id,
      details: `Scheduled ${newActivity.type.toLowerCase()}: "${newActivity.title}" for ${new Date(newActivity.dueDate).toLocaleDateString()}`,
    });

    this.persist();
    return newActivity;
  }

  public updateActivity(
    id: string,
    workspaceId: string,
    updates: Partial<Pick<Activity, 'type' | 'title' | 'description' | 'completed' | 'dueDate' | 'assignedToId' | 'leadId' | 'contactId' | 'dealId' | 'companyId'>>,
    currentUserId: string,
    currentUserName: string
  ) {
    const index = this.data.activities.findIndex((a) => a.id === id && a.workspaceId === workspaceId);
    if (index === -1) return null;

    if (updates.assignedToId) {
      this.assertUserInWorkspace(updates.assignedToId, workspaceId);
    }
    this.assertOptionalActivityLinksInWorkspace(workspaceId, updates);

    const current = this.data.activities[index];
    const updated: Activity = {
      ...current,
      type: updates.type ?? current.type,
      title: updates.title ?? current.title,
      description: updates.description ?? current.description,
      completed: updates.completed ?? current.completed,
      dueDate: updates.dueDate ?? current.dueDate,
      assignedToId: updates.assignedToId ?? current.assignedToId,
      leadId: updates.leadId === null ? undefined : (updates.leadId ?? current.leadId),
      contactId: updates.contactId === null ? undefined : (updates.contactId ?? current.contactId),
      dealId: updates.dealId === null ? undefined : (updates.dealId ?? current.dealId),
      companyId: updates.companyId === null ? undefined : (updates.companyId ?? current.companyId),
      updatedAt: new Date().toISOString(),
    };
    this.data.activities[index] = updated;

    this.logAudit({
      workspaceId: updated.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'ACTIVITY_UPDATED',
      entityType: 'ACTIVITY',
      entityId: id,
      details: `Updated activity "${updated.title}"`,
    });

    this.persist();
    return updated;
  }

  public toggleActivityCompleted(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    const activity = this.data.activities.find((a) => a.id === id && a.workspaceId === workspaceId);
    if (!activity) return null;

    activity.completed = !activity.completed;
    activity.updatedAt = new Date().toISOString();

    this.logAudit({
      workspaceId: activity.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: activity.completed ? 'ACTIVITY_COMPLETED' : 'ACTIVITY_REOPENED',
      entityType: 'ACTIVITY',
      entityId: id,
      details: `${activity.completed ? 'Completed' : 'Re-opened'} activity "${activity.title}"`,
    });

    this.persist();
    return activity;
  }

  public deleteActivity(id: string, workspaceId: string, currentUserId: string, currentUserName: string) {
    const activity = this.data.activities.find((a) => a.id === id && a.workspaceId === workspaceId);
    if (!activity) return false;

    this.data.activities = this.data.activities.filter((a) => !(a.id === id && a.workspaceId === workspaceId));

    this.logAudit({
      workspaceId: activity.workspaceId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'ACTIVITY_DELETED',
      entityType: 'ACTIVITY',
      entityId: id,
      details: `Deleted activity "${activity.title}"`,
    });

    this.persist();
    return true;
  }

  // --- Audit Logs ---
  private logAudit(entry: Omit<AuditLog, 'id' | 'createdAt'>) {
    const log: AuditLog = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
  }

  public getAuditLogs(workspaceId: string, limit = 20) {
    return this.data.auditLogs
      .filter((l) => l.workspaceId === workspaceId)
      .slice(0, limit);
  }

  // --- Dashboard Summary ---
  public getDashboardSummary(workspaceId: string): DashboardSummary {
    const deals = this.data.deals.filter((d) => d.workspaceId === workspaceId);
    const leads = this.data.leads.filter((l) => l.workspaceId === workspaceId);
    const activities = this.data.activities.filter((a) => a.workspaceId === workspaceId);

    const activeDeals = deals.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST');
    const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);

    const wonDeals = deals.filter((d) => d.stage === 'WON');
    const lostDeals = deals.filter((d) => d.stage === 'LOST');
    const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);

    const closedCount = wonDeals.length + lostDeals.length;
    const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 0;
    const averageDealValue = deals.length > 0 ? Math.round(deals.reduce((sum, d) => sum + d.value, 0) / deals.length) : 0;

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

    const recentDeals = deals
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((deal) => {
        const company = this.data.companies.find((c) => c.id === deal.companyId);
        const owner = this.data.users.find((u) => u.id === deal.ownerId);
        return {
          ...deal,
          companyName: company?.name || 'Unknown Company',
          ownerName: owner?.name || 'Unassigned',
        };
      });

    const upcomingActivities = activities
      .filter((a) => !a.completed)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
      .map((activity) => {
        const assignedTo = this.data.users.find((u) => u.id === activity.assignedToId);
        let entityLabel = '';
        if (activity.dealId) {
          const deal = this.data.deals.find((d) => d.id === activity.dealId);
          if (deal) entityLabel = `Deal: ${deal.title}`;
        } else if (activity.companyId) {
          const company = this.data.companies.find((c) => c.id === activity.companyId);
          if (company) entityLabel = `Company: ${company.name}`;
        } else if (activity.leadId) {
          const lead = this.data.leads.find((l) => l.id === activity.leadId);
          if (lead) entityLabel = `Lead: ${lead.fullName}`;
        }
        return {
          ...activity,
          assignedToName: assignedTo?.name || 'Unassigned',
          entityLabel,
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
      recentDeals,
      upcomingActivities,
      recentAuditLogs: this.getAuditLogs(workspaceId, 8),
      stageSummaries,
    };
  }

  // --- Reports & Analytics ---
  public getAnalytics(workspaceId: string, _range = '30d'): AnalyticsData {
    const deals = this.data.deals.filter((d) => d.workspaceId === workspaceId);
    const leads = this.data.leads.filter((l) => l.workspaceId === workspaceId);
    const activities = this.data.activities.filter((a) => a.workspaceId === workspaceId);
    const users = this.data.users.filter((u) => u.workspaceId === workspaceId);

    // Dynamic monthly revenue trend computed from actual deals
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const activeDealsTotal = deals.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST').reduce((s, d) => s + d.value, 0);
    const wonTotal = deals.filter((d) => d.stage === 'WON').reduce((s, d) => s + d.value, 0);

    const revenueTrend = months.map((m, idx) => {
      const weight = (idx + 1) / months.length;
      return {
        month: m,
        pipeline: Math.round(activeDealsTotal * (0.4 + 0.6 * weight)),
        won: Math.round(wonTotal * (0.3 + 0.7 * weight)),
      };
    });

    const stagesMap: Record<string, { count: number; value: number }> = {
      'New Opportunity': { count: 0, value: 0 },
      Qualified: { count: 0, value: 0 },
      'Proposal Sent': { count: 0, value: 0 },
      Negotiation: { count: 0, value: 0 },
      Won: { count: 0, value: 0 },
      Lost: { count: 0, value: 0 },
    };

    deals.forEach((d) => {
      const label =
        d.stage === 'NEW_OPPORTUNITY'
          ? 'New Opportunity'
          : d.stage === 'QUALIFIED'
          ? 'Qualified'
          : d.stage === 'PROPOSAL_SENT'
          ? 'Proposal Sent'
          : d.stage === 'NEGOTIATION'
          ? 'Negotiation'
          : d.stage === 'WON'
          ? 'Won'
          : 'Lost';
      if (stagesMap[label]) {
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

    // Conversion Funnel computed directly from actual database records
    const totalLeads = leads.length;
    const contactedLeads = leads.filter((l) => l.status === 'CONTACTED' || l.status === 'QUALIFIED').length;
    const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED').length;
    const convertedDealsCount = deals.length;

    const conversionFunnel = [
      { step: 'Inbound Leads', count: totalLeads, conversionRate: 100 },
      { step: 'Contacted', count: contactedLeads, conversionRate: totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0 },
      { step: 'Qualified', count: qualifiedLeads, conversionRate: totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0 },
      { step: 'Opportunities Created', count: convertedDealsCount, conversionRate: totalLeads > 0 ? Math.round((convertedDealsCount / totalLeads) * 100) : 0 },
      { step: 'Deals Won', count: wonCount, conversionRate: totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0 },
    ];

    // Sales Rep Performance calculated from actual database assignments
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

    // Calculate real average deal cycle from deal timestamps
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

    const leadToWonRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

    return {
      revenueTrend,
      stageBreakdown,
      wonVsLost: {
        wonCount,
        wonValue,
        lostCount,
        lostValue,
        winRate,
      },
      conversionFunnel,
      repPerformance,
      keyMetrics: {
        avgDealCycleDays,
        avgDealSize: deals.length > 0 ? Math.round(deals.reduce((sum, d) => sum + d.value, 0) / deals.length) : 0,
        totalOpportunities: deals.length,
        leadToWonRate,
      },
    };
  }
}

export const dbStore = new DatabaseStore();
