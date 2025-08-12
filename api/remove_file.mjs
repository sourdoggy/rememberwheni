import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'DELETE') 
    return res.status(405).json({ error: 'only DELETE allowed' })

  const { filename, password } = req.body
  if (!filename || !password) 
    return res.status(400).json({ error: 'missing file name or password' })

  const { data: fileMeta, error: selectError } = await supabase
    .from('documents')
    .select('filename')
    .eq('filename', filename)
    .eq('password', password)
    .single()

  if (selectError) 
    return res.status(404).json({ error: 'wrong filename or password' })

  const bucketName = 'documents'
  const filePath = `files/${filename}.txt`
  
  const { error: deleteStorageError } = await supabase.storage
    .from(bucketName)
    .remove(filePath)

  if (deleteStorageError) 
    return res.status(500).json({ error: deleteStorageError.message })

  const { error: deleteDbError } = await supabase
    .from('documents')
    .delete()
    .eq('filename', filename)
    .eq('password', password)

  if (deleteDbError) 
    return res.status(500).json({ error: deleteDbError.message })

  return res.status(200).json({ message: 'file deleted' })
}
