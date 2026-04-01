import { db } from '../db/index.js'
import { activityLogs } from '../db/schema.js'

export const activityService = {
  /**
   * Log an event for a specific job application.
   */
  async log(params: {
    jobId: string,
    type: 'Applied' | 'Assessment' | 'Interview' | 'FollowUp' | 'OfferReceived' | 'Rejection' | 'Note',
    title: string,
    description?: string,
    time?: Date
  }) {
    try {
      const [newLog] = await db.insert(activityLogs).values({
        jobId: params.jobId,
        type: params.type,
        title: params.title,
        description: params.description,
        time: params.time || new Date()
      }).returning()
      
      return newLog
    } catch (err) {
      console.error('Failed to log activity:', err)
      throw err
    }
  },

  /**
   * Get all activity logs for a specific job.
   */
  async getByJobId(jobId: string) {
    return await db.query.activityLogs.findMany({
      where: (logs, { eq }) => eq(logs.jobId, jobId),
      orderBy: (logs, { desc }) => [desc(logs.time)]
    })
  }
}
