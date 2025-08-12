import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'only DELETE allowed' })
  }

  const { filename, password } = req.body
  if (!filename || !password) {
    return res.status(400).json({ error: 'missing file name or password' })
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('filename', filename)
    .eq('password', password)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ message: 'file deleted' })
}
