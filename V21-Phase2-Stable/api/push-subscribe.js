// POST /api/push-subscribe
// Body: { projectId, uniqueKey, dept, subscription: { endpoint, keys: { p256dh, auth } } }
// Upserts a device's Push subscription so it can receive real OS
// notifications (safety alerts, broadcasts) even when the app is closed.
const { getEnv, json, err } = require('./_db')

async function dbFetch(url, opts, ms = 15000) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms)
  try { return await fetch(url, { ...opts, signal: ctrl.signal }) } finally { clearTimeout(t) }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405)

  try {
    const env = getEnv()
    const b = req.body || {}
    const projectId = String(b.projectId || '').trim()
    const uniqueKey = String(b.uniqueKey || '').trim()
    const dept = String(b.dept || '').trim()
    const sub = b.subscription || {}
    const endpoint = String(sub.endpoint || '').trim()
    const p256dh = sub.keys && sub.keys.p256dh
    const auth = sub.keys && sub.keys.auth

    if (!projectId) return err(res, 'projectId is required', 400)
    if (!uniqueKey) return err(res, 'uniqueKey is required', 400)
    if (!endpoint || !p256dh || !auth) return err(res, 'Invalid push subscription', 400)

    const dbRes = await dbFetch(`${env.url}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ project_id: projectId, unique_key: uniqueKey, dept, endpoint, p256dh, auth }),
    })
    if (!dbRes.ok) { const t = await dbRes.text(); return err(res, t, dbRes.status) }

    json(res, { ok: true })
  } catch (e) {
    err(res, e.message)
  }
}
