import { requireAdmin, jsonResponse } from '../../../../_lib/auth.js';

// Admin action: clears every course_progress row for a specific user (e.g. so a learner
// can restart a program from scratch), from the Manage Access grid's "Clear progress" button.
export async function onRequestDelete(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const username = context.params.username;
  const db = context.env.DB;
  const target = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (!target) return jsonResponse({ error: 'User not found.' }, { status: 404 });

  await db.prepare('DELETE FROM course_progress WHERE user_id = ?').bind(target.id).run();
  return jsonResponse({ ok: true });
}
