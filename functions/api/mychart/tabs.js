import { requireUser, jsonResponse } from '../../_lib/auth.js';

// A tab's shape varies a lot (manually-added: label/dot/question/answer/editedBy/editedAt;
// "Generate Interpretation" sections add generated/planetName/sign/house/sentenceStarter/
// responses{10 sub-fields}) — stored as one JSON blob (`data`) rather than rigid columns,
// same reasoning as workbook_documents.blocks. sort_order lives in its own column purely so
// drag-reorder can be queried without parsing every blob.
function toClientTab(row) {
  let data = {};
  try {
    data = JSON.parse(row.data);
  } catch (e) {
    data = {};
  }
  return { id: row.id, sortOrder: row.sort_order, ...data };
}

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const { results } = await context.env.DB
    .prepare('SELECT * FROM mychart_tabs WHERE user_id = ? ORDER BY sort_order, created_at')
    .bind(user.id)
    .all();

  return jsonResponse((results || []).map(toClientTab));
}

export async function onRequestPost(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const id = 'tab-' + crypto.randomUUID();
  const sortOrder = Number.isInteger(body.sortOrder) ? body.sortOrder : 0;
  const { sortOrder: _drop, ...data } = body;

  await context.env.DB
    .prepare('INSERT INTO mychart_tabs (id, user_id, sort_order, data, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, user.id, sortOrder, JSON.stringify(data), Date.now())
    .run();

  return jsonResponse({ id, sortOrder, ...data }, { status: 201 });
}
