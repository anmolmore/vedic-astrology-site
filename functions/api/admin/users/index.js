import { requireAdmin, hashPassword, jsonResponse } from '../../../_lib/auth.js';

const PANEL_FIELDS = ['courses', 'cosmic', 'chartSelector', 'flashcards', 'workbook', 'mychart', 'journey'];
const PANEL_COLUMNS = {
  courses: 'courses',
  cosmic: 'cosmic',
  chartSelector: 'chart_selector',
  flashcards: 'flashcards',
  workbook: 'workbook',
  mychart: 'mychart',
  journey: 'journey',
};

async function attachPrograms(db, users) {
  if (!users.length) return users;
  const placeholders = users.map(() => '?').join(',');
  const { results } = await db
    .prepare(`SELECT user_id, program FROM user_programs WHERE user_id IN (${placeholders}) ORDER BY program`)
    .bind(...users.map((u) => u.id))
    .all();
  const byUser = {};
  (results || []).forEach((row) => {
    (byUser[row.user_id] = byUser[row.user_id] || []).push(row.program);
  });
  return users.map((u) => ({
    username: u.username,
    isAdmin: !!u.is_admin,
    active: !!u.active,
    programs: byUser[u.id] || [],
    courses: !!u.courses,
    cosmic: !!u.cosmic,
    chartSelector: !!u.chart_selector,
    flashcards: !!u.flashcards,
    workbook: !!u.workbook,
    mychart: !!u.mychart,
    journey: !!u.journey,
  }));
}

export async function onRequestGet(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const { results } = await context.env.DB.prepare('SELECT * FROM users ORDER BY username').all();
  return jsonResponse(await attachPrograms(context.env.DB, results || []));
}

export async function onRequestPost(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const username = (body.username || '').trim();
  const password = body.password || '';
  if (!username || !password) {
    return jsonResponse({ error: 'Username and password are required.' }, { status: 400 });
  }
  const programs = Array.isArray(body.programs) ? body.programs.filter(Boolean) : [];

  const db = context.env.DB;
  const passwordHash = await hashPassword(password);

  const columns = ['username', 'password_hash'];
  const placeholders = ['?', '?'];
  const values = [username, passwordHash];
  PANEL_FIELDS.forEach((field) => {
    if (typeof body[field] === 'boolean') {
      columns.push(PANEL_COLUMNS[field]);
      placeholders.push('?');
      values.push(body[field] ? 1 : 0);
    }
  });

  try {
    const result = await db
      .prepare(`INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`)
      .bind(...values)
      .run();
    const userId = result.meta.last_row_id;
    for (const program of programs) {
      await db.prepare('INSERT INTO user_programs (user_id, program) VALUES (?, ?)').bind(userId, program).run();
    }
  } catch (e) {
    if (String(e.message || e).toLowerCase().includes('unique')) {
      return jsonResponse({ error: 'That username is already taken.' }, { status: 409 });
    }
    throw e;
  }

  return jsonResponse({ ok: true }, { status: 201 });
}
