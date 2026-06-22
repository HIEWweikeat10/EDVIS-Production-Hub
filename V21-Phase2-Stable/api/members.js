// V21-Phase2-Stable — frozen 2026-06-21
// POST /api/members
// Body: { code, name, phone, role, dept }
// Crew joins using ONLY the project code — no admin key required.
const { getEnv, dbGet, dbPost, json, err, slug } = require('./_db')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405)

  try {
    const env = getEnv()
    const b = req.body || {}
    const code  = String(b.code  || '').trim().toUpperCase()
    const name  = String(b.name  || '').trim()
    const phone = String(b.phone || '').trim()
    const role  = String(b.role  || '').trim()
    const dept  = String(b.dept  || '').trim()

    if (!code)  return err(res, 'Project code is required', 400)
    if (!name)  return err(res, 'Your name is required', 400)
    if (!role)  return err(res, 'Role is required', 400)
    if (!dept)  return err(res, 'Department is required', 400)

    const rows = await dbGet('projects', `code=eq.${encodeURIComponent(code)}&archived=eq.false&select=id,code,title,day_number`, env)
    if (!rows.length) return err(res, `Project code "${code}" not found`, 404)
    const project = rows[0]

    const ADMIN_ROLES = ['Director', 'AD (Assistant Director)', 'Producer']
    const isAdmin = ADMIN_ROLES.includes(role)
    const uniqueKey = `${slug(name)}_${slug(dept)}`

    // Check for existing member by name to avoid duplicates across rejoins
    const existing = await dbGet('crew_members',
      `project_id=eq.${project.id}&name=eq.${encodeURIComponent(name)}&select=id`, env)

    if (existing.length) {
      await fetch(`${env.url}/rest/v1/crew_members?id=eq.${existing[0].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', apikey: env.key, Authorization: `Bearer ${env.key}`, Prefer: 'return=minimal' },
        body: JSON.stringify({ phone, role, dept, is_admin: isAdmin, last_login: new Date().toISOString(), last_seen_at: new Date().toISOString() }),
      })
    } else {
      await dbPost('crew_members', {
        project_id: project.id, unique_key: uniqueKey, name, phone, role, dept, is_admin: isAdmin,
        last_login: new Date().toISOString(), last_seen_at: new Date().toISOString(),
      }, 'return=minimal', env)
    }

    json(res, {
      ok: true,
      project: {
        id: project.id, code: project.code, title: project.title,
        dayNumber: project.day_number, isAdmin,
      },
    })
  } catch (e) {
    err(res, e.message)
  }
}
