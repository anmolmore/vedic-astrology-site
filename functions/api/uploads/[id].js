import { requireUser, jsonResponse } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const row = await context.env.DB.prepare('SELECT * FROM uploads WHERE id = ?').bind(context.params.id).first();
  if (!row) return jsonResponse({ error: 'Not found.' }, { status: 404 });
  if (row.user_id !== user.id && !user.is_admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const obj = await context.env.UPLOADS.get(row.r2_key);
  if (!obj) return jsonResponse({ error: 'File missing from storage.' }, { status: 404 });

  // Always served as an attachment (never inline), regardless of MIME type — the one
  // meaningful XSS vector here (an uploaded HTML/SVG rendering/executing when opened) is
  // fully neutralized by forcing a download instead of letting the browser render it.
  return new Response(obj.body, {
    headers: {
      'Content-Type': row.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${row.file_name.replace(/"/g, '')}"`,
      'Content-Length': String(row.size_bytes),
    },
  });
}

export async function onRequestDelete(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const row = await context.env.DB.prepare('SELECT * FROM uploads WHERE id = ?').bind(context.params.id).first();
  if (!row) return jsonResponse({ error: 'Not found.' }, { status: 404 });
  if (row.user_id !== user.id && !user.is_admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  await context.env.UPLOADS.delete(row.r2_key);
  await context.env.DB.prepare('DELETE FROM uploads WHERE id = ?').bind(row.id).run();

  return jsonResponse({ ok: true });
}
