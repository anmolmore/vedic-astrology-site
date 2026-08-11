import {
  verifyPassword,
  createSession,
  sessionCookieHeader,
  jsonResponse,
  userPublicShape,
  getUserPrograms,
} from '../_lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const username = (body.username || '').trim();
  const password = body.password || '';
  if (!username || !password) {
    return jsonResponse({ error: 'Username and password are required.' }, { status: 400 });
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return jsonResponse({ error: 'Incorrect username or password.' }, { status: 401 });
  }
  if (!user.active) {
    return jsonResponse({ error: 'This account has been disabled.' }, { status: 403 });
  }

  const token = await createSession(env.DB, user.id);
  const programs = await getUserPrograms(env.DB, user.id);
  return jsonResponse(userPublicShape(user, programs), {
    headers: { 'Set-Cookie': sessionCookieHeader(token) },
  });
}
