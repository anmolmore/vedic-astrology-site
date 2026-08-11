import { requireAdmin, jsonResponse } from '../../../_lib/auth.js';

const PANEL_COLUMNS = {
  courses: 'courses',
  cosmic: 'cosmic',
  chartSelector: 'chart_selector',
  flashcards: 'flashcards',
  workbook: 'workbook',
  mychart: 'mychart',
  journey: 'journey',
};

export async function onRequestPatch(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const username = context.params.username;
  const db = context.env.DB;
  const target = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (!target) return jsonResponse({ error: 'User not found.' }, { status: 404 });

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const setClauses = [];
  const values = [];
  if (typeof body.active === 'boolean') {
    setClauses.push('active = ?');
    values.push(body.active ? 1 : 0);
  }
  Object.entries(PANEL_COLUMNS).forEach(([field, column]) => {
    if (typeof body[field] === 'boolean') {
      setClauses.push(`${column} = ?`);
      values.push(body[field] ? 1 : 0);
    }
  });
  if (setClauses.length) {
    await db
      .prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`)
      .bind(...values, target.id)
      .run();
  }

  if (Array.isArray(body.programs)) {
    await db.prepare('DELETE FROM user_programs WHERE user_id = ?').bind(target.id).run();
    for (const program of body.programs.filter(Boolean)) {
      await db.prepare('INSERT INTO user_programs (user_id, program) VALUES (?, ?)').bind(target.id, program).run();
    }
  }

  return jsonResponse({ ok: true });
}

export async function onRequestDelete(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const username = context.params.username;
  if (username === admin.username) {
    return jsonResponse({ error: "You can't delete your own account." }, { status: 400 });
  }

  const db = context.env.DB;
  const target = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (!target) return jsonResponse({ error: 'User not found.' }, { status: 404 });

  // D1's foreign-key enforcement isn't guaranteed on, so clean up related rows explicitly
  // instead of relying on ON DELETE CASCADE.
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id).run();
  await db.prepare('DELETE FROM user_programs WHERE user_id = ?').bind(target.id).run();
  await db.prepare('DELETE FROM users WHERE id = ?').bind(target.id).run();

  return jsonResponse({ ok: true });
}
