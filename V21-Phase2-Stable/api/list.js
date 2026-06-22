// V21-Phase2-Stable — frozen 2026-06-21
// GET /api/list
// Returns active (non-archived) projects for the Manage dropdown.
// Never returns admin_key_hash itself — only a boolean hasAdminKey flag.
const { getEnv, dbGet, json, err } = require('./_db')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405)
  try {
    const env = getEnv()
    const rows = await dbGet('projects', `archived=eq.false&select=id,code,title,day_number,admin_key_hash,created_at&order=created_at.desc`, env)
    const projects = rows.map(r => ({
      id: r.id, code: r.code, title: r.title, dayNumber: r.day_number,
      createdAt: r.created_at, hasAdminKey: !!(r.admin_key_hash && r.admin_key_hash.length > 0),
    }))
    json(res, { ok: true, projects })
  } catch (e) {
    err(res, e.message)
  }
}
