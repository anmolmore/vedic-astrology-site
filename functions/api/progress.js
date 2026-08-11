import { requireUser, jsonResponse } from '../_lib/auth.js';

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const { results } = await context.env.DB
    .prepare('SELECT course_id, media_done, flashcards_flipped, completed FROM course_progress WHERE user_id = ?')
    .bind(user.id)
    .all();

  const progress = {};
  (results || []).forEach((row) => {
    let flashcardsFlipped = [];
    try {
      flashcardsFlipped = JSON.parse(row.flashcards_flipped);
    } catch (e) {
      flashcardsFlipped = [];
    }
    progress[row.course_id] = {
      mediaDone: !!row.media_done,
      flashcardsFlipped,
      completed: !!row.completed,
    };
  });

  return jsonResponse(progress);
}

// Self-service "clear my progress": wipes every course_progress row for the signed-in
// user, unlocking the course list back to just the first lesson.
export async function onRequestDelete(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  await context.env.DB.prepare('DELETE FROM course_progress WHERE user_id = ?').bind(user.id).run();
  return jsonResponse({ ok: true });
}
