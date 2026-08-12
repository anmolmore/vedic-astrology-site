import { requireUser, jsonResponse } from '../_lib/auth.js';

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  const { results } = await context.env.DB
    .prepare('SELECT planet, sign FROM chart_placements WHERE user_id = ?')
    .bind(user.id)
    .all();

  const placements = {};
  (results || []).forEach((row) => {
    placements[row.planet] = row.sign;
  });

  return jsonResponse(placements);
}

// Replaces the signed-in user's entire placement set in one shot (delete-all + re-insert),
// mirroring how the client always calls savePlanetPlacements() with the full, current
// userPlacements object rather than one planet at a time.
export async function onRequestPut(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request body.' }, { status: 400 });
  }

  const placements = body.placements && typeof body.placements === 'object' && !Array.isArray(body.placements)
    ? body.placements
    : {};

  const now = Date.now();
  const statements = [context.env.DB.prepare('DELETE FROM chart_placements WHERE user_id = ?').bind(user.id)];
  Object.entries(placements).forEach(([planet, sign]) => {
    if (typeof planet !== 'string' || typeof sign !== 'string' || !planet || !sign) return;
    statements.push(
      context.env.DB
        .prepare('INSERT INTO chart_placements (user_id, planet, sign, updated_at) VALUES (?, ?, ?, ?)')
        .bind(user.id, planet, sign, now)
    );
  });

  await context.env.DB.batch(statements);
  return jsonResponse({ ok: true });
}
