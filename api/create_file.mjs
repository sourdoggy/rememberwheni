import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') 
    return res.status(405).json({ error: 'only POST allowed' })

  const { filename, password } = req.body
  if (!filename || !password) 
    return res.status(400).json({ error: 'missing filename or password' })

  const { data: existingFile, error: selectError } = await supabase
    .from('documents')
    .select('filename')
    .eq('filename', filename)
    .single()

  if (existingFile) 
    return res.status(409).json({ error: 'file already exists' })

  const { error: insertError } = await supabase
    .from('documents')
    .insert({ filename, password, content: 'hello world!', updated_at: new Date() })

  if (insertError) 
    return res.status(500).json({ error: insertError.message })

  res.status(200).json({ message: 'new file created!' })
}
