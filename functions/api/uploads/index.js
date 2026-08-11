import { requireUser, jsonResponse } from '../../_lib/auth.js';
import { MAX_UPLOAD_BYTES, ALLOWED_EXTENSIONS, ALLOWED_CONTEXTS, fileExtension } from '../../_lib/uploads.js';

function toClientUpload(row) {
  return {
    id: row.id,
    context: row.context,
    contextRef: row.context_ref,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedAt: row.uploaded_at,
  };
}

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const { results } = await context.env.DB
    .prepare(
      'SELECT id, context, context_ref, file_name, mime_type, size_bytes, uploaded_at FROM uploads WHERE user_id = ? ORDER BY uploaded_at DESC'
    )
    .bind(user.id)
    .all();

  return jsonResponse((results || []).map(toClientUpload));
}

export async function onRequestPost(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  let formData;
  try {
    formData = await context.request.formData();
  } catch (e) {
    return jsonResponse({ error: 'Expected multipart/form-data.' }, { status: 400 });
  }

  const file = formData.get('file');
  const uploadContext = formData.get('context');
  const contextRef = formData.get('contextRef');

  if (!(file instanceof File)) return jsonResponse({ error: 'No file provided.' }, { status: 400 });
  if (!uploadContext || !contextRef) {
    return jsonResponse({ error: 'context and contextRef are required.' }, { status: 400 });
  }
  if (!ALLOWED_CONTEXTS.includes(uploadContext)) {
    return jsonResponse({ error: 'Invalid context.' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonResponse({ error: 'File is larger than 10MB.' }, { status: 413 });
  }
  const ext = fileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return jsonResponse({ error: `File type ".${ext}" isn't allowed.` }, { status: 400 });
  }

  const db = context.env.DB;
  const bucket = context.env.UPLOADS;

  // One attachment per slot: replacing an existing upload deletes the old R2 object + row
  // first, same as the localStorage version's behavior.
  const existing = await db
    .prepare('SELECT id, r2_key FROM uploads WHERE user_id = ? AND context = ? AND context_ref = ?')
    .bind(user.id, uploadContext, contextRef)
    .first();
  if (existing) {
    await bucket.delete(existing.r2_key).catch(() => {});
    await db.prepare('DELETE FROM uploads WHERE id = ?').bind(existing.id).run();
  }

  const id = crypto.randomUUID();
  const r2Key = `u/${user.id}/${id}`;
  const bytes = await file.arrayBuffer();
  await bucket.put(r2Key, bytes, { httpMetadata: { contentType: file.type || 'application/octet-stream' } });

  const uploadedAt = Date.now();
  await db
    .prepare(
      `INSERT INTO uploads (id, user_id, context, context_ref, file_name, mime_type, size_bytes, r2_key, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, user.id, uploadContext, contextRef, file.name, file.type || '', file.size, r2Key, uploadedAt)
    .run();

  return jsonResponse(
    { id, context: uploadContext, contextRef, fileName: file.name, mimeType: file.type || '', sizeBytes: file.size, uploadedAt },
    { status: 201 }
  );
}

// Self-service "clear my uploads": wipes every upload (R2 object + row) for the signed-in user.
export async function onRequestDelete(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const db = context.env.DB;
  const { results } = await db.prepare('SELECT r2_key FROM uploads WHERE user_id = ?').bind(user.id).all();
  for (const row of results || []) {
    await context.env.UPLOADS.delete(row.r2_key).catch(() => {});
  }
  await db.prepare('DELETE FROM uploads WHERE user_id = ?').bind(user.id).run();

  return jsonResponse({ ok: true });
}
