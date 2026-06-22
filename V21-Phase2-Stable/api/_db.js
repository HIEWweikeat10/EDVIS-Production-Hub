// V21-Phase2-Stable — frozen 2026-06-21
// Shared Supabase REST helper — server-side only.
// SUPABASE_SERVICE_ROLE_KEY is read here and NEVER sent to the browser.

// Env values pasted into Vercel sometimes carry extra text beyond the real
// value (e.g. a whole .env block copied instead of just the value). JWTs
// and URLs never contain whitespace internally, so taking only the first
// whitespace-delimited token strips any trailing garbage reliably —
// stronger than .trim(), which only removes leading/trailing whitespace
// and leaves embedded "\n\nSOMETHING:" suffixes intact.
function cleanEnvVar(raw) {
  return String(raw || '').trim().split(/\s+/)[0] || ''
}

function getEnv() {
  const url = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '')
  const key = cleanEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!url || !key) {
    throw new Error('ENV_MISSING: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in Vercel')
  }
  return { url, key }
}

async function dbFetch(url, options, ms = 15000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function dbGet(path, params, env) {
  const qs = params ? '?' + params : ''
  const res = await dbFetch(`${env.url}/rest/v1/${path}${qs}`, {
    headers: { apikey: env.key, Authorization: `Bearer ${env.key}` },
  })
  if (!res.ok) { const t = await res.text(); throw new Error(`DB GET ${path} (${res.status}): ${t}`) }
  return res.json()
}

async function dbPost(path, body, prefer, env) {
  const res = await dbFetch(`${env.url}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      Prefer: prefer || 'return=representation',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) {
    let p = {}; try { p = JSON.parse(text) } catch {}
    throw Object.assign(new Error(p.message || text), { status: res.status, pg: p.code })
  }
  if (!text || text === 'null') return null
  try { return JSON.parse(text) } catch { return null }
}

async function dbPatch(path, filter, body, env) {
  const res = await dbFetch(`${env.url}/rest/v1/${path}?${filter}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) { const t = await res.text(); throw new Error(`DB PATCH ${path} (${res.status}): ${t}`) }
  return true
}

async function dbDelete(path, filter, env) {
  const res = await dbFetch(`${env.url}/rest/v1/${path}?${filter}`, {
    method: 'DELETE',
    headers: { apikey: env.key, Authorization: `Bearer ${env.key}`, Prefer: 'return=minimal' },
  })
  if (!res.ok) { const t = await res.text(); throw new Error(`DB DELETE ${path} (${res.status}): ${t}`) }
  return true
}

function json(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(status).end(JSON.stringify(data))
}
function err(res, msg, status = 500) { json(res, { ok: false, error: msg }, status) }

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text.trim()))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

module.exports = { getEnv, dbGet, dbPost, dbPatch, dbDelete, json, err, sha256, slug, genCode, cleanEnvVar }
