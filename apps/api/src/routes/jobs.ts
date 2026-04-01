import express from 'express'
import { db } from '../db/index.js'
import { jobs, activityLogs, documents } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.js'
import multer from 'multer'
import { supabase } from '../lib/supabase.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Apply authentication middleware to all routes in this router
router.use(authenticate)

router.get('/', async (req, res) => {
  const userId = (req as any).user.id

  try {
    const allJobs = await db.query.jobs.findMany({
      where: eq(jobs.userId, userId),
      orderBy: [desc(jobs.createdAt)]
    })
    res.json(allJobs)
  } catch (err: any) {
    console.error('Fetch Jobs Error:', err)
    res.status(500).json({ error: 'Failed to fetch jobs', details: err.message })
  }
})

router.post('/', async (req, res) => {
  const userId = (req as any).user.id
  const { company, role, status, location, isRemote, workArrangement, team, source, salaryMin, salaryMax, notes, interviewType, interviewLink, deadline } = req.body

  try {
    const [newJob] = await db.insert(jobs).values({
      userId,
      company,
      role,
      status: status || 'Wishlist',
      location,
      isRemote,
      workArrangement,
      team,
      source: source || 'Direct',
      salaryMin,
      salaryMax,
      notes,
      interviewType,
      interviewLink,
      deadline: deadline && !isNaN(Date.parse(deadline)) ? new Date(deadline) : null
    }).returning()

    // Add initial activity log
    await db.insert(activityLogs).values({
      jobId: newJob.id,
      type: 'Note',
      title: 'Job Entry Created',
      description: `Started tracking ${role} at ${company}.`
    })

    res.status(201).json(newJob)
  } catch (err: any) {
    console.error('Create Job Error:', err)
    res.status(500).json({ error: 'Failed to create job', details: err.message })
  }
})

router.get('/:id', async (req, res) => {
  const userId = (req as any).user.id

  try {
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, req.params.id), eq(jobs.userId, userId))
    })

    if (!job) return res.status(404).json({ error: 'Job not found' })

    const logs = await db.query.activityLogs.findMany({
      where: eq(activityLogs.jobId, job.id),
      orderBy: [desc(activityLogs.time)]
    })

    res.json({ ...job, logs })
  } catch (err: any) {
    console.error('Fetch Job Detail Error:', err)
    res.status(500).json({ error: 'Failed to fetch job details', details: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  const userId = (req as any).user.id
  
  // Sanitize input to prevent accidental updates to id/userId
  const { company, role, status, location, isRemote, workArrangement, team, source, salaryMin, salaryMax, notes, interviewType, interviewLink, deadline } = req.body
  const updateData: any = { updatedAt: new Date() }
  
  if (company !== undefined) updateData.company = company
  if (role !== undefined) updateData.role = role
  if (status !== undefined) updateData.status = status
  if (location !== undefined) updateData.location = location
  if (isRemote !== undefined) updateData.isRemote = isRemote
  if (workArrangement !== undefined) updateData.workArrangement = workArrangement
  if (team !== undefined) updateData.team = team
  if (source !== undefined) updateData.source = source
  if (salaryMin !== undefined) updateData.salaryMin = salaryMin
  if (salaryMax !== undefined) updateData.salaryMax = salaryMax
  if (notes !== undefined) updateData.notes = notes
  if (interviewType !== undefined) updateData.interviewType = interviewType
  if (interviewLink !== undefined) updateData.interviewLink = interviewLink
  if (deadline !== undefined) updateData.deadline = deadline && !isNaN(Date.parse(deadline)) ? new Date(deadline) : null

  try {
    const [updatedJob] = await db.update(jobs)
      .set(updateData)
      .where(and(eq(jobs.id, req.params.id), eq(jobs.userId, userId)))
      .returning()

    if (!updatedJob) return res.status(404).json({ error: 'Job not found' })

    res.json(updatedJob)
  } catch (err: any) {
    console.error('Update Job Error:', err)
    res.status(500).json({ error: 'Failed to update job', details: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  const userId = (req as any).user.id

  try {
    const [deletedJob] = await db.delete(jobs)
      .where(and(eq(jobs.id, req.params.id), eq(jobs.userId, userId)))
      .returning()

    if (!deletedJob) return res.status(404).json({ error: 'Job not found' })

    res.json({ message: 'Job deleted successfully', deletedJob })
  } catch (err) {
    console.error('Delete Job Error:', err)
    res.status(500).json({ error: 'Failed to delete job' })
  }
})

// --- Document Routes ---

router.get('/:id/documents', async (req, res) => {
  try {
    const docs = await db.query.documents.findMany({
      where: eq(documents.jobId, req.params.id),
      orderBy: [desc(documents.createdAt)]
    })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

router.post('/:id/documents', async (req, res) => {
  const { name, url, type, size } = req.body
  try {
    const [newDoc] = await db.insert(documents).values({
      jobId: req.params.id,
      name,
      url,
      type,
      size
    }).returning()
    res.status(201).json(newDoc)
  } catch (err) {
    res.status(500).json({ error: 'Failed to add document' })
  }
})

router.delete('/documents/:docId', async (req, res) => {
  try {
    const [deletedDoc] = await db.delete(documents)
      .where(eq(documents.id, req.params.docId))
      .returning()
    
    if (!deletedDoc) return res.status(404).json({ error: 'Document not found' })
    res.json({ message: 'Document deleted successfully', deletedDoc })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete document' })
  }
})

router.post('/:id/upload', upload.single('file'), async (req, res) => {
  const { id } = req.params
  const file = req.file

  if (!file) return res.status(400).json({ error: 'No file uploaded' })

  try {
    const fileExt = file.originalname.split('.').pop()
    const fileName = `${id}/${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('job-documents')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('job-documents')
      .getPublicUrl(fileName)

    // Save metadata to DB
    const [newDoc] = await db.insert(documents).values({
      jobId: id,
      name: file.originalname,
      url: publicUrl,
      type: file.mimetype || 'application/octet-stream',
      size: file.size
    }).returning()

    res.status(201).json(newDoc)
  } catch (err: any) {
    console.error('Proxy Upload Error:', err)
    res.status(500).json({ error: 'Failed to upload document via proxy', details: err.message })
  }
})

export default router
