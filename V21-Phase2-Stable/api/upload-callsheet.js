// V21-Phase2-Stable — frozen 2026-06-21
// POST /api/upload-callsheet
// Body: { code, fileName, fileType, fileSizeBytes, base64Data, uploadedBy }
// Uploads the file to Supabase Storage (bucket: ad-command-files) and
// creates a call_sheets row pointing at it. Marks all other call sheets
// for this project inactive (only one "active" call sheet at a time).
const { getEnv, dbGet, dbPost, dbPatch, json, err } = require('./_db')

async function dbFetch(url, opts, ms = 20000) {
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
    const b = req.body || {}
    const code = String(b.code || '').trim().toUpperCase()
    const fileName = String(b.fileName || '').trim()
    const fileType = String(b.fileType || 'application/pdf').trim()
    const base64Data = b.base64Data
    const uploadedBy = String(b.uploadedBy || '').trim()

    if (!code) return err(res, 'code is required', 400)
    if (!fileName) return err(res, 'fileName is required', 400)
    if (!base64Data) return err(res, 'base64Data is required', 400)

    const projRows = await dbGet('projects', `code=eq.${encodeURIComponent(code)}&select=id`, env)
    if (!projRows.length) return err(res, 'Project not found: ' + code, 404)
    const projectId = projRows[0].id

    const buffer = Buffer.from(base64Data, 'base64')
    if (buffer.length > 26214400) return err(res, 'File exceeds 25MB limit', 400)

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storageKey = `${projectId}/${Date.now()}_${safeFileName}`

    const uploadRes = await dbFetch(`${env.url}/storage/v1/object/ad-command-files/${storageKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': fileType,
        'Authorization': `Bearer ${env.key}`,
        'x-upsert': 'true',
      },
      body: buffer,
    })
    if (!uploadRes.ok) {
      const t = await uploadRes.text()
      return err(res, `Storage upload failed (${uploadRes.status}): ${t}`, 500)
    }

    // Mark all existing call sheets for this project inactive
    await dbPatch('call_sheets', `project_id=eq.${projectId}`, { is_active: false }, env).catch(() => {})

    const rows = await dbPost('call_sheets', {
      project_id: projectId, file_name: fileName, file_size: buffer.length,
      storage_key: storageKey, mime_type: fileType, is_active: true,
      uploaded_by: uploadedBy || '',
    }, 'return=representation', env)
    const row = Array.isArray(rows) ? rows[0] : rows

    const publicUrl = `${env.url}/storage/v1/object/public/ad-command-files/${storageKey}`
    json(res, { ok: true, row: { ...row, url: publicUrl } })
  } catch (e) {
    err(res, e.message)
  }
}
