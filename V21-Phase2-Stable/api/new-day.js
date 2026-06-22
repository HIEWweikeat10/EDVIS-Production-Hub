// V21-Phase2-Stable — frozen 2026-06-21
// POST /api/new-day
// Body: { code }
// Resets all daily/temporary state for a fresh production day:
//   - scenes.status → 'pending' (scenes themselves are kept)
//   - camera_log → all rows deleted (takes are daily, not persistent)
//   - talent.stage → 'not_arrived' (talent list itself is kept)
//   - dept_status → all rows deleted (sound/makeup/wardrobe progress)
//   - broadcasts → all rows deleted (history is daily)
//   - reports → all rows deleted (daily reports, history keeps a snapshot)
//   - meals → all rows for current day_number deleted
//   - projects.break_active/meal_status/break_* → reset to defaults
// Scenes, talent, scripts, and call sheets are NOT deleted — only their
// daily status fields are reset, matching the existing client-side intent.
const { getEnv, dbGet, dbPatch, dbDelete, json, err } = require('./_db')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405)

  try {
    const env = getEnv()
    const code = String((req.body || {}).code || '').trim().toUpperCase()
    if (!code) return err(res, 'code is required', 400)

    const projRows = await dbGet('projects', `code=eq.${encodeURIComponent(code)}&select=id,day_number`, env)
    if (!projRows.length) return err(res, 'Project not found: ' + code, 404)
    const pid = projRows[0].id
    const dayNum = projRows[0].day_number || 1

    // Get scene ids for this project, needed to scope camera_log deletes
    const scenes = await dbGet('scenes', `project_id=eq.${pid}&select=id`, env)
    const sceneIds = scenes.map(s => s.id)

    await Promise.all([
      // Reset scene status to pending (keep the scenes themselves)
      dbPatch('scenes', `project_id=eq.${pid}`, { status: 'pending' }, env).catch(() => {}),
      // Reset talent stage to not_arrived (keep the talent themselves)
      dbPatch('talent', `project_id=eq.${pid}`, { stage: 'not_arrived' }, env).catch(() => {}),
      // Clear daily camera log entries
      sceneIds.length ? dbDelete('camera_log', `project_id=eq.${pid}`, env).catch(() => {}) : Promise.resolve(),
      // Clear daily dept status (sound/makeup/wardrobe progress)
      dbDelete('dept_status', `project_id=eq.${pid}`, env).catch(() => {}),
      // Clear daily broadcast history
      dbDelete('broadcasts', `project_id=eq.${pid}`, env).catch(() => {}),
      // Clear daily reports
      dbDelete('reports', `project_id=eq.${pid}`, env).catch(() => {}),
      // Clear today's meal selections
      dbDelete('meals', `project_id=eq.${pid}&day_number=eq.${dayNum}`, env).catch(() => {}),
      // Reset project-level daily flags — critically including is_wrapped,
      // which was previously never cleared here, causing the next poll on
      // every device to immediately resurrect the Wrap Day banner.
      dbPatch('projects', `id=eq.${pid}`, {
        is_wrapped: false, day_number: dayNum + 1,
        meal_status: 'available', break_active: false, break_label: '', break_end_at: null,
        break_started_by: '', break_dismissed_at: null, break_dismissed_by: '',
      }, env).catch(() => {}),
    ])

    json(res, { ok: true })
  } catch (e) {
    err(res, e.message)
  }
}
