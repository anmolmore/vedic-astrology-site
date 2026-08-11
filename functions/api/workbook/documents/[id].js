import { requireUser, jsonResponse } from '../../../_lib/auth.js';
import { deleteUploadsByRefPrefix } from '../../../_lib/uploads.js';

// Deletes a custom workbook document and cascades: its answers, and any attachments on
// those answers (uploads whose context_ref is "<id>:<questionIndex>").
export async function onRequestDelete(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const id = context.params.id;
  const db = context.env.DB;
  const existing = await db.prepare('SELECT id FROM workbook_documents WHERE id = ? AND user_id = ?').bind(id, user.id).first();
  if (!existing) return jsonResponse({ error: 'Not found.' }, { status: 404 });

  await deleteUploadsByRefPrefix(db, context.env.UPLOADS, user.id, 'workbook-answer', `${id}:`);
  await db.prepare('DELETE FROM workbook_answers WHERE user_id = ? AND workbook_id = ?').bind(user.id, id).run();
  await db.prepare('DELETE FROM workbook_documents WHERE id = ?').bind(id).run();

  return jsonResponse({ ok: true });
}
