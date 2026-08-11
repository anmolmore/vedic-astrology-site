// Shared constants/helpers for the R2-backed uploads system, used by functions/api/uploads/**
// plus the workbook/mychart cascade-delete routes (an attachment only makes sense attached
// to a specific answer/tab, so deleting the answer/tab must also delete its upload).

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'xlsx', 'csv'];
export const ALLOWED_CONTEXTS = ['workbook-answer', 'mychart-tab'];

export function fileExtension(fileName) {
  const parts = (fileName || '').split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

// Deletes every uploads row (+ R2 object) whose context_ref starts with the given prefix —
// used when cascading a whole workbook document's deletion (context_ref is "<workbookId>:<q>").
export async function deleteUploadsByRefPrefix(db, uploadsBucket, userId, context, refPrefix) {
  const { results } = await db
    .prepare('SELECT id, r2_key FROM uploads WHERE user_id = ? AND context = ? AND context_ref LIKE ?')
    .bind(userId, context, `${refPrefix}%`)
    .all();
  for (const row of results || []) {
    await uploadsBucket.delete(row.r2_key).catch(() => {});
  }
  await db
    .prepare('DELETE FROM uploads WHERE user_id = ? AND context = ? AND context_ref LIKE ?')
    .bind(userId, context, `${refPrefix}%`)
    .run();
}

// Deletes a single uploads row (+ R2 object) for an exact context_ref — used when deleting
// one My Chart tab, whose context_ref is an exact tab id, not a prefix.
export async function deleteUploadByExactRef(db, uploadsBucket, userId, context, contextRef) {
  const row = await db
    .prepare('SELECT id, r2_key FROM uploads WHERE user_id = ? AND context = ? AND context_ref = ?')
    .bind(userId, context, contextRef)
    .first();
  if (!row) return;
  await uploadsBucket.delete(row.r2_key).catch(() => {});
  await db.prepare('DELETE FROM uploads WHERE id = ?').bind(row.id).run();
}
