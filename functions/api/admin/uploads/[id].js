import { requireAdmin, jsonResponse } from '../../../_lib/auth.js';

// Admin moderation: delete any single upload regardless of owner.
export async function onRequestDelete(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const row = await context.env.DB.prepare('SELECT * FROM uploads WHERE id = ?').bind(context.params.id).first();
  if (!row) return jsonResponse({ error: 'Not found.' }, { status: 404 });

  await context.env.UPLOADS.delete(row.r2_key);
  await context.env.DB.prepare('DELETE FROM uploads WHERE id = ?').bind(row.id).run();

  return jsonResponse({ ok: true });
}
