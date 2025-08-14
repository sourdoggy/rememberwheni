import { createClient } from '@supabase/supabase-js'
import pako from 'pako'

export const config = {
  api: {
    bodyParser: false,
  },
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'only PUT allowed' })
  }
  // file size limit
  const MAX_SIZE = 2 * 1024 * 1024
  let size = 0
  let rawBody = ''

  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_SIZE) {
      res.statusCode = 413
      res.end(JSON.stringify({ error: 'file too large' }))
      req.destroy()
      return
    }
    rawBody += chunk
  }

  let body
  try {
    body = JSON.parse(rawBody)
  } catch {
    return res.status(400).json({ error: 'invalid json' })
  }
  
  // checks
  const { filename, password, content } = body
  if (!filename || !password || !content) {
    return res
      .status(400)
      .json({ error: 'missing file name, password, or content' })
  }

  const deflatedContent = pako.deflate(content, {to:'string'})
  
  const bucketName = 'documents'
  const filePath = `files/${filename}.txt`

  const buffer = Buffer.from(deflatedContent)
  
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, { upsert: true })
  
  if (uploadError) return res.status(500).json({ error: uploadError.message })
  
  const { data, error } = await supabase
    .from('documents')
    .update({ content: filePath, updated_at: new Date() })
    .eq('filename', filename)
    .eq('password', password)
    .select()

  if (error) {
    return res.status(500).json({ error: error.message })
  }
  
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'wrong filename or password' })
  }
  
  return res
    .status(200)
    .json({ message: 'file successfully updated', data })
}
