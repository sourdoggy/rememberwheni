import { createClient } from '@supabase/supabase-js'
import pako from 'pako'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'only POST allowed' })
  }

  const { filename, password } = req.body
  if (!filename || !password) {
    return res.status(400).json({ error: 'missing filename or password' })
  }

  const filenameRegex = /^[a-zA-Z0-9_\-\+\(\)\/!\?:@&#%\*]{3,20}$/
  const passwordRegex = /^[a-zA-Z0-9_\-\+\(\)\/!\?:@&#%\*]{5,20}$/

  if (!filenameRegex.test(filename)) {
    return res.status(400).json({ error: 'invalid filename'})
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'invalid password'})
  }
  
  const { data: existingFile } = await supabase
    .from('documents')
    .select('filename')
    .eq('filename', filename)
    .single()

  if (existingFile) {
    return res.status(409).json({ error: 'file already exists' })
  }

  const { error: insertError } = await supabase
    .from('documents')
    .insert({ filename, password, content: 'nill', updated_at: new Date() })

  if (insertError) {
    return res.status(500).json({ error: insertError.message })
  }

  const fileContent = pako.deflate('hello world!', {to:'string'})
  const buffer = Buffer.from(fileContent)
  const bucketName = 'documents'
  const filePath = `files/${filename}.txt`

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, { upsert: false })

  if (uploadError) {
    await supabase
      .from('documents')
      .delete()
      .eq('filename', filename)
    return res.status(500).json({ error: uploadError.message })
  }

  const { error: updateError } = await supabase
    .from('documents')
    .update({ content: filePath, updated_at: new Date() })
    .eq('filename', filename)
    .eq('password', password)

  if (updateError) {
    await supabase.storage.from(bucketName).remove([filePath]).catch(() => {})
    await supabase.from('documents').delete().eq('filename', filename)
    return res.status(500).json({ error: updateError.message })
  }

  return res.status(200).json({ message: 'new file created and uploaded' })
}
