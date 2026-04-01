import express from 'express'
import { jobs, activityLogs } from '../db/schema.js'
import { eq, sql, desc, and, gte } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.js'
import { db } from '../db/index.js'

const router = express.Router()

// Apply authentication to all analytics routes
router.use(authenticate)

router.get('/summary', async (req, res) => {
  const userId = (req as any).user.id

  try {
    const stats = await db.select({
      total: sql<number>`count(*)`,
      interviews: sql<number>`count(*) filter (where status = 'Interview')`,
      offers: sql<number>`count(*) filter (where status = 'Offer')`,
      rejected: sql<number>`count(*) filter (where status = 'Rejected')`,
      applied: sql<number>`count(*) filter (where status = 'Applied')`,
    }).from(jobs).where(eq(jobs.userId, userId))

    const sourceStats = await db.select({
      source: jobs.source,
      count: sql<number>`count(*)`
    })
    .from(jobs)
    .where(eq(jobs.userId, userId))
    .groupBy(jobs.source)

    const summary = stats[0]
    const total = Number(summary.total)
    const rejectionRate = total > 0 
      ? (Number(summary.rejected) / total) * 100
      : 0
    const interviewRate = total > 0
      ? (Number(summary.interviews) / total) * 100
      : 0

    res.json({
      totalApplications: total,
      interviewsCount: Number(summary.interviews),
      offersCount: Number(summary.offers),
      appliedCount: Number(summary.applied),
      rejectionRate: Number(rejectionRate.toFixed(1)),
      interviewRate: Number(interviewRate.toFixed(1)),
      sourceDistribution: sourceStats,
      activeOpportunitiesCount: Number(summary.interviews) + Number(summary.offers) + Number(summary.applied)
    })
  } catch (err) {
    console.error('Analytics Error:', err)
    res.status(500).json({ error: 'Failed to fetch summary stats' })
  }
})

router.get('/recent', async (req, res) => {
  const userId = (req as any).user.id

  try {
    const recentJobs = await db.query.jobs.findMany({
      where: eq(jobs.userId, userId),
      limit: 5,
      orderBy: [desc(jobs.createdAt)]
    })
    res.json(recentJobs)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent submissions' })
  }
})

router.get('/activity', async (req, res) => {
  const userId = (req as any).user.id
  const range = parseInt(req.query.range as string) || 6
  const since = new Date()
  since.setMonth(since.getMonth() - (range - 1))
  since.setDate(1) // Start from beginning of the month
  since.setHours(0, 0, 0, 0)
  
  try {
    // Group by month and source for the requested range
    const activity = await db.select({
      month: sql<string>`to_char(created_at, 'Mon')`,
      count: sql<number>`count(*)`,
      source: jobs.source,
      sortKey: sql<string>`to_char(created_at, 'YYYY-MM')`
    })
    .from(jobs)
    .where(and(
      eq(jobs.userId, userId),
      gte(jobs.createdAt, since)
    ))
    .groupBy(sql`to_char(created_at, 'Mon'), to_char(created_at, 'YYYY-MM'), ${jobs.source}`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM')`)
    
    res.json(activity)
  } catch (err) {
    console.error('Activity Metrics Error:', err)
    res.status(500).json({ error: 'Failed to fetch activity metrics' })
  }
})

router.get('/upcoming-interviews', async (req, res) => {
  const userId = (req as any).user.id
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  try {
    // 1. Fetch specific interview events from activity logs
    const logInterviews = await db.select({
      id: activityLogs.id,
      title: activityLogs.title,
      description: activityLogs.description,
      time: activityLogs.time,
      company: jobs.company,
      role: jobs.role,
      source: sql<string>`'log'`
    })
    .from(activityLogs)
    .innerJoin(jobs, eq(activityLogs.jobId, jobs.id))
    .where(and(
      eq(jobs.userId, userId),
      eq(activityLogs.type, 'Interview'),
      gte(activityLogs.time, startOfToday)
    ))

    // 2. Fetch jobs currently in 'Interview' status with a future deadline
    // This catches jobs where the user just set a deadline for the interview stage
    const statusInterviews = await db.select({
      id: jobs.id,
      title: sql<string>`'Scheduled Interview'`,
      description: sql<string>`'Interview stage deadline'`,
      time: jobs.deadline,
      company: jobs.company,
      role: jobs.role,
      source: sql<string>`'status'`
    })
    .from(jobs)
    .where(and(
      eq(jobs.userId, userId),
      eq(jobs.status, 'Interview'),
      gte(jobs.deadline, startOfToday)
    ))

    // Merge and deduplicate (roughly, by company/role/time if they are identical)
    // For now, just merge and sort
    const allInterviews = [...logInterviews, ...statusInterviews]
      .filter(item => item.time !== null)
      .sort((a, b) => new Date(a.time!).getTime() - new Date(b.time!).getTime())

    res.json(allInterviews)
  } catch (err) {
    console.error('Upcoming Interviews Error:', err)
    res.status(500).json({ error: 'Failed to fetch upcoming interviews' })
  }
})

router.get('/high-impact', async (req, res) => {
  const userId = (req as any).user.id

  try {
    const highImpactJobs = await db.query.jobs.findMany({
      where: and(
        eq(jobs.userId, userId),
        sql`status IN ('Interview', 'Offer', 'Applied')`
      ),
      limit: 5,
      orderBy: [desc(jobs.updatedAt)]
    })
    
    // Map status to sentiment and icons for the frontend
    const mapped = highImpactJobs.map(job => {
      let sentiment = 'In Progress'
      let sentimentIcon = 'pending'
      let sentimentColor = 'primary'
      let icon = 'work'

      if (job.status === 'Offer') {
        sentiment = 'Excellent'
        sentimentIcon = 'star'
        sentimentColor = 'primary'
        icon = 'military_tech'
      } else if (job.status === 'Interview') {
        sentiment = 'Strong Match'
        sentimentIcon = 'trending_up'
        sentimentColor = 'tertiary'
        icon = 'rocket_launch'
      } else if (job.status === 'Applied') {
        sentiment = 'Exploring'
        sentimentIcon = 'search'
        sentimentColor = 'secondary'
        icon = 'send'
      }

      return {
        ...job,
        sentiment,
        sentimentIcon,
        sentimentColor,
        icon
      }
    })

    res.json(mapped)
  } catch (err) {
    console.error('High Impact Error:', err)
    res.status(500).json({ error: 'Failed to fetch high impact opportunities' })
  }
})

export default router
