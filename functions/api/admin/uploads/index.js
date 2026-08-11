import { requireAdmin, jsonResponse } from '../../../_lib/auth.js';

function toClientUpload(row) {
  return {
    id: row.id,
    context: row.context,
    contextRef: row.context_ref,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedAt: row.uploaded_at,
    username: row.username,
  };
}

// Admin visibility: every upload across every user, joined to username.
export async function onRequestGet(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const { results } = await context.env.DB
    .prepare(
      `SELECT uploads.id, uploads.context, uploads.context_ref, uploads.file_name,
              uploads.mime_type, uploads.size_bytes, uploads.uploaded_at, users.username
       FROM uploads
       JOIN users ON users.id = uploads.user_id
       ORDER BY uploads.uploaded_at DESC`
    )
    .all();

  return jsonResponse((results || []).map(toClientUpload));
}
