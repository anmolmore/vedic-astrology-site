import { requireUser, jsonResponse } from '../../_lib/auth.js';

export async function onRequestPut(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const courseId = context.params.courseId;
  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const mediaDone = !!body.mediaDone;
  const completed = !!body.completed;
  const flashcardsFlipped = Array.isArray(body.flashcardsFlipped) ? body.flashcardsFlipped.map(Boolean) : [];

  await context.env.DB
    .prepare(
      `INSERT INTO course_progress (user_id, course_id, media_done, flashcards_flipped, completed, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, course_id) DO UPDATE SET
         media_done = excluded.media_done,
         flashcards_flipped = excluded.flashcards_flipped,
         completed = excluded.completed,
         updated_at = excluded.updated_at`
    )
    .bind(user.id, courseId, mediaDone ? 1 : 0, JSON.stringify(flashcardsFlipped), completed ? 1 : 0, Date.now())
    .run();

  return jsonResponse({ ok: true });
}
