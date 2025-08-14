import { createClient } from '@supabase/supabase-js'
import pako from 'pako'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'only GET allowed' })

  const { filename, password } = req.query
  if (!filename || !password)
    return res.status(400).json({ error: 'missing filename or password' })

  const { data: fileMeta, error: selectError } = await supabase
    .from('documents')
    .select('password')
    .eq('filename', filename)
    .single()

  if (selectError || fileMeta.password !== password)
    return res.status(403).json({ error: 'wrong filename or password' })

  const bucketName = 'documents'
  const filePath = `files/${filename}.txt`
  
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucketName)
    .download(filePath)

  if (downloadError)
    return res.status(500).json({ error: downloadError.message })

  res.status(200).json({ filename, content: pako.inflate(fileData, { to: 'string' }) })
}
