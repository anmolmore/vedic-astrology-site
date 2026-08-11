import { requireAdmin, hashPassword, jsonResponse } from '../../../../_lib/auth.js';

export async function onRequestPost(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }
  const password = body.password || '';
  if (!password) return jsonResponse({ error: 'A new password is required.' }, { status: 400 });

  const username = context.params.username;
  const db = context.env.DB;
  const target = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (!target) return jsonResponse({ error: 'User not found.' }, { status: 404 });

  const passwordHash = await hashPassword(password);
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, target.id).run();
  // Reset password invalidates any existing sessions for that user.
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id).run();

  return jsonResponse({ ok: true });
}
