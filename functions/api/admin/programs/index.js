import { requireAdmin, jsonResponse } from '../../../_lib/auth.js';

function toClientRow(row) {
  return { id: row.id, program: row.program, courseName: row.course_name, fileName: row.file_name };
}

export async function onRequestGet(context) {
  const admin = await requireAdmin(context);
  if (!admin) return jsonResponse({ error: 'Forbidden.' }, { status: 403 });

  const { results } = await context.env.DB.prepare('SELECT * FROM program_courses ORDER BY rowid').all();
  return jsonResponse((results || []).map(toClientRow));
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
  const program = (body.program || '').trim();
  if (!program) return jsonResponse({ error: 'Program name is required.' }, { status: 400 });

  const id = `program-${crypto.randomUUID()}`;
  await context.env.DB
    .prepare('INSERT INTO program_courses (id, program, course_name, file_name) VALUES (?, ?, ?, ?)')
    .bind(id, program, '', '')
    .run();

  return jsonResponse({ id, program, courseName: '', fileName: '' }, { status: 201 });
}
