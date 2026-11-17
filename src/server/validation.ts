import { z } from 'zod';

const optionalHttpUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((val) => val ?? '')
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Website must be a valid http:// or https:// URL' }
  );

const optionalPhone = z.string().trim().max(50).optional().transform((v) => v ?? '');
const optionalText = (max = 2000) => z.string().trim().max(max).optional().transform((v) => v ?? '');

export const userRoleEnum = z.enum(['OWNER', 'ADMIN', 'SALES_REP']);
export const leadStatusEnum = z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED']);
export const leadSourceEnum = z.enum(['Website', 'Referral', 'LinkedIn', 'Outbound', 'Event', 'Partner']);
export const dealStageEnum = z.enum([
  'NEW_OPPORTUNITY',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'WON',
  'LOST',
]);
export const dealPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const activityTypeEnum = z.enum(['CALL', 'MEETING', 'EMAIL', 'TASK', 'FOLLOW_UP']);

export const loginSchema = z.object({
  email: z.string().trim().email('A valid work email is required').max(255),
  password: z.string().min(1, 'Password is required').max(200),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().trim().email('A valid work email is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  companyName: z.string().trim().max(120).optional(),
});

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(1).max(200),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

export const switchRoleSchema = z.object({
  userId: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(255).optional(),
});

export const leadCreateSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  email: z.string().trim().email('A valid email address is required').max(255),
  phone: optionalPhone,
  company: z.string().trim().min(1, 'Company name is required').max(150),
  jobTitle: optionalText(120),
  source: leadSourceEnum.default('Website'),
  status: leadStatusEnum.default('NEW'),
  estimatedValue: z.coerce.number().finite().min(0, 'Estimated value cannot be negative').max(100_000_000).default(10000),
  notes: optionalText(4000),
  assignedToId: z.string().trim().min(1).max(120).optional(),
});

export const leadUpdateSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().max(50).optional(),
  company: z.string().trim().min(1).max(150).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  source: leadSourceEnum.optional(),
  status: leadStatusEnum.optional(),
  estimatedValue: z.coerce.number().finite().min(0).max(100_000_000).optional(),
  notes: z.string().trim().max(4000).optional(),
  assignedToId: z.string().trim().min(1).max(120).optional(),
});

export const leadConvertSchema = z.object({
  title: z.string().trim().min(1, 'Opportunity title is required').max(200),
  value: z.coerce.number().finite().min(0, 'Deal value cannot be negative').max(100_000_000),
  stage: dealStageEnum.default('QUALIFIED'),
  probability: z.coerce.number().int().min(0).max(100).default(40),
  expectedCloseDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Valid expected close date is required' }),
  ownerId: z.string().trim().min(1).max(120).optional(),
  priority: dealPriorityEnum.default('MEDIUM'),
  description: optionalText(4000),
});

export const companyCreateSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(150),
  industry: z.string().trim().min(1, 'Industry is required').max(120),
  website: optionalHttpUrl,
  email: z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform((v) => v ?? '')
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: 'Company email must be a valid email address',
    }),
  phone: optionalPhone,
  size: z.string().trim().min(1).max(60).default('10-50 employees'),
  address: optionalText(300),
  notes: optionalText(4000),
  ownerId: z.string().trim().min(1).max(120).optional(),
});

export const companyUpdateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  industry: z.string().trim().min(1).max(120).optional(),
  website: optionalHttpUrl.optional(),
  email: z
    .string()
    .trim()
    .max(255)
    .optional()
    .refine((v) => v === undefined || v === '' || z.string().email().safeParse(v).success, {
      message: 'Company email must be a valid email address',
    }),
  phone: z.string().trim().max(50).optional(),
  size: z.string().trim().min(1).max(60).optional(),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(4000).optional(),
  ownerId: z.string().trim().min(1).max(120).optional(),
});

export const contactCreateSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('A valid email address is required').max(255),
  phone: optionalPhone,
  companyId: z.string().trim().min(1, 'Associated company is required').max(120),
  jobTitle: optionalText(120),
  notes: optionalText(4000),
});

export const contactUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().max(50).optional(),
  companyId: z.string().trim().min(1).max(120).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const dealCreateSchema = z.object({
  title: z.string().trim().min(1, 'Deal title is required').max(200),
  companyId: z.string().trim().min(1, 'Associated company is required').max(120),
  contactId: z.string().trim().max(120).optional(),
  value: z.coerce.number().finite().min(0, 'Deal value cannot be negative').max(100_000_000).default(10000),
  stage: dealStageEnum.default('NEW_OPPORTUNITY'),
  probability: z.coerce.number().int().min(0).max(100).default(20),
  expectedCloseDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Valid expected close date is required' })
    .optional(),
  ownerId: z.string().trim().min(1).max(120).optional(),
  priority: dealPriorityEnum.default('MEDIUM'),
  description: optionalText(4000),
});

export const dealUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  companyId: z.string().trim().min(1).max(120).optional(),
  contactId: z.string().trim().max(120).nullable().optional(),
  value: z.coerce.number().finite().min(0).max(100_000_000).optional(),
  stage: dealStageEnum.optional(),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  expectedCloseDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Valid expected close date is required' })
    .optional(),
  ownerId: z.string().trim().min(1).max(120).optional(),
  priority: dealPriorityEnum.optional(),
  description: z.string().trim().max(4000).optional(),
  order: z.coerce.number().int().min(0).max(100000).optional(),
});

export const dealStageUpdateSchema = z.object({
  stage: dealStageEnum,
  order: z.coerce.number().int().min(0).max(100000).optional(),
});

export const activityCreateSchema = z.object({
  type: activityTypeEnum.default('TASK'),
  title: z.string().trim().min(1, 'Activity title is required').max(200),
  description: optionalText(4000),
  dueDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Valid due date is required' }),
  assignedToId: z.string().trim().min(1).max(120).optional(),
  leadId: z.string().trim().max(120).optional(),
  contactId: z.string().trim().max(120).optional(),
  dealId: z.string().trim().max(120).optional(),
  companyId: z.string().trim().max(120).optional(),
});

export const activityUpdateSchema = z.object({
  type: activityTypeEnum.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  completed: z.boolean().optional(),
  dueDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Valid due date is required' })
    .optional(),
  assignedToId: z.string().trim().min(1).max(120).optional(),
  leadId: z.string().trim().max(120).nullable().optional(),
  contactId: z.string().trim().max(120).nullable().optional(),
  dealId: z.string().trim().max(120).nullable().optional(),
  companyId: z.string().trim().max(120).nullable().optional(),
});

export const teamInviteSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().trim().email('A valid email address is required').max(255),
  role: userRoleEnum,
  title: z.string().trim().max(120).optional(),
});

export function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Invalid request payload';
  return issue.message;
}
