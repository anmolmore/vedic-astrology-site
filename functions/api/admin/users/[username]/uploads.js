import { requireAdmin, jsonResponse } from '../../../../_lib/auth.js';

// Admin action: clears every upload (R2 object + row) for a specific user, from the Manage
// Access grid's "Clear uploads" button.
export async function onRequestDelete(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const username = context.params.username;
  const db = context.env.DB;
  const target = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (!target) return jsonResponse({ error: 'User not found.' }, { status: 404 });

  const { results } = await db.prepare('SELECT r2_key FROM uploads WHERE user_id = ?').bind(target.id).all();
  for (const row of results || []) {
    await context.env.UPLOADS.delete(row.r2_key).catch(() => {});
  }
  await db.prepare('DELETE FROM uploads WHERE user_id = ?').bind(target.id).run();

  return jsonResponse({ ok: true });
}
