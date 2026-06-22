// V21-Phase2-Stable — frozen 2026-06-21
// POST /api/reset-project
// Body: { code, adminKey }
// Permanently deletes active production data: scenes, camera_log,
// scene_cameras, talent, dept_status, meals, broadcasts, reports,
// call_sheets, script_scenes, script_lines (cascade), and destinations.
// Resets the project's own daily/break/day fields back to defaults.
// History (production_history) is intentionally PRESERVED — it is a
// permanent audit trail, not active production data. Use a dedicated
// "Delete History" function if the user wants to clear it manually.
// The project row itself (id, code, title, admin_key_hash) is KEPT —
// this is a full data wipe, not a project deletion.
// Requires the admin key, verified server-side, since this is destructive
// and irreversible.
const { getEnv, dbGet, dbPatch, dbDelete, json, err, sha256 } = require('./_db')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405)

  try {
    const env = getEnv()
    const b = req.body || {}
    const code = String(b.code || '').trim().toUpperCase()
    const adminKey = String(b.adminKey || '').trim()
    if (!code) return err(res, 'code is required', 400)
    if (!adminKey) return err(res, 'adminKey is required', 400)

    const projRows = await dbGet('projects', `code=eq.${encodeURIComponent(code)}&select=id,admin_key_hash`, env)
    if (!projRows.length) return err(res, 'Project not found: ' + code, 404)
    const project = projRows[0]

    if (!project.admin_key_hash) return err(res, 'LEGACY_NO_KEY: project has no admin key set', 403)
    const hash = await sha256(adminKey)
    if (hash !== project.admin_key_hash) return err(res, 'INVALID_ADMIN_KEY', 403)

    const pid = project.id

    // script_lines cascade automatically via FK ON DELETE CASCADE when
    // script_scenes are deleted, so they don't need their own delete call.
    await Promise.all([
      dbDelete('camera_log',          `project_id=eq.${pid}`, env).catch(() => {}),
      dbDelete('scenes',              `project_id=eq.${pid}`, env).catch(() => {}), // scene_cameras cascade
      dbDelete('dept_status',         `project_id=eq.${pid}`, env).catch(() => {}),
      dbDelete('talent',              `project_id=eq.${pid}`, env).catch(() => {}),
      dbDelete('meals',               `project_id=eq.${pid}`, env).catch(() => {}),
      dbDelete('broadcasts',          `project_id=eq.${pid}`, env).catch(() => {}),
      dbDelete('reports',             `project_id=eq.${pid}`, env).catch(() => {}),
      dbDelete('call_sheets',         `project_id=eq.${pid}`, env).catch(() => {}),
      dbDelete('script_scenes',       `project_id=eq.${pid}`, env).catch(() => {}),
      dbDelete('destinations',        `project_id=eq.${pid}`, env).catch(() => {}),
      dbPatch('projects', `id=eq.${pid}`, {
        day_number: 1, is_wrapped: false,
        meal_status: 'available', break_active: false, break_label: '', break_end_at: null,
        break_started_by: '', break_dismissed_at: null, break_dismissed_by: '',
        dash_title: '', dash_calltime: '06:00 AM', dash_location: '', dash_notes: '',
      }, env).catch(() => {}),
    ])

    json(res, { ok: true })
  } catch (e) {
    err(res, e.message)
  }
}
