import express from 'express'
import multer from 'multer'
import { supabase } from '../lib/supabase.js'
import { auth } from '../lib/auth.js'
import { fromNodeHeaders } from 'better-auth/node'

const router = express.Router()

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// Endpoint to upload profile photo
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    // Authenticate the user from the request
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Ensure the bucket exists (idempotent, but usually done once)
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketName = 'profile-photos'
    if (!buckets?.find(b => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: true })
    }

    // Upload to Supabase Storage
    const fileExtension = file.originalname.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExtension}`
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      })

    if (error) {
      throw error
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    res.json({ url: publicUrl })
  } catch (err: any) {
    console.error('Upload Error:', err)
    res.status(500).json({ error: 'Failed to upload photo', message: err.message })
  }
})

export default router
