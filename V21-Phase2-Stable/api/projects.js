// V21-Phase2-Stable — frozen 2026-06-21
// POST /api/projects
// Body: { title, adminKey, creatorName, creatorPhone, creatorRole, creatorDept }
// Creates project + first crew member. Admin key is hashed before storage —
// the plaintext key is never written to the database or returned in the response.
const { getEnv, dbPost, json, err, sha256, slug, genCode } = require('./_db')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405)

  try {
    const env = getEnv()
    const b = req.body || {}
    const title       = String(b.title || '').trim()
    const adminKey    = String(b.adminKey || '').trim()
    const creatorName = String(b.creatorName || '').trim()
    const creatorPhone= String(b.creatorPhone || '').trim()
    const creatorRole = String(b.creatorRole || '').trim()
    const creatorDept = String(b.creatorDept || '').trim()

    if (!title)       return err(res, 'Production title is required', 400)
    if (!adminKey)    return err(res, 'Admin key is required', 400)
    if (!creatorName) return err(res, 'Your name is required', 400)
    if (!creatorRole) return err(res, 'Role is required', 400)
    if (!creatorDept) return err(res, 'Department is required', 400)

    let code = genCode()
    let attempts = 0
    let project = null
    while (attempts < 5 && !project) {
      try {
        const adminKeyHash = await sha256(adminKey)
        const rows = await dbPost('projects', {
          code, title, admin_key_hash: adminKeyHash,
        }, 'return=representation', env)
        project = Array.isArray(rows) ? rows[0] : rows
      } catch (e) {
        if (e.pg === '23505' || e.status === 409) { code = genCode(); attempts++; continue }
        throw e
      }
    }
    if (!project) return err(res, 'Could not generate a unique project code, please retry', 500)

    const uniqueKey = `${slug(creatorName)}_${slug(creatorDept)}`
    await dbPost('crew_members', {
      project_id: project.id, unique_key: uniqueKey, name: creatorName, phone: creatorPhone || '',
      role: creatorRole, dept: creatorDept, is_admin: true,
      last_login: new Date().toISOString(), last_seen_at: new Date().toISOString(),
    }, 'return=minimal', env).catch((e) => { console.error('crew_members insert failed:', e.message) })

    json(res, {
      ok: true,
      project: {
        id: project.id, code: project.code, title: project.title,
        dayNumber: project.day_number, isAdmin: true,
      },
    })
  } catch (e) {
    err(res, e.message)
  }
}
