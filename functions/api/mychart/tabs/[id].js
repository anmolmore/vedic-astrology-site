import { requireUser, jsonResponse } from '../../../_lib/auth.js';
import { deleteUploadByExactRef } from '../../../_lib/uploads.js';

// Merges whatever fields the client sends into the stored JSON blob (partial updates are
// fine — e.g. just `{answer, editedBy, editedAt}` on every keystroke, or just `{sortOrder}`
// after a drag-reorder) rather than requiring the full tab shape on every call.
export async function onRequestPut(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const id = context.params.id;
  const db = context.env.DB;
  const existing = await db.prepare('SELECT * FROM mychart_tabs WHERE id = ? AND user_id = ?').bind(id, user.id).first();
  if (!existing) return jsonResponse({ error: 'Not found.' }, { status: 404 });

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  let data = {};
  try {
    data = JSON.parse(existing.data);
  } catch (e) {
    data = {};
  }
  const { sortOrder, ...fields } = body;
  Object.assign(data, fields);
  const sortOrderValue = Number.isInteger(sortOrder) ? sortOrder : existing.sort_order;

  await db
    .prepare('UPDATE mychart_tabs SET data = ?, sort_order = ? WHERE id = ?')
    .bind(JSON.stringify(data), sortOrderValue, id)
    .run();

  return jsonResponse({ ok: true });
}

// Deletes a tab and cascades: its attachment, if any (uploads row whose context_ref is
// exactly this tab's id, context 'mychart-tab').
export async function onRequestDelete(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const id = context.params.id;
  const db = context.env.DB;
  const existing = await db.prepare('SELECT id FROM mychart_tabs WHERE id = ? AND user_id = ?').bind(id, user.id).first();
  if (!existing) return jsonResponse({ error: 'Not found.' }, { status: 404 });

  await deleteUploadByExactRef(db, context.env.UPLOADS, user.id, 'mychart-tab', id);
  await db.prepare('DELETE FROM mychart_tabs WHERE id = ?').bind(id).run();

  return jsonResponse({ ok: true });
}
