// V21-Phase2-Stable — frozen 2026-06-21
// GET /api/ping
// First route to test after deploying — confirms Vercel routing works
// and reports whether env vars are visible to Node.js functions, and
// whether any of them carry extra pasted content beyond the real value
// (e.g. a whole .env block pasted instead of just the value — produces
// "Headers.append: ... is an invalid header value" or generic "fetch
// failed" errors downstream, since the real key only matches the first
// whitespace-delimited token).
function checkVar(name) {
  const raw = process.env[name]
  if (!raw) return 'MISSING'
  const cleaned = raw.trim().split(/\s+/)[0] || ''
  if (cleaned.length !== raw.length) {
    return `SET (⚠ contains ${raw.length - cleaned.length} extra char(s) beyond the real value — re-copy ONLY the key/URL, not a surrounding text block)`
  }
  return 'SET'
}
module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).end(JSON.stringify({
    ok: true,
    version: 'V21-Phase2-Stable',
    releaseDate: '2026-06-21',
    msg: 'AD Command Phase 2 API is alive',
    time: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: checkVar('NEXT_PUBLIC_SUPABASE_URL'),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: checkVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      SUPABASE_SERVICE_ROLE_KEY: checkVar('SUPABASE_SERVICE_ROLE_KEY'),
    },
  }))
}
