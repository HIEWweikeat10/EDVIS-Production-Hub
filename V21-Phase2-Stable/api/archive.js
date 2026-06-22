// V21-Phase2-Stable — frozen 2026-06-21
// POST /api/archive
// Body: { code, adminKey, archivedBy }
// Verifies the admin key against the stored hash before archiving.
const { getEnv, dbGet, dbPatch, json, err, sha256 } = require('./_db')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405)

  try {
    const env = getEnv()
    const { code, adminKey, archivedBy } = req.body || {}
    if (!code)     return err(res, 'code is required', 400)
    if (!adminKey) return err(res, 'adminKey is required', 400)

    const rows = await dbGet('projects', `code=eq.${encodeURIComponent(String(code).toUpperCase())}&select=id,title,admin_key_hash`, env)
    if (!rows.length) return err(res, 'Project not found', 404)
    const project = rows[0]

    if (!project.admin_key_hash) return err(res, 'LEGACY_NO_KEY: project has no admin key set', 403)
    const hash = await sha256(adminKey)
    if (hash !== project.admin_key_hash) return err(res, 'INVALID_ADMIN_KEY', 403)

    await dbPatch('projects', `id=eq.${project.id}`, {
      archived: true, archived_at: new Date().toISOString(), archived_by: archivedBy || 'admin',
    }, env)

    json(res, { ok: true, archived: project.title })
  } catch (e) {
    err(res, e.message)
  }
}
