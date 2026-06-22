// V21-Phase2-Stable — frozen 2026-06-21
// POST /api/save
// Body: { path, payload, method, id }
// Generic write used by every module: scenes, talent, dept_status, meals,
// broadcasts, reports, camera_log, production_history, crew_members.
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
    const { path, payload, method = 'POST', id, onConflict, filterCol, filterVal } = req.body || {}
    if (!path || payload === undefined) return err(res, 'Missing path or payload', 400)

    const base = env.url
    const hdr = { 'Content-Type': 'application/json', apikey: env.key, Authorization: `Bearer ${env.key}` }
    let url = `${base}/rest/v1/${path}`
    let meth = method
    let prefer = 'return=representation'

    if (method === 'UPSERT') {
      prefer = 'resolution=merge-duplicates,return=representation'
      meth = 'POST'
      // PostgREST needs on_conflict to know which unique constraint to upsert
      // against — without it, every call inserts a fresh row and the second
      // write on the same key silently fails the unique constraint.
      if (onConflict) url += `?on_conflict=${encodeURIComponent(onConflict)}`
    }
    if (method === 'PATCH' || method === 'DELETE') {
      if (id) url += `?id=eq.${encodeURIComponent(id)}`
      else if (method === 'DELETE' && filterCol && filterVal) url += `?${encodeURIComponent(filterCol)}=eq.${encodeURIComponent(filterVal)}`
      prefer = 'return=representation'
    }
    if (method === 'DELETE') prefer = 'return=minimal'

    const dbRes = await dbFetch(url, {
      method: meth,
      headers: { ...hdr, Prefer: prefer },
      body: method !== 'DELETE' ? JSON.stringify(payload) : undefined,
    })

    if (dbRes.status === 204) return json(res, { ok: true })
    const text = await dbRes.text()
    if (!dbRes.ok) {
      let p = {}; try { p = JSON.parse(text) } catch {}
      return err(res, p.message || text, dbRes.status)
    }
    let row = null
    if (text && text !== 'null') { try { const rows = JSON.parse(text); row = Array.isArray(rows) ? rows[0] : rows } catch {} }
    json(res, { ok: true, row: row || null })
  } catch (e) {
    err(res, e.message)
  }
}
