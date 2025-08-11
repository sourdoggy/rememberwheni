import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'only GET allowed' })
  }

  const { name, password } = req.query
  if (!name || !password) {
    return res.status(400).json({ error: 'missing file name or password' })
  }

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('name', name)
    .eq('password', password)
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data)
}
