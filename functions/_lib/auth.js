// Shared auth helpers for Cloudflare Pages Functions: password hashing (PBKDF2 via Web
// Crypto — no native bcrypt/scrypt binding available in the Workers runtime), session
// cookies, and request-context user lookup.

const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

async function pbkdf2Hex(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return toHex(bits);
}

// Same format Node's scripts/create-admin.mjs must produce with crypto.pbkdf2Sync:
// pbkdf2$<iterations>$<saltHex>$<hashHex>
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2Hex(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function verifyPassword(password, stored) {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  const salt = fromHex(parts[2]);
  const actualHash = await pbkdf2Hex(password, salt, iterations);
  return timingSafeEqual(actualHash, parts[3]);
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(digest);
}

export function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const cookies = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

export function sessionCookieHeader(token) {
  return `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`;
}

export function clearSessionCookieHeader() {
  return 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

export async function createSession(db, userId) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256Hex(token);
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await db
    .prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(tokenHash, userId, expiresAt)
    .run();
  return token;
}

export async function destroySessionToken(db, token) {
  if (!token) return;
  const tokenHash = await sha256Hex(token);
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

async function getSessionUser(request, db) {
  const token = parseCookies(request).session;
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await db
    .prepare(
      `SELECT users.* FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?
         AND sessions.expires_at > (CAST(strftime('%s','now') AS INTEGER) * 1000)`
    )
    .bind(tokenHash)
    .first();
  return row || null;
}

export async function getUserPrograms(db, userId) {
  const { results } = await db
    .prepare('SELECT program FROM user_programs WHERE user_id = ? ORDER BY program')
    .bind(userId)
    .all();
  return (results || []).map((r) => r.program);
}

export function userPublicShape(user, programs) {
  return {
    username: user.username,
    isAdmin: !!user.is_admin,
    active: !!user.active,
    programs: programs || [],
    courses: !!user.courses,
    cosmic: !!user.cosmic,
    chartSelector: !!user.chart_selector,
    flashcards: !!user.flashcards,
    workbook: !!user.workbook,
    mychart: !!user.mychart,
    journey: !!user.journey,
  };
}

export function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

// Returns the logged-in, active user row for this request, or null. Use in any route
// that just needs to know who's asking.
export async function requireUser(context) {
  const user = await getSessionUser(context.request, context.env.DB);
  if (!user || !user.active) return null;
  return user;
}

// Returns the logged-in admin user row for this request, or null. Use at the top of
// every functions/api/admin/** route before touching the database.
export async function requireAdmin(context) {
  const user = await requireUser(context);
  if (!user || !user.is_admin) return null;
  return user;
}
