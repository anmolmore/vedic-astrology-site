import { requireUser, jsonResponse } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const { results } = await context.env.DB
    .prepare('SELECT workbook_id, question_index, answer_text, edited_by, edited_at FROM workbook_answers WHERE user_id = ?')
    .bind(user.id)
    .all();

  // { workbookId: [{text, editedBy, editedAt}, ...] } — same shape the client used to keep
  // in workbookAnswers, sparse arrays included (a gap just means that question is unanswered).
  const answers = {};
  (results || []).forEach((row) => {
    if (!answers[row.workbook_id]) answers[row.workbook_id] = [];
    answers[row.workbook_id][row.question_index] = {
      text: row.answer_text,
      editedBy: row.edited_by,
      editedAt: row.edited_at,
    };
  });

  return jsonResponse(answers);
}

// Upserts one answer. Body-carried identifiers (rather than nested dynamic route segments)
// keep this to a single simple route instead of a 2-level dynamic path.
export async function onRequestPut(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const workbookId = body.workbookId;
  const questionIndex = Number.isInteger(body.questionIndex) ? body.questionIndex : parseInt(body.questionIndex, 10);
  if (!workbookId || Number.isNaN(questionIndex)) {
    return jsonResponse({ error: 'workbookId and questionIndex are required.' }, { status: 400 });
  }
  const text = body.text || '';
  // editedBy/editedAt are already display-ready strings formatted client-side (the user's
  // name + a toLocaleString() timestamp) — stored and returned as-is, not reformatted here.
  const editedBy = body.editedBy || '';
  const editedAt = body.editedAt || '';

  await context.env.DB
    .prepare(
      `INSERT INTO workbook_answers (user_id, workbook_id, question_index, answer_text, edited_by, edited_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, workbook_id, question_index) DO UPDATE SET
         answer_text = excluded.answer_text, edited_by = excluded.edited_by, edited_at = excluded.edited_at`
    )
    .bind(user.id, workbookId, questionIndex, text, editedBy, editedAt)
    .run();

  return jsonResponse({ ok: true });
}
