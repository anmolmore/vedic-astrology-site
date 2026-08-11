import { requireUser, jsonResponse } from '../../_lib/auth.js';

function toClientDoc(row) {
  let blocks = [];
  try {
    blocks = JSON.parse(row.blocks);
  } catch (e) {
    blocks = [];
  }
  return { id: row.id, title: row.title, type: row.type, blocks };
}

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const { results } = await context.env.DB
    .prepare('SELECT * FROM workbook_documents WHERE user_id = ? ORDER BY created_at')
    .bind(user.id)
    .all();

  return jsonResponse((results || []).map(toClientDoc));
}

// Creates a custom workbook document. mammoth.js still runs client-side (no docx-parsing
// library added to the Workers runtime) — this just persists the already-extracted result.
export async function onRequestPost(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const title = (body.title || '').trim() || 'Untitled document';
  const type = body.type || '';
  const blocks = Array.isArray(body.blocks) ? body.blocks : [];

  const id = 'uploaded-' + crypto.randomUUID();
  await context.env.DB
    .prepare('INSERT INTO workbook_documents (id, user_id, title, type, blocks, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, user.id, title, type, JSON.stringify(blocks), Date.now())
    .run();

  return jsonResponse({ id, title, type, blocks }, { status: 201 });
}
