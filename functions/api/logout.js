import { parseCookies, destroySessionToken, clearSessionCookieHeader, jsonResponse } from '../_lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const token = parseCookies(request).session;
  await destroySessionToken(env.DB, token);
  return jsonResponse({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookieHeader() } });
}
