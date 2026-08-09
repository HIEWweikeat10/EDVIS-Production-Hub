// GET /api/push-vapid-key
// Returns the public VAPID key the browser needs to open a Push
// subscription. The private key never leaves the server.
const { cleanEnvVar } = require('./_db')
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')
  const publicKey = cleanEnvVar(process.env.VAPID_PUBLIC_KEY)
  if (!publicKey) {
    res.status(500).end(JSON.stringify({ ok: false, error: 'ENV_MISSING: VAPID_PUBLIC_KEY not set in Vercel' }))
    return
  }
  res.status(200).end(JSON.stringify({ ok: true, publicKey }))
}
