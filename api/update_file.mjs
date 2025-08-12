import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'only PUT allowed' })
  }

  const { filename, password, content } = req.body
  if (!filename || !password || !content) {
    return res.status(400).json({ error: 'missing file name, password, or content' })
  }

  const { data, error } = await supabase
    .from('documents')
    .update({ content })
    .eq('filename', filename)
    .eq('password', password)
    .select()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ message: 'file successfuly updated', data })
}
