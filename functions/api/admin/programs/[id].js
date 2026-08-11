import { requireAdmin, jsonResponse } from '../../../_lib/auth.js';

const FIELD_COLUMNS = { program: 'program', courseName: 'course_name', fileName: 'file_name' };

export async function onRequestPatch(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const id = context.params.id;
  const db = context.env.DB;
  const existing = await db.prepare('SELECT id FROM program_courses WHERE id = ?').bind(id).first();
  if (!existing) return jsonResponse({ error: 'Row not found.' }, { status: 404 });

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const setClauses = [];
  const values = [];
  Object.entries(FIELD_COLUMNS).forEach(([field, column]) => {
    if (typeof body[field] === 'string') {
      setClauses.push(`${column} = ?`);
      values.push(body[field]);
    }
  });
  if (!setClauses.length) return jsonResponse({ ok: true });

  await db
    .prepare(`UPDATE program_courses SET ${setClauses.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run();

  return jsonResponse({ ok: true });
}

export async function onRequestDelete(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const id = context.params.id;
  await context.env.DB.prepare('DELETE FROM program_courses WHERE id = ?').bind(id).run();
  return jsonResponse({ ok: true });
}
