import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
const lines = envContent.split('\n')
for (let line of lines) {
    const idx = line.indexOf('=')
    if (idx > -1) env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim()
}
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase.rpc('get_tables', {}) // fake to trigger error
  console.log(error)
}
test()
