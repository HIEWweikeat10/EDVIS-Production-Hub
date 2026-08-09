// Web Push fan-out — used by save.js whenever a broadcast row is inserted.
// Never throws: a push failure must never break broadcast creation itself.
const webpush = require('web-push')
const { cleanEnvVar } = require('./_db')

async function sendPushForBroadcast(env, projectId, targetDept, notif) {
  const publicKey = cleanEnvVar(process.env.VAPID_PUBLIC_KEY)
  const privateKey = cleanEnvVar(process.env.VAPID_PRIVATE_KEY)
  if (!publicKey || !privateKey || !projectId) return

  webpush.setVapidDetails(
    cleanEnvVar(process.env.VAPID_SUBJECT) || 'mailto:noreply@example.com',
    publicKey, privateKey,
  )

  let qs = `project_id=eq.${projectId}`
  if (targetDept) qs += `&dept=eq.${encodeURIComponent(targetDept)}`
  const listRes = await fetch(`${env.url}/rest/v1/push_subscriptions?${qs}`, {
    headers: { apikey: env.key, Authorization: `Bearer ${env.key}` },
  })
  if (!listRes.ok) return
  const subs = await listRes.json()
  if (!Array.isArray(subs) || !subs.length) return

  const payload = JSON.stringify(notif)
  await Promise.all(subs.map(async (s) => {
    const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }
    try {
      await webpush.sendNotification(subscription, payload)
    } catch (e) {
      // 404/410 = the browser revoked or expired this subscription — remove it
      // so we stop wasting sends on a dead endpoint.
      if (e.statusCode === 404 || e.statusCode === 410) {
        fetch(`${env.url}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, {
          method: 'DELETE',
          headers: { apikey: env.key, Authorization: `Bearer ${env.key}`, Prefer: 'return=minimal' },
        }).catch(() => {})
      }
    }
  }))
}

module.exports = { sendPushForBroadcast }
