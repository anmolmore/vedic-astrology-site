import { requireUser, getUserPrograms, jsonResponse } from '../_lib/auth.js';

function toClientRow(row) {
  return { id: row.id, program: row.program, courseName: row.course_name, fileName: row.file_name };
}

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const db = context.env.DB;
  let results;
  if (user.is_admin) {
    ({ results } = await db.prepare('SELECT * FROM program_courses ORDER BY rowid').all());
  } else {
    const programs = await getUserPrograms(db, user.id);
    if (!programs.length) {
      // No program assigned yet — same "no filtering" fallback the old client used.
      ({ results } = await db.prepare('SELECT * FROM program_courses ORDER BY rowid').all());
    } else {
      const placeholders = programs.map(() => '?').join(',');
      ({ results } = await db
        .prepare(`SELECT * FROM program_courses WHERE program IN (${placeholders}) ORDER BY rowid`)
        .bind(...programs)
        .all());
    }
  }

  return jsonResponse((results || []).map(toClientRow));
}
