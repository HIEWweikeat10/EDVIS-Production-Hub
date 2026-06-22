// V21-Phase2-Stable — frozen 2026-06-21
// POST /api/project-data
// Body: { code }
// Returns the complete current state of a project, shaped to match
// the V21 in-memory array formats exactly, so applyProjectData() can
// assign them directly with no further transformation.
const { getEnv, dbGet, json, err } = require('./_db')

function inList(ids) { return `(${ids.join(',')})` }

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405)

  try {
    const env  = getEnv()
    const code = String((req.body || {}).code || '').trim().toUpperCase()
    if (!code) return err(res, 'Missing param: code', 400)

    const projRows = await dbGet('projects', `code=eq.${encodeURIComponent(code)}&select=*`, env)
    if (!projRows.length) return err(res, 'Project not found: ' + code, 404)
    const project = projRows[0]
    const pid = project.id

    const [crew, scenes, talent, deptSt, meals, broadcasts, reports, callSheets, scriptScenes, history, camLog, destinations] =
      await Promise.all([
        dbGet('crew_members',       `project_id=eq.${pid}&order=created_at.asc`, env),
        dbGet('scenes',             `project_id=eq.${pid}&order=sort_order.asc,created_at.asc`, env),
        dbGet('talent',             `project_id=eq.${pid}&order=sort_order.asc,created_at.asc`, env),
        dbGet('dept_status',        `project_id=eq.${pid}`, env),
        dbGet('meals',              `project_id=eq.${pid}&day_number=eq.${project.day_number || 1}`, env),
        dbGet('broadcasts',         `project_id=eq.${pid}&order=created_at.desc&limit=50`, env),
        dbGet('reports',            `project_id=eq.${pid}&order=created_at.desc`, env),
        dbGet('call_sheets',        `project_id=eq.${pid}&is_active=eq.true&order=created_at.desc`, env),
        dbGet('script_scenes',      `project_id=eq.${pid}&order=sort_order.asc,created_at.asc`, env),
        dbGet('production_history', `project_id=eq.${pid}&order=day_number.asc`, env),
        dbGet('camera_log',         `project_id=eq.${pid}&order=created_at.asc`, env),
        dbGet('destinations',       `project_id=eq.${pid}&order=name.asc`, env),
      ])

    const sceneIds = scenes.map(s => s.id)
    const ssIds    = scriptScenes.map(s => s.id)
    const [cams, lines] = await Promise.all([
      sceneIds.length ? dbGet('scene_cameras', `scene_id=in.${inList(sceneIds)}&order=sort_order.asc`, env) : [],
      ssIds.length    ? dbGet('script_lines',  `script_scene_id=in.${inList(ssIds)}&order=sort_order.asc`, env) : [],
    ])

    const camsByScene = {}, takesByScene = {}, linesByScript = {}
    cams.forEach(c => { (camsByScene[c.scene_id] ||= []).push(c) })
    camLog.forEach(t => { (takesByScene[t.scene_id] ||= []).push(t) })
    lines.forEach(l => { (linesByScript[l.script_scene_id] ||= []).push(l) })

    const v21Scenes = scenes.map(s => ({
      _id: s.id, n: s.number, desc: s.description, ie: s.ie, dn: s.time_of_day,
      loc: s.location || 'TBC', status: s.status, pages: String(s.pages || '1.0'),
      cast: s.cast_list || [], props: s.props || '', wardrobe: s.wardrobe || '',
      makeupNotes: s.makeup_notes || '', cameraNotes: s.camera_notes || '',
      sound: { dialogue: true, notes: s.sound_notes || '' }, lighting: s.lighting || '',
      generalNotes: s.general_notes || '', nextPrep: s.next_prep || '', sortOrder: s.sort_order || 0,
      cameras: (camsByScene[s.id] || []).map(c => ({ _id: c.id, id: c.id, label: c.label, lens: c.lens || '', type: c.shot_type || '', shotCode: c.shot_code || '', notes: c.notes || '' })),
      camLog: (takesByScene[s.id] || []).map(t => ({ _id: t.id, id: t.id, roll: t.camera_roll || '', card: t.card || 'Card 1', clip: t.clip_code, take: t.take_number || 'Take 1', operator: t.operator || '', status: t.status, notes: t.notes || '', time: t.created_at })),
    }))

    const v21Talent = talent.map(t => ({
      _id: t.id, name: t.name, char: t.character || '', phone: t.phone || '',
      manager: t.manager || '', calltime: t.call_time || '', notes: t.notes || '',
      stage: t.stage, sortOrder: t.sort_order || 0,
    }))

    const talentIdToName = {}; talent.forEach(t => { talentIdToName[t.id] = t.name })
    const v21Dept = { sound: {}, makeup: {}, wardrobe: {} }
    deptSt.forEach(d => { const n = talentIdToName[d.talent_id]; if (n && v21Dept[d.dept]) v21Dept[d.dept][n] = d.status })

    const crewIdToKey = {}; crew.forEach(c => { crewIdToKey[c.id] = c.name })
    const v21Meals = {}
    meals.forEach(m => { const k = crewIdToKey[m.crew_member_id]; if (k) v21Meals[k] = { meal: m.meal_choice || null } })

    const STOR = `${env.url}/storage/v1/object/public/ad-command-files`
    const v21Sheets = callSheets.map(c => ({
      _id: c.id, id: c.id, name: c.file_name,
      size: Math.round((c.file_size || 0) / 1024) + 'KB',
      storageKey: c.storage_key,
      type: c.mime_type || 'application/pdf', isActive: c.is_active,
      uploadedBy: c.uploaded_by || '',
      uploadedAt: c.created_at ? new Date(c.created_at).toLocaleTimeString() : '',
      date: c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
      url: `${STOR}/${c.storage_key}`,
    }))

    const sceneIdToScene = {}; scenes.forEach(s => { sceneIdToScene[s.id] = s })

    const v21Script = scriptScenes.map(s => {
      const linkedScene = s.scene_id ? sceneIdToScene[s.scene_id] : null
      return {
        _id: s.id, n: s.number, desc: s.description, ie: s.ie || 'INT', dn: s.time_of_day || 'D',
        direction: s.direction || '', sortOrder: s.sort_order || 0,
        sceneId: s.scene_id || null,
        status: linkedScene ? linkedScene.status : 'pending',
        sceneNumber: linkedScene ? linkedScene.number : null,
        lines: (linesByScript[s.id] || []).map(l => ({ _id: l.id, char: l.character_name, text: l.line_text, order: l.sort_order })),
      }
    })

    const v21History = history.map(h => ({
      _id: h.id, dayNum: h.day_number,
      date: new Date(h.wrapped_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      notes: h.notes || '', callSheet: h.call_sheet_name || '(none)',
      scenes: { done: h.scenes_done, total: h.scenes_total, list: h.scenes_list || [] },
      meals: { total: h.meals_total, breakdown: h.meals_breakdown || {} },
      talent: { wrapped: h.talent_wrapped, total: h.talent_total, list: h.talent_list || [] },
      camera: { good: h.camera_good, kiv: h.camera_kiv, ng: h.camera_ng, total: h.camera_total },
      reports: { total: h.reports_total, list: h.reports_list || [] },
      broadcasts: h.broadcast_count || 0, crew: h.crew_count || 0,
    }))

    const v21Crew = crew.map(c => ({
      _id: c.id, name: c.name, role: c.role, dept: c.dept, phone: c.phone || '',
      isAdmin: c.is_admin, lastSeenAt: c.last_seen_at || null,
      initials: c.name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '??',
    }))

    const v21Broadcasts = [...broadcasts].reverse().map(b => ({
      _id: b.id, msg: b.message, tag: b.tag || 'Signal', dot: b.dot_color || '#378add',
      mark: b.mark_type || 'normal', sentBy: b.sent_by || '', time: b.created_at,
    }))

    json(res, {
      ok: true,
      project: {
        id: project.id, code: project.code, title: project.title,
        dayNumber: project.day_number || 1, isWrapped: project.is_wrapped || false,
        dashCalltime: project.dash_calltime || '06:00 AM',
        dashLocation: project.dash_location || '', dashNotes: project.dash_notes || '',
        dashTitle: project.dash_title || '',
        breakActive: project.break_active || false, breakLabel: project.break_label || '',
        breakEndAt: project.break_end_at || null, breakStartedBy: project.break_started_by || '',
        breakDismissedAt: project.break_dismissed_at || null, breakDismissedBy: project.break_dismissed_by || '',
        mealStatus: project.meal_status || 'available',
      },
      signedIn: v21Crew,
      scenes: v21Scenes,
      talentList: v21Talent,
      deptStatus: v21Dept,
      mealData: v21Meals,
      reports: reports.map(r => ({ _id: r.id, id: r.id, from: r.from_name, dept: r.from_dept, to: r.to_role, cats: r.categories || [], msg: r.message, status: r.status, time: r.created_at })),
      broadcasts: v21Broadcasts,
      callSheetList: v21Sheets,
      scriptData: v21Script,
      productionHistory: v21History,
      destinationList: destinations.map(d => ({ _id: d.id, name: d.name })),
    })
  } catch (e) {
    err(res, e.message)
  }
}
