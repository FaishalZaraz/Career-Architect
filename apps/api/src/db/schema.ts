import { pgTable, text, timestamp, boolean, doublePrecision, integer, pgEnum, uuid } from 'drizzle-orm/pg-core'

// -- Auth Related Tables (Better Auth) --

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  role: text('role'),
  banned: boolean('banned'),
  banReason: text('banReason'),
  banExpires: timestamp('banExpires'),
  twoFactorEnabled: boolean('twoFactorEnabled').default(false),
  title: text('title'),
  bio: text('bio')
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt')
})

// -- JobTracker App Tables --

export const jobStatusEnum = pgEnum('job_status', [
  'Wishlist', 
  'Applied', 
  'Interview', 
  'Offer', 
  'Rejected', 
  'Archived'
])

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company: text('company').notNull(),
  role: text('role').notNull(),
  logoUrl: text('logo_url'),
  status: jobStatusEnum('status').notNull().default('Wishlist'),
  location: text('location'),
  isRemote: boolean('is_remote').default(false),
  workArrangement: text('work_arrangement').default('Remote'),
  team: text('team').default('Engineering'),
  source: text('source').default('Direct'), // 'LinkedIn' | 'Referral' | 'Indeed' | 'Glassdoor' | 'Direct' | 'Other'
  salaryMin: doublePrecision('salary_min'),
  salaryMax: doublePrecision('salary_max'),
  notes: text('notes'),
  interviewType: text('interview_type'), // 'On-site' | 'Google Meet' | 'Zoom' | 'Teams'
  interviewLink: text('interview_link'), // Link or address
  deadline: timestamp('deadline'),
  jobDescriptionUrl: text('job_description_url'),
  companyProfileUrl: text('company_profile_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const activityTypeEnum = pgEnum('activity_type', [
  'Applied', 
  'Assessment', 
  'Interview', 
  'FollowUp', 
  'OfferReceived', 
  'Rejection',
  'Note'
])

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  type: activityTypeEnum('type').notNull().default('Note'),
  title: text('title').notNull(),
  description: text('description'),
  time: timestamp('time').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  type: text('type').notNull(), // 'Resume' | 'CoverLetter' | 'Other'
  size: integer('size'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' })
})

export const jobTags = pgTable('job_tags', {
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: [table.jobId, table.tagId]
}))
