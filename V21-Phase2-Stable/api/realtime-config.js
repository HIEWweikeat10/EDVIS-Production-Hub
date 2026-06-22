// V21-Phase2-Stable — frozen 2026-06-21
// GET /api/realtime-config
// Returns the Supabase URL + ANON key only — needed by the browser to open
// a Realtime subscription. The anon key is public by design (RLS protects
// data); SUPABASE_SERVICE_ROLE_KEY is never returned here or anywhere else.
const { cleanEnvVar } = require('./_db')
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const url     = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anonKey = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  res.setHeader('Content-Type', 'application/json')
  if (!url || !anonKey) {
    res.status(500).end(JSON.stringify({ ok: false, error: 'ENV_MISSING: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY' }))
    return
  }
  res.status(200).end(JSON.stringify({ ok: true, url: url.replace(/\/+$/, ''), anonKey }))
}
